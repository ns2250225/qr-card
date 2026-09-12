// 编码/解码:Profile ↔ QRCARD:1:<base64url>
// 流程:紧凑 JSON → UTF-8 → Deflate → Base64URL(无 +/=,URL 安全)
import type { Profile } from '../types'
import { serialize } from './serialize'
import { deserialize, ProtocolError } from './deserialize'
import { deflateBytes, inflateBytes } from './compress'

export const PROTOCOL_PREFIX = 'QRCARD'
export const PROTOCOL_VERSION = 1

export function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

export function bytesToUtf8(b: Uint8Array): string {
  return new TextDecoder().decode(b)
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlToBytes(s: string): Uint8Array {
  let t = s.replace(/-/g, '+').replace(/_/g, '/').trim()
  while (t.length % 4 !== 0) t += '='
  const bin = atob(t)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** 编码为协议字符串 QRCARD:1:xxxx */
export async function encodeProfile(profile: Profile): Promise<string> {
  const json = serialize(profile)
  const compressed = await deflateBytes(utf8ToBytes(json))
  return `${PROTOCOL_PREFIX}:${PROTOCOL_VERSION}:${bytesToBase64Url(compressed)}`
}

export interface DecodedCard {
  version: number
  profile: Profile
}

/**
 * 解析任意扫出的文本:
 *  - QRCARD:1:<payload>          完全离线模式
 *  - https://…/#/p/QRCARD:1:<x>  通用模式(由 /p 路由拆出后进入)
 *  - <payload>(裸 base64url)     宽松兼容
 */
export function splitProtocol(raw: string): { version: number; payload: string } {
  const text = (raw || '').trim()
  if (!text.startsWith(`${PROTOCOL_PREFIX}:`)) {
    throw new ProtocolError('不是 QRCard 协议数据')
  }
  const parts = text.split(':')
  if (parts.length < 3) throw new ProtocolError('协议格式不完整')
  const version = Number(parts[1])
  if (!Number.isInteger(version) || version <= 0) throw new ProtocolError('协议版本无效')
  const payload = parts.slice(2).join(':')
  return { version, payload }
}

export async function decodeProtocol(raw: string): Promise<DecodedCard> {
  const { version, payload } = splitProtocol(raw)
  if (version !== PROTOCOL_VERSION) {
    throw new ProtocolError(`此二维码使用了更新的协议 v${version},请升级 QRCard 后重新扫描`)
  }
  let bytes: Uint8Array
  try {
    bytes = base64UrlToBytes(payload)
  } catch {
    throw new ProtocolError('Payload 不是有效的 Base64URL')
  }
  let json: string
  try {
    json = bytesToUtf8(await inflateBytes(bytes))
  } catch {
    throw new ProtocolError('解压缩失败,数据可能已损坏')
  }
  return { version, profile: deserialize(json) }
}
