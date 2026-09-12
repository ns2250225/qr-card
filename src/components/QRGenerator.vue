<script setup lang="ts">
// 二维码生成结果:展示 / 保存 PNG / 分享海报 / 打印名片 / 复制数据 / 导出 .qrcard
import { onMounted, ref, watch } from 'vue'
import { X, Download, Printer, Copy, FileDown, RefreshCcw, Share2, ShieldCheck } from 'lucide-vue-next'
import type { Profile, PublicProfile } from '../types'
import { renderQrToCanvas, renderQrToDataUrl } from '../qr/generate'
import { exportShareCard } from '../profile/sharecard'
import { copyText, downloadBlob, toast } from '../store/toast'

const props = defineProps<{
  publicProfile: PublicProfile
  editorProfile: Profile
  protocol: string
  qrContent: string
  ec: string
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'export-card'): void }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const qrDataUrl = ref('')
const failed = ref(false)

const safeName = () => (props.publicProfile.name || '名片').replace(/[\\/:*?"<>|]/g, '')

async function render() {
  failed.value = false
  try {
    if (canvasEl.value) {
      await renderQrToCanvas(canvasEl.value, props.qrContent, props.ec as any)
      // qrcode.toCanvas 会写入 560px 的内联宽高,覆盖回模态框内的固定显示尺寸(内部仍为 560px,保证清晰)
      canvasEl.value.style.width = '240px'
      canvasEl.value.style.height = '240px'
    }
    qrDataUrl.value = await renderQrToDataUrl(props.qrContent, props.ec as any, 560)
  } catch {
    failed.value = true
  }
}

onMounted(render)
watch(() => props.qrContent, render)

async function saveQrPng() {
  if (!canvasEl.value) return
  canvasEl.value.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, `QRCard-${safeName()}.png`)
      toast('二维码已保存')
    }
  }, 'image/png')
}

async function sharePng() {
  try {
    await exportShareCard(props.publicProfile, props.qrContent, `QRCard分享-${safeName()}.png`)
    toast('分享图片已生成')
  } catch {
    toast('分享图片生成失败', 'error')
  }
}

function printCard() {
  window.print()
}

async function copyData() {
  const ok = await copyText(props.protocol)
  toast(ok ? '协议数据已复制到剪贴板' : '复制失败', ok ? 'ok' : 'error')
}
</script>

<template>
  <div class="nb-modal-mask" @click.self="emit('close')">
    <div class="nb-modal p-5" role="dialog" aria-modal="true" aria-label="我的 QRCard">
      <div class="flex items-center mb-3">
        <span class="nb-tag">我的 QRCard</span>
        <button type="button" class="nb-btn is-sm is-red ml-auto !px-2 !py-1" aria-label="关闭" @click="emit('close')">
          <X :size="15" />
        </button>
      </div>

      <div class="text-center mb-3">
        <div class="font-black text-[22px]">{{ publicProfile.name }}</div>
        <div class="text-[13px] font-semibold text-[var(--muted)]">
          {{ [publicProfile.title, publicProfile.company].filter(Boolean).join(' · ') || '扫一扫认识我' }}
        </div>
      </div>

      <div class="mx-auto mb-3 w-fit p-2.5 bg-white border-[3px] border-[var(--ink)] rounded-lg shadow-[5px_5px_0_var(--ink)]">
        <canvas v-show="!failed" ref="canvasEl" class="block w-[240px] h-[240px]" aria-label="个人名片二维码"></canvas>
        <div v-if="failed" class="w-[240px] h-[240px] flex items-center justify-center text-[13px] font-bold text-[#c92a2a] px-4 text-center">
          二维码生成失败:内容超出当前纠错等级容量
        </div>
      </div>

      <div class="flex flex-wrap justify-center gap-x-3.5 gap-y-1 mb-4 text-[12px] font-bold">
        <span class="flex items-center gap-1"><ShieldCheck :size="13" class="text-[#1e9e50]" />扫码稳定</span>
        <span class="flex items-center gap-1"><ShieldCheck :size="13" class="text-[#1e9e50]" />无需账号</span>
        <span class="flex items-center gap-1"><ShieldCheck :size="13" class="text-[#1e9e50]" />无需数据库</span>
        <span class="flex items-center gap-1"><ShieldCheck :size="13" class="text-[#1e9e50]" />数据没有上传服务器</span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <button type="button" class="nb-btn is-yellow" @click="saveQrPng"><Download :size="15" />保存二维码</button>
        <button type="button" class="nb-btn is-pink" @click="sharePng"><Share2 :size="15" />分享图片</button>
        <button type="button" class="nb-btn" @click="printCard"><Printer :size="15" />打印</button>
        <button type="button" class="nb-btn is-cyan" @click="copyData"><Copy :size="15" />复制数据</button>
        <button type="button" class="nb-btn" @click="emit('export-card')"><FileDown :size="15" />导出名片</button>
        <button type="button" class="nb-btn is-dark" @click="emit('close')"><RefreshCcw :size="15" />重新编辑</button>
      </div>

      <details class="mt-3">
        <summary class="font-mono-tag cursor-pointer select-none text-[var(--muted)]">查看协议数据 QRCARD:1</summary>
        <p class="mt-1.5 p-2 bg-white border-2 border-[var(--ink)] rounded font-mono text-[10.5px] break-all max-h-24 overflow-auto m-0">{{ protocol }}</p>
      </details>
    </div>

    <!-- 打印用:标准名片 85×54mm -->
    <div class="print-card" aria-hidden="true">
      <div class="flex flex-col h-full">
        <div class="p-name">{{ publicProfile.name }}</div>
        <div class="p-title">{{ [publicProfile.title, publicProfile.company].filter(Boolean).join(' · ') }}</div>
        <div class="p-hint">扫一扫认识我 · QRCard</div>
      </div>
      <img class="p-qr" :src="qrDataUrl" alt="" />
    </div>
  </div>
</template>
