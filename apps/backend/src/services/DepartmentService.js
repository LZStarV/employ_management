const { Department, Employee, Salary, Project, EmployeeProject, sequelize } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');

class DepartmentService {
  // 部门重组服务（合并两个部门）
  static async mergeDepartments(sourceDepartmentId, targetDepartmentId) {
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 检查源部门是否存在
      const sourceDepartment = await Department.findByPk(sourceDepartmentId, { transaction });
      if (!sourceDepartment) {
        throw new Error('源部门不存在');
      }
      
      // 检查目标部门是否存在
      const targetDepartment = await Department.findByPk(targetDepartmentId, { transaction });
      if (!targetDepartment) {
        throw new Error('目标部门不存在');
      }
      
      // 获取源部门的员工数量
      const sourceEmployeeCount = await Employee.count({
        where: { department_id: sourceDepartmentId },
        transaction
      });
      
      // 将源部门的员工转移到目标部门
      await Employee.update(
        { department_id: targetDepartmentId },
        { 
          where: { department_id: sourceDepartmentId },
          transaction
        }
      );
      
      // 查找是否有源部门的员工被设置为其他部门的经理
      const managersFromSource = await Department.findAll({
        where: { manager_id: {
          [Op.in]: await Employee.findAll({
            attributes: ['employee_id'],
            where: { department_id: sourceDepartmentId },
            transaction,
            raw: true
          }).then(emps => emps.map(emp => emp.employee_id))
        }},
        transaction
      });
      
      // 记录部门合并日志
      winston.info(`部门合并记录: ${sourceDepartment.department_name}(${sourceDepartmentId}) 合并到 ${targetDepartment.department_name}(${targetDepartmentId})，转移 ${sourceEmployeeCount} 名员工`);
      
      // 删除源部门
      await sourceDepartment.destroy({ transaction });
      
      // 提交事务
      await transaction.commit();
      
      return {
        success: true,
        message: '部门合并成功',
        data: {
          sourceDepartment,
          targetDepartment,
          employeesTransferred: sourceEmployeeCount,
          managersAffected: managersFromSource.length
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      winston.error('部门合并失败:', error);
      throw error;
    }
  }

  // 部门绩效统计服务
  static async getDepartmentPerformance(departmentId, startDate, endDate) {
    try {
      // 检查部门是否存在
      const department = await Department.findByPk(departmentId);
      if (!department) {
        throw new Error('部门不存在');
      }
      
      // 获取部门员工列表
      const employees = await Employee.findAll({
        attributes: ['employee_id'],
        where: { department_id: departmentId },
        raw: true
      });
      
      const employeeIds = employees.map(emp => emp.employee_id);
      
      if (employeeIds.length === 0) {
        return {
          success: true,
          data: {
            department,
            performance: {
              totalEmployees: 0,
              totalProjects: 0,
              completedProjects: 0,
              avgSalary: 0,
              totalSalaryExpense: 0,
              totalContributionHours: 0
            }
          }
        };
      }
      
      // 统计部门项目信息
      const projectStats = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT ep.project_id) as totalProjects,
          SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completedProjects,
          SUM(ep.contribution_hours) as totalContributionHours
        FROM 
          employee_projects ep
        LEFT JOIN 
          projects p ON ep.project_id = p.project_id
        WHERE 
          ep.employee_id IN (:employeeIds)
          AND (:startDate IS NULL OR ep.start_date >= :startDate)
          AND (:endDate IS NULL OR (ep.end_date IS NULL OR ep.end_date <= :endDate))
      `, {
        replacements: { employeeIds, startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 统计薪资信息
      const salaryStats = await sequelize.query(`
        SELECT 
          SUM(s.basic_salary + s.bonus + s.allowances) as totalSalaryExpense,
          AVG(s.basic_salary + s.bonus + s.allowances) as avgSalary
        FROM 
          salaries s
        WHERE 
          s.employee_id IN (:employeeIds)
      `, {
        replacements: { employeeIds },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 统计考勤信息
      const attendanceStats = await sequelize.query(`
        SELECT 
          COUNT(*) as totalAttendances,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays,
          SUM(overtime_hours) as totalOvertimeHours
        FROM 
          attendances
        WHERE 
          employee_id IN (:employeeIds)
          AND (:startDate IS NULL OR attendance_date >= :startDate)
          AND (:endDate IS NULL OR attendance_date <= :endDate)
      `, {
        replacements: { employeeIds, startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 计算部门效率指标
      const efficiencyScore = this.calculateEfficiencyScore(
        projectStats[0],
        salaryStats[0],
        attendanceStats[0],
        employeeIds.length
      );
      
      return {
        success: true,
        data: {
          department,
          performance: {
            totalEmployees: employeeIds.length,
            totalProjects: projectStats[0].totalProjects || 0,
            completedProjects: projectStats[0].completedProjects || 0,
            totalContributionHours: projectStats[0].totalContributionHours || 0,
            totalSalaryExpense: salaryStats[0].totalSalaryExpense || 0,
            avgSalary: salaryStats[0].avgSalary || 0,
            attendance: attendanceStats[0],
            efficiencyScore
          }
        }
      };
    } catch (error) {
      winston.error('获取部门绩效统计失败:', error);
      throw error;
    }
  }

  // 计算部门效率评分
  static calculateEfficiencyScore(projectStats, salaryStats, attendanceStats, employeeCount) {
    // 基础分数
    let score = 50;
    
    // 项目完成率评分（最高30分）
    if (projectStats.totalProjects > 0) {
      const completionRate = projectStats.completedProjects / projectStats.totalProjects;
      score += completionRate * 30;
    }
    
    // 出勤率评分（最高10分）
    if (attendanceStats.totalAttendances > 0) {
      const attendanceRate = attendanceStats.presentDays / attendanceStats.totalAttendances;
      score += attendanceRate * 10;
    }
    
    // 人均贡献评分（最高10分）
    if (employeeCount > 0 && salaryStats.totalSalaryExpense > 0) {
      const contributionPerEmployee = projectStats.totalContributionHours / employeeCount;
      score += Math.min(contributionPerEmployee / 100, 1) * 10;
    }
    
    return Math.round(Math.min(score, 100));
  }

  // 部门人员结构分析
  static async getDepartmentStructure(departmentId) {
    try {
      // 检查部门是否存在
      const department = await Department.findByPk(departmentId);
      if (!department) {
        throw new Error('部门不存在');
      }
      
      // 按职位统计人员分布
      const positionDistribution = await sequelize.query(`
        SELECT 
          p.position_name,
          COUNT(e.employee_id) as employeeCount,
          AVG(s.basic_salary) as avgSalary
        FROM 
          employees e
        LEFT JOIN 
          positions p ON e.position_id = p.position_id
        LEFT JOIN 
          salaries s ON e.employee_id = s.employee_id
        WHERE 
          e.department_id = :departmentId
        GROUP BY 
          p.position_name
      `, {
        replacements: { departmentId },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 按工龄统计
      const seniorityDistribution = await sequelize.query(`
        SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) < 1 THEN '不到1年'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) < 3 THEN '1-3年'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) < 5 THEN '3-5年'
            ELSE '5年以上'
          END as seniorityLevel,
          COUNT(e.employee_id) as employeeCount
        FROM 
          employees e
        WHERE 
          e.department_id = :departmentId
        GROUP BY 
          seniorityLevel
        ORDER BY 
          MIN(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)))
      `, {
        replacements: { departmentId },
        type: sequelize.QueryTypes.SELECT
      });
      
      // 管理结构（经理和下属关系）
      const managementStructure = await sequelize.query(`
        WITH RECURSIVE manager_hierarchy AS (
          SELECT 
            e.employee_id,
            e.first_name || ' ' || e.last_name as name,
            e.manager_id,
            1 as level
          FROM 
            employees e
          WHERE 
            e.department_id = :departmentId AND 
            e.employee_id = :managerId
          
          UNION ALL
          
          SELECT 
            e.employee_id,
            e.first_name || ' ' || e.last_name as name,
            e.manager_id,
            mh.level + 1 as level
          FROM 
            employees e
          JOIN 
            manager_hierarchy mh ON e.manager_id = mh.employee_id
          WHERE 
            e.department_id = :departmentId
        )
        SELECT * FROM manager_hierarchy
      `, {
        replacements: { departmentId, managerId: department.manager_id },
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        success: true,
        data: {
          department,
          positionDistribution,
          seniorityDistribution,
          managementStructure,
          totalEmployees: positionDistribution.reduce((sum, item) => sum + item.employeeCount, 0)
        }
      };
    } catch (error) {
      winston.error('获取部门人员结构分析失败:', error);
      throw error;
    }
  }
}

module.exports = DepartmentService;