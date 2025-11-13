// 统一的类型定义文件

// 分页参数接口
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 通用响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// 日期范围接口
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

// 员工相关接口
export interface Employee {
  id: number;
  name: string;
  employeeId: string;
  departmentId: number;
  positionId: number;
  email: string;
  phone: string;
  hireDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联字段
  Department?: Department;
  Position?: Position;
}

export interface EmployeeQuery extends PaginationParams {
  name?: string;
  employeeId?: string;
  departmentId?: number;
  positionId?: number;
  status?: string;
}

// 部门相关接口
export interface Department {
  id: number;
  name: string;
  managerId?: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联字段
  Manager?: Employee;
  Employees?: Employee[];
  Positions?: Position[];
}

export interface DepartmentQuery extends PaginationParams {
  name?: string;
  managerId?: number;
}

// 职位相关接口
export interface Position {
  id: number;
  name: string;
  departmentId: number;
  description: string;
  level: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联字段
  Department?: Department;
  Employees?: Employee[];
}

export interface PositionQuery extends PaginationParams {
  name?: string;
  departmentId?: number;
  level?: string;
}

// 考勤相关接口
export interface Attendance {
  id: number;
  employeeId: number;
  date: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: string; // present, absent, late, early_leave, half_day
  workHours: number;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联字段
  Employee?: Employee;
}

export interface AttendanceQuery extends PaginationParams, DateRange {
  employeeId?: number;
  departmentId?: number;
  status?: string;
}

// 考勤统计接口
export interface AttendanceStatistics {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  halfDayDays: number;
  attendanceRate: number;
  departmentStatistics?: Array<{
    departmentId: number;
    departmentName: string;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
  }>;
  employeeStatistics?: Array<{
    employeeId: number;
    employeeName: string;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
  }>;
}

// 项目相关接口
export interface Project {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string; // active, in_progress, completed, on_hold
  departmentId?: number;
  managerId?: number;
  createdAt: Date;
  updatedAt: Date;
  // 关联字段
  Department?: Department;
  Manager?: Employee;
  Employees?: Employee[];
}

export interface ProjectQuery extends PaginationParams {
  name?: string;
  status?: string;
  departmentId?: number;
  managerId?: number;
}

// 用户相关接口
export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: string; // admin, manager, employee
  employeeId?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联字段
  Employee?: Employee;
}

// 认证接口
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    employeeId?: number;
  };
}

// 搜索参数接口
export interface SearchParams extends PaginationParams {
  keyword: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 错误处理接口
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

// 上下文接口（用于Koa）
export interface Context {
  request: {
    body?: any;
    query?: any;
    params?: any;
    headers?: Record<string, string>;
  };
  response: {
    body?: any;
    status?: number;
    headers?: Record<string, string>;
  };
  status: number;
  body: any;
  state: Record<string, any>;
  cookies: any;
  throw: (status: number, message?: string) => never;
}

// 中间件接口
export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;