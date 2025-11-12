const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Training extends Model {
  // 获取培训参与人数
  async getParticipantCount() {
    const participants = await this.getParticipants();
    return participants.length;
  }

  // 检查培训是否已开始
  hasStarted() {
    const startDate = new Date(this.start_date);
    const today = new Date();
    return today >= startDate;
  }

  // 检查培训是否已结束
  hasEnded() {
    if (!this.end_date) return false;
    const endDate = new Date(this.end_date);
    const today = new Date();
    return today > endDate;
  }

  // 获取培训状态
  getStatus() {
    if (this.hasEnded()) return 'completed';
    if (this.hasStarted()) return 'ongoing';
    return 'upcoming';
  }

  // 获取培训持续时间（天）
  getDuration() {
    const startDate = new Date(this.start_date);
    const endDate = this.end_date ? new Date(this.end_date) : startDate;
    const durationMs = endDate - startDate;
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 包含开始日期
    return Math.max(durationDays, 1);
  }
}

Training.init({
  training_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  training_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '培训名称不能为空'
      },
      len: {
        args: [1, 100],
        msg: '培训名称长度必须在1-100个字符之间'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trainer_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '开始日期不能为空'
      },
      isDate: {
        msg: '请输入有效的日期格式'
      }
    }
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: '请输入有效的日期格式'
      },
      isAfterStartDate(value) {
        if (value && this.start_date && new Date(value) < new Date(this.start_date)) {
          throw new Error('结束日期必须晚于开始日期');
        }
      }
    }
  },
  location: {
    type: DataTypes.STRING(200),
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
  modelName: 'Training',
  tableName: 'trainings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Training;