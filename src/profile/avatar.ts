// 头像:Emoji 内置头像 + 照片压缩(裁剪 1:1 → 64×64 → WebP → 控制在 ~1.5KB)
import { EMOJI_AVATARS } from '../protocol/schema'

const TARGET_CHARS = 2100 // data URL 字符数上限 ≈ 1.5KB 二进制(base64 膨胀 1.33)

export function isPhotoAvatar(a: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(a)
}

export function isEmojiAvatar(a: string): boolean {
  return a.length > 0 && a.length <= 16 && !a.startsWith('data:')
}

export function avatarBytes(a: string): number {
  if (!a.startsWith('data:')) return a.length
  const i = a.indexOf(',')
  return Math.max(0, Math.floor(((a.length - i - 1) * 3) / 4))
}

async function loadBitmap(source: Blob | string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof source === 'string') {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片读取失败'))
      img.src = source
    })
    return img
  }
  return createImageBitmap(source)
}

/**
 * 照片 → 居中裁剪 1:1 → 缩放到 size → 依质量阶梯压到目标体积
 * 返回 data URL(image/webp,浏览器不支持时回退 jpeg)
 */
export async function compressAvatar(source: Blob | string, size = 64, startQuality = 0.8): Promise<string> {
  const bitmap = await loadBitmap(source)
  const iw: number = (bitmap as ImageBitmap).width ?? (bitmap as HTMLImageElement).naturalWidth
  const ih: number = (bitmap as ImageBitmap).height ?? (bitmap as HTMLImageElement).naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // 居中 cover 裁剪
  const side = Math.min(iw, ih)
  const sx = (iw - side) / 2
  const sy = (ih - side) / 2
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, side, side, 0, 0, size, size)

  const qualities = [startQuality, 0.6, 0.45, 0.3, 0.2, 0.12]
  let best = ''
  for (const q of qualities) {
    let out = canvas.toDataURL('image/webp', q)
    if (!out.startsWith('data:image/webp')) {
      // 浏览器不支持 WebP 导出(老 Safari),回退 JPEG(无透明,先铺白底)
      const c2 = document.createElement('canvas')
      c2.width = size
      c2.height = size
      const c2ctx = c2.getContext('2d')!
      c2ctx.fillStyle = '#ffffff'
      c2ctx.fillRect(0, 0, size, size)
      c2ctx.drawImage(canvas, 0, 0)
      out = c2.toDataURL('image/jpeg', q)
    }
    best = out
    if (out.length <= TARGET_CHARS) return out
  }
  return best
}

export { EMOJI_AVATARS }
