<script setup lang="ts">
// 下载兜底浮层:微信/支付宝等内置浏览器拦截 a[download] 时的替代方案
// 图片 → 长按保存到相册;文件 → 引导「右上角 ··· 在浏览器打开」+ 可选复制内容
import { X, Copy, Info } from 'lucide-vue-next'
import { saveFallback, closeSaveFallback } from '../store/save'
import { copyText, toast } from '../store/toast'

async function copyContent() {
  const ok = await copyText(saveFallback.copyText)
  toast(ok ? '内容已复制,可粘贴发给朋友或存到备忘录' : '复制失败', ok ? 'ok' : 'error')
}
</script>

<template>
  <div v-if="saveFallback.show" class="sfo-mask" @click.self="closeSaveFallback">
    <div class="sfo-card" role="dialog" aria-modal="true" :aria-label="saveFallback.mode === 'image' ? '长按保存图片' : '下载引导'">
      <div class="flex items-center mb-3">
        <span class="nb-tag">{{ saveFallback.mode === 'image' ? '保存图片' : '下载引导' }}</span>
        <button type="button" class="nb-btn is-sm is-red ml-auto !px-2 !py-1" aria-label="关闭" @click="closeSaveFallback">
          <X :size="15" />
        </button>
      </div>

      <!-- 图片:长按保存 -->
      <template v-if="saveFallback.mode === 'image'">
        <div class="mx-auto mb-3 w-fit p-2 bg-white border-[3px] border-[var(--ink)] rounded-lg">
          <!-- data URL 才能长按呼出微信/支付宝的图片菜单,不要换成 blob: -->
          <img class="sfo-img block max-w-[62vw] max-h-[46vh]" :src="saveFallback.imageSrc" alt="长按保存的图片" />
        </div>
        <p class="font-black text-[15px] text-center m-0">长按图片,选择「保存图片」</p>
        <p class="text-[12px] font-semibold text-[var(--muted)] text-center mt-1.5 mb-0">
          内置浏览器不支持直接下载,也可长按后发送给朋友<br />
          若长按无反应:点右上角「···」→ 在浏览器打开后重试
        </p>
      </template>

      <!-- 文件:引导用系统浏览器打开 -->
      <template v-else>
        <p class="font-black text-[15px] text-center m-0">内置浏览器暂不支持下载文件</p>
        <ol class="sfo-steps">
          <li>点右上角「···」(或「更多」)</li>
          <li>选择「在浏览器打开」</li>
          <li>回到系统浏览器重新点一次下载</li>
        </ol>
        <p v-if="saveFallback.filename" class="font-mono text-[11px] text-center text-[var(--muted)] mt-0 mb-3 break-all">
          {{ saveFallback.filename }}
        </p>
        <button v-if="saveFallback.copyText" type="button" class="nb-btn is-yellow w-full justify-center mb-2" @click="copyContent">
          <Copy :size="15" />复制文件内容
        </button>
      </template>

      <button type="button" class="nb-btn w-full justify-center" @click="closeSaveFallback">
        <Info :size="15" />知道了
      </button>
    </div>
  </div>
</template>

<style scoped>
.sfo-mask {
  position: fixed;
  inset: 0;
  z-index: 75; /* 高于 nb-modal(z-60),低于 toast(z-100) */
  background: rgba(17, 17, 17, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.sfo-card {
  background: var(--paper);
  border: var(--bw) solid var(--ink);
  border-radius: 12px;
  box-shadow: 8px 8px 0 var(--ink);
  width: 100%;
  max-width: 340px;
  padding: 16px;
  max-height: 92vh;
  overflow-y: auto;
}
/* 允许 iOS WKWebView 长按呼出图片菜单(防止全局样式禁用) */
.sfo-img {
  -webkit-touch-callout: default;
  -webkit-user-select: auto;
  user-select: auto;
}
.sfo-steps {
  margin: 12px 0;
  padding-left: 22px;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 2;
}
</style>
