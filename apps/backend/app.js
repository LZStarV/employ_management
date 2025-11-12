const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const dotenv = require('dotenv');
const router = require('./src/routes');
const docsRouter = require('./src/routes/docs');
const { sequelize, testConnection } = require('./config/database');
const { syncModels } = require('./src/models');
const performanceLogger = require('./src/middleware/performanceLogger');
const errorHandler = require('./src/middleware/errorHandler');

// 加载环境变量
dotenv.config();

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
  origin: '*', // 生产环境应设置具体域名
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser({
  jsonLimit: '10mb'
}));

// 性能监控中间件
if (process.env.ENABLE_PERFORMANCE_LOGGING === 'true') {
  app.use(performanceLogger);
}

// 错误处理中间件
app.use(errorHandler);

// API路由配置
app.use(router.routes());
app.use(router.allowedMethods());

// 文档路由配置
app.use(docsRouter.routes());
app.use(docsRouter.allowedMethods());

// 检查端口是否可用
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// 查找可用端口
async function findAvailablePort(startPort, maxAttempts = 10) {
  let currentPort = startPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const available = await isPortAvailable(currentPort);
    if (available) {
      return currentPort;
    }
    currentPort++;
    attempts++;
  }
  
  throw new Error(`在端口 ${startPort}-${currentPort - 1} 范围内找不到可用端口`);
}

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 同步数据库模型
    await syncModels();
    
    // 查找可用端口
    const availablePort = await findAvailablePort(PORT);
    
    // 启动HTTP服务器
    app.listen(availablePort, () => {
      console.log(`服务器已启动，监听端口 ${availablePort}`);
      // 服务器启动成功
    });
    
    return availablePort;
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
startServer();