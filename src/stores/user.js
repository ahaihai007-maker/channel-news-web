import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../services/api.js'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const username = computed(() => user.value?.username || '')

  // Actions
  const setUser = (userData) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const clearUser = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const login = async (credentials) => {
    loading.value = true
    try {
      const res = await userApi.login(credentials)
      if (res.code === 200) {
        setToken(res.data.token)
        setUser({ username: res.data.username, role: res.data.role })
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  const register = async (data) => {
    loading.value = true
    try {
      const res = await userApi.register(data)
      if (res.code === 200) {
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '注册失败' }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    clearUser()
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await userApi.getCurrentUser()
      if (res.code === 200) {
        setUser(res.data)
        return res.data
      }
    } catch (error) {
      clearUser()
    }
  }

  // 初始化时从 localStorage 恢复用户数据
  const initUser = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        localStorage.removeItem('user')
      }
    }
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    isAdmin,
    username,
    login,
    register,
    logout,
    fetchCurrentUser,
    initUser
  }
})
