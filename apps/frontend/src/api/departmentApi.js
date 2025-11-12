import api from './api'

// 部门相关API
const departmentApi = {
  // 获取部门列表
  getDepartments(params) {
    return api.get('/departments', { params })
  },
  
  // 获取部门详情
  getDepartmentById(id) {
    return api.get(`/departments/${id}`)
  },
  
  // 创建部门
  createDepartment(departmentData) {
    return api.post('/departments', departmentData)
  },
  
  // 更新部门
  updateDepartment(id, departmentData) {
    return api.put(`/departments/${id}`, departmentData)
  },
  
  // 删除部门
  deleteDepartment(id) {
    return api.delete(`/departments/${id}`)
  },
  
  // 获取部门员工列表
  getDepartmentEmployees(id, params) {
    return api.get(`/departments/${id}/employees`, { params })
  },
  
  // 获取部门统计信息
  getDepartmentStatistics(id) {
    return api.get(`/departments/${id}/statistics`)
  },
  
  // 获取所有部门统计
  getAllDepartmentsStatistics() {
    return api.get('/departments/statistics')
  },
  
  // 部门合并
  mergeDepartments(sourceId, targetId) {
    return api.put(`/departments/${sourceId}/merge`, { target_department_id: targetId })
  },
  
  // 获取部门经理列表
  getDepartmentManagers() {
    return api.get('/departments/managers')
  },
  
  // 更新部门经理
  updateDepartmentManager(id, managerData) {
    return api.put(`/departments/${id}/manager`, managerData)
  },
  
  // 获取部门预算信息
  getDepartmentBudget(id) {
    return api.get(`/departments/${id}/budget`)
  },
  
  // 更新部门预算
  updateDepartmentBudget(id, budgetData) {
    return api.put(`/departments/${id}/budget`, budgetData)
  }
}

export default departmentApi