const Position = require('../models/Position');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const PositionHistory = require('../models/PositionHistory');
const { Op } = require('sequelize');

// 类型定义
interface PositionInstance {
  id: number;
  position_name: string;
  department_id: number;
  description: string;
  level: string;
  min_salary: number;
  max_salary: number;
  active: boolean;
  getEmployeeCount: () => Promise<number>;
  getAverageSalary: () => Promise<number | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeInstance {
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
  salary?: number;
  getFullInfo: () => Promise<any>;
  getAttendanceStats: () => Promise<any>;
  formatName: () => string;
  calculateTenure: () => number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PositionHistoryInstance {
  id: number;
  employee_id: string;
  old_position_id?: number | null;
  new_position_id: number;
  change_date: Date;
  change_reason: string;
  changed_by: string;
  old_salary?: number | null;
  new_salary: number;
  promotion_type?: 'Promotion' | 'Demotion' | 'Transfer' | 'Other';
  notes?: string;
  oldPosition?: PositionInstance;
  newPosition?: PositionInstance;
  employee?: EmployeeInstance;
  createdAt?: Date;
  updatedAt?: Date;
}

// 职位晋升数据接口
interface PromotionData {
  employee_id: string;
  new_position_id: number;
  new_salary: number;
  change_reason: string;
  changed_by: string;
  promotion_type?: 'Promotion' | 'Demotion' | 'Transfer' | 'Other';
  notes?: string;
}

// 职位服务接口定义
interface PositionService {
  getAllPositions: (options?: PaginationOptions & FilterOptions) => Promise<PositionListResult>;
  getPositionById: (id: string | number) => Promise<PositionInstance | null>;
  createPosition: (positionData: PositionCreateData) => Promise<PositionInstance>;
  updatePosition: (id: string | number, positionData: PositionUpdateData) => Promise<PositionInstance | null>;
  deletePosition: (id: string | number) => Promise<boolean>;
  searchPositions: (query: string, options?: PaginationOptions & FilterOptions) => Promise<PositionListResult>;
  getPositionsByDepartment: (departmentId: string | number, options?: PaginationOptions) => Promise<PositionListResult>;
  getPositionWithDetails: (id: string | number) => Promise<PositionWithDetails | null>;
  getPositionsWithEmployeeCount: () => Promise<PositionWithCount[]>;
  getPositionStats: () => Promise<PositionStats>;
  getPositionSummary: (positionId: string | number) => Promise<PositionSummary | null>;
  validateSalaryRange: (positionId: string | number, salary: number) => Promise<boolean>;
  promoteEmployee: (promotionData: PromotionData) => Promise<PositionHistoryInstance>;
  getEmployeePositionHistory: (employeeId: string) => Promise<PositionHistoryInstance[]>;
  getPositionHistoryById: (id: number) => Promise<PositionHistoryInstance | null>;
  getPromotionStats: () => Promise<PromotionStats>;
  getEmployeePromotionHistory: (employeeId: string, type?: string) => Promise<PositionHistoryInstance[]>;
}

// 分页选项接口
interface PaginationOptions {
  page: number;
  pageSize: number;
}

// 过滤选项接口
interface FilterOptions {
  department_id?: string | number;
  status?: string;
  minSalary?: number;
  maxSalary?: number;
}

// 职位列表结果接口
interface PositionListResult {
  positions: PositionInstance[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// 职位创建数据接口
interface PositionCreateData {
  name: string;
  description: string;
  department_id: string | number;
  min_salary: number;
  max_salary: number;
  status?: string;
  is_manager?: boolean;
  required_experience?: number;
  job_level?: string;
}

// 职位更新数据接口
interface PositionUpdateData {
  name?: string;
  description?: string;
  department_id?: string | number;
  min_salary?: number;
  max_salary?: number;
  status?: string;
  is_manager?: boolean;
  required_experience?: number;
  job_level?: string;
}

// 职位实例类型
interface PositionInstance {
  id: string | number;
  name: string;
  description: string;
  department_id: string | number;
  min_salary: number;
  max_salary: number;
  status: string;
  is_manager: boolean;
  required_experience?: number;
  job_level?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // 实例方法
  getEmployeeCount?: () => Promise<number>;
  getAverageSalary?: () => Promise<number>;
}

// 带有详情的职位接口
interface PositionWithDetails extends PositionInstance {
  department: DepartmentInstance;
  employees: EmployeeInstance[];
  managerCount: number;
  averageSalary: number;
}

// 带有员工数的职位接口
interface PositionWithCount extends PositionInstance {
  employeeCount: number;
  managerCount: number;
  averageSalary: number;
  departmentName: string;
}

// 部门实例类型
interface DepartmentInstance {
  id: string | number;
  name: string;
  description: string;
  // 其他属性...
}

// 员工实例类型
interface EmployeeInstance {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  salary: number;
  status: string;
  // 其他属性...
}

// 职位统计接口
interface PositionStats {
  totalPositions: number;
  positionsByDepartment: { department_id: string | number; department_name: string; count: number }[];
  activePositions: number;
  inactivePositions: number;
  averageMinSalary: number;
  averageMaxSalary: number;
  managerPositions: number;
  nonManagerPositions: number;
  positionsWithNoEmployees: number;
}

// 职位摘要接口
interface PositionSummary extends PositionInstance {
  department: DepartmentInstance;
  employeeCount: number;
  managerCount: number;
  averageSalary: number;
  minEmployeeSalary: number;
  maxEmployeeSalary: number;
  activeEmployees: number;
  topPerformers: EmployeeInstance[];
  salaryComplianceRate: number;
}

// 晋升统计接口
interface PromotionStats {
  totalPromotions: number;
  promotionsByType: { [key: string]: number };
  promotionsByDepartment: { department_id: string | number; department_name: string; count: number }[];
  promotionsByPosition: { position_id: string | number; position_name: string; count: number }[];
  averageSalaryIncrease: number;
  recentPromotions: PositionHistoryInstance[];
}

// 职位服务实现
const PositionService: PositionService = {
  // 获取所有职位
  async getAllPositions(options?: PaginationOptions & FilterOptions): Promise<PositionListResult> {
    try {
      const where = {};
      
      // 应用过滤条件
      if (options) {
        if (options.department_id) {
          where['department_id'] = options.department_id;
        }
        if (options.status) {
          where['status'] = options.status;
        }
        if (options.minSalary !== undefined) {
          where['min_salary'] = { [Op.gte]: options.minSalary };
        }
        if (options.maxSalary !== undefined) {
          where['max_salary'] = { [Op.lte]: options.maxSalary };
        }
      }
      
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Position.findAndCountAll({
          where,
          include: [{ model: Department, as: 'department' }],
          offset,
          limit: pageSize,
          order: [['name', 'ASC']]
        });
        
        return {
          positions: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const positions = await Position.findAll({
          where,
          include: [{ model: Department, as: 'department' }],
          order: [['name', 'ASC']]
        });
        
        return {
          positions,
          total: positions.length
        };
      }
    } catch (error) {
      console.error('Error getting all positions:', error);
      throw error;
    }
  },
  
  // 根据ID获取职位
  async getPositionById(id: string | number): Promise<PositionInstance | null> {
    try {
      return await Position.findByPk(id, {
        include: [{ model: Department, as: 'department' }]
      });
    } catch (error) {
      console.error(`Error getting position with id ${id}:`, error);
      throw error;
    }
  },
  
  // 创建新职位
  async createPosition(positionData: PositionCreateData): Promise<PositionInstance> {
    try {
      // 验证薪资范围
      if (positionData.min_salary >= positionData.max_salary) {
        throw new Error('Minimum salary must be less than maximum salary');
      }
      
      // 检查部门是否存在
      const department = await Department.findByPk(positionData.department_id);
      if (!department) {
        throw new Error('Department does not exist');
      }
      
      // 检查职位名称是否在同一部门中已存在
      const existingPosition = await Position.findOne({
        where: {
          name: positionData.name,
          department_id: positionData.department_id
        }
      });
      if (existingPosition) {
        throw new Error('Position name already exists in this department');
      }
      
      // 设置默认值
      const data = {
        ...positionData,
        status: positionData.status || 'Active',
        is_manager: positionData.is_manager || false
      };
      
      return await Position.create(data);
    } catch (error) {
      console.error('Error creating position:', error);
      throw error;
    }
  },
  
  // 更新职位
  async updatePosition(id: string | number, positionData: PositionUpdateData): Promise<PositionInstance | null> {
    try {
      const position = await Position.findByPk(id);
      
      if (!position) {
        return null;
      }
      
      // 如果更新薪资范围，验证新的薪资范围
      if (positionData.min_salary !== undefined && positionData.max_salary !== undefined) {
        if (positionData.min_salary >= positionData.max_salary) {
          throw new Error('Minimum salary must be less than maximum salary');
        }
      } else if (positionData.min_salary !== undefined && positionData.min_salary >= position.max_salary) {
        throw new Error('Minimum salary must be less than current maximum salary');
      } else if (positionData.max_salary !== undefined && positionData.max_salary <= position.min_salary) {
        throw new Error('Maximum salary must be greater than current minimum salary');
      }
      
      // 如果更新部门，检查新部门是否存在
      if (positionData.department_id !== undefined && positionData.department_id !== position.department_id) {
        const department = await Department.findByPk(positionData.department_id);
        if (!department) {
          throw new Error('Department does not exist');
        }
      }
      
      // 如果更新职位名称和/或部门，检查是否存在重复
      if (positionData.name !== undefined || positionData.department_id !== undefined) {
        const name = positionData.name || position.name;
        const departmentId = positionData.department_id || position.department_id;
        
        const existingPosition = await Position.findOne({
          where: {
            name,
            department_id: departmentId,
            id: { [Op.ne]: id }
          }
        });
        if (existingPosition) {
          throw new Error('Position name already exists in this department');
        }
      }
      
      await position.update(positionData);
      
      // 返回更新后的职位对象，包括关联数据
      return await this.getPositionById(id);
    } catch (error) {
      console.error(`Error updating position with id ${id}:`, error);
      throw error;
    }
  },
  
  // 删除职位
  async deletePosition(id: string | number): Promise<boolean> {
    try {
      const position = await Position.findByPk(id);
      
      if (!position) {
        return false;
      }
      
      // 检查是否有员工在此职位
      const hasEmployees = await Employee.count({ where: { position_id: id } });
      if (hasEmployees > 0) {
        throw new Error('Cannot delete position with employees');
      }
      
      await position.destroy();
      return true;
    } catch (error) {
      console.error(`Error deleting position with id ${id}:`, error);
      throw error;
    }
  },
  
  // 搜索职位
  async searchPositions(query: string, options?: PaginationOptions & FilterOptions): Promise<PositionListResult> {
    try {
      const where: any = {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { job_level: { [Op.like]: `%${query}%` } }
        ]
      };
      
      // 应用额外的过滤条件
      if (options) {
        if (options.department_id) {
          where['department_id'] = options.department_id;
        }
        if (options.status) {
          where['status'] = options.status;
        }
        if (options.minSalary !== undefined) {
          where['min_salary'] = { [Op.gte]: options.minSalary };
        }
        if (options.maxSalary !== undefined) {
          where['max_salary'] = { [Op.lte]: options.maxSalary };
        }
      }
      
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Position.findAndCountAll({
          where,
          include: [{ model: Department, as: 'department' }],
          offset,
          limit: pageSize,
          order: [['name', 'ASC']]
        });
        
        return {
          positions: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const positions = await Position.findAll({
          where,
          include: [{ model: Department, as: 'department' }],
          order: [['name', 'ASC']]
        });
        
        return {
          positions,
          total: positions.length
        };
      }
    } catch (error) {
      console.error('Error searching positions:', error);
      throw error;
    }
  },
  
  // 根据部门获取职位
  async getPositionsByDepartment(departmentId: string | number, options?: PaginationOptions): Promise<PositionListResult> {
    try {
      // 检查部门是否存在
      const department = await Department.findByPk(departmentId);
      if (!department) {
        throw new Error('Department does not exist');
      }
      
      if (options) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Position.findAndCountAll({
          where: { department_id: departmentId },
          include: [{ model: Department, as: 'department' }],
          offset,
          limit: pageSize,
          order: [['name', 'ASC']]
        });
        
        return {
          positions: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const positions = await Position.findAll({
          where: { department_id: departmentId },
          include: [{ model: Department, as: 'department' }],
          order: [['name', 'ASC']]
        });
        
        return {
          positions,
          total: positions.length
        };
      }
    } catch (error) {
      console.error(`Error getting positions for department ${departmentId}:`, error);
      throw error;
    }
  },
  
  // 获取带有详情的职位
  async getPositionWithDetails(id: string | number): Promise<PositionWithDetails | null> {
    try {
      const position = await Position.findByPk(id, {
        include: [
          { model: Department, as: 'department' },
          { model: Employee, as: 'employees' }
        ]
      });
      
      if (!position) {
        return null;
      }
      
      const employees = position.employees || [];
      const managerCount = employees.filter(e => e.manager_id === e.id).length; // 简化判断，实际可能需要更复杂的逻辑
      
      // 计算平均薪资
      const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      const averageSalary = employees.length > 0 ? totalSalary / employees.length : 0;
      
      return {
        ...position.toJSON(),
        department: position.department,
        employees,
        managerCount,
        averageSalary: Math.round(averageSalary * 100) / 100
      };
    } catch (error) {
      console.error(`Error getting position details for id ${id}:`, error);
      throw error;
    }
  },
  
  // 获取带有员工数的职位列表
  async getPositionsWithEmployeeCount(): Promise<PositionWithCount[]> {
    try {
      const positions = await Position.findAll({
        include: [{ model: Department, as: 'department' }],
        order: [['department_id', 'ASC'], ['name', 'ASC']]
      });
      
      const positionsWithCount: PositionWithCount[] = await Promise.all(
        positions.map(async (pos: PositionInstance) => {
          // 获取员工数
          const employees = await Employee.findAll({ where: { position_id: pos.id } });
          const employeeCount = employees.length;
          
          // 计算管理者数量（简化判断）
          const managerCount = employees.filter(e => e.manager_id === e.id).length;
          
          // 计算平均薪资
          const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
          const averageSalary = employeeCount > 0 ? totalSalary / employeeCount : 0;
          
          return {
            ...pos.toJSON(),
            employeeCount,
            managerCount,
            averageSalary: Math.round(averageSalary * 100) / 100,
            departmentName: pos.department ? pos.department.name : 'Unknown'
          };
        })
      );
      
      return positionsWithCount;
    } catch (error) {
      console.error('Error getting positions with employee count:', error);
      throw error;
    }
  },
  
  // 获取职位统计信息
  async getPositionStats(): Promise<PositionStats> {
    try {
      const positions = await this.getPositionsWithEmployeeCount();
      
      // 按部门统计职位数
      const positionsByDepartment: { [key: string]: { department_id: string | number; department_name: string; count: number } } = {};
      
      positions.forEach(pos => {
        const deptId = pos.department_id.toString();
        if (!positionsByDepartment[deptId]) {
          positionsByDepartment[deptId] = {
            department_id: pos.department_id,
            department_name: pos.departmentName,
            count: 0
          };
        }
        positionsByDepartment[deptId].count++;
      });
      
      const totalPositions = positions.length;
      const activePositions = positions.filter(p => p.status === 'Active').length;
      const inactivePositions = totalPositions - activePositions;
      const managerPositions = positions.filter(p => p.is_manager).length;
      const nonManagerPositions = totalPositions - managerPositions;
      const positionsWithNoEmployees = positions.filter(p => p.employeeCount === 0).length;
      
      // 计算平均最低和最高薪资
      const totalMinSalary = positions.reduce((sum, pos) => sum + pos.min_salary, 0);
      const totalMaxSalary = positions.reduce((sum, pos) => sum + pos.max_salary, 0);
      
      const averageMinSalary = totalPositions > 0 ? totalMinSalary / totalPositions : 0;
      const averageMaxSalary = totalPositions > 0 ? totalMaxSalary / totalPositions : 0;
      
      return {
        totalPositions,
        positionsByDepartment: Object.values(positionsByDepartment),
        activePositions,
        inactivePositions,
        averageMinSalary: Math.round(averageMinSalary * 100) / 100,
        averageMaxSalary: Math.round(averageMaxSalary * 100) / 100,
        managerPositions,
        nonManagerPositions,
        positionsWithNoEmployees
      };
    } catch (error) {
      console.error('Error getting position stats:', error);
      throw error;
    }
  },
  
  // 获取职位摘要信息
  async getPositionSummary(positionId: string | number): Promise<PositionSummary | null> {
    try {
      const details = await this.getPositionWithDetails(positionId);
      
      if (!details) {
        return null;
      }
      
      const employees = details.employees;
      
      // 计算最高和最低员工薪资
      let minEmployeeSalary = Infinity;
      let maxEmployeeSalary = -Infinity;
      
      employees.forEach(emp => {
        if (emp.salary < minEmployeeSalary) minEmployeeSalary = emp.salary;
        if (emp.salary > maxEmployeeSalary) maxEmployeeSalary = emp.salary;
      });
      
      if (employees.length === 0) {
        minEmployeeSalary = 0;
        maxEmployeeSalary = 0;
      }
      
      // 计算活跃员工数
      const activeEmployees = employees.filter(e => e.status === 'Active').length;
      
      // 获取表现最好的员工（这里简化为薪资最高的3名员工）
      const topPerformers = [...employees]
        .sort((a, b) => (b.salary || 0) - (a.salary || 0))
        .slice(0, 3);
      
      // 计算薪资合规率（薪资在职位薪资范围内的员工百分比）
      let salaryComplianceRate = 0;
      if (employees.length > 0) {
        const compliantEmployees = employees.filter(emp => 
          emp.salary >= details.min_salary && emp.salary <= details.max_salary
        );
        salaryComplianceRate = (compliantEmployees.length / employees.length) * 100;
      }
      
      return {
        ...details,
        department: details.department,
        employeeCount: employees.length,
        managerCount: details.managerCount,
        averageSalary: details.averageSalary,
        minEmployeeSalary,
        maxEmployeeSalary,
        activeEmployees,
        topPerformers,
        salaryComplianceRate: Math.round(salaryComplianceRate * 100) / 100
      };
    } catch (error) {
      console.error(`Error getting position summary for id ${positionId}:`, error);
      throw error;
    }
  },
  
  // 验证薪资是否在职位薪资范围内
  async validateSalaryRange(positionId: string | number, salary: number): Promise<boolean> {
    try {
      const position = await Position.findByPk(positionId);
      
      if (!position) {
        throw new Error('Position not found');
      }
      
      return salary >= position.min_salary && salary <= position.max_salary;
    } catch (error) {
      console.error(`Error validating salary range for position ${positionId}:`, error);
      throw error;
    }
  },
  
  // 员工职级晋升
  async promoteEmployee(promotionData: PromotionData): Promise<PositionHistoryInstance> {
    try {
      const { employee_id, new_position_id, new_salary, change_reason, changed_by, promotion_type = 'Promotion', notes } = promotionData;
      
      // 验证员工是否存在
      const employee = await Employee.findByPk(employee_id);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // 验证新职位是否存在
      const newPosition = await Position.findByPk(new_position_id);
      if (!newPosition) {
        throw new Error('New position not found');
      }
      
      // 验证薪资是否在新职位的薪资范围内
      if (new_salary < newPosition.min_salary || new_salary > newPosition.max_salary) {
        throw new Error('New salary is outside the range for the new position');
      }
      
      // 开始事务
      return await PositionHistory.sequelize.transaction(async (transaction) => {
        // 记录职位变更历史
        const positionHistory = await PositionHistory.create({
          employee_id,
          old_position_id: employee.position_id,
          new_position_id,
          change_reason,
          changed_by,
          old_salary: employee.salary,
          new_salary,
          promotion_type,
          notes
        }, { transaction });
        
        // 更新员工信息
        await employee.update({
          position_id: new_position_id,
          department_id: newPosition.department_id, // 更新部门ID（如果新职位属于不同部门）
          salary: new_salary
        }, { transaction });
        
        return positionHistory;
      });
    } catch (error) {
      console.error('Error promoting employee:', error);
      throw error;
    }
  },
  
  // 获取员工职位变更历史
  async getEmployeePositionHistory(employeeId: string): Promise<PositionHistoryInstance[]> {
    try {
      // 验证员工是否存在
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      return await PositionHistory.findAll({
        where: { employee_id: employeeId },
        include: [
          { model: Position, as: 'oldPosition' },
          { model: Position, as: 'newPosition' }
        ],
        order: [['change_date', 'DESC']]
      });
    } catch (error) {
      console.error(`Error getting position history for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 根据ID获取职位变更历史
  async getPositionHistoryById(id: number): Promise<PositionHistoryInstance | null> {
    try {
      return await PositionHistory.findByPk(id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: Position, as: 'oldPosition' },
          { model: Position, as: 'newPosition' }
        ]
      });
    } catch (error) {
      console.error(`Error getting position history with id ${id}:`, error);
      throw error;
    }
  },
  
  // 获取晋升统计信息
  async getPromotionStats(): Promise<PromotionStats> {
    try {
      const positionHistories = await PositionHistory.findAll({
        include: [
          { model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] },
          { model: Position, as: 'newPosition' }
        ],
        order: [['change_date', 'DESC']]
      });
      
      const totalPromotions = positionHistories.length;
      
      // 按类型统计晋升
      const promotionsByType: { [key: string]: number } = {};
      positionHistories.forEach(history => {
        const type = history.promotion_type || 'Other';
        promotionsByType[type] = (promotionsByType[type] || 0) + 1;
      });
      
      // 按部门统计晋升
      const promotionsByDepartment: { [key: string]: { department_id: string | number; department_name: string; count: number } } = {};
      positionHistories.forEach(history => {
        if (history.employee?.department) {
          const deptId = history.employee.department.id.toString();
          if (!promotionsByDepartment[deptId]) {
            promotionsByDepartment[deptId] = {
              department_id: history.employee.department.id,
              department_name: history.employee.department.name,
              count: 0
            };
          }
          promotionsByDepartment[deptId].count++;
        }
      });
      
      // 按职位统计晋升
      const promotionsByPosition: { [key: string]: { position_id: string | number; position_name: string; count: number } } = {};
      positionHistories.forEach(history => {
        if (history.newPosition) {
          const posId = history.newPosition.id.toString();
          if (!promotionsByPosition[posId]) {
            promotionsByPosition[posId] = {
              position_id: history.newPosition.id,
              position_name: history.newPosition.name,
              count: 0
            };
          }
          promotionsByPosition[posId].count++;
        }
      });
      
      // 计算平均薪资增长
      let totalSalaryIncrease = 0;
      let validSalaryChanges = 0;
      positionHistories.forEach(history => {
        if (history.old_salary !== null && history.old_salary !== undefined) {
          totalSalaryIncrease += history.new_salary - history.old_salary;
          validSalaryChanges++;
        }
      });
      const averageSalaryIncrease = validSalaryChanges > 0 ? totalSalaryIncrease / validSalaryChanges : 0;
      
      // 获取最近的5条晋升记录
      const recentPromotions = positionHistories.slice(0, 5);
      
      return {
        totalPromotions,
        promotionsByType,
        promotionsByDepartment: Object.values(promotionsByDepartment),
        promotionsByPosition: Object.values(promotionsByPosition),
        averageSalaryIncrease: Math.round(averageSalaryIncrease * 100) / 100,
        recentPromotions
      };
    } catch (error) {
      console.error('Error getting promotion stats:', error);
      throw error;
    }
  },
  
  // 获取员工特定类型的晋升历史
  async getEmployeePromotionHistory(employeeId: string, type?: string): Promise<PositionHistoryInstance[]> {
    try {
      // 验证员工是否存在
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      const where: any = { employee_id: employeeId };
      if (type) {
        where.promotion_type = type;
      }
      
      return await PositionHistory.findAll({
        where,
        include: [
          { model: Position, as: 'oldPosition' },
          { model: Position, as: 'newPosition' }
        ],
        order: [['change_date', 'DESC']]
      });
    } catch (error) {
      console.error(`Error getting promotion history for employee ${employeeId}:`, error);
      throw error;
    }
  }
};

module.exports = PositionService;