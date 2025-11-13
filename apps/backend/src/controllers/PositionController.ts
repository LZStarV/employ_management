import PositionService from '../services/PositionService';
import Position from '../models/Position';
import Employee from '../models/Employee';
import { Context } from 'koa';
import { ErrorHandler } from '../utils/errorHandler';

// 职位控制器接口定义
interface PositionController {
  getAllPositions: (ctx: Context) => Promise<void>;
  getPositionById: (ctx: Context) => Promise<void>;
  createPosition: (ctx: Context) => Promise<void>;
  updatePosition: (ctx: Context) => Promise<void>;
  deletePosition: (ctx: Context) => Promise<void>;
  getPositionsByDepartment: (ctx: Context) => Promise<void>;
  getPositionWithEmployees: (ctx: Context) => Promise<void>;
  getPositionSalaryStatistics: (ctx: Context) => Promise<void>;
  promoteEmployee: (ctx: Context) => Promise<void>;
  getEmployeePositionHistory: (ctx: Context) => Promise<void>;
  getPositionHistoryById: (ctx: Context) => Promise<void>;
  getPromotionStats: (ctx: Context) => Promise<void>;
  getEmployeePromotionHistory: (ctx: Context) => Promise<void>;
}



// 职位控制器实现
const PositionController: PositionController = {
  // 获取所有职位
  async getAllPositions(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { department_id } = ctx.query;
      const queryOptions: any = {};
      
      if (department_id) queryOptions.department_id = department_id;
      
      const positions = await PositionService.getAllPositions(queryOptions);
      
      ctx.status = 200;
      ctx.body = { success: true, data: positions };
    }, '获取职位列表失败');
  },
  
  // 根据ID获取职位
  async getPositionById(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '职位ID不能为空');
      }
      
      const position = await Position.findByPk(id);
      
      if (!position) {
        return ErrorHandler.notFoundError(ctx, '职位不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: position };
    }, '获取职位详情失败');
  },
  
  // 创建新职位
  async createPosition(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const positionData = ctx.request.body;
      
      // 验证必要字段
      if (!positionData.position_name) {
        return ErrorHandler.validationError(ctx, '职位名称不能为空');
      }
      
      if (!positionData.department_id) {
        return ErrorHandler.validationError(ctx, '部门ID不能为空');
      }
      
      // 验证薪资范围
      if (positionData.min_salary && positionData.max_salary && 
          parseFloat(positionData.min_salary) > parseFloat(positionData.max_salary)) {
        return ErrorHandler.validationError(ctx, '最低工资不能大于最高工资');
      }
      
      const newPosition = await PositionService.createPosition(positionData);
      
      ctx.status = 201;
      ctx.body = { success: true, message: '职位创建成功', data: newPosition };
    }, '创建职位失败', 400);
  },
  
  // 更新职位
  async updatePosition(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const positionData = ctx.request.body;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '职位ID不能为空');
      }
      
      // 验证薪资范围
      if (positionData.min_salary && positionData.max_salary && 
          parseFloat(positionData.min_salary) > parseFloat(positionData.max_salary)) {
        return ErrorHandler.validationError(ctx, '最低工资不能大于最高工资');
      }
      
      const updatedPosition = await PositionService.updatePosition(id, positionData);
      
      if (!updatedPosition) {
        return ErrorHandler.notFoundError(ctx, '职位不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '职位更新成功', data: updatedPosition };
    }, '更新职位失败', 400);
  },
  
  // 删除职位
  async deletePosition(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '职位ID不能为空');
      }
      
      // 检查职位是否有员工
      const employeeCount = await Employee.count({ where: { position_id: id } });
      if (employeeCount > 0) {
        return ErrorHandler.validationError(ctx, 
          `该职位下有${employeeCount}名员工，无法删除。请先重新分配或移除员工。` 
        );
      }
      
      const result = await PositionService.deletePosition(id);
      
      if (!result) {
        return ErrorHandler.notFoundError(ctx, '职位不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '职位删除成功' };
    }, '删除职位失败', 400);
  },
  
  // 根据部门获取职位
  async getPositionsByDepartment(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { department_id } = ctx.params;
      
      if (!department_id) {
        return ErrorHandler.validationError(ctx, '部门ID不能为空');
      }
      
      const positions = await PositionService.getPositionsByDepartment(department_id);
      
      ctx.status = 200;
      ctx.body = { success: true, data: positions };
    }, '获取部门职位列表失败');
  },
  
  // 获取职位及员工信息
  async getPositionWithEmployees(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { page = 1, pageSize = 10 } = ctx.query;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '职位ID不能为空');
      }
      
      const positionWithEmployees = await PositionService.getPositionWithEmployees(
        id, 
        { page: parseInt(page), pageSize: parseInt(pageSize) }
      );
      
      if (!positionWithEmployees) {
        return ErrorHandler.notFoundError(ctx, '职位不存在');
      }
      
      ctx.status = 200;
      ctx.body = {
        success: true, 
        data: positionWithEmployees.position,
        employees: positionWithEmployees.employees,
        pagination: positionWithEmployees.pagination
      };
    }, '获取职位及员工信息失败');
  },
  
  // 获取职位薪资统计信息
  async getPositionSalaryStatistics(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '职位ID不能为空');
      }
      
      const statistics = await PositionService.getPositionSalaryStatistics(id);
      
      if (!statistics) {
        return ErrorHandler.notFoundError(ctx, '职位不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: statistics };
    }, '获取职位薪资统计信息失败');
  },
  
  // 员工职级晋升
  async promoteEmployee(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const promotionData = ctx.request.body;
      
      // 验证必要参数
      if (!promotionData.employee_id || !promotionData.new_position_id || 
          !promotionData.new_salary || !promotionData.change_reason || !promotionData.changed_by) {
        return ErrorHandler.validationError(ctx, '缺少必要参数');
      }
      
      const result = await PositionService.promoteEmployee(promotionData);
      
      ctx.status = 201;
      ctx.body = { success: true, message: '员工职级晋升成功', data: result };
    }, '员工职级晋升失败', 400);
  },
  
  // 获取员工职位变更历史
  async getEmployeePositionHistory(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { employee_id } = ctx.params;
      
      if (!employee_id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const history = await PositionService.getEmployeePositionHistory(employee_id);
      
      ctx.status = 200;
      ctx.body = { success: true, data: history };
    }, '获取员工职位变更历史失败');
  },
  
  // 根据ID获取职位变更历史详情
  async getPositionHistoryById(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '记录ID不能为空');
      }
      
      const history = await PositionService.getPositionHistoryById(parseInt(id));
      
      if (!history) {
        return ErrorHandler.notFoundError(ctx, '职位变更历史记录不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: history };
    }, '获取职位变更历史记录失败');
  },
  
  // 获取晋升统计信息
  async getPromotionStats(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const stats = await PositionService.getPromotionStats();
      
      ctx.status = 200;
      ctx.body = { success: true, data: stats };
    }, '获取晋升统计信息失败');
  },
  
  // 获取员工特定类型的晋升历史
  async getEmployeePromotionHistory(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { employee_id } = ctx.params;
      const { type } = ctx.query;
      
      if (!employee_id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const history = await PositionService.getEmployeePromotionHistory(employee_id, type as string);
      
      ctx.status = 200;
      ctx.body = { success: true, data: history };
    }, '获取员工晋升历史失败');
  }
};

export default PositionController;