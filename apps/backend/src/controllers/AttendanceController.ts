import AttendanceService from '../services/AttendanceService';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { Context } from 'koa';
import ErrorHandler from '../utils/errorHandler';
import winston from 'winston';

// 创建日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'attendance-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 如果是开发环境，添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// 考勤控制器接口定义
interface AttendanceController {
  getAllAttendances: (ctx: Context) => Promise<void>;
  getAttendanceById: (ctx: Context) => Promise<void>;
  createAttendance: (ctx: Context) => Promise<void>;
  updateAttendance: (ctx: Context) => Promise<void>;
  deleteAttendance: (ctx: Context) => Promise<void>;
  getEmployeeAttendances: (ctx: Context) => Promise<void>;
  getDepartmentAttendances: (ctx: Context) => Promise<void>;
  getAttendanceReport: (ctx: Context) => Promise<void>;
  markAttendance: (ctx: Context) => Promise<void>;
  getAttendanceSummary: (ctx: Context) => Promise<void>;
  createLeaveApplication: (ctx: Context) => Promise<void>;
  updateLeaveApplication: (ctx: Context) => Promise<void>;
  getEmployeeLeaveApplications: (ctx: Context) => Promise<void>;
  reportExceptionalAttendance: (ctx: Context) => Promise<void>;
  handleExceptionalAttendance: (ctx: Context) => Promise<void>;
}

// 使用统一错误处理工具

