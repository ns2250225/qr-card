// QRCard Protocol v1 — 字段定义、白名单、长度上限
import type { Profile } from '../types'

/**
 * 紧凑字段映射(写入二维码的 JSON key):
 *   v=version  n=name  nn=nickname  t=title  c=company  ct=city
 *   b=bio  bd=bioLong  p=phone  e=email  w=wechat  q=qq
 *   tg=telegram  dc=discord  l=links  a=avatar  s=style  cc=custom colors
 */

/** 各字段写入二维码时的最大长度(截断保护) */
export const LIMITS = {
  name: 60,
  nickname: 40,
  title: 60,
  company: 60,
  city: 30,
  bio: 160,
  bioLong: 800,
  phone: 30,
  email: 120,
  wechat: 60,
  qq: 20,
  telegram: 60,
  discord: 60,
  avatar: 4096, // data URL 字符数(≈1.5KB 原始数据)
  linkValue: 400,
  linkLabel: 30,
  maxLinks: 16,
} as const

/** 联系方式字段元信息(编辑器 + 渲染共用) */
export const CONTACT_FIELDS = [
  { key: 'phone', label: '手机号', placeholder: '13800000000', icon: 'phone' },
  { key: 'email', label: '邮箱', placeholder: 'hello@example.com', icon: 'mail' },
  { key: 'wechat', label: '微信号', placeholder: 'zhangsan', icon: 'wechat' },
  { key: 'qq', label: 'QQ', placeholder: '10000', icon: 'qq' },
  { key: 'telegram', label: 'Telegram', placeholder: '@username', icon: 'send' },
  { key: 'discord', label: 'Discord', placeholder: 'username', icon: 'discord' },
] as const

export type ContactKey = (typeof CONTACT_FIELDS)[number]['key']

/** 已知社交平台 → URL 前缀(存储时剥离前缀,还原时拼接,大幅省容量) */
export const LINK_TYPES = [
  { code: 'gh', label: 'GitHub', base: 'https://github.com/', hint: '用户名,如 zhangsan' },
  { code: 'b', label: 'Bilibili', base: 'https://space.bilibili.com/', hint: 'UID 或完整链接' },
  { code: 'xhs', label: '小红书', base: 'https://www.xiaohongshu.com/user/profile/', hint: '用户主页 ID 或完整链接' },
  { code: 'dy', label: '抖音', base: 'https://www.douyin.com/user/', hint: '用户 ID 或完整链接' },
  { code: 'wb', label: '微博', base: 'https://weibo.com/', hint: '用户 ID 或完整链接' },
  { code: 'zh', label: '知乎', base: 'https://www.zhihu.com/people/', hint: '个性域名或完整链接' },
  { code: 'x', label: 'X', base: 'https://x.com/', hint: '用户名,如 elonmusk' },
  { code: 'yt', label: 'YouTube', base: 'https://www.youtube.com/@', hint: '频道 handle' },
  { code: 'li', label: 'LinkedIn', base: 'https://www.linkedin.com/in/', hint: '个人主页 ID' },
  { code: 'u', label: '个人网站', base: '', hint: '完整网址 https://…' },
] as const

export const CUSTOM_LINK_CODE = 'c'

/** 内置 Emoji 头像(仅存 emoji 本身,几乎不占容量) */
export const EMOJI_AVATARS = [
  '👨‍💻', '👩‍💻', '🧑‍🎨', '🧑‍🚀', '🐱', '🐶',
  '🤖', '🦊', '🐼', '🦁', '🐸', '🐙',
  '🦉', '🐝', '🌻', '🌈', '⚡', '🔥',
  '🎧', '🎮', '☕', '🍜', '🚀', '👾',
]

export function emptyProfile(): Profile {
  return {
    name: '',
    nickname: '',
    title: '',
    company: '',
    city: '',
    bio: '',
    bioLong: '',
    phone: '',
    email: '',
    wechat: '',
    qq: '',
    telegram: '',
    discord: '',
    hidden: {},
    avatar: '',
    avatarOriginal: '',
    style: 0,
    colors: null,
    links: [],
    ec: 'M',
    qrMode: 'universal',
  }
}

export function cloneProfile(p: Profile): Profile {
  return {
    ...p,
    hidden: { ...p.hidden },
    colors: p.colors ? { ...p.colors } : null,
    links: p.links.map((l) => ({ ...l })),
  }
}
