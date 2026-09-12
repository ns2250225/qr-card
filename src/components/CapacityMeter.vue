<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-vue-next'
import { formatBytes } from '../store/toast'
import type { CapacityInfo } from '../qr/generate'

const props = defineProps<{
  cap: CapacityInfo
  compact?: boolean
}>()

const pctText = computed(() => `${Math.min(999, Math.round(props.cap.percent))}%`)

const statusText = computed(() => {
  if (props.cap.level === 'over') return '无法生成 · 二维码内容过多'
  if (props.cap.level === 'danger') return '可以生成 · 已接近上限'
  if (props.cap.level === 'warn') return '可以生成 · 内容偏多'
  return '可以生成'
})

const suggestions = computed(() => {
  const list: string[] = []
  if (props.cap.level === 'over' || props.cap.level === 'danger' || props.cap.level === 'warn') {
    list.push('缩短个人介绍', '删除部分链接')
    list.push('压缩或删除头像', '切换纠错等级为「最大容量」')
  }
  return list
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <span class="font-mono-tag">二维码容量</span>
      <span class="font-mono text-[12px] font-bold">{{ formatBytes(cap.bytes) }} / {{ formatBytes(cap.max) }}</span>
    </div>
    <div class="cap-bar">
      <div
        class="fill"
        :class="`lv-${cap.level}`"
        :style="{ width: Math.min(100, cap.percent) + '%' }"
      ></div>
    </div>
    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-1.5 font-bold text-[13px]">
        <CheckCircle2 v-if="cap.canGenerate" :size="16" class="text-[#1e9e50]" />
        <AlertTriangle v-else-if="cap.level === 'danger'" :size="16" class="text-[#d0491f]" />
        <XCircle v-else :size="16" class="text-[#c92a2a]" />
        <span>{{ pctText }}</span>
        <span class="text-[var(--muted)] font-semibold">{{ statusText }}</span>
      </div>
    </div>
    <ul v-if="suggestions.length && !compact" class="mt-2.5 text-[12.5px] font-semibold text-[var(--muted)] leading-6 list-none p-0 m-0">
      <li v-for="s in suggestions" :key="s" class="before:content-['•'] before:mr-1.5 before:text-[var(--orange)]">{{ s }}</li>
    </ul>
  </div>
</template>
