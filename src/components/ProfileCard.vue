<script setup lang="ts">
// 名片渲染器:创建页预览 / 扫码结果 / 通用模式落地页共用
// 所有字段经 Vue 插值(自动转义,textContent 语义)渲染,XSS 安全
import { computed, ref } from 'vue'
import {
  Phone, Mail, Copy, Check, Globe, Github, Youtube, Linkedin, Link2, UserRound,
  Download, MessageCircleHeart,
} from 'lucide-vue-next'
import type { PublicProfile } from '../types'
import { themeVars } from '../themes/themes'
import { buildVCard, downloadVCard } from '../profile/vcard'
import { copyText, toast } from '../store/toast'

const props = defineProps<{
  profile: PublicProfile
  /** 显示"保存联系人"按钮 */
  showSave?: boolean
  /** 显示 Powered by 页脚 */
  showFooter?: boolean
}>()

const styleVars = computed(() => themeVars(props.profile.style, props.profile.colors))

const initials = computed(() => (props.profile.name || '?').trim().slice(0, 1))
const isPhoto = computed(() => props.profile.avatar.startsWith('data:'))
const isEmoji = computed(() => !!props.profile.avatar && !isPhoto.value)

const chips = computed(() =>
  [props.profile.title, props.profile.company, props.profile.city].filter(Boolean),
)

const wechatCopied = ref(false)
const qqCopied = ref(false)
const discordCopied = ref(false)

async function copyValue(value: string, mark: () => void, label: string) {
  const ok = await copyText(value)
  if (ok) {
    mark()
    toast(`${label}已复制`, 'ok')
  } else {
    toast('复制失败,请手动复制', 'error')
  }
}

function markFor(kind: 'wechat' | 'qq' | 'discord') {
  const set = (v: boolean) => {
    if (kind === 'wechat') wechatCopied.value = v
    else if (kind === 'qq') qqCopied.value = v
    else discordCopied.value = v
  }
  return () => {
    set(true)
    setTimeout(() => set(false), 1600)
  }
}

function platformIcon(type: string) {
  if (type === 'gh') return Github
  if (type === 'yt') return Youtube
  if (type === 'li') return Linkedin
  if (type === 'u') return Globe
  return Link2
}

function platformLabel(type: string, label: string) {
  const known: Record<string, string> = {
    gh: 'GitHub', b: 'Bilibili', xhs: '小红书', dy: '抖音', wb: '微博',
    zh: '知乎', x: 'X', yt: 'YouTube', li: 'LinkedIn', u: '个人网站', c: label || '链接',
  }
  return known[type] ?? label ?? '链接'
}

function saveVCard() {
  downloadVCard(props.profile)
  toast('联系人文件已下载')
}
</script>

<template>
  <div class="pc w-full min-h-full" :style="styleVars">
    <div class="px-4 pt-6 pb-4 flex flex-col items-center gap-3">
      <!-- 头像 -->
      <div class="pc-avatar w-[86px] h-[86px] flex items-center justify-center overflow-hidden select-none">
        <img v-if="isPhoto" :src="profile.avatar" alt="头像" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
        <span v-else-if="isEmoji" class="text-[46px] leading-none">{{ profile.avatar }}</span>
        <span v-else class="text-[38px] font-black leading-none">{{ initials }}</span>
      </div>

      <!-- 姓名 / 职务 -->
      <div class="text-center">
        <div class="pc-name text-[26px] leading-tight">
          {{ profile.name }}
          <span v-if="profile.nickname" class="pc-muted text-[15px] font-semibold">（{{ profile.nickname }}）</span>
        </div>
        <div v-if="chips.length" class="flex flex-wrap justify-center gap-1.5 mt-2">
          <span v-for="c in chips" :key="c" class="pc-chip">{{ c }}</span>
        </div>
      </div>

      <!-- 简介 -->
      <p v-if="profile.bio" class="pc-muted text-[14px] font-semibold text-center leading-relaxed m-0">{{ profile.bio }}</p>
    </div>

    <div class="px-4 pb-6 flex flex-col gap-2.5">
      <!-- 详细介绍 -->
      <div v-if="profile.bioLong" class="pc-inner p-3.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{{ profile.bioLong }}</div>

      <!-- 加微信(主按钮) -->
      <button v-if="profile.wechat" class="pc-btn primary justify-center !text-center" type="button" @click="copyValue(profile.wechat, markFor('wechat'), '微信号')">
        <MessageCircleHeart :size="19" />
        <span>加微信：{{ profile.wechat }}</span>
        <Check v-if="wechatCopied" :size="16" class="ml-auto" />
        <Copy v-else :size="16" class="ml-auto opacity-70" />
      </button>

      <!-- 联系方式 -->
      <div v-if="profile.phone || profile.email || profile.qq || profile.telegram || profile.discord" class="grid grid-cols-1 gap-2">
        <a v-if="profile.phone" class="pc-btn" :href="`tel:${profile.phone}`">
          <Phone :size="17" /><span class="flex-1">{{ profile.phone }}</span><span class="pc-muted text-[12px] font-semibold">拨打</span>
        </a>
        <a v-if="profile.email" class="pc-btn" :href="`mailto:${profile.email}`">
          <Mail :size="17" /><span class="flex-1 break-all">{{ profile.email }}</span><span class="pc-muted text-[12px] font-semibold">邮件</span>
        </a>
        <button v-if="profile.qq" class="pc-btn" type="button" @click="copyValue(profile.qq, markFor('qq'), 'QQ 号')">
          <span class="font-black text-[13px] w-[17px] text-center">Q</span><span class="flex-1">QQ：{{ profile.qq }}</span>
          <Check v-if="qqCopied" :size="15" /><Copy v-else :size="15" class="opacity-60" />
        </button>
        <a v-if="profile.telegram" class="pc-btn" :href="`https://t.me/${profile.telegram}`" target="_blank" rel="noopener noreferrer nofollow">
          <span class="font-black text-[13px] w-[17px] text-center">T</span><span class="flex-1">Telegram：@{{ profile.telegram }}</span><span class="pc-muted text-[12px] font-semibold">打开</span>
        </a>
        <button v-if="profile.discord" class="pc-btn" type="button" @click="copyValue(profile.discord, markFor('discord'), 'Discord')">
          <span class="font-black text-[13px] w-[17px] text-center">D</span><span class="flex-1">Discord：{{ profile.discord }}</span>
          <Check v-if="discordCopied" :size="15" /><Copy v-else :size="15" class="opacity-60" />
        </button>
      </div>

      <!-- 社交链接 -->
      <div v-if="profile.links.length" class="grid grid-cols-2 gap-2">
        <a
          v-for="l in profile.links"
          :key="l.url"
          class="pc-btn"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <component :is="platformIcon(l.type)" :size="17" class="flex-none" />
          <span class="truncate flex-1">{{ platformLabel(l.type, l.label) }}</span>
        </a>
      </div>

      <!-- 保存联系人 -->
      <button v-if="showSave" class="pc-btn primary justify-center !text-center mt-1" type="button" @click="saveVCard">
        <Download :size="18" /><span>保存到通讯录</span>
      </button>

      <div v-if="showFooter" class="flex items-center justify-center gap-1.5 mt-2 pc-muted text-[11px] font-semibold">
        <UserRound :size="11" />
        Powered by QRCard · 二维码就是数据本身
      </div>
    </div>
  </div>
</template>
