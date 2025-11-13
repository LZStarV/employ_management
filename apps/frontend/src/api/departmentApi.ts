import { get, post, put, del } from './api'

// 部门相关类型定义
export interface Department {
  id: number
  name: string
  code: string
  parentId?: number
  managerId?: number
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface DepartmentQueryParams {
  page?: number
  pageSize?: number
  parentId?: number
}

export interface DepartmentStatistics {
  totalEmployees: number
  activeEmployees: number
  averageSalary: number
  managerName?: string
  departmentHierarchy: Array<{ id: number; name: string; level: number }>
}

export interface AllDepartmentsStatistics {
  departments: Array<{
    departmentId: number
    departmentName: string
    employeeCount: number
    averageSalary: number
    managerName?: string
  }>
  totalDepartments: number
  totalEmployees: number
}

export interface ManagerData {
  managerId: number
}

export interface BudgetData {
  budget: number
  year: number
  description?: string
}

// 部门相关API
const departmentApi = {
  // 获取部门列表
  getDepartments(params?: DepartmentQueryParams) {
    return get<Array<Department>>('/departments', { params })
  },
  
  // 获取部门详情
  getDepartmentById(id: number | string) {
    return get<Department>(`/departments/${id}`)
  },
  
  // 创建部门
  createDepartment(departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) {
    return post<Department>('/departments', departmentData)
  },
  
  // 更新部门
  updateDepartment(id: number | string, departmentData: Partial<Department>) {
    return put<Department>(`/departments/${id}`, departmentData)
  },
  
  // 删除部门
  deleteDepartment(id: number | string) {
    return del<{ success: boolean }>(`/departments/${id}`)
  },
  
  // 获取部门员工列表
  getDepartmentEmployees(id: number | string, params?: { page?: number; pageSize?: number }) {
    return get<Array<any>>(`/departments/${id}/employees`, { params }) // 暂时使用any，可以引用Employee类型
  },
  
  // 获取部门统计信息
  getDepartmentStatistics(id: number | string) {
    return get<DepartmentStatistics>(`/departments/${id}/statistics`)
  },
  
  // 获取所有部门统计
  getAllDepartmentsStatistics() {
    return get<AllDepartmentsStatistics>('/departments/statistics')
  },
  
  // 部门合并
  mergeDepartments(sourceId: number | string, targetId: number | string) {
    return put<{ success: boolean }>(`/departments/${sourceId}/merge`, { target_department_id: targetId })
  },
  
  // 获取部门经理列表
  getDepartmentManagers() {
    return get<Array<{ id: number; name: string }>>('/departments/managers')
  },
  
  // 更新部门经理
  updateDepartmentManager(id: number | string, managerData: ManagerData) {
    return put<{ success: boolean }>(`/departments/${id}/manager`, managerData)
  },
  
  // 获取部门预算信息
  getDepartmentBudget(id: number | string) {
    return get<BudgetData>(`/departments/${id}/budget`)
  },
  
  // 更新部门预算
  updateDepartmentBudget(id: number | string, budgetData: BudgetData) {
    return put<{ success: boolean }>(`/departments/${id}/budget`, budgetData)
  }
}

export default departmentApi