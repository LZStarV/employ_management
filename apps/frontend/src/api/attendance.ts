import { get } from './api'

// 考勤相关类型定义
export interface Attendance {
  id: number
  employeeId: number
  employeeName: string
  date: string
  checkInTime: string
  checkOutTime?: string
  status: 'normal' | 'late' | 'early_leave' | 'absent' | 'leave'
  workHours?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceQueryParams {
  page?: number
  pageSize?: number
  employeeId?: number
  departmentId?: number
  date?: string
  startDate?: string
  endDate?: string
  status?: Attendance['status']
}

export interface EmployeeAttendanceDetail {
  employeeId: number
  employeeName: string
  departmentName: string
  positionName: string
  records: Array<Attendance>
  summary: {
    totalDays: number
    normalDays: number
    lateDays: number
    earlyLeaveDays: number
    absentDays: number
    leaveDays: number
    totalWorkHours: number
  }
}

export interface AttendanceStatistics {
  overall: {
    totalEmployees: number
    presentRate: number
    averageWorkHours: number
    totalLateCount: number
    totalAbsentCount: number
  }
  departmentStats: Array<{
    departmentId: number
    departmentName: string
    presentRate: number
    averageWorkHours: number
  }>
  trend: Array<{
    date: string
    presentRate: number
    averageWorkHours: number
  }>
}

// 考勤管理API
export const attendanceAPI = {
  // 获取考勤列表
  getAttendanceList(params?: AttendanceQueryParams) {
    return get<Array<Attendance>>('/attendances', { params })
  },

  // 获取员工考勤详情
  getEmployeeAttendanceDetail(employeeId: number | string, params: AttendanceQueryParams = {}) {
    return get<EmployeeAttendanceDetail>(`/attendances/employee/${employeeId}`, { params })
  },

  // 获取考勤统计
  getStatistics(params?: { startDate?: string; endDate?: string; departmentId?: number }) {
    return get<AttendanceStatistics>('/attendances/statistics', { params })
  }
}

export default attendanceAPI