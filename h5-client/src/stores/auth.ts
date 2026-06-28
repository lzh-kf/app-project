import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { MemberInfo, LoginParams, RegisterParams } from '@/types/member'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('member_token'))
  const member = ref<MemberInfo | null>(null)
  const loading = ref(false)
  const profileLoaded = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 监听 401 未授权事件，同步清理登录状态
  function handleUnauthorized() {
    logout()
  }

  // 在浏览器环境中注册事件监听（store 只创建一次，这里安全）
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', handleUnauthorized)
  }

  async function login(params: LoginParams) {
    loading.value = true
    try {
      const res = await authApi.login(params)
      token.value = res.token
      member.value = res.member
      profileLoaded.value = true
      localStorage.setItem('member_token', res.token)
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(params: RegisterParams) {
    loading.value = true
    try {
      const res = await authApi.register(params)
      token.value = res.token
      member.value = res.member
      profileLoaded.value = true
      localStorage.setItem('member_token', res.token)
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const res = await authApi.getMe()
      member.value = res
      profileLoaded.value = true
    } catch {
      // token 失效
      logout()
    }
  }

  async function updateProfile(data: Partial<MemberInfo>) {
    const res = await authApi.updateProfile(data)
    member.value = res
    return res
  }

  function logout() {
    token.value = null
    member.value = null
    profileLoaded.value = false
    localStorage.removeItem('member_token')
  }

  // 初始化：如果存在 token，自动验证并加载用户信息
  if (token.value && typeof window !== 'undefined') {
    fetchProfile()
  }

  return {
    token,
    member,
    loading,
    profileLoaded,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout,
  }
})
