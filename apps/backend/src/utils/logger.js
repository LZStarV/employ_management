const winston = require('winston');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      logMessage += ' ' + JSON.stringify(meta);
    }
    return logMessage;
  })
);

// 创建控制台传输
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    logFormat
  )
});

// 创建错误日志文件传输
const errorTransport = new winston.transports.File({
  filename: path.join(logDir, 'error.log'),
  level: 'error',
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  format: logFormat
});

// 创建信息日志文件传输
const infoTransport = new winston.transports.File({
  filename: path.join(logDir, 'combined.log'),
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  format: logFormat
});

// 创建性能日志文件传输
const performanceTransport = new winston.transports.File({
  filename: path.join(logDir, 'performance.log'),
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  format: logFormat
});

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'employee-management-api'
  },
  transports: [
    // 控制台只显示错误级别以上的日志
    new winston.transports.Console({
      level: 'warn', // 只显示warn和error级别的日志
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    errorTransport,
    infoTransport
  ]
});

// 创建性能专用日志记录器
const performanceLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    category: 'performance'
  },
  transports: [
    performanceTransport
  ]
});

// 导出性能日志记录器
logger.performance = performanceLogger;

module.exports = logger;