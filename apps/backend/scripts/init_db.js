const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const winston = require('../utils/logger');

dotenv.config();

// 创建数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// SQL语句 - 创建表（先删除外键约束，再重建表结构）
const createTablesSQL = `
-- 先删除外键约束（如果存在）
ALTER TABLE IF EXISTS departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
ALTER TABLE IF EXISTS employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey;
ALTER TABLE IF EXISTS employees DROP CONSTRAINT IF EXISTS employees_position_id_fkey;
ALTER TABLE IF EXISTS employees DROP CONSTRAINT IF EXISTS employees_manager_id_fkey;
ALTER TABLE IF EXISTS salaries DROP CONSTRAINT IF EXISTS salaries_employee_id_fkey;
ALTER TABLE IF EXISTS employee_projects DROP CONSTRAINT IF EXISTS employee_projects_employee_id_fkey;
ALTER TABLE IF EXISTS employee_projects DROP CONSTRAINT IF EXISTS employee_projects_project_id_fkey;
ALTER TABLE IF EXISTS attendances DROP CONSTRAINT IF EXISTS attendances_employee_id_fkey;
ALTER TABLE IF EXISTS attendances DROP CONSTRAINT IF EXISTS attendances_project_id_fkey;
ALTER TABLE IF EXISTS employee_trainings DROP CONSTRAINT IF EXISTS employee_trainings_employee_id_fkey;
ALTER TABLE IF EXISTS employee_trainings DROP CONSTRAINT IF EXISTS employee_trainings_training_id_fkey;

-- 删除表（如果存在）
DROP TABLE IF EXISTS employee_trainings CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS employee_projects CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS salaries CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 创建Department表
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建Position表
CREATE TABLE IF NOT EXISTS positions (
    position_id SERIAL PRIMARY KEY,
    position_name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建Employee表
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    department_id INTEGER,
    position_id INTEGER,
    manager_id INTEGER,
    address TEXT,
    birth_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 更新Department表，添加manager_id外键
ALTER TABLE departments ADD COLUMN manager_id INTEGER;

-- 添加外键约束（在所有表创建后）
ALTER TABLE employees ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL;
ALTER TABLE employees ADD CONSTRAINT employees_position_id_fkey FOREIGN KEY (position_id) REFERENCES positions(position_id) ON DELETE SET NULL;
ALTER TABLE employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL;
ALTER TABLE departments ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL;

-- 创建Salary表
CREATE TABLE salaries (
    salary_id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE,
    basic_salary DECIMAL(10, 2) NOT NULL,
    bonus DECIMAL(10, 2) DEFAULT 0,
    allowances DECIMAL(10, 2) DEFAULT 0,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE salaries ADD CONSTRAINT salaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;

-- 创建Project表
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning',
    budget DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建EmployeeProject关联表
CREATE TABLE employee_projects (
    employee_project_id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    project_id INTEGER,
    role VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    contribution_hours DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, project_id)
);
ALTER TABLE employee_projects ADD CONSTRAINT employee_projects_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
ALTER TABLE employee_projects ADD CONSTRAINT employee_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- 创建Attendance表
CREATE TABLE attendances (
    attendance_id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    project_id INTEGER,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status VARCHAR(20) DEFAULT 'present',
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE attendances ADD CONSTRAINT attendances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
ALTER TABLE attendances ADD CONSTRAINT attendances_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL;

-- 创建Training表
CREATE TABLE IF NOT EXISTS trainings (
    training_id SERIAL PRIMARY KEY,
    training_name VARCHAR(100) NOT NULL,
    description TEXT,
    trainer_name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建EmployeeTraining关联表
CREATE TABLE employee_trainings (
    employee_training_id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    training_id INTEGER,
    participation_date DATE NOT NULL,
    score DECIMAL(5, 2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, training_id)
);
ALTER TABLE employee_trainings ADD CONSTRAINT employee_trainings_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
ALTER TABLE employee_trainings ADD CONSTRAINT employee_trainings_training_id_fkey FOREIGN KEY (training_id) REFERENCES trainings(training_id) ON DELETE CASCADE;
`;

