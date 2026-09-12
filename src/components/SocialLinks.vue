<script setup lang="ts">
// 社交链接编辑:内置平台 + 自定义链接,支持逐条显示/删除
import { computed } from 'vue'
import { Plus, X, Eye, EyeOff } from 'lucide-vue-next'
import type { Profile } from '../types'
import { LINK_TYPES, CUSTOM_LINK_CODE, LIMITS } from '../protocol/schema'
import { toast } from '../store/toast'

const props = defineProps<{ profile: Profile }>()
const emit = defineEmits<{ (e: 'update', patch: Partial<Profile>): void }>()

const used = computed(() => new Set(props.profile.links.map((l) => l.type)))
const available = computed(() => LINK_TYPES.filter((t) => !used.value.has(t.code)))

function updateLinks(links: Profile['links']) {
  emit('update', { links })
}

function addPlatform(code: string) {
  const links = [...props.profile.links, { type: code, value: '', enabled: true }]
  updateLinks(links)
}

function addCustom() {
  if (props.profile.links.length >= LIMITS.maxLinks) {
    toast(`最多 ${LIMITS.maxLinks} 个链接`, 'error')
    return
  }
  const links = [...props.profile.links, { type: CUSTOM_LINK_CODE, value: '', label: '', enabled: true }]
  updateLinks(links)
}

function patchLink(index: number, patch: Partial<Profile['links'][number]>) {
  const links = props.profile.links.map((l, i) => (i === index ? { ...l, ...patch } : l))
  updateLinks(links)
}

function removeLink(index: number) {
  updateLinks(props.profile.links.filter((_, i) => i !== index))
}

function typeDef(code: string) {
  return LINK_TYPES.find((t) => t.code === code)
}
</script>

<template>
  <div>
    <!-- 已添加的链接 -->
    <div class="flex flex-col gap-2.5">
      <div v-for="(l, i) in profile.links" :key="i" class="nb-card-flat p-2.5">
        <div class="flex items-center gap-2 mb-2">
          <span class="nb-tag !py-0.5">{{ l.type === 'c' ? '自定义' : typeDef(l.type)?.label }}</span>
          <div class="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              class="nb-btn is-sm !px-2 !py-1"
              :title="l.enabled ? '名片上隐藏' : '在名片上显示'"
              @click="patchLink(i, { enabled: !l.enabled })"
            >
              <Eye v-if="l.enabled" :size="14" />
              <EyeOff v-else :size="14" class="opacity-45" />
            </button>
            <button type="button" class="nb-btn is-sm is-red !px-2 !py-1" title="删除" @click="removeLink(i)">
              <X :size="14" />
            </button>
          </div>
        </div>
        <div class="grid gap-1.5" :class="l.type === 'c' ? 'grid-cols-[110px_1fr]' : 'grid-cols-1'">
          <input
            v-if="l.type === 'c'"
            class="nb-input"
            placeholder="名称,如 我的博客"
            :value="l.label ?? ''"
            maxlength="30"
            @input="patchLink(i, { label: ($event.target as HTMLInputElement).value })"
          />
          <input
            class="nb-input"
            :placeholder="l.type === 'c' ? 'https://example.com' : typeDef(l.type)?.hint"
            :value="l.value"
            @input="patchLink(i, { value: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>
    </div>

    <!-- 可添加的平台 -->
    <div v-if="available.length" class="flex flex-wrap gap-1.5 mt-3">
      <button
        v-for="t in available"
        :key="t.code"
        type="button"
        class="nb-chip !shadow-[2px_2px_0_var(--ink)] hover:-translate-y-0.5 transition-transform cursor-pointer"
        @click="addPlatform(t.code)"
      >
        <Plus :size="13" />{{ t.label }}
      </button>
      <button type="button" class="nb-chip bg-[var(--cyan)] !shadow-[2px_2px_0_var(--ink)] hover:-translate-y-0.5 transition-transform cursor-pointer" @click="addCustom">
        <Plus :size="13" />添加自定义链接
      </button>
    </div>
    <p v-else class="text-[12px] font-semibold text-[var(--muted)] mt-3 m-0">已添加全部平台和链接。</p>
  </div>
</template>
