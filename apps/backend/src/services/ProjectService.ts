const Project = require('../models/Project');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

// 项目相关接口定义
interface Project {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  progress: number;
  budget: number;
  actualCost: number;
  departmentId?: number;
  managerId?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: string;
  departmentId?: number;
}

interface ProjectService {
  // 获取所有项目
  getAllProjects(query?: ProjectQuery): Promise<{ projects: Project[], total: number, page: number, pageSize: number, totalPages: number }>;
  
  // 根据ID获取项目
  getProjectById(id: number): Promise<Project | null>;
  
  // 创建项目
  createProject(projectData: Partial<Project>): Promise<Project>;
  
  // 更新项目
  updateProject(id: number, projectData: Partial<Project>): Promise<[number, Project[]]>;
  
  // 删除项目
  deleteProject(id: number): Promise<number>;
  
  // 获取项目成员
  getProjectMembers(projectId: number): Promise<any[]>;
  
  // 添加项目成员
  addProjectMember(projectId: number, employeeId: number): Promise<any>;
  
  // 移除项目成员
  removeProjectMember(projectId: number, employeeId: number): Promise<number>;
  
  // 获取项目统计信息
  getProjectStatistics(): Promise<any>;
  
  // 获取项目进度报告
  getProjectProgressReport(projectId: number): Promise<any>;
  
  // 搜索项目
  searchProjects(keyword: string): Promise<Project[]>;
  
  // 获取即将到期的项目
  getUpcomingDeadlineProjects(days: number = 7): Promise<Project[]>;
  
  // 更新项目进度
  updateProjectProgress(projectId: number, progress: number): Promise<Project | null>;
  
  // 更新项目状态
  updateProjectStatus(projectId: number, status: string): Promise<Project | null>;
  
  // 更新项目预算
  updateProjectBudget(projectId: number, budget: number): Promise<Project | null>;
  
  // 更新项目实际成本
  updateProjectActualCost(projectId: number, actualCost: number): Promise<Project | null>;
  
  // 获取项目预算报告
  getProjectBudgetReport(projectId: number): Promise<any>;
}

class ProjectServiceImpl implements ProjectService {
  /**
   * 获取所有项目
   */
  async getAllProjects(query: ProjectQuery = {}): Promise<{ projects: Project[], total: number, page: number, pageSize: number, totalPages: number }> {
    const { page = 1, pageSize = 10, name, status, departmentId } = query;
    
    const offset = (page - 1) * pageSize;
    const whereClause: any = {};
    
    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    try {
      const { count, rows } = await Project.findAndCountAll({
        where: whereClause,
        offset,
        limit: pageSize,
        order: [['createdAt', 'DESC']]
      });
      
      const totalPages = Math.ceil(count / pageSize);
      
      return {
        projects: rows,
        total: count,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }
  
  /**
   * 根据ID获取项目
   */
  async getProjectById(id: number): Promise<Project | null> {
    try {
      return await Project.findByPk(id, {
        include: [Employee]
      });
    } catch (error) {
      console.error('Error fetching project by id:', error);
      throw error;
    }
  }
  
  /**
   * 创建项目
   */
  async createProject(projectData: Partial<Project>): Promise<Project> {
    try {
      return await Project.create(projectData);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }
  
  /**
   * 更新项目
   */
  async updateProject(id: number, projectData: Partial<Project>): Promise<[number, Project[]]> {
    try {
      return await Project.update(projectData, {
        where: { id },
        returning: true
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }
  
  /**
   * 删除项目
   */
  async deleteProject(id: number): Promise<number> {
    try {
      // 先检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        throw new Error('Project not found');
      }
      
      // 检查项目是否有关联的员工
      const members = await this.getProjectMembers(id);
      if (members.length > 0) {
        throw new Error('Cannot delete project with assigned members');
      }
      
      return await Project.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
  
  /**
   * 获取项目成员
   */
  async getProjectMembers(projectId: number): Promise<any[]> {
    try {
      const project = await Project.findByPk(projectId, {
        include: [Employee]
      });
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      return project.Employees || [];
    } catch (error) {
      console.error('Error fetching project members:', error);
      throw error;
    }
  }
  
  /**
   * 添加项目成员
   */
  async addProjectMember(projectId: number, employeeId: number): Promise<any> {
    try {
      const project = await Project.findByPk(projectId);
      const employee = await Employee.findByPk(employeeId);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      await project.addEmployee(employee);
      return { success: true, message: 'Employee added to project successfully' };
    } catch (error) {
      console.error('Error adding project member:', error);
      throw error;
    }
  }
  
  /**
   * 移除项目成员
   */
  async removeProjectMember(projectId: number, employeeId: number): Promise<number> {
    try {
      const project = await Project.findByPk(projectId);
      const employee = await Employee.findByPk(employeeId);
      
      if (!project || !employee) {
        throw new Error('Project or Employee not found');
      }
      
      return await project.removeEmployee(employee);
    } catch (error) {
      console.error('Error removing project member:', error);
      throw error;
    }
  }
  
  /**
   * 获取项目统计信息
   */
  async getProjectStatistics(): Promise<any> {
    try {
      const totalProjects = await Project.count();
      const activeProjects = await Project.count({ where: { status: 'active' } });
      const completedProjects = await Project.count({ where: { status: 'completed' } });
      const inProgressProjects = await Project.count({ where: { status: 'in_progress' } });
      
      return {
        totalProjects,
        activeProjects,
        completedProjects,
        inProgressProjects,
        summary: {
          active: activeProjects,
          completed: completedProjects,
          inProgress: inProgressProjects
        }
      };
    } catch (error) {
      console.error('Error fetching project statistics:', error);
      throw error;
    }
  }
  
  /**
   * 获取项目进度报告
   */
  async getProjectProgressReport(projectId: number): Promise<any> {
    try {
      const project = await Project.findByPk(projectId, {
        include: [Employee]
      });
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      const totalMembers = project.Employees?.length || 0;
      const daysRemaining = project.endDate ? Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        project,
        totalMembers,
        daysRemaining: Math.max(0, daysRemaining),
        isOverdue: daysRemaining < 0
      };
    } catch (error) {
      console.error('Error fetching project progress report:', error);
      throw error;
    }
  }
  
  /**
   * 搜索项目
   */
  async searchProjects(keyword: string): Promise<Project[]> {
    try {
      return await Project.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } }
          ]
        }
      });
    } catch (error) {
      console.error('Error searching projects:', error);
      throw error;
    }
  }
  
