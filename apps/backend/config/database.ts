import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接参数接口
interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'postgres' | 'mysql' | 'sqlite' | 'mssql';
}

// 连接池配置接口
interface PoolConfig {
  max: number;
  min: number;
  acquire: number;
  idle: number;
}

// 配置数据库连接参数
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'employ_management',
  dialect: 'postgres'
};

// 连接池配置
const poolConfig: PoolConfig = {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
};

// 创建Sequelize实例
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  pool: poolConfig,
  // 自定义日志函数
  logging: (msg: string) => {
    // 只记录非查询日志
    if (!msg.includes('Executing (default):')) {
      console.log('Database:', msg);
    }
  },
  // 时区配置
  timezone: '+08:00',
  // 其他配置
  define: {
    underscored: true, // 使用下划线命名规则
    freezeTableName: true, // 冻结表名
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

// 测试数据库连接
const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error: any) {
    console.error('Failed to connect to database:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// 导出Sequelize实例和测试连接函数
export {
  sequelize,
  testConnection
};