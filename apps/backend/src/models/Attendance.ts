const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// Attendance模型属性接口
interface AttendanceAttributes {
  id: number;
  employee_id: string;
  date: Date;
  check_in_time?: Date | null;
  check_out_time?: Date | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Holiday' | 'Leave' | 'Sick Leave' | 'Annual Leave' | 'Other Leave' | 'Exception';
  notes?: string | null;
  working_hours?: number | null;
  overtime_hours?: number | null;
}

// Attendance实例方法接口
interface AttendanceInstance extends Model<AttendanceAttributes>, AttendanceAttributes {
  calculateWorkingHours: () => number;
  isLate: () => boolean;
  getAttendanceStatus: () => string;
}

// 定义Attendance模型
const Attendance = sequelize.define('Attendance', {
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
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true
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
    type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Half Day', 'Holiday', 'Leave', 'Sick Leave', 'Annual Leave', 'Other Leave', 'Exception'),
    allowNull: false,
    defaultValue: 'Absent'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  working_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  overtime_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  }
}, {
  tableName: 'attendances',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['date'] },
    { fields: ['status'] },
    { fields: ['employee_id', 'date'], unique: true } // 确保每个员工每天只有一条记录
  ]
});

// 实例方法：计算工作时长（小时）
Attendance.prototype.calculateWorkingHours = function() {
  if (!this.check_in_time || !this.check_out_time) {
    return 0;
  }
  
  const checkIn = new Date(`1970-01-01T${this.check_in_time}Z`);
  const checkOut = new Date(`1970-01-01T${this.check_out_time}Z`);
  
  // 处理跨天情况
  if (checkOut < checkIn) {
    checkOut.setDate(checkOut.getDate() + 1);
  }
  
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // 保留两位小数
};

// 实例方法：判断是否迟到（假设9:00为上班时间）
Attendance.prototype.isLate = function() {
  if (!this.check_in_time) {
    return false;
  }
  
  const checkIn = new Date(`1970-01-01T${this.check_in_time}Z`);
  const workStartTime = new Date('1970-01-01T09:00:00Z');
  
  return checkIn > workStartTime;
};

// 实例方法：获取考勤状态文本
Attendance.prototype.getAttendanceStatus = function() {
  if (this.status === 'Late' && this.check_in_time) {
    const checkIn = new Date(`1970-01-01T${this.check_in_time}Z`);
    const workStartTime = new Date('1970-01-01T09:00:00Z');
    const minutesLate = Math.round((checkIn.getTime() - workStartTime.getTime()) / (1000 * 60));
    return `Late by ${minutesLate} minutes`;
  }
  
  return this.status;
};

module.exports = Attendance;