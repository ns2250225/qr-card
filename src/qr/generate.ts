// 二维码生成与容量计算
// 原则:扫码成功率 > 美观 —— 默认黑白、标准方点、不加 Logo
import QRCode from 'qrcode'
import type { ECLevel, QRMode } from '../types'

/** 字节模式下各纠错等级的最大容量(bytes) */
export const EC_CAP: Record<ECLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 }

export const EC_OPTIONS: { value: ECLevel; label: string; desc: string }[] = [
  { value: 'L', label: '最大容量', desc: '数据最多,容错较低' },
  { value: 'M', label: '平衡', desc: '默认推荐' },
  { value: 'Q', label: '高可靠', desc: '适合打印 / 胸牌' },
]

export const QR_MODES: { value: QRMode; label: string; desc: string }[] = [
  { value: 'universal', label: '通用模式', desc: '手机相机扫码即可打开(推荐)' },
  { value: 'offline', label: '完全离线模式', desc: '需要 QRCard 扫描器,不依赖域名' },
]

export function utf8Length(s: string): number {
  return new TextEncoder().encode(s).length
}

export interface CapacityInfo {
  bytes: number
  max: number
  percent: number
  level: 'ok' | 'normal' | 'warn' | 'danger' | 'over'
  canGenerate: boolean
}

/** 容量等级:0–40 绿 / 40–70 正常 / 70–90 警告 / 90–100 危险 / >100 无法生成 */
export function capacityInfo(content: string, ec: ECLevel): CapacityInfo {
  const bytes = utf8Length(content)
  const max = EC_CAP[ec]
  const percent = (bytes / max) * 100
  let level: CapacityInfo['level'] = 'ok'
  if (percent > 100) level = 'over'
  else if (percent > 90) level = 'danger'
  else if (percent > 70) level = 'warn'
  else if (percent > 40) level = 'normal'
  return { bytes, max, percent, level, canGenerate: percent <= 100 }
}

/** 二维码内容:通用模式为 URL(数据在 hash 中,服务器不存任何数据);离线模式为裸协议 */
export function buildQRContent(payload: string, mode: QRMode): string {
  if (mode === 'offline') return payload
  const base = location.href.split('#')[0]
  return `${base}#/p/${payload}`
}

export async function renderQrToCanvas(canvas: HTMLCanvasElement, content: string, ec: ECLevel): Promise<void> {
  await QRCode.toCanvas(canvas, content, {
    errorCorrectionLevel: ec,
    margin: 2,
    width: 560,
    color: { dark: '#111111', light: '#FFFFFF' },
  })
}

export async function renderQrToDataUrl(content: string, ec: ECLevel, width = 560): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: ec,
    margin: 2,
    width,
    color: { dark: '#111111', light: '#FFFFFF' },
  })
}
