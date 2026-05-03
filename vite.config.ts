import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 配置 @ 指向 src 目录
      '@': path.resolve(__dirname, 'src')
    }
  },
  // 新增：配置开发服务器代理
  server: {
    proxy: {
      // 凡是以 /api 开头的请求，都会被代理到目标地址
      '/api': {
        target: 'http://localhost:8080', // 你的 Spring Boot 后端地址
        changeOrigin: true // 允许跨域
      }
    }
  }
})