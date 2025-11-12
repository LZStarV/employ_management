// 共享配置常量
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
} as const;

// 环境配置
export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// 数据库配置
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432'),
  USERNAME: process.env.DB_USERNAME || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || 'password',
  DATABASE: process.env.DB_DATABASE || 'employee_management',
  POOL: {
    MAX: 10,
    MIN: 2,
    ACQUIRE: 30000,
    IDLE: 10000,
  },
} as const;

// Redis配置
export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379'),
  PASSWORD: process.env.REDIS_PASSWORD || '',
  DB: parseInt(process.env.REDIS_DB || '0'),
} as const;

// JWT配置
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'employee-management-secret-key',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ISSUER: process.env.JWT_ISSUER || 'employee-management-api',
} as const;

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
} as const;

// 日志配置
export const LOG_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || 'info',
  FILE_PATH: process.env.LOG_FILE_PATH || './logs',
  MAX_FILE_SIZE: '10m',
  MAX_FILES: '14d',
} as const;