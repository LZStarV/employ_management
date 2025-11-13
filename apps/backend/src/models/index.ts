import { sequelize } from '../../config/database';
import Department from './Department';
import Position from './Position';
import Employee from './Employee';
import Attendance from './Attendance';
import Leave from './Leave';
import PerformanceReview from './PerformanceReview';
import Training from './Training';
import Salary from './Salary';
import Project from './Project';
import PositionHistory from './PositionHistory';
import EmployeeProject from './EmployeeProject';
import EmployeeTraining from './EmployeeTraining';

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

// 1-N关系：Employee和Leaves
Employee.hasMany(Leave, {
  foreignKey: 'employee_id',
  as: 'leaves',
  onDelete: 'CASCADE'
});
Leave.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// 1-N关系：Employee和PerformanceReviews
Employee.hasMany(PerformanceReview, {
  foreignKey: 'employee_id',
  as: 'performanceReviews',
  onDelete: 'CASCADE'
});
PerformanceReview.belongsTo(Employee, {
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

// Department has many Positions
Department.hasMany(Position, {
  foreignKey: 'department_id',
  as: 'positions',
  onDelete: 'CASCADE'
});
Position.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department'
});

// 1-N关系：Employee和PositionHistory (一个员工有多个职位变更记录)
Employee.hasMany(PositionHistory, {
  foreignKey: 'employee_id',
  as: 'positionHistory',
  onDelete: 'CASCADE'
});
PositionHistory.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// 1-N关系：Position和PositionHistory (一个职位有多个变更记录)
Position.hasMany(PositionHistory, {
  foreignKey: 'old_position_id',
  as: 'oldPositionHistory',
  onDelete: 'SET NULL'
});
PositionHistory.belongsTo(Position, {
  foreignKey: 'old_position_id',
  as: 'oldPosition'
});

Position.hasMany(PositionHistory, {
  foreignKey: 'new_position_id',
  as: 'newPositionHistory',
  onDelete: 'SET NULL'
});
PositionHistory.belongsTo(Position, {
  foreignKey: 'new_position_id',
  as: 'newPosition'
});

// 同步数据库模型
import logger from '../utils/logger';

async function syncModels() {
  try {
    // 使用更安全的同步策略，避免删除不存在的约束
    const syncOptions = { 
      force: false,
      alter: false // 禁用alter，避免删除不存在的约束
    };
    
    await sequelize.sync(syncOptions);
  } catch (error) {
    logger.error('数据库模型同步失败:', error);
    throw error;
  }
}

// 导出模型和同步函数
export {
  sequelize,
  syncModels,
  Department,
  Position,
  Employee,
  Salary,
  Project,
  PositionHistory,
  EmployeeProject,
  Attendance,
  Training,
  EmployeeTraining,
  Leave,
  PerformanceReview
};