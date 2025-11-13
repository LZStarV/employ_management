import { Project, Employee, EmployeeProject, Attendance } from '../models';
import { Op } from 'sequelize';
import { Context } from 'koa';
import winston from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import ProjectService from '../services/ProjectService';
const logger = winston;

interface ProjectController {
  getAllProjects(ctx: Context): Promise<void>;
  getProjectById(ctx: Context): Promise<void>;
  getProjectMembers(ctx: Context): Promise<void>;
  createProject(ctx: Context): Promise<void>;
  updateProject(ctx: Context): Promise<void>;
  deleteProject(ctx: Context): Promise<void>;
  searchProjects(ctx: Context): Promise<void>;
  updateProjectProgress(ctx: Context): Promise<void>;
  updateProjectStatus(ctx: Context): Promise<void>;
  updateProjectBudget(ctx: Context): Promise<void>;
  updateProjectActualCost(ctx: Context): Promise<void>;
  getProjectBudgetReport(ctx: Context): Promise<void>;
}

interface ProjectData {
  project_name: string;
  description: string;
  start_date: string;
  end_date?: string;
  status?: 'planning' | 'active' | 'paused' | 'completed';
  budget?: number;
  employees?: Array<{
    employee_id: number;
    role?: string;
    start_date?: string;
    end_date?: string;
    contribution_hours?: number;
  }>;
}

