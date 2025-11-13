import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database';

// 定义EmployeeProject模型的接口
interface EmployeeProjectAttributes {
  employee_project_id?: number;
  employee_id: number;
  project_id: number;
  role: string;
  start_date: string;
  end_date?: string;
  contribution_hours?: number;
  created_at?: Date;
  updated_at?: Date;
}

// 定义EmployeeProject模型实例的接口
interface EmployeeProjectInstance extends Model<EmployeeProjectAttributes>, EmployeeProjectAttributes {
  isActive(): boolean;
  getWorkDuration(): number;
  getStatusDescription(): string;
}

class EmployeeProject extends Model<EmployeeProjectAttributes, EmployeeProjectAttributes> implements EmployeeProjectInstance {
  // 检查员工是否仍在项目中
  isActive() {
    return !this.end_date || new Date(this.end_date) >= new Date();
  }

  // 计算在项目中的工作时长（天）
  getWorkDuration() {
    const startDate = new Date(this.start_date);
    const endDate = this.end_date ? new Date(this.end_date) : new Date();
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
    return Math.max(durationDays, 0);
  }

  // 获取项目参与状态描述
  getStatusDescription() {
    if (this.end_date) {
      return '已完成';
    }
    const startDate = new Date(this.start_date);
    const today = new Date();
    
    if (today < startDate) {
      return '即将参与';
    } else {
      return '正在参与';
    }
  }
}

EmployeeProject.init({
  employee_project_id: {
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
    allowNull: false,
    references: {
      model: 'projects',
      key: 'project_id'
    },
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '项目角色不能为空'
      },
      len: {
        args: [1, 50],
        msg: '项目角色长度必须在1-50个字符之间'
      }
    }
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
      isAfterStartDate(value: string | null) {
        if (value && this.start_date && new Date(value) < new Date(this.start_date)) {
          throw new Error('结束日期必须晚于开始日期');
        }
      }
    }
  },
  contribution_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: '贡献小时数必须是数字格式'
      },
      min: {
        args: [0],
        msg: '贡献小时数不能为负数'
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
  modelName: 'EmployeeProject',
  tableName: 'employee_projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_employee_projects_employee',
      fields: ['employee_id']
    },
    {
      name: 'idx_employee_projects_project',
      fields: ['project_id']
    },
    {
      name: 'idx_employee_projects_unique',
      fields: ['employee_id', 'project_id'],
      unique: true
    }
  ]
});

export default EmployeeProject;