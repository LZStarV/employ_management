import redis from 'redis';
import logger from '../utils/logger';
import dotenv from 'dotenv';
import { Context, Next } from 'koa';

dotenv.config();

// 创建Redis客户端
let redisClient: redis.RedisClientType | null = null;

// 初始化Redis连接
async function initializeRedis() {
  try {
    // 使用Redis客户端配置
    const redisConfig: redis.RedisClientOptions = {
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    };

    redisClient = redis.createClient(redisConfig);

    redisClient.on('connect', () => {
      logger.info('Redis连接成功');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis连接失败:', error.message);
    });

    // 连接Redis
    await redisClient.connect();
  } catch (error) {
    const err = error as Error;
    logger.warn('Redis初始化失败，性能监控将使用内存存储:', err.message);
    redisClient = null;
  }
}

// 初始化Redis连接
initializeRedis().catch(err => {
  logger.error('Redis初始化失败:', err);
});

// 定义统计数据接口
interface EndpointStats {
  requests: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  avgTime?: number;
}

interface MemoryStats {
  requests: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  endpointStats: Record<string, EndpointStats>;
}

// 内存存储作为Redis的后备方案
const memoryStats: MemoryStats = {
  requests: 0,
  totalTime: 0,
  maxTime: 0,
  minTime: Infinity,
  endpointStats: {}
};

// 性能监控中间件
const performanceLogger = async (ctx: Context, next: Next) => {
  const startTime = Date.now();
  const { method, path, ip } = ctx.request;
  
  try {
    await next();
    
    // 计算请求处理时间
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endpoint = `${method}:${path}`;
    
    // 更新内存统计信息
    memoryStats.requests++;
    memoryStats.totalTime += responseTime;
    memoryStats.maxTime = Math.max(memoryStats.maxTime, responseTime);
    memoryStats.minTime = Math.min(memoryStats.minTime, responseTime);
    
    // 更新端点统计
    if (!memoryStats.endpointStats[endpoint]) {
      memoryStats.endpointStats[endpoint] = {
        requests: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity
      };
    }
    
    const endpointStat = memoryStats.endpointStats[endpoint];
    endpointStat.requests++;
    endpointStat.totalTime += responseTime;
    endpointStat.maxTime = Math.max(endpointStat.maxTime, responseTime);
    endpointStat.minTime = Math.min(endpointStat.minTime, responseTime);
    
    // 尝试使用Redis存储
    if (redisClient && redisClient.connected) {
      try {
        // 记录请求次数
        await redisClient.incr('api:total_requests');
        
        // 记录总响应时间
        await redisClient.incrby('api:total_response_time', responseTime);
        
        // 记录端点统计
        await redisClient.incr(`api:endpoint:${endpoint}:requests`);
        await redisClient.incrby(`api:endpoint:${endpoint}:total_time`, responseTime);
        
        // 记录IP访问统计
        await redisClient.incr(`api:ip:${ip}:requests`);
        await redisClient.expire(`api:ip:${ip}:requests`, 86400); // 24小时过期
        
      } catch (redisError) {
        const err = redisError as Error;
        logger.error('Redis存储性能数据失败:', err.message);
      }
    }
    
    // 在日志中记录响应时间（仅记录超过500ms的慢请求）
    if (responseTime > 500) {
      logger.warn(`慢请求警告 - ${endpoint}: ${responseTime}ms`);
    }
    
    // 添加响应时间到响应头
    ctx.set('X-Response-Time', `${responseTime}ms`);
    
  } catch (error) {
    const err = error as Error;
    logger.error('请求处理失败:', err);
    throw error;
  }
};

// 获取性能统计信息
function getPerformanceStats() {
  const avgTime = memoryStats.requests > 0 ? memoryStats.totalTime / memoryStats.requests : 0;
  
  // 计算每个端点的平均响应时间
  const endpointStatsWithAvg: Record<string, EndpointStats> = {};
  Object.keys(memoryStats.endpointStats).forEach(endpoint => {
    const stats = memoryStats.endpointStats[endpoint];
    endpointStatsWithAvg[endpoint] = {
      ...stats,
      avgTime: stats.requests > 0 ? stats.totalTime / stats.requests : 0
    };
  });
  
  // 记录性能统计到日志
  const stats = {
    totalRequests: memoryStats.requests,
    averageResponseTime: avgTime.toFixed(2),
    maxResponseTime: memoryStats.maxTime,
    minResponseTime: memoryStats.minTime === Infinity ? 0 : memoryStats.minTime,
    endpointStats: endpointStatsWithAvg
  };
  
  // 记录性能统计信息到性能日志
  logger.performance.info('性能统计信息', stats);
  
  return stats;
}

export default performanceLogger;
export { getPerformanceStats };