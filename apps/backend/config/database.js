const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../src/utils/logger');

// 加载环境变量
dotenv.config();

// 自定义日志函数，将数据库日志重定向到logger
const databaseLogger = (msg) => {
  logger.info(`[Database] ${msg}`);
};

// 创建数据库连接实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false // 生产环境可配置为true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
);

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  testConnection
};