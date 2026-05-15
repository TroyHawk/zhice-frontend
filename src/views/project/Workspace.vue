<template>
  <el-container class="workspace-container">
    <el-header class="workspace-header">
      <div class="logo-area">
        <span class="back-btn" @click="goBack">← 返回项目大厅</span>
        <span class="divider">|</span>
        <span class="project-name">智策项目工作台</span>
      </div>
    </el-header>

    <el-container>
      <el-aside width="220px" class="workspace-aside">
        <el-menu
          :default-active="activePath"
          class="side-menu"
          router
        >
          <el-menu-item :index="`/projects/${projectId}/members`">
            <el-icon><User /></el-icon>
            <span>团队成员管理</span>
          </el-menu-item>
          <el-menu-item :index="`/projects/${projectId}/knowledge`">
            <el-icon><Document /></el-icon>
            <span>AI 智库中心</span>
          </el-menu-item>
          <el-menu-item :index="`/projects/${projectId}/document`">
            <el-icon><MagicStick /></el-icon>
            <span>成果一键生成</span>
          </el-menu-item>
          <el-menu-item :index="`/projects/${projectId}/tasks`">
            <el-icon><List /></el-icon>
            <span>敏捷任务看板</span>
          </el-menu-item>
          <el-menu-item :index="`/projects/${projectId}/dashboard`">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析看板</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="workspace-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Document, MagicStick, List, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 从地址栏获取当前的项目 ID
const projectId = computed(() => route.params.id)

// 让菜单高亮当前选中的页面
const activePath = computed(() => route.path)

const goBack = () => {
  router.push('/projects')
}
</script>

<style scoped>
.workspace-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.workspace-header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  z-index: 10;
}

.logo-area {
  font-size: 18px;
  font-weight: bold;
}

.back-btn {
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s;
}

.back-btn:hover {
  color: #409eff;
}

.divider {
  margin: 0 15px;
  color: #dcdfe6;
}

.project-name {
  color: #303133;
}

.workspace-aside {
  background-color: #ffffff;
  border-right: 1px solid #e6e6e6;
}

.side-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.workspace-main {
  padding: 20px;
}
</style>