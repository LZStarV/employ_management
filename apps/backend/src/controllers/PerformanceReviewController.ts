const PerformanceReviewService = require('../services/PerformanceReviewService');
const PerformanceReview = require('../models/PerformanceReview');
const Employee = require('../models/Employee');

// 绩效评估控制器接口定义
interface PerformanceReviewController {
  getAllReviews: (ctx: any) => Promise<void>;
  getReviewById: (ctx: any) => Promise<void>;
  createReview: (ctx: any) => Promise<void>;
  updateReview: (ctx: any) => Promise<void>;
  deleteReview: (ctx: any) => Promise<void>;
  getEmployeeReviews: (ctx: any) => Promise<void>;
  submitReview: (ctx: any) => Promise<void>;
  getManagerReviews: (ctx: any) => Promise<void>;
  getReviewSummary: (ctx: any) => Promise<void>;
  getDepartmentReviewStats: (ctx: any) => Promise<void>;
  getReviewReport: (ctx: any) => Promise<void>;
}

// 错误处理辅助函数
const handleError = (ctx: any, error: any, statusCode: number = 500, message?: string) => {
  console.error('PerformanceReviewController Error:', error);
  ctx.status = statusCode;
  ctx.body = {
    success: false,
    message: message || error.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

// 绩效评估控制器实现
const PerformanceReviewController: PerformanceReviewController = {
  // 获取所有绩效评估
  async getAllReviews(ctx: any): Promise<void> {
    try {
      const { page = 1, pageSize = 10, year, quarter, status, employee_name } = ctx.query;
      
      const queryOptions: any = {};
      if (year) queryOptions.year = year;
      if (quarter) queryOptions.quarter = quarter;
      if (status) queryOptions.status = status;
      if (employee_name) queryOptions.employee_name = employee_name;
      
      const result = await PerformanceReviewService.getAllReviews({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        queryOptions
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.reviews,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 根据ID获取绩效评估
  async getReviewById(ctx: any): Promise<void> {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Review ID is required' };
        return;
      }
      
      const review = await PerformanceReview.findByPk(id, {
        include: [{ model: Employee, as: 'employee' }]
      });
      
      if (!review) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Performance review not found' };
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: review };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 创建新绩效评估
  async createReview(ctx: any): Promise<void> {
    try {
      const reviewData = ctx.request.body;
      
      // 验证必要字段
      if (!reviewData.employee_id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Employee ID is required' };
        return;
      }
      
      if (!reviewData.year) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Year is required' };
        return;
      }
      
      if (!reviewData.quarter) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Quarter is required' };
        return;
      }
      
      const newReview = await PerformanceReviewService.createReview(reviewData);
      
      ctx.status = 201;
      ctx.body = { success: true, message: 'Performance review created successfully', data: newReview };
    } catch (error) {
      handleError(ctx, error, 400, 'Failed to create performance review');
    }
  },
  
  // 更新绩效评估
  async updateReview(ctx: any): Promise<void> {
    try {
      const { id } = ctx.params;
      const reviewData = ctx.request.body;
      
      if (!id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Review ID is required' };
        return;
      }
      
      // 如果评估已提交，不允许修改某些字段
      const existingReview = await PerformanceReview.findByPk(id);
      if (existingReview && existingReview.status === 'Completed') {
        const { rating, comments, feedback } = reviewData;
        if (!rating && !comments && !feedback) {
          ctx.status = 400;
          ctx.body = { 
            success: false, 
            message: 'Cannot modify completed review except for rating, comments, and feedback' 
          };
          return;
        }
      }
      
      const updatedReview = await PerformanceReviewService.updateReview(id, reviewData);
      
      if (!updatedReview) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Performance review not found' };
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: 'Performance review updated successfully', data: updatedReview };
    } catch (error) {
      handleError(ctx, error, 400, 'Failed to update performance review');
    }
  },
  
  // 删除绩效评估
  async deleteReview(ctx: any): Promise<void> {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Review ID is required' };
        return;
      }
      
      // 如果评估已提交，不允许删除
      const existingReview = await PerformanceReview.findByPk(id);
      if (existingReview && existingReview.status === 'Completed') {
        ctx.status = 400;
        ctx.body = { 
          success: false, 
          message: 'Cannot delete completed performance review' 
        };
        return;
      }
      
      const result = await PerformanceReviewService.deleteReview(id);
      
      if (!result) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Performance review not found' };
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: 'Performance review deleted successfully' };
    } catch (error) {
      handleError(ctx, error, 400, 'Failed to delete performance review');
    }
  },
  
  // 获取员工绩效评估
  async getEmployeeReviews(ctx: any): Promise<void> {
    try {
      const { employee_id } = ctx.params;
      const { page = 1, pageSize = 10, year, quarter, status } = ctx.query;
      
      if (!employee_id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Employee ID is required' };
        return;
      }
      
      // 验证员工是否存在
      const employee = await Employee.findByPk(employee_id);
      if (!employee) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Employee not found' };
        return;
      }
      
      const queryOptions: any = {};
      if (year) queryOptions.year = year;
      if (quarter) queryOptions.quarter = quarter;
      if (status) queryOptions.status = status;
      
      const result = await PerformanceReviewService.getEmployeeReviews(employee_id, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        queryOptions
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.reviews,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 提交绩效评估
  async submitReview(ctx: any): Promise<void> {
    try {
      const { id } = ctx.params;
      const { submitted_by, final_rating, comments } = ctx.request.body;
      
      if (!id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Review ID is required' };
        return;
      }
      
      if (!submitted_by) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Submitted by is required' };
        return;
      }
      
      const result = await PerformanceReviewService.submitReview(id, { 
        submitted_by, 
        final_rating, 
        comments 
      });
      
      if (!result) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Performance review not found or already submitted' };
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: 'Performance review submitted successfully', data: result };
    } catch (error) {
      handleError(ctx, error, 400, 'Failed to submit performance review');
    }
  },
  
  // 获取管理者评估的绩效
  async getManagerReviews(ctx: any): Promise<void> {
    try {
      const { manager_id } = ctx.params;
      const { page = 1, pageSize = 10, year, quarter, status } = ctx.query;
      
      if (!manager_id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Manager ID is required' };
        return;
      }
      
      // 验证管理者是否存在
      const manager = await Employee.findByPk(manager_id);
      if (!manager) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Manager not found' };
        return;
      }
      
      const queryOptions: any = {};
      if (year) queryOptions.year = year;
      if (quarter) queryOptions.quarter = quarter;
      if (status) queryOptions.status = status;
      
      const result = await PerformanceReviewService.getManagerReviews(manager_id, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        queryOptions
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.reviews,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 获取绩效评估摘要
  async getReviewSummary(ctx: any): Promise<void> {
    try {
      const { employee_id } = ctx.params;
      const { year } = ctx.query;
      
      if (!employee_id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Employee ID is required' };
        return;
      }
      
      const summary = await PerformanceReviewService.getReviewSummary(
        employee_id, 
        year ? parseInt(year) : new Date().getFullYear()
      );
      
      ctx.status = 200;
      ctx.body = { success: true, data: summary };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 获取部门绩效统计
  async getDepartmentReviewStats(ctx: any): Promise<void> {
    try {
      const { department_id } = ctx.params;
      const { year, quarter } = ctx.query;
      
      if (!department_id) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Department ID is required' };
        return;
      }
      
      const stats = await PerformanceReviewService.getDepartmentReviewStats(department_id, {
        year: year ? parseInt(year) : new Date().getFullYear(),
        quarter: quarter ? parseInt(quarter) : undefined
      });
      
      ctx.status = 200;
      ctx.body = { success: true, data: stats };
    } catch (error) {
      handleError(ctx, error);
    }
  },
  
  // 获取绩效评估报表
  async getReviewReport(ctx: any): Promise<void> {
    try {
      const { year, department_id, min_rating, max_rating } = ctx.query;
      
      if (!year) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Year is required' };
        return;
      }
      
      const report = await PerformanceReviewService.getReviewReport({
        year: parseInt(year),
        department_id,
        min_rating: min_rating ? parseInt(min_rating) : undefined,
        max_rating: max_rating ? parseInt(max_rating) : undefined
      });
      
      ctx.status = 200;
      ctx.body = { success: true, data: report };
    } catch (error) {
      handleError(ctx, error);
    }
  }
};

module.exports = PerformanceReviewController;