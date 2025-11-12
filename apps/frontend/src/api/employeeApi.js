import api from './api'

// 员工相关API
const employeeApi = {
  // 获取员工列表
  getEmployees(params) {
    return api.get('/employees', { params })
  },
  
  // 搜索员工
  searchEmployees(params) {
    return api.get('/employees/search', { params })
  },
  
  // 获取员工详情
  getEmployeeById(id) {
    return api.get(`/employees/${id}`)
  },
  
  // 创建员工
  createEmployee(employeeData) {
    return api.post('/employees', employeeData)
  },
  
  // 更新员工
  updateEmployee(id, employeeData) {
    return api.put(`/employees/${id}`, employeeData)
  },
  
  // 删除员工
  deleteEmployee(id) {
    return api.delete(`/employees/${id}`)
  },
  
  // 获取员工项目
  getEmployeeProjects(id) {
    return api.get(`/employees/${id}/projects`)
  },
  
  // 获取员工培训
  getEmployeeTrainings(id) {
    return api.get(`/employees/${id}/trainings`)
  },
  
  // 员工调动
  transferEmployee(id, transferData) {
    return api.put(`/employees/${id}/transfer`, transferData)
  },
  
  // 薪资调整
  adjustSalary(id, salaryData) {
    return api.put(`/employees/${id}/adjust-salary`, salaryData)
  },
  
  // 批量导入员工
  batchImportEmployees(employeesData) {
    return api.post('/employees/batch-import', { employees: employeesData })
  },
  
  // 获取员工统计
  getEmployeeStatistics(filters) {
    return api.get('/employees/statistics', { params: filters })
  },
  
  // 员工离职处理
  processResignation(id, resignationData) {
    return api.put(`/employees/${id}/resignation`, resignationData)
  }
}

export default employeeApi