  /**
   * 获取即将到期的项目
   */
  async getUpcomingDeadlineProjects(days: number = 7): Promise<Project[]> {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);
      
      return await Project.findAll({
        where: {
          endDate: {
            [Op.between]: [today, futureDate]
          },
          status: { [Op.ne]: 'completed' }
        },
        order: [['endDate', 'ASC']]
      });
    } catch (error) {
      console.error('Error fetching upcoming deadline projects:', error);
      throw error;
    }
  }

  /**
   * 更新项目进度
   */
  async updateProjectProgress(projectId: number, progress: number): Promise<Project | null> {
    try {
      // 验证进度值在0-100之间
      if (progress < 0 || progress > 100) {
        throw new Error('Progress must be between 0 and 100');
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        return null;
      }

      await project.update({ progress });
      return project;
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  }

  /**
   * 更新项目状态
   */
  async updateProjectStatus(projectId: number, status: string): Promise<Project | null> {
    try {
      // 验证状态值
      const validStatuses = ['planning', 'active', 'in_progress', 'completed', 'on_hold', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        return null;
      }

      await project.update({ status });
      return project;
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }

  /**
   * 更新项目预算
   */
  async updateProjectBudget(projectId: number, budget: number): Promise<Project | null> {
    try {
      // 验证预算值
      if (budget < 0) {
        throw new Error('Budget cannot be negative');
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        return null;
      }

      await project.update({ budget });
      return project;
    } catch (error) {
      console.error('Error updating project budget:', error);
      throw error;
    }
  }

  /**
   * 更新项目实际成本
   */
  async updateProjectActualCost(projectId: number, actualCost: number): Promise<Project | null> {
    try {
      // 验证实际成本值
      if (actualCost < 0) {
        throw new Error('Actual cost cannot be negative');
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        return null;
      }

      await project.update({ actualCost });
      return project;
    } catch (error) {
      console.error('Error updating project actual cost:', error);
      throw error;
    }
  }

  /**
   * 获取项目预算报告
   */
  async getProjectBudgetReport(projectId: number): Promise<any> {
    try {
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // 计算预算执行情况
      const budgetVariance = project.budget - project.actualCost;
      const budgetUtilization = project.budget > 0 
        ? (project.actualCost / project.budget) * 100 
        : 0;
      const isOverBudget = project.actualCost > project.budget;

      return {
        projectId: project.id,
        projectName: project.name,
        budget: project.budget,
        actualCost: project.actualCost,
        budgetVariance,
        budgetUtilization: parseFloat(budgetUtilization.toFixed(2)),
        isOverBudget,
        status: project.status,
        progress: project.progress
      };
    } catch (error) {
      console.error('Error fetching project budget report:', error);
      throw error;
    }
  }
}

module.exports = new ProjectServiceImpl();