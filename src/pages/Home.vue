<script setup lang="ts">
// 首页:核心概念 + 流程动画 + 特性 + 本地草稿入口
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  QrCode, ScanLine, Lock, ServerOff, Database, WifiOff, FileCode2, PencilLine, Braces, Shrink, Camera, UserRound, ArrowRight, Pencil,
} from 'lucide-vue-next'
import { dbListCards } from '../storage/indexeddb'
import type { DraftCard } from '../types'

const steps = [
  { icon: PencilLine, label: '填写资料' },
  { icon: Braces, label: 'JSON' },
  { icon: Shrink, label: '压缩' },
  { icon: QrCode, label: 'QR Code' },
  { icon: Camera, label: '扫一扫' },
  { icon: UserRound, label: '个人主页' },
]
const activeStep = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    activeStep.value = (activeStep.value + 1) % steps.length
  }, 1100)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const drafts = ref<DraftCard[]>([])
onMounted(async () => {
  try {
    drafts.value = (await dbListCards()).filter((c) => c.profile.name).slice(0, 3)
  } catch {
    drafts.value = []
  }
})

const features = [
  { icon: Lock, bg: 'var(--yellow)', title: '隐私至上', desc: '资料只存在浏览器与二维码中,不上传头像、手机号、社交账号。' },
  { icon: ServerOff, bg: 'var(--pink)', title: '零后端', desc: '没有服务器、数据库、账号体系。静态页面即可部署,Forever。' },
  { icon: WifiOff, bg: 'var(--cyan)', title: '离线可用', desc: 'PWA 支持,断网也能打开 QRCard、扫码、还原个人主页。' },
  { icon: FileCode2, bg: 'var(--green)', title: '开放协议', desc: 'QRCARD:1 开放规范,任何人都能实现自己的 Reader。' },
]

