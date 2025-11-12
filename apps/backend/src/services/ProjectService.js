const { Project, Employee, EmployeeProject, Attendance, sequelize } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');

class ProjectService {
  // 项目资源分配优化服务
  static async optimizeResourceAllocation(projectId) {
    try {
      // 检查项目是否存在
      const project = await Project.findByPk(projectId, {
        include: [{ model: Employee, as: 'employees' }]
      });
      
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 获取当前项目的员工列表和他们的贡献时间
      const currentAllocations = await EmployeeProject.findAll({
        where: { project_id: projectId },
        include: [{
          model: Employee,
          as: 'employee',
          include: [
            { model: sequelize.models.Department, as: 'department' },
            { model: sequelize.models.Position, as: 'position' }
          ]
        }],
        raw: true,
        nest: true
      });
      
      // 获取员工在其他项目的工作情况
      const otherProjectsWorkload = await sequelize.query(`
        SELECT 
          e.employee_id,
          COUNT(DISTINCT ep.project_id) as projectCount,
          SUM(ep.contribution_hours) as totalContributionHours
        FROM 
          employee_projects ep
        JOIN 
          employees e ON ep.employee_id = e.employee_id
        WHERE 
          ep.employee_id IN (:employeeIds)
          AND ep.project_id != :projectId
          AND (ep.end_date IS NULL OR ep.end_date >= CURRENT_DATE)
        GROUP BY 
          e.employee_id
      `, {
        replacements: {
          employeeIds: currentAllocations.map(alloc => alloc.employee.employee_id),
          projectId
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 构建工作负载映射
      const workloadMap = {};
      otherProjectsWorkload.forEach(item => {
        workloadMap[item.employee_id] = {
          projectCount: item.projectCount,
          totalHours: item.totalContributionHours
        };
      });
      
      // 分析每个员工的工作负载并提出优化建议
      const optimizationSuggestions = currentAllocations.map(alloc => {
        const employee = alloc.employee;
        const workload = workloadMap[employee.employee_id] || { projectCount: 0, totalHours: 0 };
        
        let allocationStatus = 'balanced';
        let suggestion = '';
        
        // 工作负载评估
        if (workload.projectCount > 3) {
          allocationStatus = 'overloaded';
          suggestion = '建议减少该员工的工作分配，当前参与项目过多';
        } else if (alloc.contribution_hours > 200 && workload.totalHours > 300) {
          allocationStatus = 'high';
          suggestion = '工作时间较长，建议适当调整';
        } else if (alloc.contribution_hours < 50 && workload.totalHours < 100) {
          allocationStatus = 'underutilized';
          suggestion = '利用率较低，可以增加工作分配';
        }
        
        return {
          employeeId: employee.employee_id,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          department: employee.department?.department_name || '无部门',
          position: employee.position?.position_name || '无职位',
          currentContribution: alloc.contribution_hours,
          otherProjects: workload.projectCount,
          otherProjectHours: workload.totalHours,
          allocationStatus,
          suggestion
        };
      });
      
      // 计算整体项目健康度
      const healthScore = this.calculateProjectHealth(
        project,
        optimizationSuggestions,
        currentAllocations.length
      );
      
      return {
        success: true,
        message: '项目资源分配分析完成',
        data: {
          project,
          healthScore,
          totalResources: currentAllocations.length,
          optimizationSuggestions,
          overloadedCount: optimizationSuggestions.filter(s => s.allocationStatus === 'overloaded').length,
          underutilizedCount: optimizationSuggestions.filter(s => s.allocationStatus === 'underutilized').length
        }
      };
    } catch (error) {
      winston.error('项目资源分配优化失败:', error);
      throw error;
    }
  }

  // 计算项目健康度
  static calculateProjectHealth(project, suggestions, resourceCount) {
    let score = 100;
    
    // 项目状态评分
    if (project.status === 'paused' || project.status === 'cancelled') {
      score -= 30;
    }
    
    // 进度评分
    const progress = project.getProgress();
    const daysSinceStart = Math.floor((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(daysSinceStart / 30, 1) * 100; // 假设30天完成100%
    
    if (Math.abs(progress - expectedProgress) > 20) {
      score -= 20;
    }
    
    // 资源分配评分
    const overloadedRatio = suggestions.filter(s => s.allocationStatus === 'overloaded').length / resourceCount;
    const underutilizedRatio = suggestions.filter(s => s.allocationStatus === 'underutilized').length / resourceCount;
    
    score -= overloadedRatio * 30;
    score -= underutilizedRatio * 20;
    
    return Math.round(Math.max(0, score));
  }

  // 项目进度预测服务
  static async predictProjectCompletion(projectId) {
    try {
      // 检查项目是否存在
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 如果项目已完成，直接返回
      if (project.status === 'completed') {
        return {
          success: true,
          data: {
            project,
            isCompleted: true,
            actualCompletionDate: project.end_date,
            prediction: '项目已完成'
          }
        };
      }
      
      // 获取项目的考勤记录，分析工作效率
      const attendanceData = await sequelize.query(`
        SELECT 
          DATE_TRUNC('week', a.attendance_date) as week,
          COUNT(DISTINCT a.employee_id) as workingEmployees,
          SUM(a.overtime_hours + 
              EXTRACT(HOUR FROM (a.check_out_time - a.check_in_time))) as totalWorkHours
        FROM 
          attendances a
        WHERE 
          a.project_id = :projectId
          AND a.status = 'present'
          AND a.check_in_time IS NOT NULL
          AND a.check_out_time IS NOT NULL
        GROUP BY 
          week
        ORDER BY 
          week DESC
        LIMIT 8
      `, {
        replacements: { projectId },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 计算平均每周工作小时数
      let avgWeeklyHours = 0;
      if (attendanceData.length > 0) {
        const totalHours = attendanceData.reduce((sum, week) => sum + week.totalWorkHours, 0);
        avgWeeklyHours = totalHours / attendanceData.length;
      } else {
        avgWeeklyHours = 40 * await EmployeeProject.count({ where: { project_id: projectId } }); // 假设每人每周40小时
      }
      
      // 获取项目的完成进度
      const progress = project.getProgress();
      const remainingProgress = 100 - progress;
      
      // 估算剩余工时
      const estimatedTotalHours = (project.budget || 100000) / 1000; // 简化估算：每1000元预算对应1小时
      const remainingHours = (estimatedTotalHours * remainingProgress) / 100;
      
      // 计算预计完成周数
      const weeksToComplete = remainingHours / avgWeeklyHours;
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + Math.ceil(weeksToComplete * 7));
      
      // 与计划结束日期比较
      const plannedEndDate = project.end_date ? new Date(project.end_date) : null;
      let status = 'on_track';
      let riskLevel = 'low';
      
      if (plannedEndDate) {
        const daysDiff = Math.ceil((completionDate - plannedEndDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 14) {
          status = 'delayed';
          riskLevel = 'high';
        } else if (daysDiff > 7) {
          status = 'at_risk';
          riskLevel = 'medium';
        }
      }
      
      return {
        success: true,
        data: {
          project,
          currentProgress: progress,
          avgWeeklyHours: avgWeeklyHours.toFixed(2),
          estimatedRemainingHours: remainingHours.toFixed(2),
          weeksToComplete: weeksToComplete.toFixed(1),
          predictedCompletionDate: completionDate,
          plannedEndDate,
          status,
          riskLevel,
          recommendation: this.generateProjectRecommendation(status, avgWeeklyHours)
        }
      };
    } catch (error) {
      winston.error('项目进度预测失败:', error);
      throw error;
    }
  }

  // 生成项目建议
  static generateProjectRecommendation(status, avgWeeklyHours) {
    if (status === 'delayed') {
      return '项目进度延迟严重，建议增加资源投入或重新评估项目范围';
    } else if (status === 'at_risk') {
      return '项目有延迟风险，建议优化工作流程，提高团队效率';
    }
    
    if (avgWeeklyHours < 20) {
      return '团队工作时间不足，建议增加工作时间或检查资源分配';
    } else if (avgWeeklyHours > 80) {
      return '团队工作时间过长，可能影响质量，建议合理安排工作时间';
    }
    
    return '项目进展顺利，继续保持当前工作节奏';
  }

  // 项目成本分析服务
  static async analyzeProjectCost(projectId) {
    try {
      // 检查项目是否存在
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 获取项目参与的员工及其薪资
      const projectCosts = await sequelize.query(`
        SELECT 
          e.employee_id,
          e.first_name || ' ' || e.last_name as employeeName,
          s.basic_salary,
          s.bonus,
          s.allowances,
          ep.contribution_hours,
          (s.basic_salary / 160) * ep.contribution_hours as estimatedCost
        FROM 
          employee_projects ep
        JOIN 
          employees e ON ep.employee_id = e.employee_id
        JOIN 
          salaries s ON e.employee_id = s.employee_id
        WHERE 
          ep.project_id = :projectId
      `, {
        replacements: { projectId },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 计算总成本
      const totalCost = projectCosts.reduce((sum, item) => sum + item.estimatedCost, 0);
      const avgCostPerHour = totalCost / projectCosts.reduce((sum, item) => sum + item.contribution_hours, 1);
      const budgetUtilization = project.budget ? (totalCost / project.budget) * 100 : 0;
      
      // 按部门统计成本
      const departmentCosts = await sequelize.query(`
        SELECT 
          d.department_name,
          COUNT(DISTINCT e.employee_id) as employeeCount,
          SUM((s.basic_salary / 160) * ep.contribution_hours) as totalCost
        FROM 
          employee_projects ep
        JOIN 
          employees e ON ep.employee_id = e.employee_id
        JOIN 
          departments d ON e.department_id = d.department_id
        JOIN 
          salaries s ON e.employee_id = s.employee_id
        WHERE 
          ep.project_id = :projectId
        GROUP BY 
          d.department_name
      `, {
        replacements: { projectId },
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        success: true,
        data: {
          project,
          totalCost: totalCost.toFixed(2),
          avgCostPerHour: avgCostPerHour.toFixed(2),
          budgetUtilization: budgetUtilization.toFixed(2) + '%',
          budgetRemaining: project.budget ? (project.budget - totalCost).toFixed(2) : 'N/A',
          resourceCount: projectCosts.length,
          departmentCosts,
          topContributors: projectCosts
            .sort((a, b) => b.estimatedCost - a.estimatedCost)
            .slice(0, 5)
        }
      };
    } catch (error) {
      winston.error('项目成本分析失败:', error);
      throw error;
    }
  }
}

module.exports = ProjectService;