<template>
  <div class="document-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">🚀 成果智能组装工作台</span>
            <span class="subtitle">模块化生成 / 局部精准微调 / 版本历史回溯</span>
          </div>
          <div class="header-ops">
            <el-button :icon="Clock" @click="handleShowHistory">版本记录</el-button>
            
            <el-button 
              type="primary" 
              :icon="MagicStick" 
              @click="handleGenerateInitial" 
              :loading="isGeneratingAll"
            >
              {{ hasGenerated ? '重新生成全部' : '一键生成核心模块' }}
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="!hasGenerated && !isGeneratingAll" class="empty-guide">
        <el-empty description="点击右上角按钮，AI 将根据智库资料为您拆解并生成四大核心模块" />
      </div>

      <div v-if="isGeneratingAll" class="global-loading">
        <el-icon class="is-loading" :size="50" color="#409eff"><Loading /></el-icon>
        <h3 style="margin-top: 20px;">大模型正在深度阅读项目智库...</h3>
        <p style="color: #909399;">正在为您拆解并撰写：项目背景、核心创新、技术架构、市场前景，请稍候约30秒</p>
      </div>

      <transition name="el-fade-in">
        <div v-if="hasGenerated && !isGeneratingAll" class="modules-grid">
          <el-row :gutter="20">
            <el-col :span="12" v-for="(section, key) in sections" :key="key" style="margin-bottom: 20px;">
              <el-card class="section-card" shadow="hover" v-loading="section.isLoading" element-loading-text="AI 局部润色重写中...">
                <div class="section-title">
                  <el-icon><component :is="section.icon" /></el-icon>
                  {{ section.title }}
                </div>
                
                <el-input
                  v-model="section.content"
                  type="textarea"
                  :rows="8"
                  class="custom-textarea"
                />

                <div class="ai-polish-area">
                  <el-input
                    v-model="section.prompt"
                    placeholder="输入润色要求 (例：精简为三句话，突出核心优势)"
                    size="small"
                    @keyup.enter="handlePolish(key)"
                  >
                    <template #append>
                      <el-button type="primary" @click="handlePolish(key)" :icon="Filter">
                        AI 润色
                      </el-button>
                    </template>
                  </el-input>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <div class="export-bar">
            <el-input 
              v-model="draftName" 
              placeholder="请输入版本名称，如：国赛终审定稿" 
              style="width: 300px; margin-right: 15px;"
            >
              <template #prepend>版本名称</template>
            </el-input>
            
            <el-button 
              type="success" 
              size="large" 
              :icon="Download" 
              @click="handleSaveAndExport" 
              :loading="isExporting"
            >
              保存并导出标准 Word
            </el-button>
          </div>
        </div>
      </transition>
    </el-card>

    <el-dialog v-model="historyVisible" title="项目草稿历史" width="700px">
      <el-table :data="draftList" v-loading="loadingHistory" border stripe>
        <el-table-column prop="versionName" label="版本名称" min-width="150" />
        <el-table-column prop="createTime" label="保存时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handlePreview(scope.row)">预览回滚</el-button>
            <el-button type="success" link @click="handleDownloadHistory(scope.row)">导出Word</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, Download, Loading, Filter, Document, Aim, Cpu, DataLine, Clock } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const projectId = route.params.id

// --- 全局交互状态 ---
const hasGenerated = ref(false)
const isGeneratingAll = ref(false)
const isExporting = ref(false)
const draftName = ref('挑战杯_初稿_v1')

// --- 历史版本状态 ---
const historyVisible = ref(false)
const loadingHistory = ref(false)
const draftList = ref([])

// --- 四大模块数据结构 ---
const sections = reactive<Record<string, any>>({
  background: { title: '项目背景与痛点', icon: Document, content: '', prompt: '', isLoading: false },
  innovation: { title: '核心创新点', icon: Aim, content: '', prompt: '', isLoading: false },
  architecture: { title: '技术架构实现', icon: Cpu, content: '', prompt: '', isLoading: false },
  market: { title: '商业模式与市场', icon: DataLine, content: '', prompt: '', isLoading: false }
})

