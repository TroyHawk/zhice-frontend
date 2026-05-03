<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <h2>智策 ZhiCe</h2>
        <p>大学生竞赛团队智能协作平台</p>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" size="large">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入账号 (学号/邮箱)" 
            prefix-icon="User" 
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock" 
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="login-btn" 
            :loading="loading" 
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request' // 引入我们刚才封装好的拦截器

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

// 表单校验规则
const rules = reactive({
  username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
})

const handleLogin = async () => {
  // 先进行前端格式校验
  await loginFormRef.value.validate()
  
  loading.value = true
  try {
    // 调用后端登录接口 (假设你的后端登录接口是 /api/v1/auth/login)
    // 注意：因为 request.ts 里配了 baseURL，这里直接写 /auth/login 即可
    const res: any = await request.post('/auth/login', loginForm)
    
    if (res.code === 200) {
      ElMessage.success('登录成功！欢迎来到智策')
      // 1. 将 Token 保存到浏览器的 localStorage 里面
      localStorage.setItem('token', res.data.token)
      // 2. 跳转到项目空间大厅
      router.push('/projects')
    } else {
      ElMessage.error(res.message || '账号或密码错误')
    }
  } catch (error) {
    console.error('登录异常', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
  width: 400px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0;
  font-size: 28px;
  color: #409EFF;
  letter-spacing: 2px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  border-radius: 8px;
}
</style>