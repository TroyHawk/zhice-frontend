import { createApp } from 'vue'
import App from './App.vue'

// 1. 引入我们写的路由配置
import router from './router' 

// 2. 引入 Element Plus 组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

// 3. 将路由和 Element Plus 注册到 Vue 应用中
app.use(router) 
app.use(ElementPlus)

app.mount('#app')