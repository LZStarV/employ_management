import Router from 'koa-router';
import { Context } from 'koa';
import { getPerformanceStats } from '../middleware/performanceLogger';
import winston from '../utils/logger';

// 导入所有路由模块
import employeesRouter from './employees';
import departmentsRouter from './departments';
import positionsRouter from './positions';
import projectsRouter from './projects';
import authRouter from './auth';
import docsRouter from './docs';

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
router.get('/health', async (ctx: Context) => {
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
router.get('/performance', async (ctx: Context) => {
  const stats = getPerformanceStats();
  ctx.status = 200;
  ctx.body = {
    status: 'ok',
    stats
  };
});

// 加载所有路由模块
const routeModules = [
  { name: 'employees', router: employeesRouter },
  { name: 'departments', router: departmentsRouter },
  { name: 'positions', router: positionsRouter },
  { name: 'projects', router: projectsRouter },
  // Training路由已移除
  { name: 'auth', router: authRouter },
  { name: 'docs', router: docsRouter }
];

routeModules.forEach(({ name, router: moduleRouter }) => {
  try {
    router.use(`/${name}`, moduleRouter.routes(), moduleRouter.allowedMethods());
  } catch (error) {
    winston.warn(`路由模块加载失败: ${name} - ${error instanceof Error ? error.message : String(error)}`);
  }
});

export default router;