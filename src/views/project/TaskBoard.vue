<template>
  <div class="board-container">
    <div class="top-action-bar">
      <div class="left-actions">
        <el-radio-group v-model="viewMode" size="large">
          <el-radio-button value="board"><el-icon><DataBoard /></el-icon> 看板</el-radio-button>
          <el-radio-button value="list"><el-icon><List /></el-icon> 列表</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="filterMember" placeholder="成员筛选" clearable style="width: 150px; margin-left: 20px;">
          <el-option label="只看我的" value="me" />
          <el-option label="所有成员" value="all" />
        </el-select>
      </div>
      <div class="right-actions">
        <el-button type="primary" size="large" :icon="Plus" @click="openCreateDialog()">新建任务</el-button>
      </div>
    </div>

    <div v-if="viewMode === 'board'" class="kanban-board">
      <div class="column" v-for="col in columns" :key="col.status">
        <div class="column-header" :class="col.theme">
          <span class="col-title">{{ col.name }}</span>
          <span class="col-count">{{ getFilteredTasks(col.status).length }}</span>
        </div>

        <draggable
          class="drag-area"
          :list="getFilteredTasks(col.status)"
          group="tasks"
          item-key="id"
          ghost-class="ghost-card"
          animation="200"
          @change="(e) => handleDragChange(e, col.status)"
        >
          <template #item="{ element }">
            <el-card class="task-card" shadow="hover" @click="openDrawer(element)">
              <div class="card-top">
                <span class="task-id">#T-{{ element.id }}</span>
                <el-tag size="small" :type="getPriorityType(element.priority)" effect="dark">
                  {{ getPriorityText(element.priority) }}
                </el-tag>
              </div>
              <div class="card-middle">
                <div class="task-title">{{ element.title }}</div>
              </div>
              <div class="card-bottom">
                <div class="deadline" :class="getDeadlineClass(element.deadline)">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(element.deadline) || '无期限' }}
                </div>
                <el-tooltip :content="getAssigneeName(element.assigneeId)" placement="top">
                  <el-avatar :size="24" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
                </el-tooltip>
              </div>
            </el-card>
          </template>
        </draggable>

        <div class="quick-add" @click="openCreateDialog(col.status)">
          <el-icon><Plus /></el-icon> 添加任务
        </div>
      </div>
    </div>

    <div v-else class="list-view">
      <el-empty description="列表视图开发中..." />
    </div>

    <el-drawer v-model="drawerVisible" :title="`任务详情: #T-${currentTask?.id}`" size="600px">
      <div v-if="currentTask" class="drawer-content">
        <div class="edit-section">
          <div class="edit-label">任务标题</div>
          <el-input v-model="editForm.title" placeholder="任务标题" />
        </div>
        
        <el-row :gutter="20" style="margin-top: 15px;">
          <el-col :span="12">
            <div class="edit-section">
              <div class="edit-label">优先级</div>
              <el-select v-model="editForm.priority" style="width: 100%">
                <el-option label="普通" :value="1" />
                <el-option label="高" :value="2" />
                <el-option label="紧急" :value="3" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="edit-section">
              <div class="edit-label">截止日期</div>
              <el-date-picker
                v-model="editForm.deadline"
                type="datetime"
                placeholder="设置截止日期"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          </el-col>
        </el-row>

        <div class="edit-section" style="margin-top: 15px;">
          <div class="edit-label">负责人</div>
          <el-select 
            v-model="editForm.assigneeId" 
            placeholder="指派给成员" 
            style="width: 100%"
            :disabled="currentUserRole === 2" 
          >
            <el-option 
              v-for="user in projectMembers" 
              :key="user.userId" 
              :label="user.realName || user.username" 
              :value="user.userId" 
            />
          </el-select>
        </div>

        <el-divider content-position="left">任务描述</el-divider>
        <div class="description-area">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            :rows="6" 
            placeholder="完善详细的任务说明..." 
          />
        </div>

        <div style="margin-top: 30px; display: flex; justify-content: flex-end;">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :icon="Check" @click="updateTaskDetails" :loading="isUpdating">
            保存全部修改
          </el-button>
        </div>

        <el-divider content-position="left">子任务清单</el-divider>
        <div class="subtask-area" v-loading="loadingSubtasks">
           </div>
      </div>
    </el-drawer>

    <el-dialog v-model="dialogVisible" title="创建新任务" width="550px">
      <el-form :model="taskForm" label-width="100px" label-position="top">
        <el-form-item label="任务标题" required>
          <el-input v-model="taskForm.title" placeholder="例如：完成登录页 UI 绘制" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="taskForm.priority" style="width: 100%">
                <el-option label="普通" :value="1" />
                <el-option label="高" :value="2" />
                <el-option label="紧急" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="taskForm.deadline"
                type="date"
                placeholder="选择截止日期"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="指派负责人">
          <el-select 
            v-model="taskForm.assigneeId" 
            placeholder="请选择负责人" 
            style="width: 100%"
            :disabled="currentUserRole === 2"
          >
          <el-option 
              v-for="user in projectMembers" 
              :key="user.userId" 
              :label="user.realName || user.username || `团队成员 (ID: ${user.userId})`" 
              :value="user.userId" 
            />
          </el-select>
          <p v-if="currentUserRole === 2" style="font-size: 12px; color: #909399; margin-top: 4px;">
            只有队长和指导老师可以指派任务，团队成员仅能为自己创建任务。
          </p>
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input 
            v-model="taskForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="详细描述一下任务内容、验收标准等..." 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTask" size="large">立即创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataBoard, List, Plus, Clock } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import request from '@/utils/request'

