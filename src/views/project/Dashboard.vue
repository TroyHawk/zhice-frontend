<template>
  <div class="dashboard-container" v-loading="loading">
    <!-- 1. 项目概览卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">项目名称</div>
          <div class="stat-value">{{ dashboard.projectOverview.projectName }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">竞赛类型</div>
          <div class="stat-value">
            <el-tag size="large" effect="plain" type="warning">
              {{ getCompetitionText(dashboard.projectOverview.competitionType) }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">团队成员</div>
          <div class="stat-value">{{ dashboard.projectOverview.memberCount }} 人</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">项目状态</div>
          <div class="stat-value">
            <el-tag size="large" :type="getProjectStatusType(dashboard.projectOverview.projectStatus)">
              {{ getProjectStatusText(dashboard.projectOverview.projectStatus) }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 任务统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card task-total">
          <div class="stat-label">任务总数</div>
          <div class="stat-value">{{ dashboard.taskStats.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card task-todo">
          <div class="stat-label">待处理</div>
          <div class="stat-value">{{ dashboard.taskStats.todo }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card task-doing">
          <div class="stat-label">进行中</div>
          <div class="stat-value">{{ dashboard.taskStats.inProgress }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card task-review">
          <div class="stat-label">审核中</div>
          <div class="stat-value">{{ dashboard.taskStats.review }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card task-done">
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ dashboard.taskStats.done }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card task-rate">
          <div class="stat-label">完成率</div>
          <div class="stat-value">{{ dashboard.taskStats.completionRate }}%</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 3. 图表区：饼图 + 折线图 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">任务状态分布</span>
          </template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">近 7 天任务完成趋势</span>
          </template>
          <div ref="lineChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 成员贡献柱状图 -->
    <el-row class="chart-row">
      <el-col :span="24">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">成员任务贡献对比</span>
          </template>
          <div ref="barChartRef" class="chart-box chart-box-lg"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 5. 知识库统计 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="5">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">知识库文档</div>
          <div class="stat-value">{{ dashboard.knowledgeStats.totalDocuments }}</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">已解析</div>
          <div class="stat-value success">{{ dashboard.knowledgeStats.parsedCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">解析中</div>
          <div class="stat-value warning">{{ dashboard.knowledgeStats.parsingCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">解析失败</div>
          <div class="stat-value danger">{{ dashboard.knowledgeStats.failedCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">文件总大小</div>
          <div class="stat-value">{{ formatFileSize(dashboard.knowledgeStats.totalFileSize) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 6. AI 生成统计 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">AI 累计生成次数</div>
          <div class="stat-value">{{ dashboard.draftStats.totalDrafts }}</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">最近生成时间</div>
          <div class="stat-value" style="font-size: 18px;">{{ formatLatestDraftTime(dashboard.draftStats.latestDraftTime) }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDashboardData, type DashboardData } from '@/api/dashboard'

const route = useRoute()
const projectId = route.params.id as string

const loading = ref(true)

const dashboard = reactive<DashboardData>({
  projectOverview: { projectName: '', competitionType: 0, memberCount: 0, projectStatus: 0 },
  taskStats: { total: 0, todo: 0, inProgress: 0, review: 0, done: 0, completionRate: 0 },
  dailyCompletion: [],
  memberContributions: [],
  knowledgeStats: { totalDocuments: 0, parsedCount: 0, parsingCount: 0, failedCount: 0, totalFileSize: 0 },
  draftStats: { totalDrafts: 0, latestDraftTime: null }
})

// 图表 DOM 引用
const pieChartRef = ref<HTMLDivElement | null>(null)
const lineChartRef = ref<HTMLDivElement | null>(null)
const barChartRef = ref<HTMLDivElement | null>(null)

let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

// --- 数据获取 ---
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getDashboardData(projectId)
    if (res.code === 200) {
      Object.assign(dashboard, res.data)
      await nextTick()
      renderCharts()
    } else {
      ElMessage.error(res.message || '获取仪表盘数据失败')
    }
  } catch (e) {
    ElMessage.error('网络异常，获取仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

// --- 图表渲染 ---
const renderPieChart = () => {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()

  pieChart = echarts.init(pieChartRef.value)
  const { todo, inProgress, review, done } = dashboard.taskStats

  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: todo, name: '待处理', itemStyle: { color: '#e0e0e0' } },
        { value: inProgress, name: '进行中', itemStyle: { color: '#409eff' } },
        { value: review, name: '审核中', itemStyle: { color: '#e6a23c' } },
        { value: done, name: '已完成', itemStyle: { color: '#67c23a' } }
      ]
    }]
  })
}

const renderLineChart = () => {
  if (!lineChartRef.value) return
  if (lineChart) lineChart.dispose()

  lineChart = echarts.init(lineChartRef.value)
  const data = dashboard.dailyCompletion

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.date.substring(5)), // MM-DD
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11 }
    },
    series: [{
      type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#409eff', width: 2 },
      itemStyle: { color: '#409eff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
        ])
      }
    }]
  })
}

const renderBarChart = () => {
  if (!barChartRef.value) return
  if (barChart) barChart.dispose()

  barChart = echarts.init(barChartRef.value)
  const members = dashboard.memberContributions

  const roleIcon: Record<number, string> = { 1: '👑', 2: '', 3: '👨‍🏫' }
  const names = members.map(m => `${m.realName} ${roleIcon[m.role] || ''}`).reverse()
  const totalData = members.map(m => m.totalTasks).reverse()
  const doneData = members.map(m => m.completedTasks).reverse()

  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['任务总数', '已完成'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '5%', containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 12 } },
    series: [
      {
        name: '任务总数',
        type: 'bar',
        data: totalData,
        itemStyle: { color: '#a0cfff', borderRadius: [0, 4, 4, 0] },
        barGap: '10%'
      },
      {
        name: '已完成',
        type: 'bar',
        data: doneData,
        itemStyle: { color: '#409eff', borderRadius: [0, 4, 4, 0] }
      }
    ]
  })
}

const renderCharts = () => {
  renderPieChart()
  renderLineChart()
  renderBarChart()
}

const handleResize = () => {
  pieChart?.resize()
  lineChart?.resize()
  barChart?.resize()
}

// --- 辅助方法 ---
const getCompetitionText = (type: number) => {
  const map: Record<number, string> = { 1: '大创', 2: '互联网+', 3: '挑战杯', 4: '大学生应用设计大赛', 5: '其他' }
  return map[type] || '未知'
}

const getProjectStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '筹备中', 1: '进行中', 2: '已结题' }
  return map[status] || '未知'
}

const getProjectStatusType = (status: number) => {
  const map: Record<number, 'info' | 'success' | 'warning'> = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[status] || 'info'
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatLatestDraftTime = (time: string | null) => {
  if (!time) return '暂无记录'
  const d = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  lineChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0 5px;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
}

.stat-card .stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.stat-value.danger { color: #f56c6c; }

/* 任务卡片左侧色条 */
.task-total { border-left: 4px solid #909399; }
.task-todo { border-left: 4px solid #e0e0e0; }
.task-doing { border-left: 4px solid #409eff; }
.task-review { border-left: 4px solid #e6a23c; }
.task-done { border-left: 4px solid #67c23a; }
.task-rate { border-left: 4px solid #409eff; }

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
}

.chart-title {
  font-weight: bold;
  font-size: 15px;
}

.chart-box {
  width: 100%;
  height: 320px;
}

.chart-box-lg {
  height: 380px;
}
</style>
