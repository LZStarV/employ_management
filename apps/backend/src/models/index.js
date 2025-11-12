const { sequelize } = require('../../config/database');
const winston = require('../utils/logger');

// 导入所有模型
const Department = require('./Department');
const Position = require('./Position');
const Employee = require('./Employee');
const Salary = require('./Salary');
const Project = require('./Project');
const EmployeeProject = require('./EmployeeProject');
const Attendance = require('./Attendance');
const Training = require('./Training');
const EmployeeTraining = require('./EmployeeTraining');

// 定义模型之间的关系

// 1-1关系：Employee和Salary
Employee.hasOne(Salary, {
  foreignKey: 'employee_id',
  as: 'salary',
  onDelete: 'CASCADE'
});
Salary.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// 1-N关系：Department和Employee
Department.hasMany(Employee, {
  foreignKey: 'department_id',
  as: 'employees',
  onDelete: 'SET NULL'
});
Employee.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department'
});

// 1-N关系：Position和Employee
Position.hasMany(Employee, {
  foreignKey: 'position_id',
  as: 'employees',
  onDelete: 'SET NULL'
});
Employee.belongsTo(Position, {
  foreignKey: 'position_id',
  as: 'position'
});

// 自引用关系：Employee和Manager
Employee.hasMany(Employee, {
  foreignKey: 'manager_id',
  as: 'subordinates',
  onDelete: 'SET NULL'
});
Employee.belongsTo(Employee, {
  foreignKey: 'manager_id',
  as: 'manager'
});

// 1-N关系：Department和Manager
Department.belongsTo(Employee, {
  foreignKey: 'manager_id',
  as: 'departmentManager',
  onDelete: 'SET NULL'
});

// N-M关系：Employee和Project (通过EmployeeProject)
Employee.belongsToMany(Project, {
  through: EmployeeProject,
  foreignKey: 'employee_id',
  otherKey: 'project_id',
  as: 'projects'
});
Project.belongsToMany(Employee, {
  through: EmployeeProject,
  foreignKey: 'project_id',
  otherKey: 'employee_id',
  as: 'employees'
});

// 为EmployeeProject模型定义关联关系
EmployeeProject.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});
EmployeeProject.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project'
});

// 1-N关系：Project和Attendance
Project.hasMany(Attendance, {
  foreignKey: 'project_id',
  as: 'attendances',
  onDelete: 'SET NULL'
});
Attendance.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project'
});

// 1-N关系：Employee和Attendance
Employee.hasMany(Attendance, {
  foreignKey: 'employee_id',
  as: 'attendances',
  onDelete: 'CASCADE'
});
Attendance.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// N-M关系：Employee和Training (通过EmployeeTraining)
Employee.belongsToMany(Training, {
  through: EmployeeTraining,
  foreignKey: 'employee_id',
  otherKey: 'training_id',
  as: 'trainings'
});
Training.belongsToMany(Employee, {
  through: EmployeeTraining,
  foreignKey: 'training_id',
  otherKey: 'employee_id',
  as: 'participants'
});

// 同步数据库模型
async function syncModels() {
  try {
    // 使用更安全的同步策略，避免删除不存在的约束
    const syncOptions = { 
      force: false,
      alter: false // 禁用alter，避免删除不存在的约束
    };
    
    await sequelize.sync(syncOptions);
  } catch (error) {
    winston.error('数据库模型同步失败:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  syncModels,
  Department,
  Position,
  Employee,
  Salary,
  Project,
  EmployeeProject,
  Attendance,
  Training,
  EmployeeTraining
};