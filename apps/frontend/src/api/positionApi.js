import api from './api'

// 获取所有职位列表
export const getPositions = async (params = {}) => {
  try {
    const response = await api.get('/positions', { params })
    return response
  } catch (error) {
    throw error
  }
}

// 搜索职位
export const searchPositions = async (keyword) => {
  try {
    const response = await api.get('/positions/search', { 
      params: { keyword } 
    })
    return response
  } catch (error) {
    throw error
  }
}

// 获取单个职位详情
export const getPositionById = async (id) => {
  try {
    const response = await api.get(`/positions/${id}`)
    return response
  } catch (error) {
    throw error
  }
}

// 获取职位的员工列表
export const getPositionEmployees = async (id, params = {}) => {
  try {
    const response = await api.get(`/positions/${id}/employees`, { params })
    return response
  } catch (error) {
    throw error
  }
}

// 创建新职位
export const createPosition = async (positionData) => {
  try {
    const response = await api.post('/positions', positionData)
    return response
  } catch (error) {
    throw error
  }
}

// 更新职位信息
export const updatePosition = async (id, positionData) => {
  try {
    const response = await api.put(`/positions/${id}`, positionData)
    return response
  } catch (error) {
    throw error
  }
}

// 删除职位
export const deletePosition = async (id) => {
  try {
    const response = await api.delete(`/positions/${id}`)
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