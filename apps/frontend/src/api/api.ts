import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

// 导入全局类型定义
import type { ApiResponse } from '../types'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 这里可以添加token等认证信息
    // const token = localStorage.getItem('token')
    // if (token) {
    //   if (!config.headers) {
    //     config.headers = {}
    //   }
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  <T = any>(response: AxiosResponse<ApiResponse<T>>): AxiosResponse<ApiResponse<T>> => {
    // 处理成功响应
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>): Promise<AxiosError<ApiResponse<unknown>>> => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 这里可以跳转到登录页面
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error(data.message || '服务器内部错误')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('网络错误，请检查您的网络连接')
    } else {
      // 请求配置出错
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

/**
 * 默认导出的axios实例
 * @type {AxiosInstance}
 */
export default api

/**
 * GET请求方法
 * @template T - 响应数据的类型
 * @param {string} url - 请求URL
 * @param {AxiosRequestConfig} [config] - 请求配置项
 * @returns {Promise<ApiResponse<T>>} - 返回Promise，解析为带类型的响应数据
 */
export const get = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.get<ApiResponse<T>>(url, config)
  return response.data
}

/**
 * POST请求方法
 * @template T - 响应数据的类型
 * @param {string} url - 请求URL
 * @param {any} [data] - 请求数据
 * @param {AxiosRequestConfig} [config] - 请求配置项
 * @returns {Promise<ApiResponse<T>>} - 返回Promise，解析为带类型的响应数据
 */
export const post = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.post<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * PUT请求方法
 * @template T - 响应数据的类型
 * @param {string} url - 请求URL
 * @param {any} [data] - 请求数据
 * @param {AxiosRequestConfig} [config] - 请求配置项
 * @returns {Promise<ApiResponse<T>>} - 返回Promise，解析为带类型的响应数据
 */
export const put = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.put<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * DELETE请求方法
 * @template T - 响应数据的类型
 * @param {string} url - 请求URL
 * @param {AxiosRequestConfig} [config] - 请求配置项
 * @returns {Promise<ApiResponse<T>>} - 返回Promise，解析为带类型的响应数据
 */
export const del = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.delete<ApiResponse<T>>(url, config)
  return response.data
}