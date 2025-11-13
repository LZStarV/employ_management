import { Department, Employee, Position } from '../models';
import { Op } from 'sequelize';
import { Department as DepartmentType } from '../types';

// 部门服务接口定义
interface DepartmentService {
  getAllDepartments: (options?: PaginationOptions) => Promise<DepartmentListResult>;
  getDepartmentById: (id: string | number) => Promise<DepartmentInstance | null>;
  createDepartment: (departmentData: DepartmentCreateData) => Promise<DepartmentInstance>;
  updateDepartment: (id: string | number, departmentData: DepartmentUpdateData) => Promise<DepartmentInstance | null>;
  deleteDepartment: (id: string | number) => Promise<boolean>;
  searchDepartments: (query: string, options?: PaginationOptions) => Promise<DepartmentListResult>;
  getDepartmentWithDetails: (id: string | number) => Promise<DepartmentWithDetails | null>;
  getDepartmentsWithEmployeeCount: () => Promise<DepartmentWithCount[]>;
  getDepartmentHierarchy: () => Promise<DepartmentHierarchy[]>;
  getDepartmentStats: () => Promise<DepartmentStats>;
  getDepartmentSummary: (departmentId: string | number) => Promise<DepartmentSummary | null>;
  getDepartmentHeadcountTrend: (departmentId: string | number, months: number) => Promise<HeadcountTrend[]>;
}

// 分页选项接口
interface PaginationOptions {
  page: number;
  pageSize: number;
}

