<script setup lang="ts">
// 个人主页:通用模式落地页(#/p/<payload>)与扫描结果页(#/view)共用
// 流程:读取 Payload → Base64URL 解码 → 解压 → JSON → 校验 → 渲染
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QrCode, ScanLine, PencilLine, Loader2 } from 'lucide-vue-next'
import ProfileCard from '../components/ProfileCard.vue'
import { decodeProtocol } from '../protocol/encode'
import { sanitizeDecoded } from '../profile/sanitize'
import type { PublicProfile } from '../types'

const route = useRoute()
const router = useRouter()

const state = ref<'loading' | 'ok' | 'empty' | 'invalid'>('loading')
const profile = ref<PublicProfile | null>(null)
const errorMsg = ref('')

const payloadSource = computed<string | null>(() => {
  const p = route.params.payload
  if (typeof p === 'string' && p) return p
  return sessionStorage.getItem('qrcard.lastProfile')
})

async function load() {
  const source = payloadSource.value
  if (!source) {
    state.value = 'empty'
    return
  }
  state.value = 'loading'
  try {
    const { profile: decoded } = await decodeProtocol(source)
    profile.value = sanitizeDecoded(decoded)
    state.value = 'ok'
  } catch (err: any) {
    errorMsg.value = err?.message || '名片数据无效或已损坏'
    state.value = 'invalid'
  }
}

watch(payloadSource, load, { immediate: true })
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <!-- 加载中 -->
    <div v-if="state === 'loading'" class="nb-card p-12 flex flex-col items-center gap-3">
      <Loader2 :size="34" class="animate-spin" />
      <p class="font-bold text-[14px] m-0">正在本地解码个人主页…</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="state === 'empty'" class="nb-card p-10 flex flex-col items-center gap-3 text-center">
      <QrCode :size="52" :stroke-width="1.5" />
      <h1 class="font-brutal text-[22px] m-0">这里还没有名片</h1>
      <p class="text-[13px] font-semibold text-[var(--muted)] m-0">
        从「扫描二维码」进入,或直接打开二维码里的链接<br />(通用模式:#/p/协议数据)
      </p>
      <div class="flex gap-2.5 mt-2">
        <button type="button" class="nb-btn is-yellow" @click="router.push('/scan')"><ScanLine :size="16" />去扫描</button>
        <button type="button" class="nb-btn" @click="router.push('/create')"><PencilLine :size="16" />创建我的名片</button>
      </div>
    </div>

    <!-- 解析失败 -->
    <div v-else-if="state === 'invalid'" class="nb-card p-8 text-center">
      <div class="font-black text-[18px] text-[#c92a2a] mb-2">无法打开这张名片</div>
      <p class="text-[13px] font-semibold text-[var(--muted)] mb-4">{{ errorMsg }}</p>
      <button type="button" class="nb-btn is-yellow" @click="router.push('/scan')"><ScanLine :size="15" />重新扫描</button>
    </div>

    <!-- 名片 -->
    <template v-else>
      <div class="nb-card overflow-hidden">
        <ProfileCard :profile="profile!" :show-save="true" :show-footer="true" />
      </div>
      <div class="flex justify-center gap-2.5 mt-5">
        <button type="button" class="nb-btn is-sm" @click="router.push('/scan')"><ScanLine :size="14" />扫别人的名片</button>
        <button type="button" class="nb-btn is-sm is-yellow" @click="router.push('/create')"><PencilLine :size="14" />创建我的名片</button>
      </div>
    </template>
  </div>
</template>
