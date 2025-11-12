const { Department, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');

class DepartmentController {
  // 获取所有部门列表
  static async getAllDepartments(ctx) {
    try {
      const { page = 1, limit = 10 } = ctx.query;
      const offset = (page - 1) * limit;
      
      // 查询部门总数
      const total = await Department.count();
      
      // 查询部门列表
      const departments = await Department.findAll({
        include: [
          { model: Employee, as: 'departmentManager' },
          { model: Employee, as: 'employees', attributes: ['employee_id', 'first_name', 'last_name'] }
        ],
        order: [['department_id', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // 计算每个部门的统计信息
      const departmentsWithStats = departments.map(dept => {
        const employeeCount = dept.employees.length;
        const managerName = dept.departmentManager ? 
          `${dept.departmentManager.first_name} ${dept.departmentManager.last_name}` : null;
          
        return {
          ...dept.toJSON(),
          stats: {
            employeeCount,
            managerName
          }
        };
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: departmentsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      winston.error('获取部门列表失败:', error);
      ctx.throw(500, '获取部门列表失败');
    }
  }

  // 获取单个部门详情
  static async getDepartmentById(ctx) {
    try {
      const { id } = ctx.params;
      
      const department = await Department.getDepartmentWithStats(id);
      
      if (!department) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '部门不存在'
        };
        return;
      }
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: department
      };
    } catch (error) {
      winston.error(`获取部门ID ${ctx.params.id} 详情失败:`, error);
      ctx.throw(500, '获取部门详情失败');
    }
  }

  // 获取部门员工列表（分页）
  static async getDepartmentEmployees(ctx) {
    try {
      const { id } = ctx.params;
      const { page = 1, limit = 10 } = ctx.query;
      
      // 检查部门是否存在
      const department = await Department.findByPk(id);
      if (!department) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '部门不存在'
        };
        return;
      }
      
      const offset = (page - 1) * limit;
      
      // 查询部门员工总数
      const total = await Employee.count({
        where: { department_id: id }
      });
      
      // 查询部门员工列表
      const employees = await Employee.findAll({
        where: { department_id: id },
        include: [
          { model: sequelize.models.Position, as: 'position' },
          { model: sequelize.models.Salary, as: 'salary' }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['employee_id', 'ASC']]
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      winston.error(`获取部门ID ${id} 员工列表失败:`, error);
      ctx.throw(500, '获取部门员工列表失败');
    }
  }

  // 创建新部门
  static async createDepartment(ctx) {
    try {
      const departmentData = ctx.request.body;
      
      // 验证经理是否为真实员工且状态为active
      if (departmentData.manager_id) {
        const manager = await Employee.findOne({
          where: {
            employee_id: departmentData.manager_id,
            status: 'active'
          }
        });
        
        if (!manager) {
          ctx.status = 400;
          ctx.body = {
            status: 'error',
            message: '指定的经理不存在或状态不是活跃的'
          };
          return;
        }
      }
      
      const department = await Department.create(departmentData);
      
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        message: '部门创建成功',
        data: department
      };
    } catch (error) {
      winston.error('创建部门失败:', error);
      ctx.throw(500, '创建部门失败');
    }
  }

  // 更新部门信息
  static async updateDepartment(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      
      // 检查部门是否存在
      const department = await Department.findByPk(id);
      if (!department) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '部门不存在'
        };
        return;
      }
      
      // 验证经理是否为真实员工且状态为active
      if (updateData.manager_id) {
        const manager = await Employee.findOne({
          where: {
            employee_id: updateData.manager_id,
            status: 'active'
          }
        });
        
        if (!manager) {
          ctx.status = 400;
          ctx.body = {
            status: 'error',
            message: '指定的经理不存在或状态不是活跃的'
          };
          return;
        }
        
        // 确保经理属于该部门
        if (manager.department_id !== id) {
          // 更新经理的部门
          await manager.update({ department_id: id });
        }
      }
      
      // 更新部门信息
      await department.update(updateData);
      
      // 重新查询部门信息
      const updatedDepartment = await Department.getDepartmentWithStats(id);
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        message: '部门信息更新成功',
        data: updatedDepartment
      };
    } catch (error) {
      winston.error(`更新部门ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '更新部门信息失败');
    }
  }

  // 删除部门
  static async deleteDepartment(ctx) {
    try {
      const { id } = ctx.params;
      
      // 检查部门是否存在
      const department = await Department.findByPk(id);
      if (!department) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '部门不存在'
        };
        return;
      }
      
      // 检查部门是否有员工
      const employeeCount = await Employee.count({ where: { department_id: id } });
      if (employeeCount > 0) {
        ctx.status = 400;
        ctx.body = {
          status: 'error',
          message: '该部门下还有员工，无法删除'
        };
        return;
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 清除部门经理关联
        await Department.update(
          { manager_id: null },
          { where: { department_id: id }, transaction }
        );
        
        // 删除部门
        await department.destroy({ transaction });
        
        // 提交事务
        await transaction.commit();
        
        ctx.status = 200;
        ctx.body = {
          status: 'success',
          message: '部门删除成功'
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      winston.error(`删除部门ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '删除部门失败');
    }
  }



  // 搜索部门
  static async searchDepartments(ctx) {
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
      
      const departments = await Department.findAll({
        where: {
          [Op.or]: [
            { department_name: { [Op.iLike]: `%${keyword}%` } },
            { location: { [Op.iLike]: `%${keyword}%` } }
          ]
        },
        include: [{ model: Employee, as: 'departmentManager' }]
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: departments
      };
    } catch (error) {
      winston.error('搜索部门失败:', error);
      ctx.throw(500, '搜索部门失败');
    }
  }
}

module.exports = DepartmentController;