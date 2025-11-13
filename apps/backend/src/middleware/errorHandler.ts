import logger from '../utils/logger';
import { Context, Next } from 'koa';

// 错误处理中间件
const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    const err = error as Error & { status?: number; name?: string; errors?: Record<string, any> };
    
    // 记录错误日志
    logger.error('应用错误:', {
      message: err.message,
      stack: err.stack,
      path: ctx.path,
      method: ctx.method,
      status: err.status || 500
    });
    
    // 设置响应状态码
    ctx.status = err.status || 500;
    
    // 根据不同的错误类型返回不同的响应
    if (err.name === 'ValidationError') {
      ctx.body = {
        error: '验证错误',
        details: err.errors
      };
    } else if (err.name === 'SequelizeDatabaseError') {
      ctx.body = {
        error: '数据库错误',
        message: '数据库操作失败'
      };
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      ctx.body = {
        error: '唯一约束错误',
        message: '数据已存在'
      };
      ctx.status = 409;
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      ctx.body = {
        error: '认证错误',
        message: '无效的令牌'
      };
      ctx.status = 401;
    } else {
      // 生产环境不返回详细错误信息
      const isProduction = process.env.NODE_ENV === 'production';
      ctx.body = {
        error: '服务器错误',
        message: isProduction ? '服务器内部错误' : err.message
      };
    }
    
    // 触发错误事件
    ctx.app.emit('error', err, ctx);
  }
};

export default errorHandler;