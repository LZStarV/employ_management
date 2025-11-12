const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Position extends Model {
  // 可以在这里定义模型方法
  static async getPositionWithStats(positionId) {
    const position = await this.findByPk(positionId, {
      include: [{ model: sequelize.models.Employee, as: 'employees' }]
    });
    
    if (!position) return null;
    
    // 计算职位统计信息
    const employeeCount = position.employees.length;
    
    // 计算平均薪资
    const employeesWithSalary = await sequelize.models.Employee.findAll({
      where: { position_id: positionId },
      include: [{ model: sequelize.models.Salary, as: 'salary' }]
    });
    
    const totalSalary = employeesWithSalary.reduce((sum, emp) => {
      return sum + (emp.salary ? emp.salary.basic_salary : 0);
    }, 0);
    
    const avgSalary = employeeCount > 0 ? totalSalary / employeeCount : 0;
    
    return {
      ...position.toJSON(),
      stats: {
        employeeCount,
        avgSalary: avgSalary.toFixed(2)
      }
    };
  }
}

Position.init({
  position_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  position_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '职位名称不能为空'
      },
      len: {
        args: [1, 100],
        msg: '职位名称长度必须在1-100个字符之间'
      }
    }
  },
  level: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  sequelize,
  modelName: 'Position',
  tableName: 'positions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Position;