// SQL语句 - 创建索引
const createIndexesSQL = `
-- 为Employee表创建索引
CREATE INDEX IF NOT EXISTS idx_employees_last_name ON employees(last_name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);

-- 为Salary表创建索引
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON salaries(employee_id);

-- 为Attendance表创建索引
CREATE INDEX IF NOT EXISTS idx_attendances_employee_date ON attendances(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendances_project_id ON attendances(project_id);

-- 为EmployeeProject表创建索引
CREATE INDEX IF NOT EXISTS idx_employee_projects_employee ON employee_projects(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_projects_project ON employee_projects(project_id);

-- 为EmployeeTraining表创建索引
CREATE INDEX IF NOT EXISTS idx_employee_trainings_employee ON employee_trainings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_trainings_training ON employee_trainings(training_id);

-- 为Department表创建索引
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(department_name);
`;

// 数据库初始化函数
async function initializeDatabase() {
  let client;
  let defaultClient;
  
  try {
    console.log(`开始初始化数据库: ${dbConfig.database}`);
    console.log(`使用用户: ${dbConfig.user}`);
    
    try {
      // 尝试连接到目标数据库直接操作（在Mac上通常不需要通过postgres默认数据库）
      client = new Client(dbConfig);
      await client.connect();
      console.log('直接连接到目标数据库成功');
    } catch (directConnectError) {
      console.log('直接连接失败，尝试通过默认数据库创建目标数据库...');
      
      // 尝试连接到默认数据库
      try {
        defaultClient = new Client({
          ...dbConfig,
          database: 'postgres' // 使用默认数据库
        });
        
        await defaultClient.connect();
        console.log('连接到默认数据库成功');
        
        // 检查目标数据库是否存在
        const { rows } = await defaultClient.query(
          'SELECT 1 FROM pg_database WHERE datname = $1',
          [dbConfig.database]
        );
        
        // 如果数据库不存在，则创建
        if (rows.length === 0) {
          await defaultClient.query(`CREATE DATABASE ${dbConfig.database}`);
          console.log(`数据库 ${dbConfig.database} 创建成功`);
        } else {
          console.log(`数据库 ${dbConfig.database} 已存在`);
        }
        
        await defaultClient.end();
      } catch (defaultConnectError) {
        console.log('连接默认数据库失败，可能是Mac环境下的PostgreSQL配置问题');
        console.log('尝试直接使用当前用户创建表...');
      }
      
      // 再次尝试连接目标数据库
      client = new Client(dbConfig);
      await client.connect();
      console.log('连接到目标数据库成功');
    }
    winston.info(`连接到数据库 ${dbConfig.database} 成功`);
    
    // 开始事务
    await client.query('BEGIN');
    
    try {
      // 执行创建表的SQL
      console.log('🔄 开始创建表结构...');
      winston.info('开始创建表结构...');
      await client.query(createTablesSQL);
      console.log('✅ 表结构创建成功');
      winston.info('表结构创建成功');
      
      // 执行创建索引的SQL
      console.log('🔄 开始创建索引...');
      winston.info('开始创建索引...');
      await client.query(createIndexesSQL);
      console.log('✅ 索引创建成功');
      winston.info('索引创建成功');
      
      // 提交事务
      await client.query('COMMIT');
      console.log('🎉 数据库初始化完成！');
      winston.info('数据库初始化完成！');
      
      return true;
    } catch (error) {
      // 尝试回滚事务
      try {
        await client.query('ROLLBACK');
        console.log('🔄 事务已回滚');
      } catch (rollbackError) {
        console.log('⚠️  事务回滚失败:', rollbackError.message);
      }
      console.error('❌ 数据库初始化失败:', error.message);
      console.error('详细错误信息:', error);
      winston.error('数据库初始化失败，事务已回滚:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 数据库初始化过程中发生错误:', error.message);
    console.error('详细错误信息:', error);
    winston.error('数据库初始化过程中发生错误:', error);
    return false;
  } finally {
    if (client) {
      try {
        await client.end();
        console.log('🔒 数据库连接已关闭');
      } catch (closeError) {
        console.log('⚠️  关闭数据库连接时出错:', closeError.message);
      }
    }
  }
}

// 执行数据库初始化并处理结果
console.log('====================================');
console.log('🚀 开始数据库初始化...');
console.log('====================================');

initializeDatabase()
  .then(success => {
    console.log('====================================');
    if (success) {
      console.log('🎉 数据库初始化成功完成!');
      winston.info('数据库初始化脚本执行完成');
      process.exit(0);
    } else {
      console.log('❌ 数据库初始化失败!');
      console.log('🔍 请检查错误信息并修复问题');
      console.log('💡 提示: 确保PostgreSQL服务正在运行，并且当前用户有正确的权限');
      winston.error('数据库初始化脚本执行失败');
      process.exit(1);
    }
  });