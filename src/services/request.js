import axios from 'axios'

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  const location = window.location
  return `${location.protocol}//${location.host}/api`
}

const request = axios.create({
  timeout: 120000  // 2分钟，支持视频上传
})

request.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl()
    const token = localStorage.getItem('token')
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error('请求失败:', response.data?.message || '未知错误')
      }
    }
    return Promise.reject(error)
  }
)

export default request
