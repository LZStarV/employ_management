const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Attendance extends Model {
  // 计算工作时长（小时）
  getWorkHours() {
    if (!this.check_in_time || !this.check_out_time) {
      return 0;
    }
    
    const checkIn = new Date(`2000-01-01T${this.check_in_time}`);
    const checkOut = new Date(`2000-01-01T${this.check_out_time}`);
    const diffMs = checkOut - checkIn;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(diffHours, 0);
  }

  // 获取状态描述
  getStatusDescription() {
    const statusMap = {
      'present': '出勤',
      'absent': '缺勤',
      'late': '迟到',
      'early_leave': '早退',
      'sick_leave': '病假',
      'annual_leave': '年假'
    };
    
    return statusMap[this.status] || this.status;
  }

  // 检查是否为工作日
  isWorkDay() {
    const date = new Date(this.attendance_date);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0是周日，6是周六
  }

  // 获取当天的总工作时间（包括加班）
  getTotalWorkTime() {
    return this.getWorkHours() + (this.overtime_hours || 0);
  }
}

Attendance.init({
  attendance_id: {
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
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'project_id'
    },
    onDelete: 'SET NULL'
  },
  attendance_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '考勤日期不能为空'
      },
      isDate: {
        msg: '请输入有效的日期格式'
      }
    }
  },
  check_in_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  check_out_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'present',
    validate: {
      isIn: {
        args: [['present', 'absent', 'late', 'early_leave', 'sick_leave', 'annual_leave']],
        msg: '考勤状态必须是present、absent、late、early_leave、sick_leave或annual_leave之一'
      }
    }
  },
  overtime_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: '加班小时数必须是数字格式'
      },
      min: {
        args: [0],
        msg: '加班小时数不能为负数'
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
  modelName: 'Attendance',
  tableName: 'attendances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_attendances_employee_date',
      fields: ['employee_id', 'attendance_date']
    },
    {
      name: 'idx_attendances_project_id',
      fields: ['project_id']
    }
  ]
});

module.exports = Attendance;