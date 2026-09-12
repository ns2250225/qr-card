// 序列化:编辑态 Profile → 紧凑 JSON(短字段名 + 平台 URL 剥离前缀)
import type { Profile } from '../types'
import { LIMITS, LINK_TYPES, CUSTOM_LINK_CODE } from './schema'

/** 已知平台存储时剥离 URL 前缀:https://github.com/zhangsan → ["gh","zhangsan"] */
export function linkToCompact(l: { type: string; value: string; label?: string }): unknown {
  const value = l.value.trim()
  if (l.type === CUSTOM_LINK_CODE) {
    return [CUSTOM_LINK_CODE, (l.label || '链接').slice(0, LIMITS.linkLabel), value]
  }
  const def = LINK_TYPES.find((t) => t.code === l.type)
  let v = value
  if (def && def.base && /^https?:\/\//i.test(v) && v.toLowerCase().startsWith(def.base.toLowerCase())) {
    v = v.slice(def.base.length)
  }
  if (l.type === 'yt') v = v.replace(/^@/, '')
  return [l.type, v.slice(0, LIMITS.linkValue)]
}

export function serialize(profile: Profile): string {
  const o: Record<string, unknown> = { v: 1 }
  const put = (key: string, value: string, max: number) => {
    const t = (value || '').trim()
    if (t) o[key] = t.slice(0, max)
  }
  put('n', profile.name, LIMITS.name)
  put('nn', profile.nickname, LIMITS.nickname)
  put('t', profile.title, LIMITS.title)
  put('c', profile.company, LIMITS.company)
  put('ct', profile.city, LIMITS.city)
  put('b', profile.bio, LIMITS.bio)
  put('bd', profile.bioLong, LIMITS.bioLong)
  put('p', profile.phone, LIMITS.phone)
  put('e', profile.email, LIMITS.email)
  put('w', profile.wechat, LIMITS.wechat)
  put('q', profile.qq, LIMITS.qq)
  put('tg', profile.telegram, LIMITS.telegram)
  put('dc', profile.discord, LIMITS.discord)

  // 头像:'' / emoji / dataURL
  const avatar = (profile.avatar || '').trim()
  if (avatar) o.a = avatar.slice(0, LIMITS.avatar)

  // 主题 ID(0 为默认,省略)
  const s = Number(profile.style) || 0
  if (s > 0) o.s = s

  // 自定义颜色 [背景, 主色, 文字, 卡片](无 # 的 hex)
  if (profile.colors) {
    const cc = [profile.colors.bg, profile.colors.primary, profile.colors.text, profile.colors.card]
      .map((c) => String(c || '').replace(/^#/, '').toLowerCase())
      .filter(Boolean)
    if (cc.length === 4) o.cc = cc
  }

  // 链接(仅启用且非空的)
  const links = (profile.links || [])
    .filter((l) => l.enabled !== false && l.value && l.value.trim())
    .slice(0, LIMITS.maxLinks)
    .map(linkToCompact)
  if (links.length) o.l = links

  return JSON.stringify(o)
}
