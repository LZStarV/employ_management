const redis = require('redis');
const winston = require('../utils/logger');
const dotenv = require('dotenv');

dotenv.config();

// 创建Redis客户端
let redisClient = null;

try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  });

  redisClient.on('connect', () => {
    winston.info('Redis连接成功');
  });

  redisClient.on('error', (error) => {
    winston.error('Redis连接失败:', error.message);
  });
} catch (error) {
  winston.warn('Redis初始化失败，性能监控将使用内存存储:', error.message);
}

// 内存存储作为Redis的后备方案
const memoryStats = {
  requests: 0,
  totalTime: 0,
  maxTime: 0,
  minTime: Infinity,
  endpointStats: {}
};

// 性能监控中间件
const performanceLogger = async (ctx, next) => {
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
        winston.error('Redis存储性能数据失败:', redisError.message);
      }
    }
    
    // 在日志中记录响应时间（仅记录超过500ms的慢请求）
    if (responseTime > 500) {
      winston.warn(`慢请求警告 - ${endpoint}: ${responseTime}ms`);
    }
    
    // 添加响应时间到响应头
    ctx.set('X-Response-Time', `${responseTime}ms`);
    
  } catch (error) {
    winston.error('请求处理失败:', error);
    throw error;
  }
};

// 获取性能统计信息
function getPerformanceStats() {
  const avgTime = memoryStats.requests > 0 ? memoryStats.totalTime / memoryStats.requests : 0;
  
  // 计算每个端点的平均响应时间
  const endpointStatsWithAvg = {};
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
  winston.performance.info('性能统计信息', stats);
  
  return stats;
}

module.exports = performanceLogger;
module.exports.getPerformanceStats = getPerformanceStats;