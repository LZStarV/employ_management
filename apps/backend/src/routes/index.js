const Router = require('koa-router');
const { getPerformanceStats } = require('../middleware/performanceLogger');
const winston = require('../utils/logger');

const router = new Router({ prefix: '/api' });

// 健康检查路由
/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务是否正常运行
 *     tags:
 *       - 系统
 *     responses:
 *       200:
 *         description: 服务运行正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: 服务运行正常
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', async (ctx) => {
  ctx.status = 200;
  ctx.body = {
    status: 'ok',
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  };
});

// 性能统计路由
/**
 * @swagger
 * /performance:
 *   get:
 *     summary: 性能统计
 *     description: 获取API性能统计信息
 *     tags:
 *       - 系统
 *     responses:
 *       200:
 *         description: 性能统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: integer
 *                       example: 100
 *                     averageResponseTime:
 *                       type: string
 *                       example: "45.67"
 *                     maxResponseTime:
 *                       type: integer
 *                       example: 500
 *                     minResponseTime:
 *                       type: integer
 *                       example: 10
 */
router.get('/performance', async (ctx) => {
  const stats = getPerformanceStats();
  ctx.status = 200;
  ctx.body = {
    status: 'ok',
    stats
  };
});

// 动态加载其他路由模块
const routeModules = [
  'employees',
  'departments',
  'positions',
  'projects',
  'attendances',
  'trainings',
  'auth',
  'docs'
];

routeModules.forEach(moduleName => {
  try {
    const moduleRouter = require(`./${moduleName}`);
    router.use(`/${moduleName}`, moduleRouter.routes(), moduleRouter.allowedMethods());
    // 移除路由模块加载日志记录
  } catch (error) {
    winston.warn(`路由模块加载失败: ${moduleName} - ${error.message}`);
  }
});

module.exports = router;