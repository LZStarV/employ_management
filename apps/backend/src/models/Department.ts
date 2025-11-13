const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// Department模型属性接口
interface DepartmentAttributes {
  id: number;
  department_name: string;
  description: string;
  manager_id?: string | null;
  location: string;
  budget: number;
  active: boolean;
}

// Department实例方法接口
interface DepartmentInstance extends Model<DepartmentAttributes>, DepartmentAttributes {
  getHeadcount: () => Promise<number>;
  getDepartmentSummary: () => Promise<any>;
}

// 定义Department模型
const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  department_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  manager_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    references: {
      model: 'Employees',
      key: 'employee_id'
    }
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'departments',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['department_name'] },
    { fields: ['manager_id'] },
    { fields: ['active'] }
  ]
});

// 实例方法：获取部门人数
Department.prototype.getHeadcount = async function() {
  const Employee = require('./Employee');
  return await Employee.count({
    where: { department_id: this.id }
  });
};

// 实例方法：获取部门摘要信息
Department.prototype.getDepartmentSummary = async function() {
  const Employee = require('./Employee');
  const Position = require('./Position');
  
  const headcount = await this.getHeadcount();
  const positions = await Position.count({
    where: { department_id: this.id }
  });
  const activeEmployees = await Employee.count({
    where: { 
      department_id: this.id,
      status: 'Active'
    }
  });
  
  return {
    department_id: this.id,
    department_name: this.department_name,
    total_employees: headcount,
    active_employees,
    position_count: positions,
    manager_id: this.manager_id,
    location: this.location,
    budget: this.budget
  };
};

module.exports = Department;