// 部门列表结果接口
interface DepartmentListResult {
  departments: DepartmentInstance[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// 部门创建数据接口
interface DepartmentCreateData {
  name: string;
  description: string;
  manager_id?: string | number;
  location?: string;
  parent_id?: string | number;
}

// 部门更新数据接口
interface DepartmentUpdateData {
  name?: string;
  description?: string;
  manager_id?: string | number | null;
  location?: string;
  parent_id?: string | number | null;
}

// 部门实例类型
interface DepartmentInstance {
  id: string | number;
  name: string;
  description: string;
  manager_id?: string | number;
  location?: string;
  parent_id?: string | number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // 实例方法
  getHeadcount?: () => Promise<number>;
  getDepartmentSummary?: () => Promise<any>;
}

// 带有详情的部门接口
interface DepartmentWithDetails extends DepartmentInstance {
  manager?: Employee;
  employees?: Employee[];
  positions?: Position[];
  subDepartments?: DepartmentWithDetails[];
  headcount: number;
}

// 带有员工数的部门接口
interface DepartmentWithCount extends DepartmentInstance {
  employeeCount: number;
  positionCount: number;
  managerName?: string;
}

// 部门层级接口
interface DepartmentHierarchy extends DepartmentInstance {
  children: DepartmentHierarchy[];
  headcount: number;
  managerName?: string;
}

// 部门统计接口
interface DepartmentStats {
  totalDepartments: number;
  departmentsWithManagers: number;
  departmentsWithoutManagers: number;
  averageDepartmentSize: number;
  largestDepartment: { name: string; id: string | number; headcount: number } | null;
  smallestDepartment: { name: string; id: string | number; headcount: number } | null;
  departmentDistribution: { departmentId: string | number; departmentName: string; percentage: number }[];
}

// 部门摘要接口
interface DepartmentSummary extends DepartmentInstance {
  manager?: Employee;
  headcount: number;
  activeEmployees: number;
  positionCount: number;
  averageSalary: number;
  averageExperience: number;
  subDepartmentCount: number;
  topPerformingEmployees: Employee[];
}

// 员工接口
interface Employee {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  position_id: string | number;
  salary: number;
  hire_date: string | Date;
  // 其他属性...
}

// 职位接口
interface Position {
  id: string | number;
  name: string;
  department_id: string | number;
  // 其他属性...
}

// 员工数趋势接口
interface HeadcountTrend {
  month: string;
  headcount: number;
  active: number;
  newHires: number;
  departures: number;
}

// 部门服务实现
const DepartmentService: DepartmentService = {
  // 获取所有部门
  async getAllDepartments(options?: PaginationOptions): Promise<DepartmentListResult> {
    try {
      if (options) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Department.findAndCountAll({
          include: [{ model: Employee, as: 'manager' }],
          offset,
          limit: pageSize,
          order: [['name', 'ASC']]
        });
        
        return {
          departments: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const departments = await Department.findAll({
          include: [{ model: Employee, as: 'manager' }],
          order: [['name', 'ASC']]
        });
        
        return {
          departments,
          total: departments.length
        };
      }
    } catch (error) {
      console.error('Error getting all departments:', error);
      throw error;
    }
  },
  
  // 根据ID获取部门
  async getDepartmentById(id: string | number): Promise<DepartmentInstance | null> {
    try {
      return await Department.findByPk(id, {
        include: [{ model: Employee, as: 'manager' }]
      });
    } catch (error) {
      console.error(`Error getting department with id ${id}:`, error);
      throw error;
    }
  },
  
  // 创建新部门
  async createDepartment(departmentData: DepartmentCreateData): Promise<DepartmentInstance> {
    try {
      // 检查部门名称是否已存在
      const existingDepartment = await Department.findOne({ where: { name: departmentData.name } });
      if (existingDepartment) {
        throw new Error('Department name already exists');
      }
      
      // 如果指定了经理，检查经理是否存在且活跃
      if (departmentData.manager_id) {
        const manager = await Employee.findByPk(departmentData.manager_id);
        if (!manager || manager.status !== 'Active') {
          throw new Error('Invalid manager specified');
        }
      }
      
      // 如果指定了父部门，检查父部门是否存在
      if (departmentData.parent_id) {
        const parentDepartment = await Department.findByPk(departmentData.parent_id);
        if (!parentDepartment) {
          throw new Error('Invalid parent department specified');
        }
      }
      
      return await Department.create(departmentData);
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },
  
  // 更新部门
  async updateDepartment(id: string | number, departmentData: DepartmentUpdateData): Promise<DepartmentInstance | null> {
    try {
      const department = await Department.findByPk(id);
      
      if (!department) {
        return null;
      }
      
      // 如果更新部门名称，检查新名称是否已被其他部门使用
      if (departmentData.name && departmentData.name !== department.name) {
        const existingDepartment = await Department.findOne({
          where: {
            name: departmentData.name,
            id: { [Op.ne]: id }
          }
        });
        if (existingDepartment) {
          throw new Error('Department name already exists');
        }
      }
      
      // 如果更新经理，检查新经理是否存在且活跃
      if (departmentData.manager_id !== undefined) {
        if (departmentData.manager_id !== null) {
          const manager = await Employee.findByPk(departmentData.manager_id);
          if (!manager || manager.status !== 'Active') {
            throw new Error('Invalid manager specified');
          }
        }
      }
      
      // 如果更新父部门，检查新父部门是否存在
      if (departmentData.parent_id !== undefined) {
        if (departmentData.parent_id !== null) {
          const parentDepartment = await Department.findByPk(departmentData.parent_id);
          if (!parentDepartment) {
            throw new Error('Invalid parent department specified');
          }
          
          // 避免循环引用
          const isDescendant = await this._checkCircularReference(id, departmentData.parent_id);
          if (isDescendant) {
            throw new Error('Cannot set parent department to a descendant');
          }
        }
      }
      
      await department.update(departmentData);
      
      // 返回更新后的部门对象，包括关联数据
      return await this.getDepartmentById(id);
    } catch (error) {
      console.error(`Error updating department with id ${id}:`, error);
      throw error;
    }
  },
  
  // 删除部门
  async deleteDepartment(id: string | number): Promise<boolean> {
    try {
      const department = await Department.findByPk(id);
      
      if (!department) {
        return false;
      }
      
      // 检查是否有子部门
      const hasSubDepartments = await Department.count({ where: { parent_id: id } });
      if (hasSubDepartments > 0) {
        throw new Error('Cannot delete department with sub-departments');
      }
      
      // 检查是否有员工
      const hasEmployees = await Employee.count({ where: { department_id: id } });
      if (hasEmployees > 0) {
        throw new Error('Cannot delete department with employees');
      }
      
      // 检查是否有职位
      const hasPositions = await Position.count({ where: { department_id: id } });
      if (hasPositions > 0) {
        throw new Error('Cannot delete department with positions');
      }
      
      await department.destroy();
      return true;
    } catch (error) {
      console.error(`Error deleting department with id ${id}:`, error);
      throw error;
    }
  },
  
  // 搜索部门
  async searchDepartments(query: string, options?: PaginationOptions): Promise<DepartmentListResult> {
    try {
      if (options) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Department.findAndCountAll({
          where: {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { description: { [Op.like]: `%${query}%` } },
              { location: { [Op.like]: `%${query}%` } }
            ]
          },
          include: [{ model: Employee, as: 'manager' }],
          offset,
          limit: pageSize,
          order: [['name', 'ASC']]
        });
        
        return {
          departments: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const departments = await Department.findAll({
          where: {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { description: { [Op.like]: `%${query}%` } },
              { location: { [Op.like]: `%${query}%` } }
            ]
          },
          include: [{ model: Employee, as: 'manager' }],
          order: [['name', 'ASC']]
        });
        
        return {
          departments,
          total: departments.length
        };
      }
    } catch (error) {
      console.error('Error searching departments:', error);
      throw error;
    }
  },
  
  // 获取带有详情的部门
  async getDepartmentWithDetails(id: string | number): Promise<DepartmentWithDetails | null> {
    try {
      const department = await Department.findByPk(id, {
        include: [
          { model: Employee, as: 'manager' },
          { model: Employee, as: 'employees' },
          { model: Position, as: 'positions' },
          { model: Department, as: 'subDepartments' }
        ]
      });
      
      if (!department) {
        return null;
      }
      
      // 递归获取子部门的详情
      const departmentWithDetails: DepartmentWithDetails = {
        ...department.toJSON(),
        headcount: department.employees ? department.employees.length : 0
      };
      
      if (departmentWithDetails.subDepartments) {
        departmentWithDetails.subDepartments = await Promise.all(
          departmentWithDetails.subDepartments.map(async (subDept: DepartmentInstance) => {
            const details = await this.getDepartmentWithDetails(subDept.id);
            return details || subDept as DepartmentWithDetails;
          })
        );
      }
      
      return departmentWithDetails;
    } catch (error) {
      console.error(`Error getting department details for id ${id}:`, error);
      throw error;
    }
  },
  
  // 获取带有员工数的部门列表
  async getDepartmentsWithEmployeeCount(): Promise<DepartmentWithCount[]> {
    try {
      const departments = await Department.findAll({
        include: [
          { model: Employee, as: 'manager' }
        ],
        order: [['name', 'ASC']]
      });
      
      const departmentsWithCount: DepartmentWithCount[] = await Promise.all(
        departments.map(async (dept: DepartmentInstance) => {
          const employeeCount = await Employee.count({ where: { department_id: dept.id } });
          const positionCount = await Position.count({ where: { department_id: dept.id } });
          
          return {
            ...dept.toJSON(),
            employeeCount,
            positionCount,
            managerName: dept.manager ? `${dept.manager.first_name} ${dept.manager.last_name}` : undefined
          };
        })
      );
      
      return departmentsWithCount;
    } catch (error) {
      console.error('Error getting departments with employee count:', error);
      throw error;
    }
  },
  
  // 获取部门层级结构
  async getDepartmentHierarchy(): Promise<DepartmentHierarchy[]> {
    try {
      // 首先获取所有部门
      const allDepartments = await Department.findAll({
        include: [{ model: Employee, as: 'manager' }]
      });
      
      // 构建层级结构
      const buildHierarchy = (parentId: string | number | null = null): DepartmentHierarchy[] => {
        return allDepartments
          .filter((dept: DepartmentInstance) => dept.parent_id === parentId)
          .map((dept: DepartmentInstance) => {
            const children = buildHierarchy(dept.id);
            // 计算部门及其子部门的员工总数
            const headcount = children.reduce((total, child) => total + child.headcount, 0);
            
            return {
              ...dept.toJSON(),
              headcount,
              managerName: dept.manager ? `${dept.manager.first_name} ${dept.manager.last_name}` : undefined,
              children
            };
          });
      };
      
      return buildHierarchy();
    } catch (error) {
      console.error('Error getting department hierarchy:', error);
      throw error;
    }
  },
  
  // 获取部门统计信息
  async getDepartmentStats(): Promise<DepartmentStats> {
    try {
      const departments = await this.getDepartmentsWithEmployeeCount();
      
      const totalDepartments = departments.length;
      const departmentsWithManagers = departments.filter(d => d.manager_id !== null && d.manager_id !== undefined).length;
      const departmentsWithoutManagers = totalDepartments - departmentsWithManagers;
      
      // 计算平均部门大小
      const totalEmployees = departments.reduce((sum, dept) => sum + dept.employeeCount, 0);
      const averageDepartmentSize = totalDepartments > 0 ? totalEmployees / totalDepartments : 0;
      
      // 找出最大和最小的部门
      let largestDepartment = null;
      let smallestDepartment = null;
      
      departments.forEach(dept => {
        if (largestDepartment === null || dept.employeeCount > largestDepartment.headcount) {
          largestDepartment = { name: dept.name, id: dept.id, headcount: dept.employeeCount };
        }
        
        if (smallestDepartment === null || dept.employeeCount < smallestDepartment.headcount) {
          smallestDepartment = { name: dept.name, id: dept.id, headcount: dept.employeeCount };
        }
      });
      
      // 计算部门分布百分比
      const departmentDistribution = departments.map(dept => ({
        departmentId: dept.id,
        departmentName: dept.name,
        percentage: totalEmployees > 0 ? (dept.employeeCount / totalEmployees) * 100 : 0
      })).sort((a, b) => b.percentage - a.percentage);
      
      return {
        totalDepartments,
        departmentsWithManagers,
        departmentsWithoutManagers,
        averageDepartmentSize: Math.round(averageDepartmentSize * 100) / 100,
        largestDepartment,
        smallestDepartment,
        departmentDistribution
      };
    } catch (error) {
      console.error('Error getting department stats:', error);
      throw error;
    }
  },
  
  // 获取部门摘要信息
  async getDepartmentSummary(departmentId: string | number): Promise<DepartmentSummary | null> {
    try {
      const department = await this.getDepartmentWithDetails(departmentId);
      
      if (!department) {
        return null;
      }
      
      // 获取员工信息
      const employees = await Employee.findAll({ 
        where: { department_id: departmentId },
        order: [['hire_date', 'ASC']]
      });
      
      // 计算活跃员工数
      const activeEmployees = employees.filter(e => e.status === 'Active').length;
      
      // 计算平均薪资
      const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      const averageSalary = employees.length > 0 ? totalSalary / employees.length : 0;
      
      // 计算平均工作经验
      const now = new Date();
      const totalExperience = employees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hire_date as Date);
        return sum + ((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      }, 0);
      const averageExperience = employees.length > 0 ? totalExperience / employees.length : 0;
      
      // 获取子部门数量
      const subDepartmentCount = await Department.count({ where: { parent_id: departmentId } });
      
      // 获取表现最好的员工（这里简化为薪资最高的3名员工）
      const topPerformingEmployees = [...employees]
        .sort((a, b) => (b.salary || 0) - (a.salary || 0))
        .slice(0, 3);
      
      return {
        ...department,
        headcount: employees.length,
        activeEmployees,
        positionCount: department.positions ? department.positions.length : 0,
        averageSalary: Math.round(averageSalary * 100) / 100,
        averageExperience: Math.round(averageExperience * 100) / 100,
        subDepartmentCount,
        topPerformingEmployees
      };
    } catch (error) {
      console.error(`Error getting department summary for id ${departmentId}:`, error);
      throw error;
    }
  },
  
