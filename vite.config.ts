import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// base: './' 使构建产物可直接部署到任意子路径
// (GitHub Pages / Cloudflare Pages / Nginx / 本地文件)
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
