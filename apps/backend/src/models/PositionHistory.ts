const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// PositionHistory模型属性接口
interface PositionHistoryAttributes {
  id: number;
  employee_id: string;
  old_position_id?: number | null;
  new_position_id: number;
  change_date: Date;
  change_reason: string;
  changed_by: string;
  old_salary?: number | null;
  new_salary: number;
  promotion_type?: 'Promotion' | 'Demotion' | 'Transfer' | 'Other';
  notes?: string;
}

// PositionHistory实例方法接口
interface PositionHistoryInstance extends Model<PositionHistoryAttributes>, PositionHistoryAttributes {}

// 定义PositionHistory模型
const PositionHistory = sequelize.define('PositionHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  employee_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'Employees',
      key: 'employee_id'
    },
    onDelete: 'CASCADE'
  },
  old_position_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Positions',
      key: 'id'
    }
  },
  new_position_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Positions',
      key: 'id'
    }
  },
  change_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  change_reason: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  changed_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  old_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  new_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  promotion_type: {
    type: DataTypes.ENUM('Promotion', 'Demotion', 'Transfer', 'Other'),
    allowNull: true,
    defaultValue: 'Other'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'position_histories',
  timestamps: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['old_position_id'] },
    { fields: ['new_position_id'] },
    { fields: ['change_date'] },
    { fields: ['promotion_type'] }
  ]
});

module.exports = PositionHistory;