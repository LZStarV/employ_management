import EmployeeService from '../services/EmployeeService';
import { Context } from 'koa';
import { Employee, Department, Position } from '../types';
import { validationResult, body } from 'express-validator';
import { ErrorHandler } from '../utils/errorHandler';
import winston from '../utils/logger';

// 员工控制器接口定义
interface EmployeeController {
  getAllEmployees: (ctx: Context) => Promise<void>;
  getEmployeeById: (ctx: Context) => Promise<void>;
  createEmployee: (ctx: Context) => Promise<void>;
  updateEmployee: (ctx: Context) => Promise<void>;
  deleteEmployee: (ctx: Context) => Promise<void>;
  getEmployeeWithDetails: (ctx: Context) => Promise<void>;
  searchEmployees: (ctx: Context) => Promise<void>;
  getEmployeeStatistics: (ctx: Context) => Promise<void>;
  exportEmployees: (ctx: Context) => Promise<void>;
  importEmployees: (ctx: Context) => Promise<void>;
  updateEmployeeStatus: (ctx: Context) => Promise<void>;
  calculateEmployeeBonus: (ctx: Context) => Promise<void>;
}



// 员工控制器实现
const EmployeeController: EmployeeController = {
  // 获取所有员工
  async getAllEmployees(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { page = 1, pageSize = 10, department, position, status } = ctx.query;
      
      const queryOptions: any = {};
      
      if (department) queryOptions.department_id = department;
      if (position) queryOptions.position_id = position;
      if (status) queryOptions.status = status;
      
      const result = await EmployeeService.getAllEmployees({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        queryOptions
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.employees,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    }, '获取员工列表失败');
  },
  
  // 根据ID获取员工
  async getEmployeeById(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const employee = await Employee.findByPk(id);
      
      if (!employee) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: employee };
    }, '获取员工详情失败');
  },
  
  // 创建新员工
  async createEmployee(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const errors = validationResult(ctx.request);
      if (!errors.isEmpty()) {
        return ErrorHandler.validationError(ctx, '参数验证错误', errors.array());
      }
      
      const employeeData = ctx.request.body;
      const newEmployee = await EmployeeService.createEmployee(employeeData);
      
      ctx.status = 201;
      ctx.body = { success: true, message: '员工创建成功', data: newEmployee };
    }, '创建员工失败', 400);
  },
  
  // 更新员工信息
  async updateEmployee(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const employeeData = ctx.request.body;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const updatedEmployee = await EmployeeService.updateEmployee(id, employeeData);
      
      if (!updatedEmployee) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '员工信息更新成功', data: updatedEmployee };
    }, '更新员工信息失败', 400);
  },
  
  // 删除员工
  async deleteEmployee(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const result = await EmployeeService.deleteEmployee(id);
      
      if (!result) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '员工删除成功' };
    }, '删除员工失败', 400);
  },
  
  // 获取员工详细信息
  async getEmployeeWithDetails(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const employeeDetails = await EmployeeService.getEmployeeWithDetails(id);
      
      if (!employeeDetails) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: employeeDetails };
    }, '获取员工详细信息失败');
  },
  
  // 搜索员工
  async searchEmployees(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { keyword, department, position, page = 1, pageSize = 10 } = ctx.query;
      
      if (!keyword) {
        return ErrorHandler.validationError(ctx, '搜索关键词不能为空');
      }
      
      const searchOptions: any = { keyword };
      if (department) searchOptions.department_id = department;
      if (position) searchOptions.position_id = position;
      
      const result = await EmployeeService.searchEmployees({
        searchOptions,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.employees,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    }, '搜索员工失败');
  },
  
  // 获取员工统计信息
  async getEmployeeStatistics(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const statistics = await EmployeeService.getEmployeeStatistics();
      
      ctx.status = 200;
      ctx.body = { success: true, data: statistics };
    }, '获取员工统计信息失败');
  },
  
  // 导出员工数据
  async exportEmployees(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const exportData = await EmployeeService.exportEmployees();
      
      // 设置响应头，准备下载
      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename=employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      ctx.status = 200;
      ctx.body = exportData;
    }, '导出员工数据失败', 500);
  },
  
  // 导入员工数据
  async importEmployees(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      // 这里假设文件上传中间件已配置，ctx.request.files包含上传的文件
      if (!ctx.request.files || !ctx.request.files.file) {
        return ErrorHandler.validationError(ctx, '未上传文件');
      }
      
      const file = ctx.request.files.file;
      const importResult = await EmployeeService.importEmployees(file);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: '员工数据导入成功',
        data: importResult
      };
    }, '导入员工数据失败', 400);
  },
  
  // 更新员工状态
  async updateEmployeeStatus(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { status } = ctx.request.body;
      
      if (!id || !status) {
        return ErrorHandler.validationError(ctx, '员工ID和状态不能为空');
      }
      
      const validStatuses = ['Active', 'Inactive', 'On Leave', 'Terminated'];
      if (!validStatuses.includes(status)) {
        return ErrorHandler.validationError(ctx, 
          `无效的状态值。状态必须是以下之一: ${validStatuses.join(', ')}`
        );
      }
      
      const result = await EmployeeService.updateEmployeeStatus(id, status);
      
      if (!result) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '员工状态更新成功' };
    }, '更新员工状态失败', 400);
  },
  
  // 计算员工奖金
  async calculateEmployeeBonus(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const bonusData = ctx.request.body;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const bonusCalculation = await EmployeeService.calculateEmployeeBonus(id, bonusData);
      
      if (!bonusCalculation) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: bonusCalculation };
    }, '计算员工奖金失败', 400);
  },
  
  // 获取员工参与的项目
  async getEmployeeProjects(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      // 检查员工是否存在
      const employee = await EmployeeService.getEmployeeById(id);
      if (!employee) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      const projects = await EmployeeService.getEmployeeProjects(id);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: projects
      };
    }, '获取员工参与项目失败');
  },
  
  // 员工调动
  async transferEmployee(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { department_id, position_id, reason } = ctx.request.body;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      if (!department_id && !position_id) {
        return ErrorHandler.validationError(ctx, '至少需要提供新部门或新职位');
      }
      
      const transferResult = await EmployeeService.transferEmployee(id, { department_id, position_id, reason });
      
      if (!transferResult) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      // 记录调动日志
      winston.info(`员工调动：员工ID ${id}，从部门 ${transferResult.old_department} (职位 ${transferResult.old_position}) 调动到部门 ${department_id} (职位 ${position_id})，原因：${reason || '未说明'}`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: '员工调动成功',
        data: transferResult
      };
    }, '员工调动失败', 500);
  },
  
  // 薪资调整
  async adjustEmployeeSalary(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { new_salary, reason } = ctx.request.body;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      if (typeof new_salary !== 'number' || new_salary <= 0) {
        return ErrorHandler.validationError(ctx, '新薪资必须是正数');
      }
      
      const adjustResult = await EmployeeService.adjustEmployeeSalary(id, { new_salary, reason });
      
      if (!adjustResult) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      // 记录薪资调整日志
      winston.info(`薪资调整：员工ID ${id}，原薪资 ${adjustResult.old_salary}，新薪资 ${new_salary}，变动 ${adjustResult.salary_change} (${adjustResult.change_percentage})，原因：${reason || '未说明'}`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: '薪资调整成功',
        data: adjustResult
      };
    }, '薪资调整失败', 500);
  },
  
  // 员工离职处理
  async terminateEmployee(ctx: Context): Promise<void> {
    await ErrorHandler.handleControllerError(ctx, async () => {
      const { id } = ctx.params;
      const { termination_date, reason } = ctx.request.body;
      
      if (!id) {
        return ErrorHandler.validationError(ctx, '员工ID不能为空');
      }
      
      const terminateResult = await EmployeeService.terminateEmployee(id, { termination_date, reason });
      
      if (!terminateResult) {
        return ErrorHandler.notFoundError(ctx, '员工不存在');
      }
      
      if (terminateResult.alreadyTerminated) {
        return ErrorHandler.validationError(ctx, '该员工已经离职');
      }
      
      // 记录离职日志
      winston.info(`员工离职：员工ID ${id}，姓名 ${terminateResult.employee_name}，离职日期 ${terminateResult.termination_date}，原因：${reason || '未说明'}`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: '员工离职处理成功',
        data: terminateResult
      };
    }, '员工离职处理失败', 500);
  }
};

export default EmployeeController;