<script setup lang="ts">
// 创建名片:编辑 + 实时预览 + 容量监控 + 生成二维码 + 本地草稿/导入导出
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Plus, Trash2, FileUp, FileDown, Sparkles, QrCode, X, Save, ShieldCheck,
} from 'lucide-vue-next'
import type { DraftCard, Profile, QrcardFile, PublicProfile, ECLevel, QRMode } from '../types'
import { emptyProfile, cloneProfile, LIMITS } from '../protocol/schema'
import { encodeProfile } from '../protocol/encode'
import { buildQRContent, capacityInfo, type CapacityInfo } from '../qr/generate'
import { toPublicProfile } from '../profile/sanitize'
import { compressAvatar } from '../profile/avatar'
import { dbListCards, dbPutCard, dbDeleteCard, dbClearCards, newCardId } from '../storage/indexeddb'
import { toast, downloadBlob } from '../store/toast'
import ProfileEditor from '../components/ProfileEditor.vue'
import ProfileCard from '../components/ProfileCard.vue'
import CapacityMeter from '../components/CapacityMeter.vue'
import QRGenerator from '../components/QRGenerator.vue'

const route = useRoute()

const profile = ref<Profile>(emptyProfile())
const cards = ref<DraftCard[]>([])
const currentId = ref('')
const savedAt = ref<Date | null>(null)
const payload = ref('')
const qrContent = ref('')
const cap = ref<CapacityInfo | null>(null)
const busyCode = ref(false)
const showResult = ref(false)
const importInput = ref<HTMLInputElement | null>(null)

const publicProfile = computed<PublicProfile | null>(() => {
  try {
    return profile.value.name.trim() ? toPublicProfile(profile.value) : null
  } catch {
    return null
  }
})

// ---------- 容量与二维码(状态机:EDITING → SERIALIZING → COMPRESSING → ENCODING → CHECK_CAPACITY) ----------
async function recompute() {
  busyCode.value = true
  try {
    payload.value = await encodeProfile(profile.value)
    qrContent.value = buildQRContent(payload.value, profile.value.qrMode)
    cap.value = capacityInfo(qrContent.value, profile.value.ec)
  } catch {
    cap.value = null
  } finally {
    busyCode.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(
  profile,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      await recompute()
      await saveCurrent()
    }, 500)
  },
  { deep: true },
)
onBeforeUnmount(() => debounceTimer && clearTimeout(debounceTimer))

// ---------- 本地草稿 ----------
async function saveCurrent() {
  if (!currentId.value) return
  const card: DraftCard = { id: currentId.value, profile: cloneProfile(profile.value), updatedAt: Date.now() }
  const i = cards.value.findIndex((c) => c.id === card.id)
  if (i >= 0) cards.value[i] = card
  else cards.value.unshift(card)
  cards.value.sort((a, b) => b.updatedAt - a.updatedAt)
  savedAt.value = new Date()
  await dbPutCard(card)
}

function newDraft(p?: Profile) {
  currentId.value = newCardId()
  profile.value = p ? cloneProfile(p) : emptyProfile()
  saveCurrent()
}

async function switchTo(id: string) {
  if (id === currentId.value) return
  const card = cards.value.find((c) => c.id === id)
  if (!card) return
  await saveCurrent()
  currentId.value = id
  profile.value = cloneCard(card.profile)
  await recompute()
}

function cloneCard(p: Profile): Profile {
  const c = cloneProfile(p)
  c.hidden = { ...p.hidden }
  return c
}

async function deleteDraft(id: string) {
  if (!confirm('删除这张本地草稿?')) return
  await dbDeleteCard(id)
  cards.value = cards.value.filter((c) => c.id !== id)
  if (currentId.value === id) {
    if (cards.value.length) {
      currentId.value = cards.value[0].id
      profile.value = cloneCard(cards.value[0].profile)
    } else {
      newDraft()
      return
    }
  }
  toast('草稿已删除')
}