const marqueeText = '无需注册 ★ 无需服务器 ★ 无需数据库 ★ 个人资料不上云 ★ 二维码就是数据本身 ★ '
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-14">
      <div class="flex flex-col md:flex-row items-center gap-10">
        <div class="flex-1">
          <span class="nb-tag rotate-[-2deg] inline-block mb-5">LOCAL-FIRST · PURE FRONTEND</span>
          <h1 class="font-brutal text-[44px] md:text-[64px] leading-[1.04] m-0">
            一个二维码<br />
            <span class="inline-block bg-[var(--yellow)] border-[3px] border-[var(--ink)] px-3 shadow-[6px_6px_0_var(--pink)] rotate-[-1deg] mt-1.5">
              就是你的个人主页
            </span>
          </h1>
          <p class="mt-6 text-[16px] font-semibold text-[var(--muted)] max-w-[480px] leading-relaxed">
            你的资料被压缩进二维码本身,扫码后由浏览器本地还原成完整个人主页。
            <strong class="text-[var(--ink)]">二维码不是入口,二维码就是数据载体。</strong>
          </p>
          <ul class="flex flex-wrap gap-2 mt-5 p-0 list-none m-0">
            <li v-for="t in ['无需注册', '无需服务器', '无需数据库', '个人资料不上云']" :key="t" class="nb-chip">{{ t }}</li>
          </ul>
          <div class="flex flex-wrap gap-3 mt-8">
            <RouterLink to="/create" class="nb-btn is-yellow is-lg">
              <QrCode :size="19" />创建我的二维码
            </RouterLink>
            <RouterLink to="/scan" class="nb-btn is-lg">
              <ScanLine :size="19" />扫描二维码
            </RouterLink>
          </div>
        </div>

        <!-- 大二维码装饰块 -->
        <div class="hidden md:block flex-none relative">
          <div class="w-[300px] h-[300px] bg-white border-[4px] border-[var(--ink)] shadow-[10px_10px_0_var(--ink)] rotate-[3deg] p-6 flex flex-col items-center justify-center gap-4">
            <QrCode :size="150" :stroke-width="1.4" />
            <div class="font-mono-tag bg-[var(--ink)] text-[var(--yellow)] px-3 py-1.5">QRCARD:1:…</div>
          </div>
          <div class="absolute -bottom-5 -left-8 bg-[var(--pink)] border-[3px] border-[var(--ink)] shadow-[4px_4px_0_var(--ink)] px-4 py-2 font-black rotate-[-4deg]">
            QR Code = Profile Data
          </div>
        </div>
      </div>
    </section>

    <!-- 跑马灯 -->
    <div class="nb-marquee">
      <span class="track">{{ marqueeText.repeat(4) }}</span>
    </div>

    <!-- 流程动画 -->
    <section class="max-w-6xl mx-auto px-4 py-12 md:py-16">
      <h2 class="font-brutal text-[26px] md:text-[32px] mb-2">它是怎么工作的?</h2>
      <p class="text-[14px] font-semibold text-[var(--muted)] mb-8">全流程都在浏览器里完成,一步都不经过服务器</p>
      <div class="flex flex-wrap items-center gap-x-2.5 gap-y-4">
        <template v-for="(s, i) in steps" :key="s.label">
          <div class="flow-step flex items-center gap-2" :class="{ active: activeStep === i }">
            <component :is="s.icon" :size="17" />
            {{ s.label }}
          </div>
          <span v-if="i < steps.length - 1" class="flow-arrow">→</span>
        </template>
      </div>
    </section>

    <!-- 特性 -->
    <section class="max-w-6xl mx-auto px-4 pb-14">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="f in features" :key="f.title" class="nb-card p-5">
          <div
            class="w-11 h-11 border-[3px] border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] flex items-center justify-center mb-4"
            :style="{ background: f.bg }"
          >
            <component :is="f.icon" :size="21" :stroke-width="2.2" />
          </div>
          <div class="font-black text-[16px] mb-1.5">{{ f.title }}</div>
          <p class="text-[13px] font-semibold text-[var(--muted)] leading-relaxed m-0">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 本地草稿 -->
    <section v-if="drafts.length" class="max-w-6xl mx-auto px-4 pb-6">
      <div class="nb-card p-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="nb-tag !bg-[var(--cyan)]">本地草稿</span>
          <span class="text-[12px] font-semibold text-[var(--muted)]">只存在你的浏览器(IndexedDB)</span>
          <RouterLink to="/create" class="ml-auto text-[13px] font-bold underline">管理全部 →</RouterLink>
        </div>
        <div class="grid sm:grid-cols-3 gap-3">
          <RouterLink
            v-for="c in drafts"
            :key="c.id"
            :to="`/create?draft=${c.id}`"
            class="nb-card-flat p-3.5 no-underline text-inherit hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)] transition-all flex items-center gap-3"
          >
            <span class="w-9 h-9 flex-none bg-[var(--yellow)] border-[2.5px] border-[var(--ink)] flex items-center justify-center font-black">
              {{ c.profile.name.slice(0, 1) }}
            </span>
            <span class="min-w-0">
              <span class="block font-bold text-[14px] truncate">{{ c.profile.name }}</span>
              <span class="block text-[12px] font-semibold text-[var(--muted)]">
                {{ new Date(c.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) }} 编辑
              </span>
            </span>
            <Pencil :size="15" class="ml-auto flex-none opacity-60" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 底部 CTA -->
    <section class="max-w-6xl mx-auto px-4 pb-4">
      <div class="nb-card p-8 md:p-10 !bg-[var(--ink)] text-[var(--paper)] text-center relative overflow-hidden">
        <div class="absolute top-4 left-5 w-5 h-5 bg-[var(--yellow)] border-2 border-[var(--paper)] rotate-12"></div>
        <div class="absolute bottom-5 right-6 w-7 h-7 bg-[var(--pink)] border-2 border-[var(--paper)] -rotate-12"></div>
        <h2 class="font-brutal text-[26px] md:text-[36px] m-0">Your profile lives inside the QR code.</h2>
        <p class="text-[15px] font-bold opacity-85 mt-2 mb-6">你的主页,就住在二维码里。</p>
        <RouterLink to="/create" class="nb-btn is-yellow is-lg">
          创建我的主页 <ArrowRight :size="17" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