// --- 基础状态 ---
const route = useRoute()
const projectId = route.params.id
const currentUserId = Number(localStorage.getItem('userId') || 0) // 从浏览器获取当前登录用户ID
const currentUserRole = ref(2) // 默认普通成员
const projectMembers = ref<any[]>([])

const viewMode = ref('board')
const filterMember = ref('')
const allTasks = ref<any[]>([])

// --- 看板列定义 ---
const columns = [
  { name: '待处理', status: 0, theme: 'col-todo' },
  { name: '进行中', status: 1, theme: 'col-doing' },
  { name: '审核中', status: 2, theme: 'col-review' },
  { name: '已完成', status: 3, theme: 'col-done' }
]

// --- 初始化与获取数据 ---
const initProjectData = async () => {
  try {
    const res: any = await request.get(`/projects/${projectId}/members`)
    if (res.code === 200) {
      projectMembers.value = res.data
      const me = res.data.find((m: any) => m.userId === currentUserId)
      if (me) currentUserRole.value = me.role
    }
  } catch (error) {
    console.error('获取成员列表失败', error)
  }
}

const fetchBoard = async () => {
  try {
    const res: any = await request.get(`/tasks/projects/${projectId}/board`)
    if (res.code === 200) {
      // 兼容后端返回结构
      allTasks.value = Array.isArray(res.data) ? res.data : Object.values(res.data).flat()
    }
  } catch (e) {
    console.error('获取看板失败', e)
  }
}

// 核心过滤方法（融合状态列 + 成员筛选）
const getFilteredTasks = (status: number) => {
  return allTasks.value.filter(t => {
    let match = t.status === status
    if (filterMember.value === 'me') {
      match = match && t.assigneeId === currentUserId
    }
    return match
  })
}

// --- 新建任务交互 ---
const dialogVisible = ref(false)
const taskForm = reactive({ 
  title: '', 
  description: '',
  priority: 1, 
  status: 0, 
  assigneeId: null as number | null,
  deadline: '',
  projectId: Number(projectId) 
})

const openCreateDialog = (defaultStatus = 0) => {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.status = defaultStatus
  taskForm.deadline = ''
  
  // 权限处理：如果是成员，锁死指派给自己；如果是组长，置空等待选择
  if (currentUserRole.value === 2) {
    taskForm.assigneeId = currentUserId
  } else {
    taskForm.assigneeId = null
  }
  
  dialogVisible.value = true
}

