const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Position = require('../models/Position');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const EmployeeProject = require('../models/EmployeeProject');
const Project = require('../models/Project');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// 员工服务接口定义
interface EmployeeService {
  getAllEmployees: (options: PaginationOptions & QueryOptions) => Promise<EmployeeListResult>;
  getEmployeeById: (id: string | number) => Promise<EmployeeInstance | null>;
  createEmployee: (employeeData: EmployeeCreateData) => Promise<EmployeeInstance>;
  updateEmployee: (id: string | number, employeeData: EmployeeUpdateData) => Promise<EmployeeInstance | null>;
  deleteEmployee: (id: string | number) => Promise<boolean>;
  searchEmployees: (query: string, options: PaginationOptions) => Promise<EmployeeListResult>;
  getEmployeesByDepartment: (departmentId: string | number, options: PaginationOptions) => Promise<EmployeeListResult>;
  getEmployeesByPosition: (positionId: string | number, options: PaginationOptions) => Promise<EmployeeListResult>;
  getEmployeeAttendance: (employeeId: string | number, startDate: string, endDate: string) => Promise<Attendance[]>;
  getEmployeeLeaves: (employeeId: string | number, options: PaginationOptions) => Promise<Leave[]>;
  getEmployeeStats: () => Promise<EmployeeStats>;
  getEmployeeSummary: (employeeId: string | number) => Promise<EmployeeSummary | null>;
  getEmployeeProjects: (employeeId: string | number) => Promise<any[]>;
  transferEmployee: (employeeId: string | number, transferData: { department_id: string | number; position_id: string | number }) => Promise<EmployeeInstance | null>;
  adjustEmployeeSalary: (employeeId: string | number, salary: number) => Promise<EmployeeInstance | null>;
  terminateEmployee: (employeeId: string | number, terminationData: { reason: string; contract_end_date?: string }) => Promise<EmployeeInstance | null>;
}

// 分页选项接口
interface PaginationOptions {
  page: number;
  pageSize: number;
}

// 查询选项接口
interface QueryOptions {
  queryOptions?: Record<string, any>;
}

// 员工列表结果接口
interface EmployeeListResult {
  employees: EmployeeInstance[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 员工创建数据接口
interface EmployeeCreateData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: string | number;
  position_id: string | number;
  hire_date: string;
  salary: number;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  status?: string;
  manager_id?: string | number;
  employment_type?: string;
  contract_end_date?: string;
}

// 员工更新数据接口
interface EmployeeUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department_id?: string | number;
  position_id?: string | number;
  hire_date?: string;
  salary?: number;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  status?: string;
  manager_id?: string | number;
  employment_type?: string;
  contract_end_date?: string;
}

// 员工统计接口
interface EmployeeStats {
  total: number;
  byDepartment: { department_id: string | number; department_name: string; count: number }[];
  byPosition: { position_id: string | number; position_name: string; count: number }[];
  active: number;
  inactive: number;
  averageSalary: number;
}

// 员工摘要接口
interface EmployeeSummary {
  employee: EmployeeInstance;
  department: any;
  position: any;
  manager?: EmployeeInstance;
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    onTimeRate: number;
  };
  leaveStats: {
    totalLeaves: number;
    approvedLeaves: number;
    pendingLeaves: number;
    leaveBalance: number;
  };
  experience: number;
}

// 员工实例类型
interface EmployeeInstance {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: string | number;
  position_id: string | number;
  hire_date: string | Date;
  salary: number;
  gender?: string;
  date_of_birth?: string | Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  status: string;
  manager_id?: string | number;
  employment_type?: string;
  contract_end_date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // 实例方法
  getFullInfo?: () => Promise<any>;
  getAttendanceStatistics?: (startDate: string | Date, endDate: string | Date) => Promise<any>;
  getFormattedName?: () => string;
  getYearsOfService?: () => number;
}

