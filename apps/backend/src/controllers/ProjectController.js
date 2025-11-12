const { Project, Employee, EmployeeProject, sequelize } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');

class ProjectController {
  // 获取所有项目列表
  static async getAllProjects(ctx) {
    try {
      const { page = 1, limit = 10, status } = ctx.query;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      
      const offset = (page - 1) * limit;
      
      const projects = await Project.findAll({
        where: whereClause,
        include: [{ model: Employee, as: 'employees', attributes: ['employee_id', 'first_name', 'last_name'] }],
        limit: parseInt(limit),
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
        status: 'success',
        data: projectsWithProgress,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      winston.error('获取项目列表失败:', error);
      ctx.throw(500, '获取项目列表失败');
    }
  }

  // 获取单个项目详情
  static async getProjectById(ctx) {
    try {
      const { id } = ctx.params;
      
      const project = await Project.findByPk(id);
      
      if (!project) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '项目不存在'
        };
        return;
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
        status: 'success',
        data: projectData
      };
    } catch (error) {
      winston.error(`获取项目ID ${ctx.params.id} 详情失败:`, error);
      ctx.throw(500, '获取项目详情失败');
    }
  }

  // 获取项目成员列表（分页）
  static async getProjectMembers(ctx) {
    try {
      const { id } = ctx.params;
      const { page = 1, limit = 10 } = ctx.query;
      
      // 检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '项目不存在'
        };
        return;
      }
      
      const offset = (page - 1) * limit;
      
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
        limit: parseInt(limit),
        offset: parseInt(offset),
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
        status: 'success',
        data: members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      winston.error(`获取项目ID ${ctx.params.id} 成员列表失败:`, error);
      ctx.throw(500, '获取项目成员列表失败');
    }
  }

  // 创建新项目
  static async createProject(ctx) {
    try {
      const projectData = ctx.request.body;
      const { employees } = projectData;
      delete projectData.employees;
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
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
        await transaction.commit();
        
        // 重新查询项目信息（包含员工信息）
        const newProject = await Project.findByPk(project.project_id, {
          include: [{ model: Employee, as: 'employees' }]
        });
        
        ctx.status = 201;
        ctx.body = {
          status: 'success',
          message: '项目创建成功',
          data: newProject
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error('创建项目失败:', error);
      ctx.throw(500, '创建项目失败');
    }
  }

  // 更新项目信息
  static async updateProject(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      const { employees } = updateData;
      delete updateData.employees;
      
      // 检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '项目不存在'
        };
        return;
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
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
        await transaction.commit();
        
        // 重新查询项目信息
        const updatedProject = await Project.findByPk(id, {
          include: [{ model: Employee, as: 'employees' }]
        });
        
        ctx.status = 200;
        ctx.body = {
          status: 'success',
          message: '项目信息更新成功',
          data: updatedProject
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error(`更新项目ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '更新项目信息失败');
    }
  }

  // 删除项目
  static async deleteProject(ctx) {
    try {
      const { id } = ctx.params;
      
      // 检查项目是否存在
      const project = await Project.findByPk(id);
      if (!project) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '项目不存在'
        };
        return;
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 删除员工项目关联
        await EmployeeProject.destroy({
          where: { project_id: id },
          transaction
        });
        
        // 删除考勤记录中的项目关联
        await sequelize.models.Attendance.update(
          { project_id: null },
          { where: { project_id: id }, transaction }
        );
        
        // 删除项目
        await project.destroy({ transaction });
        
        // 提交事务
        await transaction.commit();
        
        ctx.status = 200;
        ctx.body = {
          status: 'success',
          message: '项目删除成功'
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error(`删除项目ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '删除项目失败');
    }
  }

  // 搜索项目
  static async searchProjects(ctx) {
    try {
      const { keyword } = ctx.query;
      
      if (!keyword) {
        ctx.status = 400;
        ctx.body = {
          status: 'error',
          message: '搜索关键词不能为空'
        };
        return;
      }
      
      const projects = await Project.findAll({
        where: {
          [Op.or]: [
            { project_name: { [Op.iLike]: `%${keyword}%` } },
            { description: { [Op.iLike]: `%${keyword}%` } }
          ]
        },
        include: [{ model: Employee, as: 'employees', attributes: ['employee_id', 'first_name', 'last_name'] }]
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: projects
      };
    } catch (error) {
      winston.error('搜索项目失败:', error);
      ctx.throw(500, '搜索项目失败');
    }
  }
}

module.exports = ProjectController;