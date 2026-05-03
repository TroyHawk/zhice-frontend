<template>
  <div class="project-space">
    <div class="header-bar">
      <h2>🗂️ 我的项目空间</h2>
      <el-button type="primary" size="large" @click="handleAdd">
        + 新建项目
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-empty v-if="projectList.length === 0" description="暂无项目，快去新建一个吧！" style="width: 100%;" />

      <el-col :span="8" v-for="project in projectList" :key="project.id" style="margin-bottom: 20px;">
        <el-card shadow="hover" class="project-card" @click="goToProject(project.id)">
          <template #header>
          <div class="card-header">
            <div style="flex: 1;">
              <div class="project-title">{{ project.name }}</div>
              <div style="margin-top: 5px;">
                <el-tag size="small" effect="plain" type="warning" v-if="project.competitionType">
                  {{ getCompetitionTypeText(project.competitionType) }}
                </el-tag>
              </div>
            </div>
            <div @click.stop> <el-dropdown trigger="click">
            <el-button type="info" :icon="MoreFilled" circle size="small" text />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="Edit" @click="handleEdit(project)">编辑信息</el-dropdown-item>
                <el-dropdown-item :icon="Delete" @click="handleDelete(project.id)" style="color: #f56c6c">
                  删除项目
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
            <el-tag :type="getStatusType(project.status)" size="small">
              {{ getStatusText(project.status) }}
            </el-tag>
          </div>
          </template>
          <div class="card-body">
            <p class="desc">{{ project.description || '暂无描述' }}</p>
            <div class="meta-info">
              <span>{{ getRoleText(project.role) }}</span>
              <span style="float: right;" v-if="project.createTime">📅 {{ formatDate(project.createTime) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑项目信息' : '新建协作项目'" width="500px" @close="resetForm">
      <el-form :model="projectForm" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="projectForm.name" placeholder="请输入竞赛或项目名称" />
        </el-form-item>
        <el-form-item label="竞赛类型">
    <el-select v-model="projectForm.competitionType" placeholder="请选择竞赛赛道" style="width: 100%">
      <el-option label="大创 (创新创业训练计划)" :value="1" />
      <el-option label="互联网+" :value="2" />
      <el-option label="挑战杯" :value="3" />
      <el-option label="中国大学生应用设计大赛" :value="4" />
      <el-option label="其他" :value="5" />
    </el-select>
  </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="4" placeholder="简单描述一下项目的目标和核心痛点..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="isSubmitting" @click="submitForm">
            {{ isEditMode ? '保存修改' : '创 建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>


<script setup lang="ts">
import { MoreFilled, Edit, Delete } from '@element-plus/icons-vue'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()
// --- 状态声明区 ---
const isEditMode = ref(false) // 是否为编辑模式
const currentEditId = ref<number | null>(null) // 记录当前正在编辑的项目ID

// --- TypeScript 接口定义 ---
interface Project {
  id: number
  name: string
  description: string
  status: number
  createTime: string
  competitionType: number
  role: number // 👇 新增角色字段
}

// 点击“新建项目”按钮时
const handleAdd = () => {
  isEditMode.value = false
  dialogVisible.value = true
}
// 1. 编辑按钮点击：填充数据并打开弹窗
const handleEdit = (project: Project) => {
  isEditMode.value = true
  currentEditId.value = project.id
  // 将卡片数据回显到表单
  projectForm.name = project.name
  projectForm.description = project.description
  projectForm.competitionType = project.competitionType
  dialogVisible.value = true
}
// 👇 新增一个方法：把数字翻译成中文身份
const getRoleText = (role: number) => {
  const map: Record<number, string> = { 1: '👑 项目组长', 2: '👤 项目成员', 3: '👨‍🏫 指导老师' }
  return map[role] || '未知角色'
}

// --- 状态与数据 ---
const dialogVisible = ref(false)
const isSubmitting = ref(false) // 提交按钮防抖状态
const projectList = ref<Project[]>([]) // 真实的响应式项目列表

const projectForm = reactive({
  name: '',
  description: '',
  competitionType: 5 // 新增竞赛类型字段
})

// --- 核心网络请求逻辑 ---

// 1. 加载项目列表数据
const fetchProjects = async () => {
  try {
    // 这里因为配置了 Vite 代理，所以请求 /api 会自动转发到 8080 端口
  const res: any = await request.get('/projects')
  if (res.code === 200) {
    projectList.value = res.data
  }
    if (res.code === 200) {
      projectList.value = res.data
    } else {
      ElMessage.error(res.message || '获取列表失败')
    }
  } catch (error) {
    console.error('API请求错误:', error)
    ElMessage.error('网络错误，请确认 Spring Boot 后端是否已启动！')
  }
}

// 2. 页面一挂载完成，立刻调用加载方法
onMounted(() => {
  fetchProjects()
})



// 3. 统一的提交方法：根据模式调用不同接口
const submitForm = async () => {
  if (!projectForm.name.trim()) {
    ElMessage.warning('项目名称不能为空！')
    return
  }

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      // 修改逻辑：PUT /projects
      const res: any = await request.put('/projects', {
        id: currentEditId.value, // 修改必须传 ID
        ...projectForm
      })
      if (res.code === 200) ElMessage.success('项目更新成功')
    } else {
      // 新增逻辑：POST /projects
      const res: any = await request.post('/projects', projectForm)
      if (res.code === 200) ElMessage.success('项目创建成功')
    }
    
    dialogVisible.value = false
    fetchProjects() // 刷新列表
  } catch (error) {
    console.error('保存失败', error)
  } finally {
    isSubmitting.value = false
  }
}

// 3. 删除操作
const handleDelete = (id: number) => {
  ElMessageBox.confirm(
    '确定要删除该项目吗？此操作将不可撤销，且会清理所有关联任务和文档！',
    '严正警告',
    {
      confirmButtonText: '狠心删除',
      cancelButtonText: '留它一命',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res: any = await request.delete(`/projects/${id}`)
      if (res.code === 200) {
        ElMessage.success('项目已彻底删除')
        fetchProjects()
      }
    } catch (error) {
      console.error('删除异常', error)
    }
  })
}

// --- 辅助方法 ---

const resetForm = () => {
  projectForm.name = ''
  projectForm.competitionType = 5
  projectForm.description = ''
  isEditMode.value = false
  currentEditId.value = null
}

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}

// 状态字典转换 (后端返回 0/1，前端转成汉字)
const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '筹备中', 1: '进行中', 2: '已结题' }
  return map[status] || '未知'
}

// 状态标签颜色转换
const getStatusType = (status: number) => {
  const map: Record<number, 'info' | 'success' | 'warning'> = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[status] || 'info'
}

// 格式化日期字符串
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  // 截取掉时分秒，只显示 YYYY-MM-DD
  return dateStr.split('T')[0]
}
// 竞赛类型字典转换
const getCompetitionTypeText = (type: number) => {
  const map: Record<number, string> = {
    1: '大创',
    2: '互联网+',
    3: '挑战杯',
    4: '应用设计大赛',
    5: '其他'
  }
  return map[type] || '未知赛道'
}
</script>

<style scoped>
/* 样式与上一版一致，略作优化 */
.project-space {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-title {
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.card-body .desc {
  color: #606266;
  font-size: 14px;
  height: 40px;
  overflow: hidden;
  margin-bottom: 20px;
  line-height: 1.5;
}

.meta-info {
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}
</style>