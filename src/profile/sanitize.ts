// 安全:二维码数据是不可信输入。所有字段 textContent 渲染(Vue 插值默认转义),
// URL 只允许 https/http/mailto/tel 协议,杜绝 javascript:/data:text/html XSS。
import type { Profile, PublicProfile, PublicLink } from '../types'
import { LIMITS, LINK_TYPES, CUSTOM_LINK_CODE, CONTACT_FIELDS, cloneProfile } from '../protocol/schema'

const SAFE_HTTP = /^https?:\/\/[^\s"<>\`\x00-\x1f]+$/i
const SAFE_MAILTO = /^mailto:[^\s@<>"`]+@[^\s@<>"`]+\.[^\s@<>"`]+$/i
const SAFE_TEL = /^tel:\+?[0-9\-().\s]{3,25}$/i

/** 校验并返回安全 URL,不安全时返回 null */
export function safeUrl(url: string): string | null {
  const u = (url || '').trim()
  if (!u) return null
  if (SAFE_HTTP.test(u)) return u
  if (SAFE_MAILTO.test(u)) return u.replace(/\s/g, '')
  if (SAFE_TEL.test(u)) return u.replace(/\s/g, '')
  return null
}

/** 校验头像:emoji 或白名单 data:image */
export function isValidAvatar(a: unknown): boolean {
  if (typeof a !== 'string') return false
  if (!a) return false
  if (a.length <= 16) return !/[\x00-\x1f]/.test(a)
  return isPhotoDataUrl(a)
}

export function isPhotoDataUrl(a: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(a) && a.length <= LIMITS.avatar
}

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\x00-\x1f]/g, '').slice(0, max).trim() : ''

/** 由已解码的紧凑数据构建安全的展示 Profile(不可信输入入口) */
export function sanitizeDecoded(raw: Profile): PublicProfile {
  const out: PublicProfile = {
    name: str(raw.name, LIMITS.name),
    nickname: str(raw.nickname, LIMITS.nickname),
    title: str(raw.title, LIMITS.title),
    company: str(raw.company, LIMITS.company),
    city: str(raw.city, LIMITS.city),
    bio: str(raw.bio, LIMITS.bio),
    bioLong: str(raw.bioLong, LIMITS.bioLong),
    phone: str(raw.phone, LIMITS.phone).replace(/[^\d+\-()\s]/g, ''),
    email: str(raw.email, LIMITS.email),
    wechat: str(raw.wechat, LIMITS.wechat),
    qq: str(raw.qq, LIMITS.qq).replace(/[^\dA-Za-z]/g, ''),
    telegram: str(raw.telegram, LIMITS.telegram).replace(/^@/, ''),
    discord: str(raw.discord, LIMITS.discord),
    avatar: isValidAvatar(raw.avatar) ? raw.avatar : '',
    style: Math.min(Math.max(0, Math.floor(Number(raw.style) || 0)), 7),
    colors: sanitizeColors(raw.colors),
    links: sanitizeLinks(raw.links || []),
  }
  if (!out.name) throw new Error('名片数据中缺少姓名')
  return out
}

function sanitizeColors(c: any): PublicProfile['colors'] {
  if (!c || typeof c !== 'object') return null
  const hex = (v: unknown): string | null => {
    if (typeof v !== 'string') return null
    const t = v.replace(/^#/, '')
    return /^[0-9a-fA-F]{3,8}$/.test(t) ? t : null
  }
  const bg = hex(c.bg), primary = hex(c.primary), text = hex(c.text), card = hex(c.card)
  if (!bg && !primary && !text && !card) return null
  return { bg: bg || '', primary: primary || '', text: text || '', card: card || '' }
}

function sanitizeLinks(links: Profile['links']): PublicLink[] {
  const out: PublicLink[] = []
  for (const l of links.slice(0, LIMITS.maxLinks)) {
    if (!l || typeof l !== 'object') continue
    const type = str(l.type, 8)
    const value = str(l.value, LIMITS.linkValue)
    if (!value) continue
    let label = ''
    let url: string | null = null
    if (type === CUSTOM_LINK_CODE) {
      label = str(l.label, LIMITS.linkLabel) || '链接'
      url = safeUrl(value)
    } else {
      const def = LINK_TYPES.find((t) => t.code === type)
      if (!def) {
        // 未知代码:仅当值本身是安全 http(s) URL 时保留
        url = SAFE_HTTP.test(value) ? value : null
        label = '链接'
      } else if (/^https?:\/\//i.test(value)) {
        url = safeUrl(value)
        label = def.label
      } else if (def.base === '') {
        // 个人网站必须给完整 URL
        url = safeUrl(value.startsWith('http') ? value : `https://${value}`)
        label = def.label
      } else if (type === 'u') {
        url = null
      } else {
        url = safeUrl(def.base + value.replace(/^@/, ''))
        label = def.label
      }
    }
    if (url) out.push({ type: type || 'u', label, url })
    if (out.length >= LIMITS.maxLinks) break
  }
  return out
}

/** 编辑态 → 展示态(应用可见性开关,二维码只携带可见数据,预览保持一致) */
export function toPublicProfile(p: Profile): PublicProfile {
  const copy = cloneProfile(p)
  for (const f of CONTACT_FIELDS) {
    if (copy.hidden?.[f.key]) (copy as any)[f.key] = ''
  }
  copy.links = copy.links.filter((l) => l.enabled && l.value.trim())
  return sanitizeDecoded(copy)
}
