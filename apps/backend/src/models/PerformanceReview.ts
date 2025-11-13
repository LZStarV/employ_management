const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

// PerformanceReview模型属性接口
interface PerformanceReviewAttributes {
  id: number;
  employee_id: string;
  review_date: Date;
  review_period_start: Date;
  review_period_end: Date;
  reviewer_id: string;
  overall_rating: number;
  strengths: string;
  areas_for_improvement: string;
  goals: string;
  comments?: string | null;
  status: 'Scheduled' | 'Completed' | 'Pending Feedback';
  next_review_date?: Date | null;
}

// PerformanceReview实例方法接口
interface PerformanceReviewInstance extends Model<PerformanceReviewAttributes>, PerformanceReviewAttributes {
  getReviewSummary: () => Promise<any>;
  calculateRatingTrend: () => Promise<number[] | null>;
  updateEmployeeGoals: () => Promise<void>;
}

// 定义PerformanceReview模型
const PerformanceReview = sequelize.define<PerformanceReviewInstance>('PerformanceReview', {
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
  review_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  review_period_start: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  review_period_end: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  reviewer_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'Employees',
      key: 'employee_id'
    }
  },
  overall_rating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 1,
      max: 5
    }
  },
  strengths: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  areas_for_improvement: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  goals: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'Completed', 'Pending Feedback'),
    allowNull: false,
    defaultValue: 'Scheduled'
  },
  next_review_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'performance_reviews',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['employee_id'] },
    { fields: ['reviewer_id'] },
    { fields: ['review_date'] },
    { fields: ['status'] },
    { fields: ['overall_rating'] }
  ],
  validate: {
    checkDateRange() {
      if (new Date(this.review_period_start) > new Date(this.review_period_end)) {
        throw new Error('Review period start cannot be after end');
      }
    }
  }
});

// 实例方法：获取绩效评估摘要
PerformanceReview.prototype.getReviewSummary = async function() {
  const Employee = require('./Employee');
  const employee = await Employee.findByPk(this.employee_id);
  const reviewer = await Employee.findByPk(this.reviewer_id);
  
  return {
    review_id: this.id,
    employee: employee ? {
      id: employee.employee_id,
      name: `${employee.last_name}, ${employee.first_name}`
    } : null,
    reviewer: reviewer ? {
      id: reviewer.employee_id,
      name: `${reviewer.last_name}, ${reviewer.first_name}`
    } : null,
    review_date: this.review_date,
    review_period: {
      start: this.review_period_start,
      end: this.review_period_end
    },
    overall_rating: this.overall_rating,
    status: this.status,
    next_review_date: this.next_review_date
  };
};

// 实例方法：计算员工的评分趋势
PerformanceReview.prototype.calculateRatingTrend = async function() {
  const reviews = await PerformanceReview.findAll({
    where: { employee_id: this.employee_id },
    order: [['review_date', 'ASC']],
    attributes: ['overall_rating']
  });
  
  return reviews.length > 0 ? reviews.map(r => parseFloat(r.overall_rating.toString())) : null;
};

// 实例方法：更新员工目标
PerformanceReview.prototype.updateEmployeeGoals = async function() {
  // 这里可以实现与员工目标相关的逻辑
  // 例如更新某个目标跟踪表或触发通知
  console.log(`Goals updated for employee ${this.employee_id} after performance review`);
};

module.exports = PerformanceReview;