  // 获取部门员工数趋势
  async getDepartmentHeadcountTrend(departmentId: string | number, months: number): Promise<HeadcountTrend[]> {
    try {
      const now = new Date();
      const trends: HeadcountTrend[] = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        // 获取该月第一天和最后一天
        const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        // 获取该月员工总数
        const headcount = await Employee.count({
          where: {
            department_id: departmentId,
            hire_date: { [Op.lte]: lastDay }
          }
        });
        
        // 获取活跃员工数
        const active = await Employee.count({
          where: {
            department_id: departmentId,
            hire_date: { [Op.lte]: lastDay },
            status: 'Active'
          }
        });
        
        // 获取该月新入职员工数
        const newHires = await Employee.count({
          where: {
            department_id: departmentId,
            hire_date: {
              [Op.between]: [firstDay, lastDay]
            }
          }
        });
        
        // 获取该月离职员工数（简化为状态变为非活跃的员工）
        // 注意：这需要额外的逻辑或表结构来跟踪员工状态变更历史
        // 这里仅作为示例，实际实现可能需要调整
        const departures = 0; // 占位符
        
        trends.push({
          month: monthStr,
          headcount,
          active,
          newHires,
          departures
        });
      }
      
      return trends;
    } catch (error) {
      console.error(`Error getting headcount trend for department ${departmentId}:`, error);
      throw error;
    }
  },
  
  // 辅助方法：检查循环引用
  async _checkCircularReference(departmentId: string | number, parentId: string | number): Promise<boolean> {
    if (departmentId === parentId) {
      return true;
    }
    
    let currentParent = parentId;
    while (currentParent) {
      const parentDept = await Department.findByPk(currentParent);
      if (!parentDept) break;
      
      if (parentDept.id === departmentId) {
        return true;
      }
      
      currentParent = parentDept.parent_id;
    }
    
    return false;
  }
};

module.exports = DepartmentService;