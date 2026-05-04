<template>
  <div class="knowledge-container">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card class="box-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">🧠 项目知识库</span>
              <el-tag size="small" type="info">RAG 向量检索</el-tag>
            </div>
          </template>

          <el-upload
            class="upload-area"
            drag
            action="javascript:void(0)"
            :http-request="handleCustomUpload"
            :show-file-list="false"
            accept=".pdf,.docx,.txt,.md"
            :disabled="isUploading"
          >
            <el-icon class="el-icon--upload" v-if="!isUploading"><upload-filled /></el-icon>
            <el-icon class="el-icon--upload is-loading" v-else><Loading /></el-icon>
            <div class="el-upload__text" v-if="!isUploading">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <div class="el-upload__text" v-else>
              文件切片与向量化处理中，请稍候...
            </div>
          </el-upload>

          <el-table :data="documentList" style="width: 100%" v-loading="loadingDocs" border size="small">
            <el-table-column prop="fileName" label="文档名称" show-overflow-tooltip>
              <template #default="scope">
                <el-icon><Document /></el-icon> {{ scope.row.fileName }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope">
                <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="chat-card" shadow="never" :body-style="{ padding: '0px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }">
          <template #header>
            <div class="card-header">
              <span class="title">✨ 智策 AI 助手</span>
              <span class="subtitle">基于当前项目资料为您提供精准解答</span>
            </div>
          </template>

          <div class="chat-window" ref="chatWindowRef">
            <div v-for="(msg, index) in chatList" :key="index" :class="['chat-bubble-wrapper', msg.role]">
              <el-avatar :size="36" class="avatar" :src="msg.role === 'ai' ? aiAvatar : userAvatar" />
              <div class="chat-bubble">
                <span style="white-space: pre-wrap;">{{ msg.content }}</span>
              </div>
            </div>
            <div class="chat-bubble-wrapper ai" v-if="isChatting">
              <el-avatar :size="36" class="avatar" :src="aiAvatar" />
              <div class="chat-bubble loading-bubble">
                思考检索中<span class="dot">...</span>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <el-input
              v-model="inputMsg"
              type="textarea"
              :rows="3"
              resize="none"
              placeholder="向 AI 提问（例如：总结一下本项目的核心创新点？）按 Enter 发送"
              @keydown.enter.prevent="sendMessage"
            />
            <div class="action-bar">
              <el-button type="primary" :icon="Position" @click="sendMessage" :loading="isChatting" :disabled="!inputMsg.trim()">
                发 送
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Document, Loading, Position } from '@element-plus/icons-vue'
import request from '@/utils/request'

// --- 类型声明 ---
interface KnowledgeDoc {
  id: number
  fileName: string
  fileSize: string
  status: number
  uploadTime: string
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

// --- 状态与变量 ---
const route = useRoute()
const projectId = route.params.id
const loadingDocs = ref(false)
const isUploading = ref(false)
const documentList = ref<KnowledgeDoc[]>([])
// --- 状态映射辅助函数 ---
const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '未解析', 1: '解析中', 2: '已解析', 3: '解析失败' }
  return map[status] || '未知状态'
}

const getStatusType = (status: number) => {
  const map: Record<number, 'info' | 'warning' | 'success' | 'danger'> = { 
    0: 'info',     // 灰色
    1: 'warning',  // 黄色
    2: 'success',  // 绿色
    3: 'danger'    // 红色
  }
  return map[status] || 'info'
}

const chatWindowRef = ref<HTMLElement | null>(null)
const inputMsg = ref('')
const isChatting = ref(false)
const chatList = ref<ChatMessage[]>([
  { role: 'ai', content: '您好！我是智策 AI 助手。我已经读取了左侧的知识库，您可以向我提问关于本项目的任何细节。' }
])

const aiAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const userAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

// ================= 左侧：文档管理逻辑 =================

// 1. 获取文档列表
const fetchDocuments = async () => {
  loadingDocs.value = true
  try {
    const res: any = await request.get(`/knowledge/${projectId}`)
    if (res.code === 200) {
      documentList.value = res.data || []
    }
  } catch (error) {
    console.error('获取智库列表失败', error)
  } finally {
    loadingDocs.value = false
  }
}

// 2. 自定义拖拽上传
const handleCustomUpload = async (options: any) => {
  const file = options.file
  const formData = new FormData()
  formData.append('file', file)

  isUploading.value = true
  try {
    const res: any = await request.post(`/knowledge/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200) {
      ElMessage.success('文件向量化成功！AI 已掌握该文档知识。')
      fetchDocuments()
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error('网络异常，上传失败')
  } finally {
    isUploading.value = false
  }
}

// 3. 删除文档
const handleDelete = (row: KnowledgeDoc) => {
  ElMessageBox.confirm(`确定删除文档《${row.fileName}》吗？AI 将丢失这部分记忆。`, '警告', { type: 'warning' }).then(async () => {
    try {
      const res: any = await request.delete(`/knowledge/${projectId}/${row.id}`)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchDocuments()
      }
    } catch (error) {
      console.error('删除异常', error)
    }
  }).catch(() => {})
}

// ================= 右侧：AI 聊天逻辑 =================

const scrollToBottom = () => {
  nextTick(() => {
    if (chatWindowRef.value) {
      chatWindowRef.value.scrollTop = chatWindowRef.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const msgText = inputMsg.value.trim()
  if (!msgText || isChatting.value) return

  // 1. 追加用户消息
  chatList.value.push({ role: 'user', content: msgText })
  inputMsg.value = ''
  isChatting.value = true
  scrollToBottom()

  // 2. 请求后端 RAG 接口
  try {
    const res: any = await request.get(`/knowledge/${projectId}/chat`, {
      params: { question: msgText } 
    })
    
    if (res.code === 200) {
      chatList.value.push({ role: 'ai', content: res.data })
    } else {
      chatList.value.push({ role: 'ai', content: '抱歉，检索时发生错误：' + res.message })
    }
  } catch (error) {
    chatList.value.push({ role: 'ai', content: '网络错误，无法连接到大模型服务。' })
  } finally {
    isChatting.value = false
    scrollToBottom()
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.knowledge-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title { font-weight: bold; font-size: 16px; }
.subtitle { font-size: 12px; color: #909399; margin-left: 10px; }

/* 上传区样式 */
.upload-area { margin-bottom: 20px; }
:deep(.el-upload-dragger) { padding: 30px 10px; }
.is-loading { animation: rotating 2s linear infinite; }
@keyframes rotating { 100% { transform: rotate(360deg); } }

/* 聊天区样式 */
.chat-card {
  height: calc(100vh - 100px);
}
.chat-window {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.chat-bubble-wrapper {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}
.chat-bubble-wrapper.user {
  flex-direction: row-reverse;
}
.avatar {
  margin: 0 10px;
  flex-shrink: 0;
}
.chat-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* AI 的气泡：白色，靠左 */
.chat-bubble-wrapper.ai .chat-bubble {
  background-color: #ffffff;
  color: #333;
  border-top-left-radius: 0;
}
/* 用户的气泡：蓝色，靠右 */
.chat-bubble-wrapper.user .chat-bubble {
  background-color: #409eff;
  color: #ffffff;
  border-top-right-radius: 0;
}

.chat-input-area {
  padding: 15px;
  background-color: #ffffff;
  border-top: 1px solid #ebeef5;
}
.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>