const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// 部门模型定义

class Department extends Model {
  // 可以在这里定义模型方法
  static async getDepartmentWithStats(departmentId) {
    const department = await this.findByPk(departmentId, {
      include: [
        { model: sequelize.models.Employee, as: 'departmentManager' }
        // 移除员工列表，避免返回过多数据
      ]
    });
    
    if (!department) return null;
    
    // 计算部门统计信息（不返回员工列表）
    const employeeCount = await sequelize.models.Employee.count({
      where: { department_id: departmentId }
    });
    
    // 计算平均薪资（需要关联Salary表）
    const employeesWithSalary = await sequelize.models.Employee.findAll({
      where: { department_id: departmentId },
      include: [{ model: sequelize.models.Salary, as: 'salary' }],
      limit: 100 // 限制查询数量，避免性能问题
    });
    
    const totalSalary = employeesWithSalary.reduce((sum, emp) => {
      return sum + (emp.salary ? emp.salary.basic_salary : 0);
    }, 0);
    
    const avgSalary = employeeCount > 0 ? totalSalary / employeeCount : 0;
    
    return {
      ...department.toJSON(),
      stats: {
        employeeCount,
        avgSalary: avgSalary.toFixed(2),
        managerName: department.departmentManager ? 
          `${department.departmentManager.first_name} ${department.departmentManager.last_name}` : null
      }
    };
  }
}

Department.init({
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '部门名称不能为空'
      },
      len: {
        args: [1, 100],
        msg: '部门名称长度必须在1-100个字符之间'
      }
    }
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
  modelName: 'Department',
  tableName: 'departments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_departments_manager_id',
      fields: ['manager_id']
    },
    {
      name: 'idx_departments_name',
      fields: ['department_name']
    }
  ]
});

module.exports = Department;