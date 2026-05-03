import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 1. 创建一个自定义的 axios 实例
const request = axios.create({
  // 基础路径，Vite 会将 /api 代理到后端的 8080 端口
  baseURL: '/api/v1', 
  timeout: 10000 // 请求超时时间
})

// 2. 请求拦截器 (Request Interceptor)
// 作用：在请求发出去之前，自动拦截下来，塞入 Token
request.interceptors.request.use(
  (config) => {
    // 从浏览器的 LocalStorage 中获取登录时存入的 Token
    const token = localStorage.getItem('token')
    if (token) {
      // 如果有 Token，就在请求头里添加 Authorization 字段，值为 Bearer + Token
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 3. 响应拦截器 (Response Interceptor)
// 作用：在后端数据返回给页面之前，先拦截下来判断一下状态
request.interceptors.response.use(
  (response) => {
    // 这里可以直接返回 response.data，这样页面里就不需要再写 res.data.data 了
    return response.data
  },
  (error) => {
    // 统一的错误处理
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        ElMessage.error('登录已过期或未授权，请重新登录！')
        localStorage.removeItem('token') // 清除失效的 Token
        router.push('/login') // 强制踢回登录页
      } else if (status === 403) {
        ElMessage.error('您没有权限执行此操作！')
      } else if (status === 500) {
        ElMessage.error('服务器开了个小差，请稍后再试')
      }
    } else {
      ElMessage.error('网络异常，请检查后端服务是否启动')
    }
    return Promise.reject(error)
  }
)

export default request