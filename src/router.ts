import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Create from './pages/Create.vue'
import Scan from './pages/Scan.vue'
import Profile from './pages/Profile.vue'

// Hash Router:提高静态部署兼容性(GitHub Pages / 任意静态目录 / 本地文件)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: 'QRCard · 一个二维码，就是你的个人主页' } },
    { path: '/create', name: 'create', component: Create, meta: { title: '创建名片 · QRCard' } },
    { path: '/scan', name: 'scan', component: Scan, meta: { title: '扫描二维码 · QRCard' } },
    { path: '/view', name: 'view', component: Profile, meta: { title: '个人主页 · QRCard' } },
    { path: '/p/:payload?', name: 'p', component: Profile, meta: { title: '个人主页 · QRCard' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'QRCard'
})

export default router
