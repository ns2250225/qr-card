<script setup lang="ts">
// 编辑个人资料:基础信息 / 联系方式(可单独设置是否显示)/ 社交链接 / 外观
import { computed } from 'vue'
import { Eye, EyeOff, Lock, Palette, Braces } from 'lucide-vue-next'
import type { Profile, QRMode, ECLevel } from '../types'
import { CONTACT_FIELDS } from '../protocol/schema'
import { THEMES } from '../themes/themes'
import { QR_MODES, EC_OPTIONS } from '../qr/generate'
import AvatarEditor from './AvatarEditor.vue'
import SocialLinks from './SocialLinks.vue'

const props = defineProps<{ profile: Profile }>()
const emit = defineEmits<{ (e: 'update', patch: Partial<Profile>): void }>()

function field(key: string) {
  return computed({
    get: () => (props.profile as any)[key] as string,
    set: (v: string) => emit('update', { [key]: v } as Partial<Profile>),
  })
}
const name = field('name')
const nickname = field('nickname')
const title = field('title')
const company = field('company')
const city = field('city')
const bio = field('bio')
const bioLong = field('bioLong')

function isHidden(key: string) {
  return !!props.profile.hidden[key]
}
function toggleHidden(key: string) {
  emit('update', { hidden: { ...props.profile.hidden, [key]: !props.profile.hidden[key] } })
}

const hasColors = computed(() => props.profile.colors !== null)

function enableColors(on: boolean) {
  emit('update', {
    colors: on ? { bg: 'f5f1e8', primary: 'ffdc58', text: '111111', card: 'ffffff' } : null,
  })
}

