const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// Employee模型属性接口
interface EmployeeAttributes {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  hire_date: Date;
  position_id: number;
  department_id: number;
  manager_id?: string | null;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: Date;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  profile_picture?: string | null;
  emergency_contact: string;
  emergency_phone: string;
}

// Employee实例方法接口
interface EmployeeInstance extends Model<EmployeeAttributes>, EmployeeAttributes {
  getFullInfo: () => Promise<any>;
  getAttendanceStats: () => Promise<any>;
  formatName: () => string;
  calculateTenure: () => number;
}

// 定义Employee模型
const Employee = sequelize.define('Employee', {
  employee_id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  hire_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  position_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Positions',
      key: 'id'
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
  manager_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    references: {
      model: 'Employees',
      key: 'employee_id'
    }
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  zip_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'On Leave'),
    allowNull: false,
    defaultValue: 'Active'
  },
  profile_picture: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  emergency_contact: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  emergency_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'employees',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['position_id'] },
    { fields: ['department_id'] },
    { fields: ['manager_id'] },
    { fields: ['status'] }
  ]
});

// 实例方法：获取员工完整信息，包括职位和部门
Employee.prototype.getFullInfo = async function() {
  return await this.get({ include: ['position', 'department'] });
};

// 实例方法：获取员工考勤统计
Employee.prototype.getAttendanceStats = async function() {
  const Attendance = require('./Attendance');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  return await Attendance.findAll({
    where: {
      employee_id: this.employee_id,
      [sequelize.Sequelize.Op.and]: [
        sequelize.Sequelize.literal(`EXTRACT(MONTH FROM date) = ${currentMonth}`),
        sequelize.Sequelize.literal(`EXTRACT(YEAR FROM date) = ${currentYear}`)
      ]
    },
    attributes: ['status', [sequelize.Sequelize.fn('count', sequelize.Sequelize.col('status')), 'count']],
    group: ['status']
  });
};

// 实例方法：格式化员工姓名
Employee.prototype.formatName = function() {
  return `${this.last_name}, ${this.first_name}`;
};

// 实例方法：计算员工工龄（年）
Employee.prototype.calculateTenure = function() {
  const hireDate = new Date(this.hire_date);
  const now = new Date();
  let years = now.getFullYear() - hireDate.getFullYear();
  const monthDiff = now.getMonth() - hireDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) {
    years--;
  }
  
  return years;
};

module.exports = Employee;