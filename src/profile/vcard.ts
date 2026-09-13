// vCard:根据 Profile 生成 .vcf 并保存(兼容微信/支付宝内置浏览器),无需服务器
import type { PublicProfile } from '../types'
import { saveBlobCompat, type SaveResult } from '../store/save'

function escapeVCard(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

export function buildVCard(p: PublicProfile): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`N:${escapeVCard(p.name)};;;;`)
  lines.push(`FN:${escapeVCard(p.name)}`)
  if (p.nickname) lines.push(`NICKNAME:${escapeVCard(p.nickname)}`)
  if (p.title) lines.push(`TITLE:${escapeVCard(p.title)}`)
  if (p.company) lines.push(`ORG:${escapeVCard(p.company)}`)
  if (p.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(p.phone)}`)
  if (p.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(p.email)}`)
  const urls = p.links.map((l) => l.url).filter((u) => /^https?:\/\//i.test(u)).slice(0, 3)
  for (const u of urls) lines.push(`URL:${u}`)
  const notes: string[] = []
  if (p.bio) notes.push(p.bio)
  if (p.wechat) notes.push(`微信号: ${p.wechat}`)
  if (p.qq) notes.push(`QQ: ${p.qq}`)
  if (p.telegram) notes.push(`Telegram: @${p.telegram}`)
  if (p.discord) notes.push(`Discord: ${p.discord}`)
  if (p.city) notes.push(`城市: ${p.city}`)
  if (notes.length) lines.push(`NOTE:${escapeVCard(notes.join(' / '))}`)
  lines.push(`X-QRCARD-VERSION:1`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export async function downloadVCard(p: PublicProfile): Promise<SaveResult> {
  const text = buildVCard(p)
  const blob = new Blob([text], { type: 'text/vcard;charset=utf-8' })
  // copyText 兜底:内置浏览器无法下载文件时,浮层里可一键复制联系人文本
  return saveBlobCompat(blob, `${(p.name || '名片').replace(/[\\/:*?"<>|]/g, '')}.vcf`, { copyText: text })
}