// 员工服务实现
const EmployeeService: EmployeeService = {
  // 获取所有员工
  async getAllEmployees(options: PaginationOptions & QueryOptions): Promise<EmployeeListResult> {
    const { page, pageSize, queryOptions = {} } = options;
    const offset = (page - 1) * pageSize;
    
    try {
      // 构建查询条件
      const where = {};
      if (queryOptions.status) {
        where['status'] = queryOptions.status;
      }
      if (queryOptions.department_id) {
        where['department_id'] = queryOptions.department_id;
      }
      if (queryOptions.position_id) {
        where['position_id'] = queryOptions.position_id;
      }
      if (queryOptions.gender) {
        where['gender'] = queryOptions.gender;
      }
      
      const { count, rows } = await Employee.findAndCountAll({
        where,
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' },
          { model: Employee, as: 'manager' }
        ],
        offset,
        limit: pageSize,
        order: [['createdAt', 'DESC']]
      });
      
      return {
        employees: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  },
  
  // 根据ID获取员工
  async getEmployeeById(id: string | number): Promise<EmployeeInstance | null> {
    try {
      return await Employee.findByPk(id, {
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' },
          { model: Employee, as: 'manager' }
        ]
      });
    } catch (error) {
      console.error(`Error getting employee with id ${id}:`, error);
      throw error;
    }
  },
  
  // 创建新员工
  async createEmployee(employeeData: EmployeeCreateData): Promise<EmployeeInstance> {
    try {
      // 检查邮箱是否已存在
      const existingEmail = await Employee.findOne({ where: { email: employeeData.email } });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
      
      // 检查手机号是否已存在
      const existingPhone = await Employee.findOne({ where: { phone: employeeData.phone } });
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }
      
      return await Employee.create(employeeData);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },
  
  // 更新员工
  async updateEmployee(id: string | number, employeeData: EmployeeUpdateData): Promise<EmployeeInstance | null> {
    try {
      const employee = await Employee.findByPk(id);
      
      if (!employee) {
        return null;
      }
      
      // 如果更新邮箱，检查新邮箱是否已被其他员工使用
      if (employeeData.email && employeeData.email !== employee.email) {
        const existingEmail = await Employee.findOne({ 
          where: { 
            email: employeeData.email,
            id: { [Op.ne]: id } 
          } 
        });
        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }
      
      // 如果更新手机号，检查新手机号是否已被其他员工使用
      if (employeeData.phone && employeeData.phone !== employee.phone) {
        const existingPhone = await Employee.findOne({ 
          where: { 
            phone: employeeData.phone,
            id: { [Op.ne]: id } 
          } 
        });
        if (existingPhone) {
          throw new Error('Phone number already exists');
        }
      }
      
      await employee.update(employeeData);
      
      // 返回更新后的员工对象，包括关联数据
      return await this.getEmployeeById(id);
    } catch (error) {
      console.error(`Error updating employee with id ${id}:`, error);
      throw error;
    }
  },
  
  // 删除员工
  async deleteEmployee(id: string | number): Promise<boolean> {
    try {
      const employee = await Employee.findByPk(id);
      
      if (!employee) {
        return false;
      }
      
      // 软删除，实际可能是更新状态为inactive
      await employee.update({ status: 'Inactive' });
      return true;
    } catch (error) {
      console.error(`Error deleting employee with id ${id}:`, error);
      throw error;
    }
  },
  
  // 搜索员工
  async searchEmployees(query: string, options: PaginationOptions): Promise<EmployeeListResult> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;
    
    try {
      const { count, rows } = await Employee.findAndCountAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.like]: `%${query}%` } },
            { last_name: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { phone: { [Op.like]: `%${query}%` } }
          ]
        },
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' }
        ],
        offset,
        limit: pageSize,
        order: [['last_name', 'ASC']]
      });
      
      return {
        employees: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  },
  
  // 根据部门获取员工
  async getEmployeesByDepartment(departmentId: string | number, options: PaginationOptions): Promise<EmployeeListResult> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;
    
    try {
      const { count, rows } = await Employee.findAndCountAll({
        where: { department_id: departmentId },
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' }
        ],
        offset,
        limit: pageSize,
        order: [['last_name', 'ASC']]
      });
      
      return {
        employees: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      console.error(`Error getting employees for department ${departmentId}:`, error);
      throw error;
    }
  },
  
  // 根据职位获取员工
  async getEmployeesByPosition(positionId: string | number, options: PaginationOptions): Promise<EmployeeListResult> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;
    
    try {
      const { count, rows } = await Employee.findAndCountAll({
        where: { position_id: positionId },
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' }
        ],
        offset,
        limit: pageSize,
        order: [['last_name', 'ASC']]
      });
      
      return {
        employees: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      console.error(`Error getting employees for position ${positionId}:`, error);
      throw error;
    }
  },
  
  // 获取员工考勤记录
  async getEmployeeAttendance(employeeId: string | number, startDate: string, endDate: string): Promise<Attendance[]> {
    try {
      return await Attendance.findAll({
        where: {
          employee_id: employeeId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['date', 'DESC']]
      });
    } catch (error) {
      console.error(`Error getting attendance for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 获取员工请假记录
  async getEmployeeLeaves(employeeId: string | number, options: PaginationOptions): Promise<Leave[]> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;
    
    try {
      return (await Leave.findAndCountAll({
        where: { employee_id: employeeId },
        offset,
        limit: pageSize,
        order: [['start_date', 'DESC']]
      })).rows;
    } catch (error) {
      console.error(`Error getting leaves for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 获取员工统计信息
  async getEmployeeStats(): Promise<EmployeeStats> {
    try {
      // 总员工数
      const total = await Employee.count();
      
      // 活跃员工数
      const active = await Employee.count({ where: { status: 'Active' } });
      
      // 非活跃员工数
      const inactive = total - active;
      
      // 按部门统计
      const byDepartment = await Employee.findAll({
        attributes: [
          'department_id',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['name']
          }
        ],
        group: ['department_id', 'department.id'],
        raw: true
      });
      
      // 按职位统计
      const byPosition = await Employee.findAll({
        attributes: [
          'position_id',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: Position,
            as: 'position',
            attributes: ['name']
          }
        ],
        group: ['position_id', 'position.id'],
        raw: true
      });
      
      // 平均薪资
      const avgSalaryResult = await Employee.findOne({
        attributes: [[Sequelize.fn('AVG', Sequelize.col('salary')), 'averageSalary']],
        raw: true
      });
      
      const averageSalary = avgSalaryResult ? parseFloat(avgSalaryResult.averageSalary || '0') : 0;
      
      return {
        total,
        byDepartment: byDepartment.map(d => ({
          department_id: d.department_id,
          department_name: d['department.name'],
          count: parseInt(d.count as any)
        })),
        byPosition: byPosition.map(p => ({
          position_id: p.position_id,
          position_name: p['position.name'],
          count: parseInt(p.count as any)
        })),
        active,
        inactive,
        averageSalary
      };
    } catch (error) {
      console.error('Error getting employee stats:', error);
      throw error;
    }
  },
  
  // 获取员工摘要信息
  async getEmployeeSummary(employeeId: string | number): Promise<EmployeeSummary | null> {
    try {
      const employee = await this.getEmployeeById(employeeId);
      
      if (!employee) {
        return null;
      }
      
      // 获取当前月份的起止日期
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // 获取本月考勤统计
      const attendances = await this.getEmployeeAttendance(employeeId, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]);
      
      const presentDays = attendances.filter(a => a.status === 'Present').length;
      const absentDays = attendances.filter(a => a.status === 'Absent').length;
      const lateDays = attendances.filter(a => a.status === 'Late').length;
      const totalDays = presentDays + absentDays + lateDays;
      const onTimeRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      // 获取请假统计
      const leaves = await this.getEmployeeLeaves(employeeId, { page: 1, pageSize: 100 });
      const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
      const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      
      // 计算工龄
      const hireDate = new Date(employee.hire_date as Date);
      const experience = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      return {
        employee,
        department: employee.department || null,
        position: employee.position || null,
        manager: employee.manager || null,
        attendanceStats: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          onTimeRate: Math.round(onTimeRate * 100) / 100
        },
        leaveStats: {
          totalLeaves: leaves.length,
          approvedLeaves,
          pendingLeaves,
          leaveBalance: 15 - approvedLeaves // 假设年假总天数为15天
        },
        experience: Math.round(experience * 100) / 100
      };
    } catch (error) {
      console.error(`Error getting summary for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 获取员工参与的项目
  async getEmployeeProjects(employeeId: string | number): Promise<any[]> {
    try {
      const employeeProjects = await EmployeeProject.findAll({
        where: { employee_id: employeeId },
        include: [
          {
            model: Project,
            as: 'project'
          }
        ],
        order: [['start_date', 'DESC']]
      });
      
      return employeeProjects.map(ep => ({
        ...ep.project.toJSON(),
        EmployeeProject: {
          role: ep.role,
          start_date: ep.start_date,
          end_date: ep.end_date,
          contribution_hours: ep.contribution_hours
        }
      }));
    } catch (error) {
      console.error(`Error getting projects for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 员工调动
  async transferEmployee(employeeId: string | number, transferData: { department_id: string | number; position_id: string | number }): Promise<EmployeeInstance | null> {
    const transaction = await sequelize.transaction();
    
    try {
      const employee = await Employee.findByPk(employeeId, { transaction });
      
      if (!employee) {
        await transaction.rollback();
        return null;
      }
      
      // 验证部门和职位是否存在
      const department = await Department.findByPk(transferData.department_id, { transaction });
      const position = await Position.findByPk(transferData.position_id, { transaction });
      
      if (!department || !position) {
        await transaction.rollback();
        throw new Error('部门或职位不存在');
      }
      
      // 更新员工信息
      await employee.update({
        department_id: transferData.department_id,
        position_id: transferData.position_id
      }, { transaction });
      
      await transaction.commit();
      return await this.getEmployeeById(employeeId);
    } catch (error) {
      await transaction.rollback();
      console.error(`Error transferring employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 薪资调整
  async adjustEmployeeSalary(employeeId: string | number, salary: number): Promise<EmployeeInstance | null> {
    try {
      const employee = await Employee.findByPk(employeeId);
      
      if (!employee) {
        return null;
      }
      
      // 获取职位信息，验证薪资是否在合理范围内
      const position = await Position.findByPk(employee.position_id);
      if (position && (salary < position.min_salary || salary > position.max_salary)) {
        throw new Error(`薪资必须在职位薪资范围(${position.min_salary}-${position.max_salary})内`);
      }
      
      // 更新薪资
      await employee.update({ salary });
      return await this.getEmployeeById(employeeId);
    } catch (error) {
      console.error(`Error adjusting salary for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 员工离职处理
  async terminateEmployee(employeeId: string | number, terminationData: { reason: string; contract_end_date?: string }): Promise<EmployeeInstance | null> {
    const transaction = await sequelize.transaction();
    
    try {
      const employee = await Employee.findByPk(employeeId, { transaction });
      
      if (!employee) {
        await transaction.rollback();
        return null;
      }
      
      // 更新员工状态为离职
      const updateData: any = {
        status: 'Inactive',
        termination_reason: terminationData.reason
      };
      
      if (terminationData.contract_end_date) {
        updateData.contract_end_date = terminationData.contract_end_date;
      } else {
        // 如果没有提供离职日期，使用当前日期
        updateData.contract_end_date = new Date();
      }
      
      await employee.update(updateData, { transaction });
      
      // 从所有项目中移除该员工
      await EmployeeProject.destroy({
        where: { employee_id: employeeId },
        transaction
      });
      
      await transaction.commit();
      return await this.getEmployeeById(employeeId);
    } catch (error) {
      await transaction.rollback();
      console.error(`Error terminating employee ${employeeId}:`, error);
      throw error;
    }
  }
};

module.exports = EmployeeService;