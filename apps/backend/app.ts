import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { Context } from 'koa';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入数据库配置
import { sequelize, testConnection } from './config/database';

// 导入路由
import apiRoutes from './src/routes/index';
import docsRoutes from './src/routes/docs';

// 导入模型和同步函数
import { syncModels } from './src/models';

// 创建Koa实例
const app = new Koa();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(bodyParser({
  jsonLimit: '50mb',
  formLimit: '50mb'
}));

// 性能监控中间件
app.use(async (ctx: Context, next: () => Promise<void>) => {
  const start: number = Date.now();
  await next();
  const ms: number = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// 错误处理中间件
app.use(async (ctx: Context, next: () => Promise<void>) => {
  try {
    await next();
  } catch (error: any) {
    console.error('Server Error:', error);
    ctx.status = error.statusCode || error.status || 500;
    ctx.body = {
      error: error.message || 'Internal Server Error',
      code: ctx.status
    };
  }
});

// 注册路由
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());
app.use(docsRoutes.routes());
app.use(docsRoutes.allowedMethods());

// 404处理
app.use((ctx: Context) => {
  ctx.status = 404;
  ctx.body = {
    error: 'Not Found',
    code: 404
  };
});

// 检查端口是否被占用
import net from 'net';
const checkPortAvailability = async (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
};

// 启动应用
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    console.log('Database connection successful!');

    // 同步数据库模型
    await syncModels();
    console.log('Database models synchronized!');

    // 检查端口可用性
    const isAvailable = await checkPortAvailability(PORT);
    if (!isAvailable) {
      console.error(`Port ${PORT} is already in use. Please choose a different port.`);
      process.exit(1);
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API documentation available at http://localhost:${PORT}/docs`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// 导出app实例供测试使用
export { app, startServer };

// 直接运行时启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}