async function clearAll() {
  if (!confirm('清空所有本地草稿?此操作会删除浏览器中保存的全部名片数据,且无法恢复。')) return
  if (!confirm('再次确认:真的要清空吗?')) return
  await dbClearCards()
  cards.value = []
  newDraft()
  toast('本地数据已清空')
}

function draftDate(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- 导入 / 导出 ----------
function exportCard() {
  const data: QrcardFile = { version: 1, profile: cloneProfile(profile.value) }
  const name = profile.value.name.trim() || '名片'
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `QRCard-${name}.qrcard`)
  toast('名片文件已导出(.qrcard)')
}

async function importCard(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const data = JSON.parse(await file.text()) as QrcardFile
    if (data?.version !== 1 || !data.profile || typeof data.profile !== 'object') {
      throw new Error()
    }
    const p = normalizeImported(data.profile)
    if (!p.name.trim()) throw new Error()
    newDraft(p)
    await recompute()
    toast(`已导入「${p.name}」`)
  } catch {
    toast('导入失败:不是有效的 .qrcard 文件', 'error')
  }
}

/** 导入数据按字段类型清洗(不可信输入) */
function normalizeImported(raw: any): Profile {
  const p = emptyProfile()
  const s = (k: keyof Profile, max: number) => {
    const v = raw[k]
    if (typeof v === 'string') (p as any)[k] = v.replace(/[\x00-\x1f]/g, '').slice(0, max)
  }
  s('name', LIMITS.name); s('nickname', LIMITS.nickname); s('title', LIMITS.title)
  s('company', LIMITS.company); s('city', LIMITS.city); s('bio', LIMITS.bio); s('bioLong', LIMITS.bioLong)
  s('phone', LIMITS.phone); s('email', LIMITS.email); s('wechat', LIMITS.wechat); s('qq', LIMITS.qq)
  s('telegram', LIMITS.telegram); s('discord', LIMITS.discord)
  if (typeof raw.avatar === 'string' && raw.avatar) {
    if (raw.avatar.startsWith('data:image/') && raw.avatar.length <= LIMITS.avatar) p.avatar = raw.avatar
    else if (raw.avatar.length <= 16) p.avatar = raw.avatar
  }
  if (typeof raw.avatarOriginal === 'string' && raw.avatarOriginal.startsWith('data:image/')) {
    p.avatarOriginal = raw.avatarOriginal.slice(0, 2_000_000)
  }
  if (raw.hidden && typeof raw.hidden === 'object' && !Array.isArray(raw.hidden)) {
    for (const [k, v] of Object.entries(raw.hidden)) if (typeof v === 'boolean') p.hidden[k] = v
  }
  const st = Number(raw.style)
  if (Number.isInteger(st) && st >= 0 && st < 8) p.style = st
  if (raw.colors && typeof raw.colors === 'object') {
    const hex = (v: unknown) => (typeof v === 'string' && /^[0-9a-fA-F]{3,8}$/.test(v.replace(/^#/, '')) ? v.replace(/^#/, '').toLowerCase() : '')
    const c = { bg: hex(raw.colors.bg), primary: hex(raw.colors.primary), text: hex(raw.colors.text), card: hex(raw.colors.card) }
    if (Object.values(c).some(Boolean)) p.colors = c
  }
  if (Array.isArray(raw.links)) {
    for (const l of raw.links.slice(0, LIMITS.maxLinks)) {
      if (!l || typeof l !== 'object' || typeof l.type !== 'string' || typeof l.value !== 'string') continue
      p.links.push({
        type: l.type.slice(0, 8),
        value: l.value.slice(0, LIMITS.linkValue),
        label: typeof l.label === 'string' ? l.label.slice(0, LIMITS.linkLabel) : undefined,
        enabled: l.enabled !== false,
      })
    }
  }
  if (['L', 'M', 'Q', 'H'].includes(raw.ec)) p.ec = raw.ec as ECLevel
  if (raw.qrMode === 'offline' || raw.qrMode === 'universal') p.qrMode = raw.qrMode as QRMode
  return p
}

// ---------- 智能瘦身(PRD §49) ----------
const slimming = ref(false)
async function smartSlim() {
  if (!cap.value || slimming.value) return
  slimming.value = true
  try {
    const target = 90
    let cur = cap.value.percent
    const p = cloneProfile(profile.value)
    const actions: string[] = []
    const pctOf = async (pp: Profile): Promise<number> => {
      const content = buildQRContent(await encodeProfile(pp), pp.qrMode)
      return capacityInfo(content, pp.ec).percent
    }
    if (p.avatarOriginal && p.avatar) {
      const table: [number, number, string][] = [
        [64, 0.6, '头像质量 60%'],
        [64, 0.45, '头像质量 45%'],
        [48, 0.45, '头像 48px'],
        [48, 0.25, '头像 48px 高压缩'],
      ]
      for (const [size, q, label] of table) {
        if (cur <= target) break
        p.avatar = await compressAvatar(p.avatarOriginal, size, q)
        cur = await pctOf(p)
        actions.push(label)
      }
      if (cur > target && p.avatar) {
        p.avatar = ''
        cur = await pctOf(p)
        actions.push('删除头像')
      }
    }
    if (cur > target && p.bioLong.length > 150) {
      p.bioLong = p.bioLong.slice(0, 150)
      cur = await pctOf(p)
      actions.push('精简详细介绍')
    }
    if (cur > target && p.bio.length > 60) {
      p.bio = p.bio.slice(0, 60)
      cur = await pctOf(p)
      actions.push('精简简介')
    }
    if (cur > 100 && p.ec !== 'L') {
      p.ec = 'L'
      cur = await pctOf(p)
      actions.push('纠错等级 → 最大容量')
    }
    profile.value = p
    await recompute()
    await saveCurrent()
    if (cur <= 100) toast(`智能瘦身完成:容量 ${Math.round(cur)}%${actions.length ? '(' + actions.join(' → ') + ')' : ''}`)
    else toast('已尽力优化,仍超出容量,请手动精简内容', 'error')
  } catch {
    toast('智能瘦身失败', 'error')
  } finally {
    slimming.value = false
  }
}

// ---------- 生成 ----------
function openGenerator() {
  if (!publicProfile.value) {
    toast('请先填写姓名(必填)', 'error')
    return
  }
  if (cap.value && !cap.value.canGenerate) {
    toast('二维码内容过多,无法生成。试试「智能瘦身」', 'error')
    return
  }
  showResult.value = true
}

function onExportCard() {
  showResult.value = false
  exportCard()
}

// ---------- 初始化 ----------
onMounted(async () => {
  cards.value = await dbListCards()
  const want = typeof route.query.draft === 'string' ? route.query.draft : ''
  const target = cards.value.find((c) => c.id === want)
  if (target) {
    currentId.value = target.id
    profile.value = cloneCard(target.profile)
  } else if (cards.value.length) {
    currentId.value = cards.value[0].id
    profile.value = cloneCard(cards.value[0].profile)
  } else {
    newDraft()
  }
  await recompute()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-7">
    <!-- 顶部:标题 + 草稿栏 -->
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <h1 class="font-brutal text-[26px] mr-2 m-0">创建名片</h1>
      <span class="text-[12px] font-semibold text-[var(--muted)] hidden sm:inline">
        <Save :size="12" class="inline -mt-0.5" />
        {{ savedAt ? `已自动保存 ${savedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '自动保存到本地草稿' }}
      </span>
      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <button type="button" class="nb-chip cursor-pointer bg-[var(--yellow)] !shadow-[2px_2px_0_var(--ink)]" @click="newDraft()">
          <Plus :size="13" />新建
        </button>
        <button type="button" class="nb-chip cursor-pointer !shadow-[2px_2px_0_var(--ink)]" @click="importInput?.click()">
          <FileUp :size="13" />导入
        </button>
        <button type="button" class="nb-chip cursor-pointer !shadow-[2px_2px_0_var(--ink)]" @click="exportCard">
          <FileDown :size="13" />导出
        </button>
        <button type="button" class="nb-chip cursor-pointer !bg-[var(--red)] !text-white !shadow-[2px_2px_0_var(--ink)]" @click="clearAll">
          <Trash2 :size="13" />清空本地数据
        </button>
        <input ref="importInput" type="file" accept=".qrcard,application/json" class="visually-hidden-input" @change="importCard" />
      </div>
    </div>

    <!-- 草稿列表 -->
    <div v-if="cards.length > 0" class="flex flex-wrap items-center gap-1.5 mb-6">
      <span class="font-mono-tag text-[var(--muted)] mr-1">本地草稿</span>
      <button
        v-for="c in cards"
        :key="c.id"
        type="button"
        class="nb-chip cursor-pointer !py-1 !pr-1.5"
        :class="c.id === currentId ? 'bg-[var(--green)]' : 'bg-white'"
        :title="`修改于 ${draftDate(c.updatedAt)}`"
        @click="switchTo(c.id)"
      >
        {{ c.profile.name || '未命名' }}
        <span class="text-[10px] opacity-60 font-mono">{{ draftDate(c.updatedAt) }}</span>
        <X :size="12" class="opacity-60 hover:opacity-100 hover:text-[var(--red)]" @click.stop="deleteDraft(c.id)" />
      </button>
    </div>

    <div class="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] items-start">
      <!-- 左:编辑器(移动端在预览上方,遵循 PRD §9 顺序) -->
      <div class="min-w-0 order-1">
        <ProfileEditor :profile="profile" @update="(p) => Object.assign(profile, p)" />
      </div>

      <!-- 右:实时预览 + 容量 + 生成 -->
      <div class="order-2 lg:sticky lg:top-[72px] flex flex-col items-center gap-4">
        <div class="phone">
          <div class="notch"></div>
          <div class="h-[560px] overflow-y-auto bg-white">
            <ProfileCard v-if="publicProfile" :profile="publicProfile" :show-save="true" :show-footer="true" />
            <div v-else class="h-full flex flex-col items-center justify-center gap-3 text-[var(--muted)] px-8 text-center">
              <QrCode :size="52" :stroke-width="1.6" />
              <p class="font-bold text-[14px] text-[var(--ink)]">实时预览</p>
              <p class="text-[12.5px] font-semibold m-0">在左侧填写姓名等信息,<br />这里会实时出现你的个人主页</p>
            </div>
          </div>
        </div>

        <div class="nb-card p-4 w-full">
          <CapacityMeter v-if="cap" :cap="cap" />
          <div v-else class="font-bold text-[13px] text-center py-2">计算容量中…</div>

          <div class="grid grid-cols-[1fr_auto] gap-2 mt-4">
            <button type="button" class="nb-btn is-yellow" :disabled="!cap?.canGenerate" @click="openGenerator">
              <QrCode :size="17" />生成二维码
            </button>
            <button
              type="button"
              class="nb-btn is-cyan"
              :class="{ 'animate-pulse': cap && cap.percent > 100 }"
              :disabled="!cap || cap.percent <= 90 || slimming"
              title="容量超出时自动瘦身"
              @click="smartSlim"
            >
              <Sparkles :size="16" />{{ slimming ? '瘦身中…' : '智能瘦身' }}
            </button>
          </div>

          <p v-if="cap && !cap.canGenerate" class="flex items-center gap-1.5 text-[12.5px] font-bold text-[#c92a2a] mt-2.5 mb-0">
            <ShieldCheck :size="14" class="rotate-180" />超出容量,请先瘦身或精简内容
          </p>
        </div>
      </div>
    </div>

    <!-- 生成结果 -->
    <QRGenerator
      v-if="showResult && publicProfile && payload"
      :public-profile="publicProfile"
      :editor-profile="profile"
      :protocol="payload"
      :qr-content="qrContent"
      :ec="profile.ec"
      @close="showResult = false"
      @export-card="onExportCard"
    />
  </div>
</template>
