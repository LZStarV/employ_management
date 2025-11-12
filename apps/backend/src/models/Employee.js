const { DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const validator = require('validator');

class Employee extends Model {
  // 获取员工完整信息（包含所有关联数据）
  static async getEmployeeWithAllDetails(employeeId) {
    return await this.findByPk(employeeId, {
      include: [
        { model: sequelize.models.Department, as: 'department' },
        { model: sequelize.models.Position, as: 'position' },
        { model: sequelize.models.Employee, as: 'manager' },
        { model: sequelize.models.Salary, as: 'salary' },
        { model: sequelize.models.Project, as: 'projects' },
        { model: sequelize.models.Training, as: 'trainings' }
      ]
    });
  }

  // 获取员工的考勤统计
  async getAttendanceStats(startDate, endDate) {
    const attendances = await sequelize.models.Attendance.findAll({
      where: {
        employee_id: this.employee_id,
        attendance_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const stats = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      overtimeHours: 0
    };

    attendances.forEach(att => {
      stats.totalDays++;
      if (att.status === 'present') stats.presentDays++;
      if (att.status === 'absent') stats.absentDays++;
      if (att.status === 'late') stats.lateDays++;
      stats.overtimeHours += att.overtime_hours || 0;
    });

    return stats;
  }

  // 格式化员工姓名
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // 计算工龄（年）
  getSeniority() {
    if (!this.hire_date) return 0;
    const hireDate = new Date(this.hire_date);
    const today = new Date();
    const diffTime = Math.abs(today - hireDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  }
}

Employee.init({
  employee_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '名字不能为空'
      },
      len: {
        args: [1, 50],
        msg: '名字长度必须在1-50个字符之间'
      }
    }
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '姓氏不能为空'
      },
      len: {
        args: [1, 50],
        msg: '姓氏长度必须在1-50个字符之间'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: '邮箱地址已存在'
    },
    validate: {
      notEmpty: {
        msg: '邮箱不能为空'
      },
      isEmail: {
        msg: '请输入有效的邮箱地址'
      },
      len: {
        args: [1, 100],
        msg: '邮箱长度必须在1-100个字符之间'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: {
        args: [0, 20],
        msg: '电话长度不能超过20个字符'
      }
    }
  },
  hire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '入职日期不能为空'
      },
      isDate: {
        msg: '请输入有效的日期格式'
      }
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'department_id'
    },
    onDelete: 'SET NULL'
  },
  position_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'positions',
      key: 'position_id'
    },
    onDelete: 'SET NULL'
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'employee_id'
    },
    onDelete: 'SET NULL'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: '请输入有效的出生日期格式'
      }
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'inactive', 'on_leave', 'resigned']],
        msg: '员工状态必须是active、inactive、on_leave或resigned之一'
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
  modelName: 'Employee',
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_employees_last_name',
      fields: ['last_name']
    },
    {
      name: 'idx_employees_email',
      fields: ['email'],
      unique: true
    },
    {
      name: 'idx_employees_department_id',
      fields: ['department_id']
    },
    {
      name: 'idx_employees_position_id',
      fields: ['position_id']
    },
    {
      name: 'idx_employees_manager_id',
      fields: ['manager_id']
    }
  ]
});

module.exports = Employee;