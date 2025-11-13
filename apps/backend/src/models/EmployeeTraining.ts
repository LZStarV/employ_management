import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database';

// 定义EmployeeTraining模型的接口
interface EmployeeTrainingAttributes {
  employee_training_id?: number;
  employee_id: number;
  training_id: number;
  participation_date: string;
  score?: number;
  feedback?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 定义EmployeeTraining模型实例的接口
interface EmployeeTrainingInstance extends Model<EmployeeTrainingAttributes>, EmployeeTrainingAttributes {
  getScoreLevel(): string;
  isCompleted(): boolean;
  getParticipationStatus(): string;
  formatTrainingRecord(): {
    participationDate: string;
    score?: number;
    scoreLevel: string;
    feedback?: string;
    status: string;
  };
}

class EmployeeTraining extends Model<EmployeeTrainingAttributes, EmployeeTrainingAttributes> implements EmployeeTrainingInstance {
  // 获取成绩等级
  getScoreLevel() {
    if (!this.score) return '未评分';
    
    if (this.score >= 90) return '优秀';
    if (this.score >= 80) return '良好';
    if (this.score >= 70) return '中等';
    if (this.score >= 60) return '及格';
    return '不及格';
  }

  // 检查是否已完成培训
  isCompleted() {
    return new Date(this.participation_date) <= new Date();
  }

  // 获取参与状态
  getParticipationStatus() {
    const participationDate = new Date(this.participation_date);
    const today = new Date();
    
    if (today < participationDate) return '即将参与';
    if (this.score) return '已完成并评分';
    return '已参与未评分';
  }

  // 格式化培训记录信息
  formatTrainingRecord() {
    return {
      participationDate: this.participation_date,
      score: this.score,
      scoreLevel: this.getScoreLevel(),
      feedback: this.feedback,
      status: this.getParticipationStatus()
    };
  }
}

EmployeeTraining.init({
  employee_training_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'employee_id'
    },
    onDelete: 'CASCADE'
  },
  training_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trainings',
      key: 'training_id'
    },
    onDelete: 'CASCADE'
  },
  participation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '参与日期不能为空'
      },
      isDate: {
        msg: '请输入有效的日期格式'
      }
    }
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: '成绩必须是数字格式'
      },
      min: {
        args: [0],
        msg: '成绩不能为负数'
      },
      max: {
        args: [100],
        msg: '成绩不能超过100'
      }
    }
  },
  feedback: {
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
  modelName: 'EmployeeTraining',
  tableName: 'employee_trainings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_employee_trainings_employee',
      fields: ['employee_id']
    },
    {
      name: 'idx_employee_trainings_training',
      fields: ['training_id']
    },
    {
      name: 'idx_employee_trainings_unique',
      fields: ['employee_id', 'training_id'],
      unique: true
    }
  ]
});

export default EmployeeTraining;