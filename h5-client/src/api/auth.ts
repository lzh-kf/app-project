import request from './request'
import type { LoginParams, RegisterParams, MemberInfo } from '@/types/member'

export const authApi = {
  login(params: LoginParams) {
    return request.post<{ token: string; member: MemberInfo }>('/auth/login', params)
  },

  register(params: RegisterParams) {
    return request.post<{ token: string; member: MemberInfo }>('/auth/register', params)
  },

  getMe() {
    return request.get<MemberInfo>('/auth/me')
  },

  updateProfile(data: Partial<MemberInfo>) {
    return request.put<MemberInfo>('/auth/profile', data)
  },
}
