import { get, post, put, del } from './api'

// 职位相关类型定义
export interface Position {
  id: number
  name: string
  code: string
  departmentId: number
  level: 'junior' | 'middle' | 'senior' | 'manager' | 'director'
  description?: string
  minSalary?: number
  maxSalary?: number
  createdAt?: string
  updatedAt?: string
}

export interface PositionQueryParams {
  page?: number
  pageSize?: number
  departmentId?: number
  level?: Position['level']
}

// 获取所有职位列表
export const getPositions = async (params: PositionQueryParams = {}) => {
  try {
    const response = await get<Array<Position>>('/positions', { params })
    return response
  } catch (error) {
    throw error
  }
}

// 搜索职位
export const searchPositions = async (keyword: string) => {
  try {
    const response = await get<Array<Position>>('/positions/search', { 
      params: { keyword } 
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取单个职位详情
export const getPositionById = async (id: number | string) => {
  try {
    const response = await get<Position>(`/positions/${id}`)
    return response
  } catch (error) {
    throw error
  }
}

// 获取职位的员工列表
export const getPositionEmployees = async (id: number | string, params: { page?: number; pageSize?: number } = {}) => {
  try {
    const response = await get<Array<any>>(`/positions/${id}/employees`, { params }) // 暂时使用any，可以引用Employee类型
    return response
  } catch (error) {
    throw error
  }
}

// 创建新职位
export const createPosition = async (positionData: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const response = await post<Position>('/positions', positionData)
    return response
  } catch (error) {
    throw error
  }
}

// 更新职位信息
export const updatePosition = async (id: number | string, positionData: Partial<Position>) => {
  try {
    const response = await put<Position>(`/positions/${id}`, positionData)
    return response
  } catch (error) {
    throw error
  }
}

// 删除职位
export const deletePosition = async (id: number | string) => {
  try {
    const response = await del<{ success: boolean }>(`/positions/${id}`)
    return response
  } catch (error) {
    throw error
  }
}

export default {
  getPositions,
  searchPositions,
  getPositionById,
  getPositionEmployees,
  createPosition,
  updatePosition,
  deletePosition
}