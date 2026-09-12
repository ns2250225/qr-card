// 反序列化:紧凑 JSON → 编辑态 Profile(带字段校验与截断)
import type { Profile } from '../types'
import { LIMITS, emptyProfile } from './schema'
import { isValidAvatar } from '../profile/sanitize'

export class ProtocolError extends Error {}

export function deserialize(json: string): Profile {
  let o: any
  try {
    o = JSON.parse(json)
  } catch {
    throw new ProtocolError('数据不是有效的 JSON')
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new ProtocolError('数据结构无效')

  const version = Number(o.v ?? 1)
  if (version !== 1) throw new ProtocolError(`不支持的协议版本: ${version}`)

  const p = emptyProfile()
  const str = (key: string, max: number): string => {
    const v = o[key]
    return typeof v === 'string' ? v.slice(0, max).trim() : ''
  }
  p.name = str('n', LIMITS.name)
  p.nickname = str('nn', LIMITS.nickname)
  p.title = str('t', LIMITS.title)
  p.company = str('c', LIMITS.company)
  p.city = str('ct', LIMITS.city)
  p.bio = str('b', LIMITS.bio)
  p.bioLong = str('bd', LIMITS.bioLong)
  p.phone = str('p', LIMITS.phone)
  p.email = str('e', LIMITS.email)
  p.wechat = str('w', LIMITS.wechat)
  p.qq = str('q', LIMITS.qq)
  p.telegram = str('tg', LIMITS.telegram)
  p.discord = str('dc', LIMITS.discord)

  if (typeof o.a === 'string' && o.a && isValidAvatar(o.a)) p.avatar = o.a

  const s = Number(o.s)
  if (Number.isInteger(s) && s >= 0 && s < 8) p.style = s

  if (Array.isArray(o.cc) && o.cc.length === 4 && o.cc.every((c: unknown) => typeof c === 'string' && /^[0-9a-fA-F]{3,8}$/.test(c))) {
    p.colors = { bg: o.cc[0], primary: o.cc[1], text: o.cc[2], card: o.cc[3] }
  }

  if (Array.isArray(o.l)) {
    for (const item of o.l.slice(0, LIMITS.maxLinks)) {
      if (!Array.isArray(item) || item.length < 2) continue
      const [type, value, label] = item
      if (typeof type !== 'string' || typeof value !== 'string') continue
      p.links.push({
        type,
        value: value.slice(0, LIMITS.linkValue),
        label: typeof label === 'string' ? label.slice(0, LIMITS.linkLabel) : undefined,
        enabled: true,
      })
    }
  }

  if (!p.name) throw new ProtocolError('名片数据中缺少姓名')
  return p
}
