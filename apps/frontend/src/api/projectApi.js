import api from './api'

// 项目相关API
const projectApi = {
  // 获取项目列表
  getProjects(params) {
    return api.get('/projects', { params })
  },
  
  // 获取项目详情
  getProjectById(id) {
    return api.get(`/projects/${id}`)
  },
  
  // 创建项目
  createProject(projectData) {
    return api.post('/projects', projectData)
  },
  
  // 更新项目
  updateProject(id, projectData) {
    return api.put(`/projects/${id}`, projectData)
  },
  
  // 删除项目
  deleteProject(id) {
    return api.delete(`/projects/${id}`)
  },
  
  // 获取项目成员列表
  getProjectMembers(id, params) {
    return api.get(`/projects/${id}/members`, { params })
  },
  
  // 添加项目成员
  addProjectMember(id, memberData) {
    return api.post(`/projects/${id}/members`, memberData)
  },
  
  // 移除项目成员
  removeProjectMember(id, employeeId) {
    return api.delete(`/projects/${id}/members/${employeeId}`)
  },
  
  // 更新项目成员角色
  updateProjectMemberRole(id, employeeId, roleData) {
    return api.put(`/projects/${id}/members/${employeeId}/role`, roleData)
  },
  
  // 获取项目统计信息
  getProjectStatistics(id) {
    return api.get(`/projects/${id}/statistics`)
  },
  
  // 获取所有项目统计
  getAllProjectsStatistics() {
    return api.get('/projects/statistics')
  },
  
  // 更新项目状态
  updateProjectStatus(id, statusData) {
    return api.put(`/projects/${id}/status`, statusData)
  },
  
  // 获取项目进度
  getProjectProgress(id) {
    return api.get(`/projects/${id}/progress`)
  },
  
  // 更新项目进度
  updateProjectProgress(id, progressData) {
    return api.put(`/projects/${id}/progress`, progressData)
  },
  
  // 获取项目预算信息
  getProjectBudget(id) {
    return api.get(`/projects/${id}/budget`)
  },
  
  // 更新项目预算
  updateProjectBudget(id, budgetData) {
    return api.put(`/projects/${id}/budget`, budgetData)
  },
  
  // 获取项目时间线
  getProjectTimeline(id) {
    return api.get(`/projects/${id}/timeline`)
  },
  
  // 添加项目里程碑
  addProjectMilestone(id, milestoneData) {
    return api.post(`/projects/${id}/milestones`, milestoneData)
  },
  
  // 删除项目里程碑
  deleteProjectMilestone(id, milestoneId) {
    return api.delete(`/projects/${id}/milestones/${milestoneId}`)
  }
}

export default projectApi