// 分享卡片:Canvas 本地生成 PNG 海报(头像 + 姓名 + 二维码)
import QRCode from 'qrcode'
import type { PublicProfile } from '../types'

const INK = '#111111'
const PAPER = '#f5f1e8'

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line)
      line = ch
      if (lines.length >= maxLines) break
    } else {
      line += ch
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === maxLines && text.length > lines.join('').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, '') + '…'
  }
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function drawShareCard(profile: PublicProfile, qrContent: string): Promise<HTMLCanvasElement> {
  const W = 900
  const H = 1200
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 背景 + 硬阴影卡片(Neo Brutalism)
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = INK
  roundRect(ctx, 60, 72, W - 120, H - 120, 18)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 48, 52, W - 120, H - 120, 18)
  ctx.fill()
  ctx.lineWidth = 10
  ctx.strokeStyle = INK
  roundRect(ctx, 48, 52, W - 120, H - 120, 18)
  ctx.stroke()

  const cx = W / 2
  // 头像
  const avatarY = 130
  if (profile.avatar.startsWith('data:')) {
    const img = new Image()
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = () => rej(new Error('头像加载失败'))
      img.src = profile.avatar
    })
    ctx.save()
    roundRect(ctx, cx - 90, avatarY, 180, 180, 16)
    ctx.clip()
    ctx.drawImage(img, cx - 90, avatarY, 180, 180)
    ctx.restore()
    ctx.lineWidth = 8
    ctx.strokeStyle = INK
    roundRect(ctx, cx - 90, avatarY, 180, 180, 16)
    ctx.stroke()
  } else if (profile.avatar) {
    ctx.font = '150px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(profile.avatar, cx, avatarY + 96)
  } else {
    ctx.fillStyle = '#FFDC58'
    roundRect(ctx, cx - 90, avatarY, 180, 180, 16)
    ctx.fill()
    ctx.lineWidth = 8
    ctx.strokeStyle = INK
    roundRect(ctx, cx - 90, avatarY, 180, 180, 16)
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.font = '900 90px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((profile.name || '?').slice(0, 1), cx, avatarY + 96)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  // 姓名 / 职业
  let y = avatarY + 268
  ctx.fillStyle = INK
  ctx.font = '900 72px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(profile.name.slice(0, 12), cx, y)
  y += 56
  const subtitle = [profile.title, profile.company].filter(Boolean).join(' · ')
  if (subtitle) {
    ctx.fillStyle = '#666666'
    ctx.font = '600 34px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(subtitle.slice(0, 24), cx, y)
    y += 52
  }
  if (profile.bio) {
    ctx.fillStyle = '#444444'
    ctx.font = '500 30px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    const lines = wrapText(ctx, profile.bio, W - 260, 2)
    for (const l of lines) {
      ctx.fillText(l, cx, y)
      y += 44
    }
    y += 8
  }

  // "扫一扫认识我" 徽章
  const badgeW = 320
  const badgeH = 62
  ctx.fillStyle = '#FFDC58'
  roundRect(ctx, cx - badgeW / 2, y, badgeW, badgeH, 10)
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  roundRect(ctx, cx - badgeW / 2, y, badgeW, badgeH, 10)
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.font = '800 30px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('扫一扫认识我', cx, y + badgeH / 2 + 2)
  ctx.textBaseline = 'alphabetic'
  y += badgeH + 36

  // 二维码
  const qrSize = Math.min(430, H - y - 150)
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, qrContent, { errorCorrectionLevel: 'M', margin: 2, width: qrSize })
  ctx.drawImage(qrCanvas, cx - qrSize / 2, y, qrSize, qrSize)
  ctx.lineWidth = 8
  ctx.strokeStyle = INK
  ctx.strokeRect(cx - qrSize / 2, y, qrSize, qrSize)

  // 底部品牌
  ctx.fillStyle = '#999999'
  ctx.font = '700 26px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText('QRCard · 你的主页，就住在二维码里', cx, H - 96)
  return canvas
}

export async function exportShareCard(profile: PublicProfile, qrContent: string, filename: string): Promise<void> {
  const canvas = await drawShareCard(profile, qrContent)
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) throw new Error('图片生成失败')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
