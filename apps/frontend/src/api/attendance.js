import api from './api'

// 考勤管理API
export const attendanceAPI = {
  // 获取考勤列表
  getAttendanceList(params) {
    return api({
      url: '/attendances',
      method: 'get',
      params
    })
  },

  // 获取员工考勤详情
  getEmployeeAttendanceDetail(employeeId, params = {}) {
    return api({
      url: `/attendances/employee/${employeeId}`,
      method: 'get',
      params
    })
  },

  // 获取考勤统计
  getStatistics(params) {
    return api({
      url: '/attendances/statistics',
      method: 'get',
      params
    })
  }
}

export default attendanceAPI