// 考勤控制器实现
const AttendanceController: AttendanceController = {
  // 获取所有考勤记录
  async getAllAttendances(ctx: Context): Promise<void> {
    try {
      const { page = 1, pageSize = 10, date_from, date_to, status } = ctx.query;
      
      const queryOptions: any = {};
      
      if (date_from) queryOptions.date_from = date_from;
      if (date_to) queryOptions.date_to = date_to;
      if (status) queryOptions.status = status;
      
      const result = await AttendanceService.getAllAttendances({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        queryOptions
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.attendances,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取考勤记录失败');
    }
  },
  
  // 根据ID获取考勤记录
  async getAttendanceById(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        ErrorHandler.validationError(ctx, '考勤记录ID是必填项');
        return;
      }
      
      const attendance = await Attendance.findByPk(id);
      
      if (!attendance) {
        ErrorHandler.notFoundError(ctx, '未找到指定的考勤记录');
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, data: attendance };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取考勤记录失败');
    }
  },
  
  // 创建新考勤记录
  async createAttendance(ctx: Context): Promise<void> {
    try {
      const attendanceData = ctx.request.body;
      
      // 验证必要字段
      if (!attendanceData.employee_id) {
        ErrorHandler.validationError(ctx, '员工ID是必填项');
        return;
      }
      
      if (!attendanceData.date) {
        ErrorHandler.validationError(ctx, '日期是必填项');
        return;
      }
      
      const newAttendance = await AttendanceService.createAttendance(attendanceData);
      
      ctx.status = 201;
      ctx.body = { success: true, message: '考勤记录创建成功', data: newAttendance };
    } catch (error) {
      ErrorHandler.handleControllerError(ctx, error, 400, '创建考勤记录失败');
    }
  },
  
  // 更新考勤记录
  async updateAttendance(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      const attendanceData = ctx.request.body;
      
      if (!id) {
        ErrorHandler.validationError(ctx, '考勤记录ID是必填项');
        return;
      }
      
      const updatedAttendance = await AttendanceService.updateAttendance(id, attendanceData);
      
      if (!updatedAttendance) {
        ErrorHandler.notFoundError(ctx, '未找到指定的考勤记录');
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '考勤记录更新成功', data: updatedAttendance };
    } catch (error) {
      ErrorHandler.handleControllerError(ctx, error, 400, '更新考勤记录失败');
    }
  },
  
  // 删除考勤记录
  async deleteAttendance(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        ErrorHandler.validationError(ctx, '考勤记录ID是必填项');
        return;
      }
      
      const result = await AttendanceService.deleteAttendance(id);
      
      if (!result) {
        ErrorHandler.notFoundError(ctx, '未找到指定的考勤记录');
        return;
      }
      
      ctx.status = 200;
      ctx.body = { success: true, message: '考勤记录删除成功' };
    } catch (error) {
      ErrorHandler.handleControllerError(ctx, error, 400, '删除考勤记录失败');
    }
  },
  
  // 获取员工考勤记录
  async getEmployeeAttendances(ctx: Context): Promise<void> {
    try {
      const { employee_id } = ctx.params;
      const { page = 1, pageSize = 10, date_from, date_to } = ctx.query;
      
      if (!employee_id) {
        ErrorHandler.validationError(ctx, '员工ID是必填项');
        return;
      }
      
      // 验证员工是否存在
      const employee = await Employee.findByPk(employee_id);
      if (!employee) {
        ErrorHandler.notFoundError(ctx, '未找到指定的员工');
        return;
      }
      
      const result = await AttendanceService.getEmployeeAttendances(employee_id, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        date_from,
        date_to
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: result.attendances,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取员工考勤记录失败');
    }
  },
  
  // 获取部门考勤记录
  async getDepartmentAttendances(ctx: Context): Promise<void> {
    try {
      const { department_id } = ctx.params;
      const { date_from, date_to } = ctx.query;
      
      if (!department_id) {
        ErrorHandler.validationError(ctx, '部门ID是必填项');
        return;
      }
      
      const departmentAttendances = await AttendanceService.getDepartmentAttendances(
        department_id, 
        { date_from, date_to }
      );
      
      ctx.status = 200;
      ctx.body = { success: true, data: departmentAttendances };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取部门考勤记录失败');
    }
  },
  
  // 获取考勤报表
  async getAttendanceReport(ctx: Context): Promise<void> {
    try {
      const { date_from, date_to, department_id, position_id } = ctx.query;
      
      if (!date_from || !date_to) {
        ErrorHandler.validationError(ctx, '日期范围是必填项');
        return;
      }
      
      const report = await AttendanceService.getAttendanceReport({
        date_from,
        date_to,
        department_id,
        position_id
      });
      
      ctx.status = 200;
      ctx.body = { success: true, data: report };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取考勤报表失败');
    }
  },
  
  // 打卡签到/签退
  async markAttendance(ctx: Context): Promise<void> {
    try {
      const { employee_id } = ctx.params;
      const { action, timestamp } = ctx.request.body;
      
      if (!employee_id) {
        ErrorHandler.validationError(ctx, '员工ID是必填项');
        return;
      }
      
      if (!action || !['check_in', 'check_out'].includes(action)) {
        ErrorHandler.validationError(ctx, '有效的操作类型（check_in或check_out）是必填项');
        return;
      }
      
      const result = await AttendanceService.markAttendance(employee_id, action, timestamp);
      
      ctx.status = 200;
      ctx.body = { 
        success: true, 
        message: result.message, 
        data: result.attendance 
      };
    } catch (error) {
      ErrorHandler.handleControllerError(ctx, error, 400, '打卡操作失败');
    }
  },
  
  // 获取考勤汇总
  async getAttendanceSummary(ctx: Context): Promise<void> {
    try {
      const { employee_id, date_from, date_to } = ctx.query;
      
      if (!date_from || !date_to) {
        ErrorHandler.validationError(ctx, '日期范围是必填项');
        return;
      }
      
      const summary = await AttendanceService.getAttendanceSummary({
        employee_id,
        date_from,
        date_to
      });
      
      ctx.status = 200;
      ctx.body = { success: true, data: summary };
    } catch (error) {
      ErrorHandler.internalError(ctx, error, '获取考勤汇总失败');
    }
  },

  // 请假申请
  async createLeaveApplication(ctx: Context): Promise<void> {
    try {
      const { employee_id, start_date, end_date, leave_type, reason, created_by } = ctx.request.body;
      
      // 参数验证
      if (!employee_id || !start_date || !end_date || !leave_type || !reason) {
        ErrorHandler.validationError(ctx, '缺少必要字段');
        return;
      }
      
      const leaveRecords = await AttendanceService.createLeaveApplication({
        employee_id,
        start_date,
        end_date,
        leave_type,
        reason,
        created_by
      });
      
      logger.info('请假申请创建成功', { employee_id, leave_type });
      ctx.status = 201;
      ctx.body = { success: true, message: '请假申请创建成功', data: leaveRecords };
    } catch (error) {
      logger.error('创建请假申请失败', { error });
      ErrorHandler.internalError(ctx, error, '创建请假申请失败');
    }
  },

  // 更新请假申请
  async updateLeaveApplication(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;
      
      // 参数验证
      if (!status) {
        ErrorHandler.validationError(ctx, '缺少状态字段');
        return;
      }
      
      const updatedRecord = await AttendanceService.updateLeaveApplication(id, status);
      
      if (!updatedRecord) {
        ErrorHandler.notFoundError(ctx, '考勤记录不存在');
        return;
      }
      
      logger.info('请假申请更新成功', { id, status });
      ctx.status = 200;
      ctx.body = { success: true, message: '请假申请更新成功', data: updatedRecord };
    } catch (error) {
      logger.error('更新请假申请失败', { error });
      ErrorHandler.internalError(ctx, error, '更新请假申请失败');
    }
  },

  // 获取员工请假记录
  async getEmployeeLeaveApplications(ctx: Context): Promise<void> {
    try {
      const { employee_id } = ctx.params;
      const { page, pageSize, startDate, endDate } = ctx.query;
      
      // 参数验证
      if (!employee_id) {
        ErrorHandler.validationError(ctx, '缺少员工ID参数');
        return;
      }
      
      const options: any = {};
      if (page && pageSize) {
        options.page = parseInt(page as string, 10);
        options.pageSize = parseInt(pageSize as string, 10);
      }
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;
      
      const leaveApplications = await AttendanceService.getEmployeeLeaveApplications(employee_id, options);
      
      logger.info('获取员工请假记录成功', { employee_id });
      ctx.status = 200;
      ctx.body = { success: true, data: leaveApplications };
    } catch (error) {
      logger.error('获取员工请假记录失败', { error });
      ErrorHandler.internalError(ctx, error, '获取员工请假记录失败');
    }
  },

  // 上报异常考勤
  async reportExceptionalAttendance(ctx: Context): Promise<void> {
    try {
      const { employee_id, date, reason, proof, created_by } = ctx.request.body;
      
      // 参数验证
      if (!employee_id || !date || !reason) {
        ErrorHandler.validationError(ctx, '缺少必要字段');
        return;
      }
      
      const exceptionRecord = await AttendanceService.reportExceptionalAttendance({
        employee_id,
        date,
        reason,
        proof,
        created_by
      });
      
      logger.info('异常考勤上报成功', { employee_id, date });
      ctx.status = 201;
      ctx.body = { success: true, message: '异常考勤上报成功', data: exceptionRecord };
    } catch (error) {
      logger.error('上报异常考勤失败', { error });
      ErrorHandler.internalError(ctx, error, '上报异常考勤失败');
    }
  },

  // 处理异常考勤
  async handleExceptionalAttendance(ctx: Context): Promise<void> {
    try {
      const { id } = ctx.params;
      const { status, notes, updated_by } = ctx.request.body;
      
      // 参数验证
      if (!status || !notes) {
        ErrorHandler.validationError(ctx, '缺少必要字段');
        return;
      }
      
      const resolvedRecord = await AttendanceService.handleExceptionalAttendance(id, {
        status,
        notes,
        updated_by
      });
      
      if (!resolvedRecord) {
        ErrorHandler.notFoundError(ctx, '异常考勤记录不存在');
        return;
      }
      
      logger.info('异常考勤处理成功', { id, status });
      ctx.status = 200;
      ctx.body = { success: true, message: '异常考勤处理成功', data: resolvedRecord };
    } catch (error) {
      logger.error('处理异常考勤失败', { error });
      ErrorHandler.internalError(ctx, error, '处理异常考勤失败');
    }
  }
};

export default AttendanceController;