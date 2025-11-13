import { Context } from 'koa';
import logger from './logger';

// 错误类型枚举
export enum ErrorType {
  VALIDATION_ERROR = 'ValidationError',
  DATABASE_ERROR = 'DatabaseError',
  NOT_FOUND_ERROR = 'NotFoundError',
  UNAUTHORIZED_ERROR = 'UnauthorizedError',
  FORBIDDEN_ERROR = 'ForbiddenError',
  CONFLICT_ERROR = 'ConflictError',
  INTERNAL_ERROR = 'InternalError'
}

// 错误响应接口
export interface ErrorResponse {
  success: boolean;
  error: {
    type: ErrorType;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

/**
 * 统一错误处理工具类
 */
export class ErrorHandler {
  /**
   * 处理控制器中的错误
   * @param ctx Koa上下文
   * @param error 错误对象
   * @param statusCode HTTP状态码
   * @param message 错误消息
   * @param details 错误详情
   */
  static handleControllerError(
    ctx: Context,
    error: any,
    statusCode: number = 500,
    message?: string,
    details?: any
  ): void {
    const isError = error instanceof Error;
    const errorMessage = message || (isError ? error.message : '未知错误');
    const errorType = this.getErrorType(statusCode);
    
    // 记录详细错误日志
    logger.error(`${ctx.method} ${ctx.path} 错误`, {
      statusCode,
      errorType,
      message: errorMessage,
      details,
      stack: isError ? error.stack : undefined,
      requestBody: ctx.request.body,
      params: ctx.params,
      query: ctx.query,
      ip: ctx.ip
    });
    
    // 构建错误响应
    const response: ErrorResponse = {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? details : undefined
      },
      timestamp: new Date().toISOString(),
      path: ctx.path
    };
    
    // 设置响应
    ctx.status = statusCode;
    ctx.body = response;
  }
  
  /**
   * 根据状态码获取错误类型
   * @param statusCode HTTP状态码
   * @returns 错误类型
   */
  private static getErrorType(statusCode: number): ErrorType {
    switch (statusCode) {
      case 400:
        return ErrorType.VALIDATION_ERROR;
      case 401:
        return ErrorType.UNAUTHORIZED_ERROR;
      case 403:
        return ErrorType.FORBIDDEN_ERROR;
      case 404:
        return ErrorType.NOT_FOUND_ERROR;
      case 409:
        return ErrorType.CONFLICT_ERROR;
      default:
        return ErrorType.INTERNAL_ERROR;
    }
  }
  
  /**
   * 创建验证错误
   * @param ctx Koa上下文
   * @param message 错误消息
   * @param details 错误详情
   */
  static validationError(ctx: Context, message: string, details?: any): void {
    this.handleControllerError(ctx, new Error(message), 400, message, details);
  }
  
  /**
   * 创建资源未找到错误
   * @param ctx Koa上下文
   * @param message 错误消息
   */
  static notFoundError(ctx: Context, message: string): void {
    this.handleControllerError(ctx, new Error(message), 404, message);
  }
  
  /**
   * 创建内部服务器错误
   * @param ctx Koa上下文
   * @param error 错误对象
   * @param message 错误消息
   */
  static internalError(ctx: Context, error: any, message: string = '服务器内部错误'): void {
    this.handleControllerError(ctx, error, 500, message);
  }
}

export default ErrorHandler;