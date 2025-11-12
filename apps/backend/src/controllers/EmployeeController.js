const { Employee, Department, Position, Salary, Project, Training, sequelize } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');
const EmployeeService = require('../services/EmployeeService');

class EmployeeController {
  // 获取所有员工列表
  static async getAllEmployees(ctx) {
    try {
      const { page = 1, limit = 10, department_id, position_id, status } = ctx.query;
      
      const whereClause = {};
      if (department_id) whereClause.department_id = department_id;
      if (position_id) whereClause.position_id = position_id;
      if (status) whereClause.status = status;
      
      const offset = (page - 1) * limit;
      
      const employees = await Employee.findAll({
        where: whereClause,
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' },
          { model: Salary, as: 'salary' }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['employee_id', 'DESC']]
      });
      
      const total = await Employee.count({ where: whereClause });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employees,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      winston.error('获取员工列表失败:', error);
      ctx.throw(500, '获取员工列表失败');
    }
  }

  // 获取单个员工详情
  static async getEmployeeById(ctx) {
    try {
      const { id } = ctx.params;
      
      const employee = await Employee.getEmployeeWithAllDetails(id);
      
      if (!employee) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '员工不存在'
        };
        return;
      }
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employee
      };
    } catch (error) {
      winston.error(`获取员工ID ${ctx.params.id} 详情失败:`, error);
      ctx.throw(500, '获取员工详情失败');
    }
  }

  // 创建新员工
  static async createEmployee(ctx) {
    try {
      const employeeData = ctx.request.body;
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 创建员工记录
        const employee = await Employee.create(employeeData, { transaction });
        
        // 如果提供了薪资信息，创建薪资记录
        if (employeeData.salary) {
          await Salary.create({
            employee_id: employee.employee_id,
            ...employeeData.salary
          }, { transaction });
        }
        
        // 提交事务
        await transaction.commit();
        
        // 重新查询员工信息（包含关联数据）
        const newEmployee = await Employee.getEmployeeWithAllDetails(employee.employee_id);
        
        ctx.status = 201;
        ctx.body = {
          status: 'success',
          message: '员工创建成功',
          data: newEmployee
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error('创建员工失败:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        ctx.throw(409, '邮箱地址已存在');
      }
      ctx.throw(500, '创建员工失败');
    }
  }

  // 更新员工信息
  static async updateEmployee(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      
      // 检查员工是否存在
      const employee = await Employee.findByPk(id);
      if (!employee) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '员工不存在'
        };
        return;
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 分离薪资数据
        const salaryData = updateData.salary;
        delete updateData.salary;
        
        // 更新员工信息
        await employee.update(updateData, { transaction });
        
        // 如果提供了薪资信息，更新薪资记录
        if (salaryData) {
          const salary = await Salary.findOne({
            where: { employee_id: id },
            transaction
          });
          
          if (salary) {
            await salary.update(salaryData, { transaction });
          } else {
            await Salary.create({
              employee_id: id,
              ...salaryData
            }, { transaction });
          }
        }
        
        // 提交事务
        await transaction.commit();
        
        // 重新查询员工信息
        const updatedEmployee = await Employee.getEmployeeWithAllDetails(id);
        
        ctx.status = 200;
        ctx.body = {
          status: 'success',
          message: '员工信息更新成功',
          data: updatedEmployee
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error(`更新员工ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '更新员工信息失败');
    }
  }

  // 删除员工
  static async deleteEmployee(ctx) {
    try {
      const { id } = ctx.params;
      
      // 检查员工是否存在
      const employee = await Employee.findByPk(id);
      if (!employee) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '员工不存在'
        };
        return;
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 删除员工（级联删除会自动删除相关的薪资记录等）
        await employee.destroy({ transaction });
        
        // 提交事务
        await transaction.commit();
        
        ctx.status = 200;
        ctx.body = {
          status: 'success',
          message: '员工删除成功'
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error(`删除员工ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '删除员工失败');
    }
  }

  // 获取员工的项目列表
  static async getEmployeeProjects(ctx) {
    try {
      const { id } = ctx.params;
      
      const employee = await Employee.findByPk(id, {
        include: [{ model: Project, as: 'projects' }]
      });
      
      if (!employee) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '员工不存在'
        };
        return;
      }
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employee.projects
      };
    } catch (error) {
      winston.error(`获取员工ID ${ctx.params.id} 的项目列表失败:`, error);
      ctx.throw(500, '获取员工项目列表失败');
    }
  }

  // 获取员工的培训记录
  static async getEmployeeTrainings(ctx) {
    try {
      const { id } = ctx.params;
      
      const employee = await Employee.findByPk(id, {
        include: [{ model: Training, as: 'trainings' }]
      });
      
      if (!employee) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '员工不存在'
        };
        return;
      }
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employee.trainings
      };
    } catch (error) {
      winston.error(`获取员工ID ${ctx.params.id} 的培训记录失败:`, error);
      ctx.throw(500, '获取员工培训记录失败');
    }
  }

  // 搜索员工
  static async searchEmployees(ctx) {
    try {
      const { keyword, page = 1, limit = 10 } = ctx.query;
      
      if (!keyword) {
        ctx.status = 400;
        ctx.body = {
          status: 'error',
          message: '搜索关键词不能为空'
        };
        return;
      }
      
      const offset = (page - 1) * limit;
      
      // 搜索条件：姓名、邮箱或电话
      const employees = await Employee.findAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${keyword}%` } },
            { last_name: { [Op.iLike]: `%${keyword}%` } },
            { email: { [Op.iLike]: `%${keyword}%` } },
            { phone: { [Op.iLike]: `%${keyword}%` } }
          ]
        },
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' }
        ],
        limit: parseInt(limit),
        offset: offset
      });
      
      const total = await Employee.count({
        where: {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${keyword}%` } },
            { last_name: { [Op.iLike]: `%${keyword}%` } },
            { email: { [Op.iLike]: `%${keyword}%` } },
            { phone: { [Op.iLike]: `%${keyword}%` } }
          ]
        }
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employees,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      winston.error('搜索员工失败:', error);
      ctx.throw(500, '搜索员工失败');
    }
  }
  
  // 员工调动
  static async transferEmployee(ctx) {
    try {
      const { id } = ctx.params;
      const { new_department_id, new_position_id, effective_date } = ctx.request.body;
      
      const result = await EmployeeService.transferEmployee(id, new_department_id, new_position_id, effective_date);
      
      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      winston.error(`员工调动失败:`, error);
      ctx.throw(500, error.message || '员工调动失败');
    }
  }

  // 薪资调整
  static async adjustSalary(ctx) {
    try {
      const { id } = ctx.params;
      const salaryData = ctx.request.body;
      
      const result = await EmployeeService.adjustSalary(id, salaryData);
      
      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      winston.error(`薪资调整失败:`, error);
      ctx.throw(500, error.message || '薪资调整失败');
    }
  }

  // 批量导入员工
  static async batchImport(ctx) {
    try {
      const employeesData = ctx.request.body.employees;
      
      if (!Array.isArray(employeesData)) {
        ctx.status = 400;
        ctx.body = {
          status: 'error',
          message: '员工数据必须是数组格式'
        };
        return;
      }
      
      const result = await EmployeeService.batchImportEmployees(employeesData);
      
      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      winston.error(`批量导入员工失败:`, error);
      ctx.throw(500, error.message || '批量导入员工失败');
    }
  }

  // 获取员工统计
  static async getStatistics(ctx) {
    try {
      const filters = ctx.query;
      
      const result = await EmployeeService.getEmployeeStatistics(filters);
      
      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      winston.error(`获取员工统计失败:`, error);
      ctx.throw(500, error.message || '获取员工统计失败');
    }
  }

  // 员工离职处理
  static async processResignation(ctx) {
    try {
      const { id } = ctx.params;
      const { resignation_date, reason } = ctx.request.body;
      
      const result = await EmployeeService.processEmployeeResignation(id, resignation_date, reason);
      
      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      winston.error(`员工离职处理失败:`, error);
      ctx.throw(500, error.message || '员工离职处理失败');
    }
  }
}

module.exports = EmployeeController;