// 1. 一键初始化全部模块
const handleGenerateInitial = async () => {
  isGeneratingAll.value = true
  hasGenerated.value = false
  
  try {
    // 调用大模型生成全量 JSON
    const res: any = await request.post(`/documents/${projectId}/generate-initial`)
    if (res.code === 200) {
      try {
        let rawData = res.data || '{}'
        
        // 防御性处理：剥离模型可能附带的 Markdown json 标记
        if (rawData.includes('```json')) {
          rawData = rawData.replace(/```json/g, '').replace(/```/g, '').trim()
        } else if (rawData.includes('```')) {
          rawData = rawData.replace(/```/g, '').trim()
        }
        
        const parsedData = JSON.parse(rawData)

        // 精准填充
        sections.background.content = parsedData.background || 'AI 未能生成项目背景...'
        sections.innovation.content = parsedData.innovation || 'AI 未能生成创新点...'
        sections.architecture.content = parsedData.architecture || 'AI 未能生成技术架构...'
        sections.market.content = parsedData.market || 'AI 未能生成市场前景...'

        hasGenerated.value = true
        ElMessage.success('🎉 四个核心模块已全部精准解析并填充！')
      } catch (parseError) {
        console.error('JSON 解析失败，原始返回：', res.data)
        ElMessage.error('AI 返回的数据格式异常，无法解析，请重试')
      }
    }
  } catch (error) {
    ElMessage.error('生成失败，请检查网络或大模型服务')
  } finally {
    isGeneratingAll.value = false
  }
}

// 2. 局部 AI 精准润色
const handlePolish = async (key: string) => {
  const targetSection = sections[key]
  if (!targetSection.prompt.trim()) {
    return ElMessage.warning('请输入您的局部润色要求！')
  }

  targetSection.isLoading = true // 仅触发当前卡片的 Loading
  try {
    const res: any = await request.post(`/documents/${projectId}/iterate`, {
      oldContent: targetSection.content,
      userPrompt: targetSection.prompt
    })
    
    if (res.code === 200) {
      targetSection.content = res.data
      targetSection.prompt = '' // 清空输入框
      ElMessage.success(`【${targetSection.title}】模块润色完成！`)
    }
  } catch (error) {
    ElMessage.error('润色失败')
  } finally {
    targetSection.isLoading = false
  }
}

// 3. 组合并导出
const handleSaveAndExport = async () => {
  if (!draftName.value.trim()) return ElMessage.warning('请为定稿命名')
  
  isExporting.value = true
  try {
    // 重新组合成纯净的 JSON 字符串发给后端
    const combinedContent = JSON.stringify({
      background: sections.background.content,
      innovation: sections.innovation.content,
      architecture: sections.architecture.content,
      market: sections.market.content
    })

    // 第一步：存入数据库获取 draftId
    const saveRes: any = await request.post('/documents/drafts', {
      projectId: projectId,
      content: combinedContent,
      versionName: draftName.value // 精准对齐后端的 versionName
    })

    if (saveRes.code === 200) {
      const draftId = saveRes.data
      
      // 第二步：请求文件流下载 (需要后端对接 poi-tl)
      const exportRes: any = await request.get(`/documents/${draftId}/export`, {
        responseType: 'blob', // 极重要：指定二进制流格式
        timeout: 60000 
      })

      // 浏览器创建 Blob URL 触发下载
      const blob = new Blob([exportRes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${draftName.value}.docx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('🎉 定稿已成功保存并导出为官方 Word！')
    } else {
       ElMessage.error(saveRes.message || '保存草稿失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败，请检查网络或后端日志')
  } finally {
    isExporting.value = false
  }
}

// 4. 展示历史版本列表
const handleShowHistory = async () => {
  historyVisible.value = true
  loadingHistory.value = true
  try {
    const res: any = await request.get(`/documents/projects/${projectId}/drafts`)
    if (res.code === 200) {
      draftList.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取版本列表失败')
  } finally {
    loadingHistory.value = false
  }
}

// 5. 预览并回滚到该版本
const handlePreview = (draft: any) => {
  ElMessageBox.confirm(
    `确定要预览并载入版本【${draft.versionName}】吗？当前未保存的修改将会被覆盖。`,
    '版本回滚确认',
    { type: 'warning' }
  ).then(() => {
    try {
      const parsedData = JSON.parse(draft.content)
      // 将历史数据重新填充到 4 个卡片
      sections.background.content = parsedData.background || ''
      sections.innovation.content = parsedData.innovation || ''
      sections.architecture.content = parsedData.architecture || ''
      sections.market.content = parsedData.market || ''
      
      hasGenerated.value = true
      draftName.value = draft.versionName + '_副本'
      historyVisible.value = false
      ElMessage.success('历史版本已成功载入工作台！')
    } catch (e) {
      ElMessage.error('该版本数据格式异常，无法解析')
    }
  }).catch(() => {})
}

// 6. 从历史列表直接下载
const handleDownloadHistory = async (draft: any) => {
  try {
    const res: any = await request.get(`/documents/${draft.id}/export`, {
      responseType: 'blob',
      timeout: 60000
    })
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${draft.versionName}.docx`)
    document.body.appendChild(link)
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

// 7. 辅助：格式化日期
const formatTime = (time: string) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}
</script>

<style scoped>
.document-container { max-width: 1300px; margin: 0 auto; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-weight: bold; font-size: 18px; display: block; margin-bottom: 5px; }
.subtitle { font-size: 12px; color: #909399; }
.header-ops { display: flex; gap: 10px; }

.empty-guide, .global-loading {
  text-align: center;
  padding: 80px 0;
}
.is-loading { animation: rotating 2s linear infinite; }
@keyframes rotating { 100% { transform: rotate(360deg); } }

.modules-grid { margin-top: 20px; }
.section-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fafafa;
}
.section-title {
  font-weight: bold;
  font-size: 15px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

/* 去除 textarea 边框，让它融入卡片 */
:deep(.custom-textarea .el-textarea__inner) {
  border: none;
  background-color: transparent;
  padding: 0;
  box-shadow: none;
  resize: none;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
  line-height: 1.6;
}

.ai-polish-area {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #e4e7ed;
}

.export-bar {
  margin-top: 20px;
  padding: 20px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>