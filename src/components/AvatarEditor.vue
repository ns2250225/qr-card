<script setup lang="ts">
// 头像编辑:模式 A 不保存 / 模式 B Emoji / 模式 C 照片(本地压缩到 ~1.5KB)
import { computed, ref } from 'vue'
import { Trash2, Upload, ImageOff, AlertTriangle, RefreshCcw } from 'lucide-vue-next'
import type { Profile } from '../types'
import { EMOJI_AVATARS } from '../protocol/schema'
import { compressAvatar, avatarBytes } from '../profile/avatar'
import { toast } from '../store/toast'

const props = defineProps<{ profile: Profile }>()
const emit = defineEmits<{ (e: 'update', patch: Partial<Profile>): void }>()

const mode = computed<'none' | 'emoji' | 'photo'>(() => {
  if (!props.profile.avatar) return 'none'
  return props.profile.avatar.startsWith('data:') ? 'photo' : 'emoji'
})

const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function setMode(m: 'none' | 'emoji') {
  if (m === 'none') emit('update', { avatar: '' })
  else if (!EMOJI_AVATARS.includes(props.profile.avatar)) {
    emit('update', { avatar: EMOJI_AVATARS[0] })
  }
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('请选择图片文件', 'error')
    return
  }
  busy.value = true
  try {
    const original = await readAsDataUrl(file)
    const dataUrl = await compressAvatar(file, 64, 0.8)
    emit('update', { avatar: dataUrl, avatarOriginal: original })
    const kb = avatarBytes(dataUrl) / 1024
    toast(kb <= 1.5 ? `头像已压缩到 ${kb.toFixed(1)} KB` : `头像 ${kb.toFixed(1)} KB,偏大建议降低质量`, kb <= 1.5 ? 'ok' : 'info')
  } catch {
    toast('头像处理失败', 'error')
  } finally {
    busy.value = false
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

async function recompress(quality: number, size = 64) {
  if (!props.profile.avatarOriginal) return
  busy.value = true
  try {
    const dataUrl = await compressAvatar(props.profile.avatarOriginal, size, quality)
    emit('update', { avatar: dataUrl })
    toast(`头像已重新压缩:${formatKB(dataUrl)}`, 'ok')
  } finally {
    busy.value = false
  }
}

function formatKB(a: string): string {
  return `${(avatarBytes(a) / 1024).toFixed(1)} KB`
}

const avatarSize = computed(() => (props.profile.avatar ? formatKB(props.profile.avatar) : ''))
const avatarHeavy = computed(() => props.profile.avatar.startsWith('data:') && avatarBytes(props.profile.avatar) > 1500)
</script>

<template>
  <div>
    <!-- 模式切换 -->
    <div class="grid grid-cols-3 gap-2 mb-3">
      <button class="nb-radio text-center" :class="{ active: mode === 'none' }" type="button" @click="setMode('none')">
        <ImageOff :size="15" class="inline -mt-0.5 mr-1" />不使用
        <span class="sub">最省容量 ✓</span>
      </button>
      <button class="nb-radio text-center" :class="{ active: mode === 'emoji' }" type="button" @click="setMode('emoji')">
        <span class="text-[15px]">🐱</span> Emoji
        <span class="sub">几乎不占容量</span>
      </button>
      <button class="nb-radio text-center" :class="{ active: mode === 'photo' }" type="button" @click="fileInput?.click()" :disabled="busy">
        <Upload :size="15" class="inline -mt-0.5 mr-1" />照片
        <span class="sub">自动压缩 64×64</span>
      </button>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="visually-hidden-input" @change="onFile" />

    <!-- Emoji 选择 -->
    <div v-if="mode === 'emoji'" class="grid grid-cols-8 gap-1.5 mb-2">
      <button
        v-for="e in EMOJI_AVATARS"
        :key="e"
        type="button"
        class="h-9 rounded-md border-[2.5px] border-[var(--ink)] bg-white text-[18px] leading-none cursor-pointer transition-transform hover:-translate-y-0.5"
        :class="{ 'bg-[var(--yellow)] translate-y-[-1px] shadow-[2px_2px_0_var(--ink)]': profile.avatar === e }"
        @click="emit('update', { avatar: e })"
      >
        {{ e }}
      </button>
    </div>

    <!-- 照片预览 -->
    <div v-if="mode === 'photo'" class="flex items-center gap-3 p-2.5 nb-card-flat mb-2">
      <img :src="profile.avatar" alt="头像预览" class="w-14 h-14 rounded-lg border-[2.5px] border-[var(--ink)] object-cover" />
      <div class="flex-1 min-w-0">
        <div class="font-bold text-[13px]">照片头像 <span class="text-[var(--muted)] font-semibold">· {{ avatarSize }}</span></div>
        <div v-if="avatarHeavy" class="flex items-center gap-1 text-[12px] font-bold text-[#d0491f] mt-0.5">
          <AlertTriangle :size="13" />头像较大,会明显增加二维码密度
        </div>
        <div v-else class="text-[12px] font-semibold text-[var(--muted)] mt-0.5">✓ 体积良好</div>
      </div>
      <div class="flex flex-col gap-1.5">
        <button v-if="avatarHeavy" class="nb-btn is-sm is-cyan" type="button" :disabled="busy" @click="recompress(0.5)">
          <RefreshCcw :size="13" />降低质量
        </button>
        <button class="nb-btn is-sm is-red" type="button" @click="emit('update', { avatar: '' })">
          <Trash2 :size="13" />删除
        </button>
      </div>
    </div>

    <p class="text-[12px] font-semibold text-[var(--muted)] m-0">
      🔒 照片只在你的浏览器内压缩为 64×64 WebP,原图不会上传,也不会存入二维码。
    </p>
  </div>
</template>
