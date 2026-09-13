<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { QrCode, ScanLine, Github, Lock } from 'lucide-vue-next'
import { toasts } from './store/toast'
import SaveFallbackOverlay from './components/SaveFallbackOverlay.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="app-header">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <RouterLink to="/" class="flex items-center gap-2.5 no-underline text-inherit">
          <span class="logo-badge"><QrCode :size="19" :stroke-width="2.6" />QRCard</span>
          <span class="hidden md:inline font-mono-tag text-[var(--muted)]">你的主页，就住在二维码里</span>
        </RouterLink>
        <nav class="ml-auto flex items-center gap-2.5">
          <RouterLink to="/create" class="nb-btn is-sm is-yellow" active-class="is-pink">
            <svg width="0" height="0" class="hidden"></svg>创建名片
          </RouterLink>
          <RouterLink to="/scan" class="nb-btn is-sm" active-class="is-cyan">
            <ScanLine :size="15" :stroke-width="2.6" />扫描二维码
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t-[3px] border-[var(--ink)] bg-[var(--ink)] text-[#f5f1e8] mt-14">
      <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-5 md:items-center">
        <div class="flex-1">
          <div class="font-black text-lg">QRCard</div>
          <p class="text-[13px] opacity-80 mt-1.5 font-semibold">
            纯前端 · Local-First · 无需注册 · 无需服务器 · 无需数据库
          </p>
          <p class="text-[12px] opacity-60 mt-1 flex items-center gap-1.5 font-semibold">
            <Lock :size="12" />所有数据只在你的浏览器与二维码中处理,从不上传
          </p>
        </div>
        <div class="font-mono text-[12px] opacity-75 leading-6 md:text-right">
          <div>PROTOCOL <span class="text-[var(--yellow)]">QRCARD:1</span></div>
          <div>MIT LICENSE · OPEN SPEC</div>
          <div>YOUR PROFILE LIVES INSIDE THE QR CODE</div>
        </div>
      </div>
    </footer>

<!-- 内置浏览器下载兜底浮层(微信/支付宝等,全局唯一实例) -->
    <SaveFallbackOverlay />

    <!-- Toast -->
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="{ 'is-error': t.type === 'error', 'is-info': t.type === 'info' }">
        {{ t.msg }}
      </div>
    </div>
  </div>
</template>
