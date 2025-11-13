// 全局类型定义文件

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 用户信息类型
export interface UserInfo {
  id: number
  username: string
  name: string
  avatar?: string
  role: 'admin' | 'manager' | 'employee'
  permissions: string[]
}

// 分页参数类型
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 基础搜索参数类型
export interface SearchParams extends PaginationParams {
  keyword?: string
  [key: string]: any
}

// 排序参数类型
export interface SortParams {
  orderBy?: string
  sortBy?: 'asc' | 'desc'
}

// 日期范围类型
export interface DateRange {
  startDate?: string
  endDate?: string
}

// 基础实体类型
export interface BaseEntity {
  id: number
  createdAt?: string
  updatedAt?: string
}

// 选择器选项类型
export interface SelectOption {
  label: string
  value: number | string
  disabled?: boolean
  children?: SelectOption[]
}

// 文件上传相关类型
export interface UploadFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error' | 'removed'
  response?: any
  url?: string
}

// 错误处理相关类型
export interface ErrorInfo {
  code?: string
  message: string
  field?: string
}

// 操作结果类型
export interface OperationResult {
  success: boolean
  message?: string
  data?: any
}

// 表格列配置类型
export interface TableColumn<T = any> {
  prop: keyof T
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  fixed?: 'left' | 'right'
  formatter?: (row: T, column: TableColumn<T>, cellValue: any) => any
  [key: string]: any
}