import { get, post, put, del } from './api'

// 员工相关类型定义
export interface Employee {
  id: number
  name: string
  employeeId: string
  departmentId: number
  positionId: number
  gender: 'male' | 'female'
  dateOfBirth: string
  hireDate: string
  email: string
  phone: string
  address?: string
  salary: number
  status: 'active' | 'inactive' | 'resigned'
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface EmployeeQueryParams {
  page?: number
  pageSize?: number
  departmentId?: number
  positionId?: number
  status?: 'active' | 'inactive' | 'resigned'
  keyword?: string
}

export interface EmployeeSearchParams {
  keyword: string
  fields?: ('name' | 'employeeId' | 'email' | 'phone')[]
}

export interface TransferData {
  departmentId: number
  positionId: number
  transferDate: string
  reason: string
}

export interface SalaryData {
  newSalary: number
  reason: string
  effectiveDate: string
}

export interface ResignationData {
  resignationDate: string
  reason: string
  finalWorkDate: string
}

export interface EmployeeStatistics {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  resignedEmployees: number
  departmentDistribution: Array<{ departmentId: number; departmentName: string; count: number }>
  genderDistribution: { male: number; female: number }
  averageSalary: number
}

// 员工相关API
const employeeApi = {
  // 获取员工列表
  getEmployees(params?: EmployeeQueryParams) {
    return get<Array<Employee>>('/employees', { params })
  },
  
  // 搜索员工
  searchEmployees(params: EmployeeSearchParams) {
    return get<Array<Employee>>('/employees/search', { params })
  },
  
  // 获取员工详情
  getEmployeeById(id: number | string) {
    return get<Employee>(`/employees/${id}`)
  },
  
  // 创建员工
  createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) {
    return post<Employee>('/employees', employeeData)
  },
  
  // 更新员工
  updateEmployee(id: number | string, employeeData: Partial<Employee>) {
    return put<Employee>(`/employees/${id}`, employeeData)
  },
  
  // 删除员工
  deleteEmployee(id: number | string) {
    return del<{ success: boolean }>(`/employees/${id}`)
  },
  
  // 获取员工项目
  getEmployeeProjects(id: number | string) {
    return get<Array<any>>(`/employees/${id}/projects`) // 暂时使用any，后续可以定义Project类型
  },
  
  // 获取员工培训
  getEmployeeTrainings(id: number | string) {
    return get<Array<any>>(`/employees/${id}/trainings`) // 暂时使用any，后续可以定义Training类型
  },
  
  // 员工调动
  transferEmployee(id: number | string, transferData: TransferData) {
    return put<{ success: boolean }>(`/employees/${id}/transfer`, transferData)
  },
  
  // 薪资调整
  adjustSalary(id: number | string, salaryData: SalaryData) {
    return put<{ success: boolean }>(`/employees/${id}/adjust-salary`, salaryData)
  },
  
  // 批量导入员工
  batchImportEmployees(employeesData: Array<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>) {
    return post<{ success: boolean; importedCount: number; failedCount: number }>('/employees/batch-import', { employees: employeesData })
  },
  
  // 获取员工统计
  getEmployeeStatistics(filters?: { startDate?: string; endDate?: string }) {
    return get<EmployeeStatistics>('/employees/statistics', { params: filters })
  },
  
  // 员工离职处理
  processResignation(id: number | string, resignationData: ResignationData) {
    return put<{ success: boolean }>(`/employees/${id}/resignation`, resignationData)
  }
}

export default employeeApi