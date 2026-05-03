<template>
  <div class="members-container">
    <el-card class="members-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">团队成员管理</span>
          <el-button type="primary" icon="Plus" @click="dialogVisible = true">
            邀请新成员
          </el-button>
        </div>
      </template>

      <el-table 
        :data="memberList" 
        style="width: 100%" 
        v-loading="loading"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="姓名/昵称" min-width="120" />
        <el-table-column prop="username" label="账号(学号/邮箱)" min-width="150" />
        
        <el-table-column label="项目角色" width="150" align="center">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role)">
              {{ getRoleText(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="joinTime" label="加入时间" width="180" />
        
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button 
              type="danger" 
              size="small" 
              link
              @click="handleRemove(scope.row)"
              v-if="scope.row.role !== 1" 
            >
              移除
            </el-button>
            <span v-else style="color: #909399; font-size: 12px;">不可移除</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="邀请新成员加入项目" width="450px" @close="resetForm">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="成员账号">
          <el-input 
            v-model="inviteForm.username" 
            placeholder="请输入对方的学号或邮箱" 
          />
        </el-form-item>
        <el-form-item label="分配角色">
          <el-select v-model="inviteForm.role" placeholder="请选择角色" style="width: 100%;">
            <el-option label="普通成员" :value="2" />
            <el-option label="指导老师" :value="3" />
            </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="isSubmitting" @click="submitInvite">发 送 邀 请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request' // 引入我们封装好的请求工具

// --- 类型与状态声明 ---
interface Member {
  id: number
  userId: number
  username: string
  realName: string
  role: number
  joinTime: string
}

const route = useRoute()
const projectId = route.params.id // 获取当前路由上的项目ID

const loading = ref(false)
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const memberList = ref<Member[]>([])

const inviteForm = reactive({
  username: '',
  role: 2 // 默认是普通成员
})

// --- 核心网络请求逻辑 ---

// 1. 获取当前项目的成员列表
const fetchMembers = async () => {
  loading.value = true
  try {
    // 假设后端的接口是 GET /projects/{projectId}/members
    const res: any = await request.get(`/projects/${projectId}/members`)
    if (res.code === 200) {
      memberList.value = res.data
    } else {
      ElMessage.error(res.message || '获取成员列表失败')
    }
  } catch (error) {
    console.error('获取成员失败', error)
  } finally {
    loading.value = false
  }
}

// 2. 页面挂载时立即调用
onMounted(() => {
  fetchMembers()
})

// 3. 提交邀请请求
const submitInvite = async () => {
  if (!inviteForm.username.trim()) {
    ElMessage.warning('请输入对方的账号！')
    return
  }
  
  isSubmitting.value = true
  try {
    // 假设后端的邀请接口是 POST /projects/{projectId}/members/invite
    const res: any = await request.post(`/projects/${projectId}/members/invite`, {
      username: inviteForm.username,
      role: inviteForm.role
    })
    
    if (res.code === 200) {
      ElMessage.success('成功将该用户拉入项目！')
      dialogVisible.value = false
      resetForm()
      fetchMembers() // 刷新列表
    } else {
      ElMessage.error(res.message || '邀请失败')
    }
  } catch (error) {
    console.error('邀请异常', error)
  } finally {
    isSubmitting.value = false
  }
}

// 4. 模拟移除成员
const handleRemove = (row: Member) => {
  ElMessageBox.confirm(`确定要将【${row.realName || row.username}】移出本项目吗？`, '警告', {
    confirmButtonText: '确定移除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.info('此功能需要后端删除接口支持，目前为演示状态')
    // 实际开发时，在这里调用 request.delete(`/projects/${projectId}/members/${row.userId}`)
  }).catch(() => {})
}

// --- 辅助方法 ---

const resetForm = () => {
  inviteForm.username = ''
  inviteForm.role = 2
}

const getRoleText = (role: number) => {
  const map: Record<number, string> = { 1: '项目组长', 2: '普通成员', 3: '指导老师' }
  return map[role] || '未知'
}

const getRoleTagType = (role: number) => {
  const map: Record<number, 'danger' | 'primary' | 'warning'> = { 1: 'danger', 2: 'primary', 3: 'warning' }
  return map[role] || 'info'
}
</script>

<style scoped>
.members-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
}
</style>