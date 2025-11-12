const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Project extends Model {
  // 获取项目进度
  getProgress() {
    const startDate = new Date(this.start_date);
    const today = new Date();
    let endDate = this.end_date ? new Date(this.end_date) : today;
    
    // 如果项目未开始
    if (today < startDate) return 0;
    
    // 如果项目已结束
    if (this.end_date && today > endDate) return 100;
    
    // 计算进度百分比
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today - startDate) / (1000 * 60 * 60 * 24);
    return Math.min(Math.round((elapsedDays / totalDays) * 100), 100);
  }

  // 获取项目参与人数
  async getParticipantCount() {
    const employees = await this.getEmployees();
    return employees.length;
  }

  // 检查项目是否活跃
  isActive() {
    return this.status === 'active';
  }

  // 获取项目的时间信息
  getTimeInfo() {
    const startDate = new Date(this.start_date);
    const endDate = this.end_date ? new Date(this.end_date) : null;
    const today = new Date();
    
    const timeInfo = {
      started: startDate <= today,
      ended: endDate && endDate < today,
      daysRemaining: null
    };
    
    if (endDate && endDate > today) {
      const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      timeInfo.daysRemaining = remainingDays;
    }
    
    return timeInfo;
  }
}

Project.init({
  project_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '项目名称不能为空'
      },
      len: {
        args: [1, 100],
        msg: '项目名称长度必须在1-100个字符之间'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
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
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'planning',
    validate: {
      isIn: {
        args: [['planning', 'active', 'paused', 'completed', 'cancelled']],
        msg: '项目状态必须是planning、active、paused、completed或cancelled之一'
      }
    }
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: '预算必须是数字格式'
      },
      min: {
        args: [0],
        msg: '预算不能为负数'
      }
    }
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
  modelName: 'Project',
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Project;