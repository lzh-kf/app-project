import axios from 'axios'
import { showToast } from 'vant'
import type { ApiResponse } from '@/types/api'

// 响应拦截器已解包到 data 层，这里重写 axios 实例的类型签名
interface UnwrappedAxios {
  get<T = any>(url: string, config?: any): Promise<T>
  post<T = any>(url: string, data?: any, config?: any): Promise<T>
  put<T = any>(url: string, data?: any, config?: any): Promise<T>
  delete<T = any>(url: string, config?: any): Promise<T>
}

const instance = axios.create({
  baseURL: '/api/member',
  timeout: 15000,
})

// 请求拦截器：注入 member_token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('member_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理 + 解包
instance.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (res.code !== 0) {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res.data // 解包到 data 层
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message

      if (status === 401) {
        // 通过自定义事件通知 auth store 同步清理状态
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        showToast('请先登录')
      } else {
        showToast(message || '网络错误，请重试')
      }
    } else {
      showToast('网络连接失败')
    }
    return Promise.reject(error)
  }
)

const request = instance as unknown as UnwrappedAxios

export default request
