import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { MemberInfo, LoginParams, RegisterParams } from '@/types/member'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('member_token'))
  const member = ref<MemberInfo | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  async function login(params: LoginParams) {
    loading.value = true
    try {
      const res = await authApi.login(params)
      token.value = res.token
      member.value = res.member
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
    localStorage.removeItem('member_token')
  }

  return {
    token,
    member,
    loading,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout,
  }
})
