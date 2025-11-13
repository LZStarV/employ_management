import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database';

// 定义Salary模型的接口
interface SalaryAttributes {
  salary_id?: number;
  employee_id: number;
  basic_salary: number;
  bonus?: number;
  allowances?: number;
  effective_date: string;
  created_at?: Date;
  updated_at?: Date;
}

// 定义Salary模型实例的接口
interface SalaryInstance extends Model<SalaryAttributes>, SalaryAttributes {
  getTotalSalary(): number;
  formatSalary(): {
    basicSalary: number;
    bonus: number;
    allowances: number;
    totalSalary: number;
    effectiveDate: string;
  };
  isEffective(): boolean;
}

class Salary extends Model<SalaryAttributes, SalaryAttributes> implements SalaryInstance {
  // 计算总薪资（基本工资 + 奖金 + 津贴）
  getTotalSalary() {
    return (this.basic_salary || 0) + (this.bonus || 0) + (this.allowances || 0);
  }

  // 格式化薪资信息
  formatSalary() {
    return {
      basicSalary: this.basic_salary,
      bonus: this.bonus || 0,
      allowances: this.allowances || 0,
      totalSalary: this.getTotalSalary(),
      effectiveDate: this.effective_date
    };
  }

  // 检查薪资是否有效
  isEffective() {
    const effectiveDate = new Date(this.effective_date);
    const today = new Date();
    return effectiveDate <= today;
  }
}

Salary.init({
  salary_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: {
      msg: '每个员工只能有一条薪资记录'
    },
    references: {
      model: 'employees',
      key: 'employee_id'
    },
    onDelete: 'CASCADE'
  },
  basic_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '基本工资不能为空'
      },
      isDecimal: {
        msg: '基本工资必须是数字格式'
      },
      min: {
        args: [0],
        msg: '基本工资不能为负数'
      }
    }
  },
  bonus: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: '奖金必须是数字格式'
      },
      min: {
        args: [0],
        msg: '奖金不能为负数'
      }
    }
  },
  allowances: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: '津贴必须是数字格式'
      },
      min: {
        args: [0],
        msg: '津贴不能为负数'
      }
    }
  },
  effective_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '生效日期不能为空'
      },
      isDate: {
        msg: '请输入有效的日期格式'
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
  modelName: 'Salary',
  tableName: 'salaries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_salaries_employee_id',
      fields: ['employee_id'],
      unique: true
    }
  ]
});

export default Salary;