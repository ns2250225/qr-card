<script setup lang="ts">
// 扫描器 UI:摄像头实时扫描 + 图片上传识别
// 状态机:IDLE → CAMERA_REQUEST → SCANNING / DENIED → DETECTED
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { Camera, CameraOff, Upload, RefreshCcw, Loader2 } from 'lucide-vue-next'
import { CameraScanner, decodeImageFile } from '../qr/scan'
import { toast } from '../store/toast'

const emit = defineEmits<{ (e: 'result', text: string): void }>()

const status = ref<'idle' | 'requesting' | 'scanning' | 'denied'>('idle')
const statusText = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const busyFile = ref(false)

const scanner = new CameraScanner()

async function startCamera() {
  if (status.value === 'requesting' || status.value === 'scanning') return
  status.value = 'requesting'
  statusText.value = '正在请求摄像头…'
  // <video> 只在非 idle 分支渲染,先等 DOM 随 status 切换挂载完成,再取引用
  await nextTick()
  const video = videoEl.value
  if (!video) {
    status.value = 'denied'
    statusText.value = '视频组件未就绪,请重试'
    return
  }
  try {
    await scanner.start(
      video,
      (text) => {
        status.value = 'idle'
        statusText.value = ''
        emit('result', text)
      },
      () => {
        if (status.value !== 'scanning') {
          status.value = 'scanning'
          statusText.value = '扫描中…将二维码放入框内'
        }
      },
    )
    status.value = 'scanning'
    statusText.value = '扫描中…将二维码放入框内'
  } catch (err: any) {
    // getUserMedia 成功但绑定/播放失败时,释放已占用的摄像头
    scanner.stop()
    status.value = 'denied'
    statusText.value =
      err?.name === 'NotAllowedError'
        ? '摄像头权限被拒绝,请在浏览器设置中允许后重试'
        : err?.name === 'NotFoundError'
          ? '未检测到摄像头设备'
          : `摄像头不可用:${err?.message || err}`
  }
}

function stopCamera() {
  scanner.stop()
  status.value = 'idle'
  statusText.value = ''
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busyFile.value = true
  try {
    const text = await decodeImageFile(file)
    if (text) {
      emit('result', text)
    } else {
      toast('未在图片中识别到二维码', 'error')
    }
  } catch {
    toast('图片识别失败', 'error')
  } finally {
    busyFile.value = false
  }
}

onBeforeUnmount(() => scanner.stop())
</script>

<template>
  <div>
    <div class="mx-auto w-fit">
      <div v-if="status === 'idle' || status === 'denied'" class="scan-frame flex flex-col items-center justify-center gap-3 px-6 text-center" style="background: #fffdf3">
        <template v-if="status === 'idle'">
          <Camera :size="42" :stroke-width="2" />
          <p class="font-bold text-[14px] m-0">开启摄像头扫描 QRCard</p>
          <p class="text-[12px] font-semibold text-[var(--muted)] m-0">数据全程本地解析,不会上传</p>
          <button type="button" class="nb-btn is-yellow" @click="startCamera"><Camera :size="16" />开启摄像头</button>
          <button type="button" class="nb-btn is-sm" @click="fileInput?.click()"><Upload :size="15" />上传二维码图片</button>
        </template>
        <template v-else>
          <CameraOff :size="42" :stroke-width="2" class="text-[#c92a2a]" />
          <p class="font-bold text-[13.5px] m-0 max-w-[240px]">{{ statusText }}</p>
          <div class="flex gap-2">
            <button type="button" class="nb-btn is-sm is-yellow" @click="startCamera"><RefreshCcw :size="14" />重试</button>
            <button type="button" class="nb-btn is-sm" @click="fileInput?.click()"><Upload :size="14" />上传图片</button>
          </div>
        </template>
      </div>

      <div v-else class="scan-frame">
        <video ref="videoEl" muted playsinline></video>
        <i class="corner c-tl"></i><i class="corner c-tr"></i><i class="corner c-bl"></i><i class="corner c-br"></i>
        <i class="scan-line"></i>
        <div v-if="status === 'requesting'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
          <Loader2 :size="30" class="animate-spin" />
          <span class="font-bold text-[13px]">正在请求摄像头…</span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center gap-3 mt-4 min-h-[24px]">
      <p v-if="statusText" class="text-[13px] font-bold m-0" :class="status === 'denied' ? 'text-[#c92a2a]' : ''">{{ statusText }}</p>
    </div>

    <div v-if="status === 'scanning'" class="flex justify-center mt-1">
      <button type="button" class="nb-btn is-sm" @click="stopCamera"><CameraOff :size="14" />关闭摄像头</button>
    </div>

    <div class="flex justify-center mt-3">
      <button type="button" class="nb-btn is-sm" :disabled="busyFile" @click="fileInput?.click()">
        <Upload :size="15" />{{ busyFile ? '识别中…' : '上传二维码图片' }}
      </button>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="visually-hidden-input" @change="onFile" />

    <p class="text-center text-[12px] font-semibold text-[var(--muted)] mt-4 mb-0">
      将二维码放入框内自动识别;也可以上传含二维码的截图或照片。
    </p>
  </div>
</template>
