import { get, post, put, del } from './api'

// 项目相关类型定义
export interface Project {
  id: number
  name: string
  code: string
  description?: string
  startDate: string
  endDate?: string
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'canceled'
  managerId: number
  budget?: number
  actualCost?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt?: string
  updatedAt?: string
}

export interface ProjectQueryParams {
  page?: number
  pageSize?: number
  status?: Project['status']
  managerId?: number
  keyword?: string
  startDate?: string
  endDate?: string
}

export interface ProjectMember {
  id: number
  employeeId: number
  employeeName: string
  role: 'manager' | 'developer' | 'designer' | 'tester' | 'analyst' | 'other'
  joinDate: string
  hoursPerWeek?: number
}

export interface MemberData {
  employeeId: number
  role: ProjectMember['role']
  joinDate: string
  hoursPerWeek?: number
}

export interface RoleData {
  role: ProjectMember['role']
}

export interface StatusData {
  status: Project['status']
  reason?: string
}

export interface ProgressData {
  completionPercentage: number
  lastUpdated?: string
  notes?: string
}

export interface BudgetData {
  budget: number
  allocatedDate?: string
  notes?: string
}

export interface Milestone {
  id: number
  name: string
  description?: string
  dueDate: string
  status: 'pending' | 'completed' | 'delayed'
  completedDate?: string
}

export interface MilestoneData {
  name: string
  description?: string
  dueDate: string
}

export interface ProjectStatistics {
  totalMembers: number
  totalMilestones: number
  completedMilestones: number
  completionPercentage: number
  daysLeft?: number
  estimatedHours: number
  actualHours: number
  budgetUtilization: number
}

export interface AllProjectsStatistics {
  projects: Array<{
    projectId: number
    projectName: string
    status: Project['status']
    completionPercentage: number
    memberCount: number
  }>
  totalProjects: number
  activeProjects: number
  completedProjects: number
}

// 项目相关API
const projectApi = {
  // 获取项目列表
  getProjects(params?: ProjectQueryParams) {
    return get<Array<Project>>('/projects', { params })
  },
  
  // 获取项目详情
  getProjectById(id: number | string) {
    return get<Project>(`/projects/${id}`)
  },
  
  // 创建项目
  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    return post<Project>('/projects', projectData)
  },
  
  // 更新项目
  updateProject(id: number | string, projectData: Partial<Project>) {
    return put<Project>(`/projects/${id}`, projectData)
  },
  
  // 删除项目
  deleteProject(id: number | string) {
    return del<{ success: boolean }>(`/projects/${id}`)
  },
  
  // 获取项目成员列表
  getProjectMembers(id: number | string, params?: { page?: number; pageSize?: number }) {
    return get<Array<ProjectMember>>(`/projects/${id}/members`, { params })
  },
  
  // 添加项目成员
  addProjectMember(id: number | string, memberData: MemberData) {
    return post<ProjectMember>(`/projects/${id}/members`, memberData)
  },
  
  // 移除项目成员
  removeProjectMember(id: number | string, employeeId: number | string) {
    return del<{ success: boolean }>(`/projects/${id}/members/${employeeId}`)
  },
  
  // 更新项目成员角色
  updateProjectMemberRole(id: number | string, employeeId: number | string, roleData: RoleData) {
    return put<{ success: boolean }>(`/projects/${id}/members/${employeeId}/role`, roleData)
  },
  
  // 获取项目统计信息
  getProjectStatistics(id: number | string) {
    return get<ProjectStatistics>(`/projects/${id}/statistics`)
  },
  
  // 获取所有项目统计
  getAllProjectsStatistics() {
    return get<AllProjectsStatistics>('/projects/statistics')
  },
  
  // 更新项目状态
  updateProjectStatus(id: number | string, statusData: StatusData) {
    return put<{ success: boolean }>(`/projects/${id}/status`, statusData)
  },
  
  // 获取项目进度
  getProjectProgress(id: number | string) {
    return get<ProgressData>(`/projects/${id}/progress`)
  },
  
  // 更新项目进度
  updateProjectProgress(id: number | string, progressData: ProgressData) {
    return put<{ success: boolean }>(`/projects/${id}/progress`, progressData)
  },
  
  // 获取项目预算信息
  getProjectBudget(id: number | string) {
    return get<BudgetData>(`/projects/${id}/budget`)
  },
  
  // 更新项目预算
  updateProjectBudget(id: number | string, budgetData: BudgetData) {
    return put<{ success: boolean }>(`/projects/${id}/budget`, budgetData)
  },
  
  // 获取项目时间线
  getProjectTimeline(id: number | string) {
    return get<Array<Milestone>>(`/projects/${id}/timeline`)
  },
  
  // 添加项目里程碑
  addProjectMilestone(id: number | string, milestoneData: MilestoneData) {
    return post<Milestone>(`/projects/${id}/milestones`, milestoneData)
  },
  
  // 删除项目里程碑
  deleteProjectMilestone(id: number | string, milestoneId: number | string) {
    return del<{ success: boolean }>(`/projects/${id}/milestones/${milestoneId}`)
  }
}

export default projectApi