// 员工相关类型定义
export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date: string;
  department_id?: number;
  position_id?: number;
  manager_id?: number;
  address?: string;
  birth_date?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'resigned';
  created_at: string;
  updated_at: string;
}

// 部门相关类型定义
export interface Department {
  department_id: number;
  department_name: string;
  manager_id?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

// 职位相关类型定义
export interface Position {
  position_id: number;
  position_name: string;
  level?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 薪资相关类型定义
export interface Salary {
  salary_id: number;
  employee_id: number;
  basic_salary: number;
  bonus: number;
  allowances: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

// 项目相关类型定义
export interface Project {
  project_id: number;
  project_name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget?: number;
  created_at: string;
  updated_at: string;
}

// 考勤相关类型定义
export interface Attendance {
  attendance_id: number;
  employee_id: number;
  project_id?: number;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  work_hours?: number;
  overtime_hours?: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'sick_leave' | 'annual_leave';
  created_at: string;
  updated_at: string;
}

// 培训相关类型定义
export interface Training {
  training_id: number;
  training_name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  instructor?: string;
  max_participants?: number;
  created_at: string;
  updated_at: string;
}

// 员工项目关联类型定义
export interface EmployeeProject {
  employee_project_id: number;
  employee_id: number;
  project_id: number;
  role?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// 员工培训关联类型定义
export interface EmployeeTraining {
  employee_training_id: number;
  employee_id: number;
  training_id: number;
  registration_date: string;
  completion_date?: string;
  status: 'registered' | 'attended' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 分页查询参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
}

// 员工查询参数
export interface EmployeeQueryParams extends PaginationParams {
  department_id?: number;
  position_id?: number;
  status?: string;
}

// 考勤查询参数
export interface AttendanceQueryParams extends PaginationParams {
  employeeId?: number;
  departmentId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// 统计数据类型
export interface StatisticsData {
  total_employees: number;
  active_employees: number;
  attendance_rate: number;
  average_salary: number;
  department_stats: Array<{
    department_id: number;
    department_name: string;
    employee_count: number;
    attendance_rate: number;
    average_salary: number;
  }>;
}

// 认证相关类型
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    employee_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

// 通用工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;