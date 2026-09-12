<script setup lang="ts">
// 扫描页:状态机 IDLE → CAMERA_REQUEST → SCANNING → DETECTED → PROTOCOL_CHECK → DECODE → VALIDATE → RENDER
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { QrCode, AlertTriangle, ExternalLink, RefreshCcw, CheckCircle2, ScanLine } from 'lucide-vue-next'
import QRScanner from '../components/QRScanner.vue'
import { splitProtocol, decodeProtocol } from '../protocol/encode'
import { safeUrl } from '../profile/sanitize'
import { toast } from '../store/toast'

const router = useRouter()

type Phase = 'idle' | 'decoding' | 'qrcard-invalid' | 'other' | 'error'
const phase = ref<Phase>('idle')
const rawText = ref('')
const errorMsg = ref('')
const otherUrl = ref<string | null>(null)
const decoding = ref(false)

async function onResult(text: string) {
  rawText.value = text
  // PROTOCOL_CHECK
  let header: { version: number } | null = null
  try {
    header = splitProtocol(text)
  } catch {
    header = null
  }

  if (!header) {
    // 非 QRCard 二维码:不得尝试当成 QRCard 数据解析
    otherUrl.value = safeUrl(text)
    phase.value = 'other'
    return
  }

  // DECODE → DECOMPRESS → VALIDATE
  decoding.value = true
  phase.value = 'decoding'
  try {
    const { profile } = await decodeProtocol(text)
    sessionStorage.setItem('qrcard.lastProfile', text.trim())
    toast(`识别成功:欢迎来到 ${profile.name} 的主页`)
    router.push('/view')
  } catch (err: any) {
    errorMsg.value = err?.message || '名片数据无效或已损坏'
    phase.value = 'qrcard-invalid'
  } finally {
    decoding.value = false
  }
}

function reset() {
  phase.value = 'idle'
  rawText.value = ''
  errorMsg.value = ''
  otherUrl.value = null
}

function openLink() {
  if (otherUrl.value) window.open(otherUrl.value, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2.5 mb-1">
      <ScanLine :size="24" :stroke-width="2.4" />
      <h1 class="font-brutal text-[26px] m-0">扫描 QRCard</h1>
    </div>
    <p class="text-[13px] font-semibold text-[var(--muted)] mb-6">
      扫描后数据在本地解码还原,全程不经服务器
    </p>

    <!-- 解码中 -->
    <div v-if="phase === 'decoding'" class="nb-card p-10 flex flex-col items-center gap-3">
      <span class="w-10 h-10 border-[4px] border-[var(--ink)] border-t-transparent rounded-full animate-spin"></span>
      <p class="font-bold m-0">已检测到 QRCard,正在本地解码…</p>
    </div>

    <!-- 扫描器 -->
    <QRScanner v-else-if="phase === 'idle'" @result="onResult" />

    <!-- 成功跳转提示(短暂) -->
    <!-- 失败:QRCard 数据无效 -->
    <div v-else-if="phase === 'qrcard-invalid'" class="nb-card p-6">
      <div class="flex items-center gap-2 font-black text-[16px] text-[#c92a2a] mb-2">
        <AlertTriangle :size="19" />无法读取这张 QRCard
      </div>
      <p class="text-[13.5px] font-semibold leading-relaxed mb-3">{{ errorMsg }}</p>
      <p class="p-2.5 bg-white border-2 border-[var(--ink)] rounded font-mono text-[11px] break-all max-h-20 overflow-auto m-0">{{ rawText.slice(0, 300) }}</p>
      <button type="button" class="nb-btn is-yellow mt-4" @click="reset"><RefreshCcw :size="15" />继续扫描</button>
    </div>

    <!-- 非 QRCard 二维码 -->
    <div v-else-if="phase === 'other'" class="nb-card p-6">
      <div class="flex items-center gap-2 font-black text-[16px] mb-2">
        <QrCode :size="19" />这不是 QRCard 二维码
      </div>
      <p class="text-[13.5px] font-semibold text-[var(--muted)] mb-2">识别内容:</p>
      <p class="p-2.5 bg-white border-2 border-[var(--ink)] rounded font-mono text-[12px] break-all m-0">{{ rawText }}</p>
      <div class="flex gap-2.5 mt-4">
        <button v-if="otherUrl" type="button" class="nb-btn is-yellow" @click="openLink">
          <ExternalLink :size="15" />打开链接
        </button>
        <button type="button" class="nb-btn" @click="reset"><RefreshCcw :size="15" />继续扫描</button>
      </div>
    </div>

    <!-- 之前扫过的名片入口 -->
    <div class="nb-card-flat p-4 mt-6 flex items-center gap-3">
      <CheckCircle2 :size="18" class="text-[#1e9e50] flex-none" />
      <p class="text-[12.5px] font-semibold m-0">提示:普通系统相机无法解析 QRCARD 自定义内容,请使用本页扫描,或创建时选择「通用模式」让相机直接打开链接。</p>
    </div>
  </div>
</template>
