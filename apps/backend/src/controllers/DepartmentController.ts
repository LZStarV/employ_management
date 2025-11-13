import DepartmentService from '../services/DepartmentService';
import { Context } from 'koa';
import { Department, Employee } from '../types';
import ErrorHandler from '../utils/errorHandler';

// 部门控制器接口定义
interface DepartmentController {
  getAllDepartments: (ctx: Context) => Promise<void>;
  getDepartmentById: (ctx: Context) => Promise<void>;
  createDepartment: (ctx: Context) => Promise<void>;
  updateDepartment: (ctx: Context) => Promise<void>;
  deleteDepartment: (ctx: Context) => Promise<void>;
  getDepartmentWithEmployees: (ctx: Context) => Promise<void>;
  getDepartmentStatistics: (ctx: Context) => Promise<void>;
  getDepartmentHierarchy: (ctx: Context) => Promise<void>;
  searchDepartments: (ctx: Context) => Promise<void>;
}

// 错误处理辅助函数
const handleError = (ctx: Context, error: Error, statusCode: number = 500, message?: string) => {
  console.error('DepartmentController Error:', error);
  ctx.status = statusCode;
  ctx.body = {
    success: false,
    message: message || error.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

// 部门控制器实现
const DepartmentController: DepartmentController = {
  // 获取所有部门
  async getAllDepartments(ctx: Context): Promise<void> {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const result = await DepartmentService.getAllDepartments({
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.departments,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取部门列表失败');
    }
  },
  
  // 根据ID获取部门
  async getDepartmentById(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Department ID is required' };
        return;
      }
      
      const department = await Department.findByPk(id);
      
      if (!department) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Department not found' };
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: department };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 创建新部门
  async createDepartment(ctx: Context): Promise<void> {
    try {
      const departmentData = ctx.request.body;
      
      // 验证必要字段
      if (!departmentData.department_name) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Department name is required' };
        return;
      }
      
      const newDepartment = await DepartmentService.createDepartment(departmentData);
      
      ctx.status = 201;
      ctx.body = { success: true, message: 'Department created successfully', data: newDepartment };
    } catch (error) {
      handleError(ctx, error, 400, 'Failed to create department');
    }
  },
  
  // 更新部门
  async updateDepartment(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      const departmentData = ctx.request.body;
      
      if (!id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Department ID is required' };
        return;
      }
      
      const updatedDepartment = await DepartmentService.updateDepartment(id, departmentData);
      
      if (!updatedDepartment) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Department not found' };
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: 'Department updated successfully', data: updatedDepartment };
    } catch (error) {
      handleError(ctx, error, 400, 'Failed to update department');
    }
  },
  
  // 删除部门
  async deleteDepartment(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        ErrorHandler.validationError(ctx, '部门ID是必填项');
        return;
      }
      
      // 检查部门是否有员工
      const employeeCount = await Employee.count({ where: { department_id: id } });
      if (employeeCount > 0) {
        ctx.status = 400;
        ctx.body = { 
          success: false, 
          message: `该部门下有${employeeCount}名员工，无法删除。请先重新分配或移除员工。` 
        };
        return;
      }
      
      const result = await DepartmentService.deleteDepartment(id);
      
      if (!result) {
        ErrorHandler.notFoundError(ctx, '未找到指定的部门');
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '部门删除成功' };
    } catch (error) {
      ErrorHandler.handleControllerError(ctx, error, 400, '删除部门失败');
    }
  },
  
  // 获取部门及员工信息
  async getDepartmentEmployees(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      const { page = 1, pageSize = 10 } = ctx.query;
      
      if (!id) {
        ErrorHandler.validationError(ctx, '部门ID是必填项');
        return;
      }
      
      const result = await DepartmentService.getDepartmentEmployees(id, {
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
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取部门员工列表失败');
    }
  },
  
  // 获取部门统计信息
  async getDepartmentStatistics(ctx: Context): Promise<void> {
    try {
      const statistics = await DepartmentService.getDepartmentStatistics();
      
      ctx.status = 200;
      ctx.body = { success: true, data: statistics };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 获取部门层级结构
  async getDepartmentHierarchy(ctx: Context): Promise<void> {
    try {
      const hierarchy = await DepartmentService.getDepartmentHierarchy();
      
      ctx.status = 200;
      ctx.body = { success: true, data: hierarchy };
    } catch (error) {
      handleError(ctx, error);
    }
  },

  // 搜索部门
  async searchDepartments(ctx: Context): Promise<void> {
    try {
      const { keyword } = ctx.query;
      
      if (!keyword) {
        ErrorHandler.validationError(ctx, '搜索关键词是必填项');
        return;
      }
      
      const departments = await DepartmentService.searchDepartments(keyword as string);
      
      ctx.status = 200;
      ctx.body = { success: true, data: departments };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '搜索部门失败');
    }
  }
};

export default DepartmentController;