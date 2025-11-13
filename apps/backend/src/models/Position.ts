const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// Position模型属性接口
interface PositionAttributes {
  id: number;
  position_name: string;
  department_id: number;
  description: string;
  level: string;
  min_salary: number;
  max_salary: number;
  active: boolean;
}

// Position实例方法接口
interface PositionInstance extends Model<PositionAttributes>, PositionAttributes {
  getEmployeeCount: () => Promise<number>;
  getAverageSalary: () => Promise<number | null>;
}

// 定义Position模型
const Position = sequelize.define('Position', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  position_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  min_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  max_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
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
  tableName: 'positions',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['position_name'] },
    { fields: ['department_id'] },
    { fields: ['level'] },
    { fields: ['active'] }
  ],
  validate: {
    checkSalaryRange() {
      if (this.min_salary > this.max_salary) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }
    }
  }
});

// 实例方法：获取该职位的员工数量
Position.prototype.getEmployeeCount = async function() {
  const Employee = require('./Employee');
  return await Employee.count({
    where: { position_id: this.id }
  });
};

// 实例方法：获取该职位的平均薪资
Position.prototype.getAverageSalary = async function() {
  const Employee = require('./Employee');
  const Salary = require('./Salary');
  
  const result = await Salary.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('current_salary')), 'average_salary']],
    include: [{
      model: Employee,
      where: { position_id: this.id }
    }]
  });
  
  return result ? parseFloat(result.get('average_salary') as string) : null;
};

module.exports = Position;