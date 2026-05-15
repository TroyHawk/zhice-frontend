import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/Login.vue')
    },
    {
      path: '/projects',
      name: 'ProjectList',
      component: () => import('../views/project/ProjectList.vue')
    },
    // 👇 新增的嵌套路由配置 👇
    {
      // :id 是动态路由参数，代表项目ID
      path: '/projects/:id',
      name: 'Workspace',
      component: () => import('../views/project/Workspace.vue'),
      // 当用户直接进入工作台时，默认重定向到成员管理页
      redirect: to => {
        return `/projects/${to.params.id}/members`
      },
      // children 里面的页面，会渲染在 Workspace.vue 的 <router-view /> 中
      children: [
        {
          path: 'members', // 注意这里不带斜杠，相当于 /projects/:id/members
          name: 'Members',
          component: () => import('../views/project/Members.vue')
        },
        // 后续的 AI智库、看板等页面，都会加在这个数组里！
        {
          path: 'knowledge', 
          name: 'Knowledge',
          component: () => import('../views/project/Knowledge.vue')
        },
        {
          path: 'document', // 注意不要带斜杠
          name: 'Document',
          component: () => import('../views/project/Document.vue')
        },
        {
        path: 'tasks',
        name: 'TaskBoard',
        component: () => import('../views/project/TaskBoard.vue')
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/project/Dashboard.vue')
      }
      ]
    },
    {
      path: '/',
      redirect: '/projects'
    }
  ]

})

// === 全局前置路由守卫 ===
router.beforeEach((to, from, next) => {
  // 1. 获取本地存储的 Token
  const token = localStorage.getItem('token')

  // 2. 如果要去的是登录页，直接放行
  if (to.path === '/login') {
    return next()
  }

  // 3. 如果去其他页面，但没有 Token，强制跳转到登录页
  if (!token) {
    return next('/login')
  }

  // 4. 有 Token，放行
  next()
})

export default router