const submitTask = async () => {
  if (!taskForm.title) return ElMessage.warning('请填写任务标题')
  try {
    const res: any = await request.post('/tasks', taskForm)
    if (res.code === 200) {
      ElMessage.success('任务创建成功')
      dialogVisible.value = false
      fetchBoard()
    }
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

// --- 拖拽交互 (调用后端 PUT /tasks/status) ---
const handleDragChange = async (evt: any, newStatus: number) => {
  // vuedraggable 会在跨列移入时触发 'added' 事件
  if (evt.added) {
    const task = evt.added.element
    
    // 💡 1. 乐观更新：在等待后端接口响应时，先让 UI 卡片流转过去，给用户极其丝滑的体验
    task.status = newStatus 

    try {
      // 💡 2. 调用你刚刚提供的 PUT /status 接口
      // ⚠️ 注意：这里的属性名 taskId 和 status 必须与你后端的 TaskStatusUpdateDTO 字段名 100% 保持一致！
      const res: any = await request.put('/tasks/status', {
        taskId: task.id,
        status: newStatus 
      })
      
      if (res.code === 200) {
        ElMessage.success('🎉 状态流转成功！')
        // 如果后端不返回完整的列表，可以在此处保持乐观更新，或者选择调用 fetchBoard() 重新拉取一次
      } else {
        ElMessage.error(res.message || '状态流转失败')
        fetchBoard() // 💡 3. 失败回滚：如果后端报错了，我们重新拉取最新数据，把刚才“提前”拖过去的卡片拽回来
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('网络异常，状态流转失败')
      fetchBoard() // 失败回滚
    }
  }
}

// --- 右侧抽屉交互 (详情、描述修改、子任务) ---
import { Check } from '@element-plus/icons-vue' // 引入确认图标

// 1. 定义编辑表单对象
const editForm = reactive({
  title: '',
  priority: 1,
  assigneeId: null as number | null,
  deadline: '',
  description: ''
})
const isUpdating = ref(false)
const drawerVisible = ref(false)
const currentTask = ref<any>(null)
const editDescription = ref('')

const subtaskList = ref<any[]>([])
const newSubtaskTitle = ref('')
const loadingSubtasks = ref(false)



const openDrawer = (task: any) => {
  currentTask.value = task
  // 将任务原始数据克隆到编辑表单中
  editForm.title = task.title
  editForm.priority = task.priority
  editForm.assigneeId = task.assigneeId
  if (task.deadline) {
    editForm.deadline = task.deadline.replace('T', ' ')
  } else {
    editForm.deadline = ''
  }
  editForm.description = task.description || ''
  
  drawerVisible.value = true
  fetchSubTasks(task.id)
}

// 修改主任务详情
const updateTaskDetails = async () => {
  if (!editForm.title.trim()) return ElMessage.warning('任务标题不能为空')
  
  isUpdating.value = true
  try {
    // 💡 关键：这里发送的对象必须和后端的 TaskUpdateDTO 字段名 100% 对应
    const res: any = await request.put(`/tasks/${currentTask.value.id}`, {
      title: editForm.title,
      priority: editForm.priority,
      assigneeId: editForm.assigneeId,
      deadline: editForm.deadline,
      description: editForm.description
    })
    
    if (res.code === 200) {
      ElMessage.success('任务详情已成功同步')
      // 更新本地数据，让看板上的卡片也能实时变化
      Object.assign(currentTask.value, editForm)
      fetchBoard() // 刷新看板，确保优先级和负责人的 UI 更新
      drawerVisible.value = false // 保存后关闭抽屉（也可以不关，取决于习惯）
    }
  } catch (e) {
    ElMessage.error('更新失败，请重试')
  } finally {
    isUpdating.value = false
  }
}

// 获取子任务列表
const fetchSubTasks = async (taskId: number) => {
  loadingSubtasks.value = true
  try {
    const res: any = await request.get(`/tasks/${taskId}/subtasks`)
    if (res.code === 200) subtaskList.value = res.data || []
  } catch (e) {
    console.error('获取子任务失败', e)
  } finally {
    loadingSubtasks.value = false
  }
}

// 添加子任务
const addSubTask = async () => {
  if (!newSubtaskTitle.value.trim()) return
  try {
    const res: any = await request.post(`/tasks/${currentTask.value.id}/subtasks`, {
      title: newSubtaskTitle.value
    })
    if (res.code === 200) {
      newSubtaskTitle.value = ''
      fetchSubTasks(currentTask.value.id)
    }
  } catch (e) {
    ElMessage.error('添加子任务失败')
  }
}

// 切换子任务状态
const toggleSubTask = async (sub: any, val: boolean) => {
  const isCompleted = val ? 1 : 0
  try {
    const res: any = await request.put(`/tasks/subtasks/${sub.id}/status?isCompleted=${isCompleted}`)
    if (res.code === 200) {
      sub.isCompleted = isCompleted // 乐观更新
    } else {
      fetchSubTasks(currentTask.value.id) // 失败重拉
    }
  } catch (e) {
    fetchSubTasks(currentTask.value.id)
  }
}


// --- 纯 UI 辅助方法 ---
const getAssigneeName = (id: number) => {
  if (!id) return '未分配'
  const user = projectMembers.value.find(m => m.userId === id)
  return user ? (user.realName || user.username) : '未知成员'
}
const getPriorityText = (p: number) => ({ 3: '紧急', 2: '高', 1: '普通' }[p] || '普通')
const getPriorityType = (p: number) => ({ 3: 'danger', 2: 'warning', 1: 'info' }[p] || 'info')
const getStatusText = (s: number) => columns.find(c => c.status === s)?.name || '未知'
const getStatusType = (s: number) => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success' }[s] || 'info')

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.substring(5, 10) // 仅截取 MM-DD
}

const getDeadlineClass = (dateStr: string) => {
  if (!dateStr) return 'safe'
  const dl = new Date(dateStr).getTime()
  const now = new Date().getTime()
  if (dl < now) return 'danger'
  if (dl - now < 86400000 * 2) return 'warning'
  return 'safe'
}

onMounted(() => {
  initProjectData()
  fetchBoard()
})
</script>

<style scoped>
.board-container { height: calc(100vh - 100px); display: flex; flex-direction: column; }

/* 顶部操作区 */
.top-action-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px 20px; background: #fff; border-bottom: 1px solid #ebeef5;
}
.left-actions { display: flex; align-items: center; }

/* 核心看板区 */
.kanban-board {
  flex: 1; display: flex; gap: 20px; overflow-x: auto; padding: 20px;
  background-color: #f4f5f7; align-items: flex-start;
}

.column {
  min-width: 320px; width: 320px; background: #ebecf0;
  border-radius: 8px; display: flex; flex-direction: column;
  max-height: 100%;
}
.column-header {
  padding: 12px 16px; font-weight: bold; font-size: 14px;
  display: flex; justify-content: space-between; align-items: center;
  border-top-left-radius: 8px; border-top-right-radius: 8px;
}
.col-todo { border-top: 4px solid #909399; }
.col-doing { border-top: 4px solid #409eff; }
.col-review { border-top: 4px solid #e6a23c; }
.col-done { border-top: 4px solid #67c23a; }

.col-count { background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 12px; font-size: 12px; }

/* 拖拽区与卡片 */
.drag-area { flex: 1; padding: 10px; overflow-y: auto; min-height: 150px; }
.task-card { margin-bottom: 12px; cursor: grab; border-radius: 6px; }
.task-card:active { cursor: grabbing; }
.ghost-card { opacity: 0.5; background: #c8ebfb; border: 1px dashed #409eff; }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.task-id { font-size: 12px; color: #909399; font-family: monospace; }
.card-middle { margin-bottom: 12px; }
.task-title { font-size: 14px; font-weight: bold; color: #303133; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; }
.deadline { font-size: 12px; display: flex; align-items: center; gap: 4px; }
.deadline.danger { color: #f56c6c; font-weight: bold; }
.deadline.warning { color: #e6a23c; font-weight: bold; }
.deadline.safe { color: #909399; }

.quick-add {
  padding: 12px; text-align: center; color: #909399;
  cursor: pointer; transition: all 0.3s;
}
.quick-add:hover { background: #e4e7ed; color: #303133; }

.edit-section {
  margin-bottom: 5px;
}
.edit-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: bold;
}
:deep(.el-divider--horizontal) {
  margin: 24px 0 15px 0;
}

/* 抽屉样式 */
.description-area { padding-bottom: 15px; }
.subtask-area { background: #fafafa; padding: 15px; border-radius: 8px; border: 1px solid #ebeef5; }
</style>