function setColor(key: keyof NonNullable<Profile['colors']>, value: string) {
  const colors = { ...(props.profile.colors ?? { bg: '', primary: '', text: '', card: '' }) }
  colors[key] = value.replace(/^#/, '')
  emit('update', { colors })
}

const colorDefs: { key: keyof NonNullable<Profile['colors']>; label: string }[] = [
  { key: 'bg', label: '背景' },
  { key: 'primary', label: '主色' },
  { key: 'text', label: '文字' },
  { key: 'card', label: '卡片' },
]
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- 隐私提示(PRD §54) -->
    <div class="nb-card p-4 !bg-[var(--yellow)]">
      <div class="flex items-center gap-2 font-black text-[14px]">
        <Lock :size="16" />
        🔒 数据只在你的设备中处理
      </div>
      <p class="text-[12.5px] font-semibold leading-relaxed mt-2 mb-0">
        QRCard 不会上传:姓名 · 手机号 · 邮箱 · 微信 · 头像 · 社交账号。二维码就是数据本身。
      </p>
      <p class="text-[11.5px] font-semibold leading-relaxed mt-1.5 mb-0 opacity-75">
        ⚠ 二维码一旦分享,任何能读取它的人都可能获取其中信息。请勿写入身份证号、家庭住址、密码、密钥等敏感信息。
      </p>
    </div>

    <!-- 基础信息 -->
    <section class="nb-card p-4">
      <div class="sec-title"><i class="dot bg-[var(--yellow)]"></i>基础信息</div>
      <p class="sec-desc">只有姓名是必填项,其他都可以留空</p>

      <div class="mb-4">
        <div class="nb-label">头像</div>
        <AvatarEditor :profile="profile" @update="(p) => emit('update', p)" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2 sm:col-span-1">
          <label class="nb-label">姓名 <span class="text-[var(--red)]">*</span></label>
          <input v-model="name" class="nb-input" placeholder="张三" maxlength="60" />
        </div>
        <div class="col-span-2 sm:col-span-1">
          <label class="nb-label">昵称</label>
          <input v-model="nickname" class="nb-input" placeholder="三哥" maxlength="40" />
        </div>
        <div>
          <label class="nb-label">职业</label>
          <input v-model="title" class="nb-input" placeholder="独立开发者" maxlength="60" />
        </div>
        <div>
          <label class="nb-label">公司 / 组织</label>
          <input v-model="company" class="nb-input" placeholder="自由职业" maxlength="60" />
        </div>
        <div>
          <label class="nb-label">城市</label>
          <input v-model="city" class="nb-input" placeholder="上海" maxlength="30" />
        </div>
        <div class="col-span-2">
          <label class="nb-label">一句话简介</label>
          <input v-model="bio" class="nb-input" placeholder="喜欢做一些有趣的小工具" maxlength="160" />
        </div>
        <div class="col-span-2">
          <label class="nb-label">详细介绍 <span class="text-[var(--muted)] font-semibold">(会占用较多容量)</span></label>
          <textarea v-model="bioLong" class="nb-input" rows="3" placeholder="喜欢 AI、游戏和开源项目,目前正在做…" maxlength="800"></textarea>
        </div>
      </div>
    </section>

    <!-- 联系方式 -->
    <section class="nb-card p-4">
      <div class="sec-title"><i class="dot bg-[var(--pink)]"></i>联系方式</div>
      <p class="sec-desc">每一项都可以单独设置是否显示在名片上(眼睛图标)</p>
      <div class="grid gap-2.5">
        <div v-for="f in CONTACT_FIELDS" :key="f.key" class="flex items-center gap-2">
          <div class="flex-1">
            <input
              class="nb-input"
              :class="{ 'opacity-45': isHidden(f.key) }"
              :placeholder="f.placeholder"
              :value="profile[f.key]"
              :maxlength="30"
              @input="emit('update', { [f.key]: ($event.target as HTMLInputElement).value } as Partial<Profile>)"
            />
          </div>
          <button
            type="button"
            class="nb-btn is-sm !px-2.5 !py-2"
            :title="isHidden(f.key) ? '已在名片隐藏,点击显示' : '显示中,点击隐藏'"
            @click="toggleHidden(f.key)"
          >
            <Eye v-if="!isHidden(f.key)" :size="15" />
            <EyeOff v-else :size="15" class="opacity-45" />
          </button>
        </div>
      </div>
      <p class="text-[11.5px] font-semibold text-[var(--muted)] mt-2 mb-0">隐藏的字段不会写入二维码,扫码者看不到。</p>
    </section>

    <!-- 社交链接 -->
    <section class="nb-card p-4">
      <div class="sec-title"><i class="dot bg-[var(--cyan)]"></i>社交链接</div>
      <p class="sec-desc">已知平台只保存用户名,Reader 自动还原完整链接,大幅节省二维码容量</p>
      <SocialLinks :profile="profile" @update="(p) => emit('update', p)" />
    </section>

    <!-- 外观 -->
    <section class="nb-card p-4">
      <div class="sec-title"><i class="dot bg-[var(--purple)]"></i><Palette :size="17" />外观与二维码</div>
      <p class="sec-desc">主题只保存 ID("s": 3),不会增加二维码容量</p>

      <div class="grid grid-cols-4 gap-2 mb-4">
        <button
          v-for="(t, i) in THEMES"
          :key="t.id"
          type="button"
          class="theme-swatch"
          :class="{ active: profile.style === i }"
          @click="emit('update', { style: i })"
        >
          <span class="sw"><i v-for="c in t.swatch" :key="c" :style="{ background: c }"></i></span>
          <span class="nm">{{ t.name }}</span>
        </button>
      </div>

      <div class="flex items-center gap-2 mb-2">
        <Braces :size="15" />
        <span class="font-bold text-[13.5px]">自定义颜色</span>
        <button type="button" class="nb-switch ml-auto" :class="{ on: hasColors }" @click="enableColors(!hasColors)"></button>
      </div>
      <div v-if="hasColors" class="flex gap-4 flex-wrap mb-4 p-2.5 nb-card-flat">
        <label v-for="d in colorDefs" :key="d.key" class="flex items-center gap-1.5 text-[12px] font-bold">
          <input
            type="color"
            class="nb-color"
            :value="'#' + (profile.colors?.[d.key] || 'ffffff')"
            @input="setColor(d.key, ($event.target as HTMLInputElement).value)"
          />
          {{ d.label }}
        </label>
      </div>

      <div class="mb-3">
        <div class="nb-label">二维码模式</div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="m in QR_MODES"
            :key="m.value"
            type="button"
            class="nb-radio"
            :class="{ active: profile.qrMode === m.value }"
            @click="emit('update', { qrMode: m.value as QRMode })"
          >
            {{ m.label }}<span class="sub">{{ m.desc }}</span>
          </button>
        </div>
      </div>

      <div>
        <div class="nb-label">扫码稳定性(纠错等级)</div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="e in EC_OPTIONS"
            :key="e.value"
            type="button"
            class="nb-radio text-center"
            :class="{ active: profile.ec === e.value }"
            @click="emit('update', { ec: e.value as ECLevel })"
          >
            {{ e.label }}<span class="sub">{{ e.desc }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
