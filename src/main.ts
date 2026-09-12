import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(router).mount('#app')

// PWA:生产环境注册 Service Worker,离线可用(Offline Digital Business Card)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const host = location.hostname
  const swOk = location.protocol === 'https:' || host === 'localhost' || host === '127.0.0.1'
  if (swOk) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* 静默失败,不影响功能 */
      })
    })
  }
}