const ProjectController: ProjectController = {
  // 获取所有项目列表
  async getAllProjects(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { page = 1, limit = 10, status } = ctx.query;
      
      const whereClause: any = {};
      if (status) whereClause.status = status;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const projects = await Project.findAll({
        where: whereClause,
        include: [{ model: Employee, as: 'employees', attributes: ['employee_id', 'first_name', 'last_name'] }],
        limit: parseInt(limit as string),
        offset: offset,
        order: [['project_id', 'DESC']]
      });
      
      const total = await Project.count({ where: whereClause });
      
      // 计算每个项目的进度
      const projectsWithProgress = projects.map(project => ({
        ...project.toJSON(),
        progress: project.getProgress(),
        participantCount: project.employees.length
      }));
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: projectsWithProgress,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      };
    }, '获取项目列表失败');
  },

  // 获取单个项目详情
  async getProjectById(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '项目ID不能为空');
      }
      
      const project = await Project.findByPk(id);
      
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      // 添加项目进度和时间信息
      const projectData = project.toJSON();
      projectData.progress = project.getProgress();
      projectData.timeInfo = project.getTimeInfo();
      
      // 计算项目成员数量（不返回成员列表）
      const participantCount = await EmployeeProject.count({
        where: { project_id: id }
      });
      projectData.participant_count = participantCount;
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: projectData
      };
    }, '获取项目详情失败');
  },

  // 获取项目成员列表（分页）
  async getProjectMembers(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { page = 1, limit = 10 } = ctx.query;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '项目ID不能为空');
      }
      
      // 检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      // 查询项目成员总数
      const total = await EmployeeProject.count({
        where: { project_id: id }
      });
      
      // 查询项目成员列表
      const employeeProjects = await EmployeeProject.findAll({
        where: { project_id: id },
        include: [
          {
            model: Employee,
            as: 'employee',
            include: [{ model: require('../models/Position'), as: 'position' }]
          }
        ],
        limit: parseInt(limit as string),
        offset: offset,
        order: [['employee_project_id', 'ASC']]
      });
      
      // 格式化返回数据
      const members = employeeProjects.map(ep => ({
        ...ep.employee.toJSON(),
        EmployeeProject: {
          role: ep.role,
          start_date: ep.start_date,
          end_date: ep.end_date,
          contribution_hours: ep.contribution_hours
        }
      }));
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: members,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      };
    }, '获取项目成员列表失败');
  },

  // 创建新项目
  async createProject(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const projectData: ProjectData = ctx.request.body;
      const { employees } = projectData;
      delete projectData.employees;
      
      // 开始事务
      const transaction = await Project.sequelize?.transaction();
      
      try {
        // 创建项目
        const project = await Project.create(projectData, { transaction });
        
        // 如果提供了员工信息，建立员工项目关联
        if (employees && Array.isArray(employees) && employees.length > 0) {
          const employeeProjects = employees.map(emp => ({
            employee_id: emp.employee_id,
            project_id: project.project_id,
            role: emp.role || '团队成员',
            start_date: emp.start_date || new Date(),
            end_date: emp.end_date,
            contribution_hours: emp.contribution_hours
          }));
          
          await EmployeeProject.bulkCreate(employeeProjects, { transaction });
        }
        
        // 提交事务
        await transaction?.commit();
        
        // 重新查询项目信息（包含员工信息）
        const newProject = await Project.findByPk(project.project_id, {
          include: [{ model: Employee, as: 'employees' }]
        });
        
        ctx.status = 201;
        ctx.body = {
          success: true,
          message: '项目创建成功',
          data: newProject
        };
      } catch (error) {
        // 回滚事务
        await transaction?.rollback();
        throw error;
      }
    }, '创建项目失败', 500);
  },

  // 更新项目信息
  async updateProject(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const updateData: ProjectData = ctx.request.body;
      const { employees } = updateData;
      delete updateData.employees;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '项目ID不能为空');
      }
      
      // 检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      // 开始事务
      const transaction = await Project.sequelize?.transaction();
      
      try {
        // 更新项目信息
        await project.update(updateData, { transaction });
        
        // 如果提供了员工信息，更新员工项目关联
        if (employees && Array.isArray(employees)) {
          // 获取现有的员工项目关联
          const existingEmployeeProjects = await EmployeeProject.findAll({
            where: { project_id: id },
            transaction
          });
          
          const existingEmployeeIds = new Set(existingEmployeeProjects.map(ep => ep.employee_id));
          const newEmployeeIds = new Set(employees.map(emp => emp.employee_id));
          
          // 处理新增的员工关联
          const employeesToAdd = employees.filter(emp => !existingEmployeeIds.has(emp.employee_id));
          if (employeesToAdd.length > 0) {
            const newEmployeeProjects = employeesToAdd.map(emp => ({
              employee_id: emp.employee_id,
              project_id: id,
              role: emp.role || '团队成员',
              start_date: emp.start_date || new Date(),
              end_date: emp.end_date,
              contribution_hours: emp.contribution_hours
            }));
            await EmployeeProject.bulkCreate(newEmployeeProjects, { transaction });
          }
          
          // 处理需要更新的员工关联
          for (const emp of employees) {
            if (existingEmployeeIds.has(emp.employee_id)) {
              await EmployeeProject.update(
                {
                  role: emp.role,
                  start_date: emp.start_date,
                  end_date: emp.end_date,
                  contribution_hours: emp.contribution_hours
                },
                {
                  where: {
                    employee_id: emp.employee_id,
                    project_id: id
                  },
                  transaction
                }
              );
            }
          }
          
          // 处理需要移除的员工关联
          const employeeIdsToRemove = [...existingEmployeeIds].filter(id => !newEmployeeIds.has(id));
          if (employeeIdsToRemove.length > 0) {
            await EmployeeProject.destroy({
              where: {
                project_id: id,
                employee_id: employeeIdsToRemove
              },
              transaction
            });
          }
        }
        
        // 提交事务
        await transaction?.commit();
        
        // 重新查询项目信息
        const updatedProject = await Project.findByPk(id, {
          include: [{ model: Employee, as: 'employees' }]
        });
        
        ctx.status = 200;
        ctx.body = {
          success: true,
          message: '项目信息更新成功',
          data: updatedProject
        };
      } catch (error) {
        // 回滚事务
        await transaction?.rollback();
        throw error;
      }
    }, '更新项目信息失败', 500);
  },

  // 删除项目
  async deleteProject(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '项目ID不能为空');
      }
      
      // 检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      // 开始事务
      const transaction = await Project.sequelize?.transaction();
      
      try {
        // 删除员工项目关联
        await EmployeeProject.destroy({
          where: { project_id: id },
          transaction
        });
        
        // 删除考勤记录中的项目关联
        await Attendance.update(
          { project_id: null },
          { where: { project_id: id }, transaction }
        );
        
        // 删除项目
        await project.destroy({ transaction });
        
        // 提交事务
        await transaction?.commit();
        
        ctx.status = 200;
        ctx.body = {
          success: true,
          message: '项目删除成功'
        };
      } catch (error) {
        // 回滚事务
        await transaction?.rollback();
        throw error;
      }
    }, '删除项目失败', 500);
  },

  // 搜索项目
  async searchProjects(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { keyword } = ctx.query;
      
      if (!keyword || typeof keyword !== 'string') {
        return ErrorHandler.validationError(ctx, '搜索关键词不能为空');
      }
      
      const projects = await ProjectService.searchProjects(keyword);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: projects
      };
    }, '搜索项目失败');
  },

  // 更新项目进度
  async updateProjectProgress(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { progress } = ctx.request.body;
      
      if (!id || isNaN(Number(id))) {
        return ErrorHandler.validationError(ctx, '项目ID无效');
      }
      
      if (progress === undefined || progress === null || isNaN(Number(progress))) {
        return ErrorHandler.validationError(ctx, '进度值不能为空且必须为数字');
      }
      
      const project = await ProjectService.updateProjectProgress(Number(id), Number(progress));
      
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      logger.info(`项目进度更新成功: 项目ID=${id}, 进度=${progress}%`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: project,
        message: '项目进度更新成功'
      };
    }, '更新项目进度失败');
  },

  // 更新项目状态
  async updateProjectStatus(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { status } = ctx.request.body;
      
      if (!id || isNaN(Number(id))) {
        return ErrorHandler.validationError(ctx, '项目ID无效');
      }
      
      if (!status || typeof status !== 'string') {
        return ErrorHandler.validationError(ctx, '状态值不能为空且必须为字符串');
      }
      
      const project = await ProjectService.updateProjectStatus(Number(id), status);
      
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      logger.info(`项目状态更新成功: 项目ID=${id}, 状态=${status}`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: project,
        message: '项目状态更新成功'
      };
    }, '更新项目状态失败');
  },

  // 更新项目预算
  async updateProjectBudget(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { budget } = ctx.request.body;
      
      if (!id || isNaN(Number(id))) {
        return ErrorHandler.validationError(ctx, '项目ID无效');
      }
      
      if (budget === undefined || budget === null || isNaN(Number(budget))) {
        return ErrorHandler.validationError(ctx, '预算值不能为空且必须为数字');
      }
      
      const project = await ProjectService.updateProjectBudget(Number(id), Number(budget));
      
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      logger.info(`项目预算更新成功: 项目ID=${id}, 预算=${budget}`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: project,
        message: '项目预算更新成功'
      };
    }, '更新项目预算失败');
  },

  // 更新项目实际成本
  async updateProjectActualCost(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { actualCost } = ctx.request.body;
      
      if (!id || isNaN(Number(id))) {
        return ErrorHandler.validationError(ctx, '项目ID无效');
      }
      
      if (actualCost === undefined || actualCost === null || isNaN(Number(actualCost))) {
        return ErrorHandler.validationError(ctx, '实际成本值不能为空且必须为数字');
      }
      
      const project = await ProjectService.updateProjectActualCost(Number(id), Number(actualCost));
      
      if (!project) {
        return ErrorHandler.notFoundError(ctx, '项目不存在');
      }
      
      logger.info(`项目实际成本更新成功: 项目ID=${id}, 实际成本=${actualCost}`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: project,
        message: '项目实际成本更新成功'
      };
    }, '更新项目实际成本失败');
  },

  // 获取项目预算报告
  async getProjectBudgetReport(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id || isNaN(Number(id))) {
        return ErrorHandler.validationError(ctx, '项目ID无效');
      }
      
      const report = await ProjectService.getProjectBudgetReport(Number(id));
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: report
      };
    }, '获取项目预算报告失败');
  }
};

export default ProjectController;