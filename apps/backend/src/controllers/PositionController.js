const { Position, Employee } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');

class PositionController {
  // 获取所有职位列表
  static async getAllPositions(ctx) {
    try {
      const positions = await Position.findAll({
        include: [{ model: Employee, as: 'employees', attributes: ['employee_id', 'first_name', 'last_name'] }],
        order: [['position_id', 'ASC']]
      });
      
      // 计算每个职位的员工数量
      const positionsWithCount = positions.map(pos => ({
        ...pos.toJSON(),
        employeeCount: pos.employees.length
      }));
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: positionsWithCount
      };
    } catch (error) {
      winston.error('获取职位列表失败:', error);
      ctx.throw(500, '获取职位列表失败');
    }
  }

  // 获取单个职位详情
  static async getPositionById(ctx) {
    try {
      const { id } = ctx.params;
      
      const position = await Position.getPositionWithStats(id);
      
      if (!position) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '职位不存在'
        };
        return;
      }
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: position
      };
    } catch (error) {
      winston.error(`获取职位ID ${ctx.params.id} 详情失败:`, error);
      ctx.throw(500, '获取职位详情失败');
    }
  }

  // 创建新职位
  static async createPosition(ctx) {
    try {
      const positionData = ctx.request.body;
      
      const position = await Position.create(positionData);
      
      ctx.status = 201;
      ctx.body = {
        status: 'success',
        message: '职位创建成功',
        data: position
      };
    } catch (error) {
      winston.error('创建职位失败:', error);
      ctx.throw(500, '创建职位失败');
    }
  }

  // 更新职位信息
  static async updatePosition(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      
      // 检查职位是否存在
      const position = await Position.findByPk(id);
      if (!position) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '职位不存在'
        };
        return;
      }
      
      // 更新职位信息
      await position.update(updateData);
      
      // 重新查询职位信息
      const updatedPosition = await Position.getPositionWithStats(id);
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        message: '职位信息更新成功',
        data: updatedPosition
      };
    } catch (error) {
      winston.error(`更新职位ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '更新职位信息失败');
    }
  }

  // 删除职位
  static async deletePosition(ctx) {
    try {
      const { id } = ctx.params;
      
      // 检查职位是否存在
      const position = await Position.findByPk(id);
      if (!position) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '职位不存在'
        };
        return;
      }
      
      // 检查职位是否有员工
      const employeeCount = await Employee.count({ where: { position_id: id } });
      if (employeeCount > 0) {
        ctx.status = 400;
        ctx.body = {
          status: 'error',
          message: '该职位下还有员工，无法删除'
        };
        return;
      }
      
      // 删除职位
      await position.destroy();
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        message: '职位删除成功'
      };
    } catch (error) {
      winston.error(`删除职位ID ${ctx.params.id} 失败:`, error);
      ctx.throw(500, '删除职位失败');
    }
  }

  // 获取职位的员工列表
  static async getPositionEmployees(ctx) {
    try {
      const { id } = ctx.params;
      
      // 检查职位是否存在
      const position = await Position.findByPk(id);
      if (!position) {
        ctx.status = 404;
        ctx.body = {
          status: 'error',
          message: '职位不存在'
        };
        return;
      }
      
      const employees = await Employee.findAll({
        where: { position_id: id },
        include: [{ model: require('../models').Department, as: 'department' }],
        order: [['employee_id', 'ASC']]
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: employees
      };
    } catch (error) {
      winston.error(`获取职位ID ${ctx.params.id} 的员工列表失败:`, error);
      ctx.throw(500, '获取职位员工列表失败');
    }
  }

  // 搜索职位
  static async searchPositions(ctx) {
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
      
      const positions = await Position.findAll({
        where: {
          [Op.or]: [
            { position_name: { [Op.iLike]: `%${keyword}%` } },
            { level: { [Op.iLike]: `%${keyword}%` } },
            { description: { [Op.iLike]: `%${keyword}%` } }
          ]
        }
      });
      
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: positions
      };
    } catch (error) {
      winston.error('搜索职位失败:', error);
      ctx.throw(500, '搜索职位失败');
    }
  }
}

module.exports = PositionController;