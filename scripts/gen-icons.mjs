// 生成 PWA 图标(纯 Node,无第三方依赖):手工编码 PNG(zlib + CRC32)
// 视觉:Neo Brutalism — 黄底 / 黑色粗边 / QR 块 / 粉色点缀
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// ---------- PNG 编码 ----------
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter none
    rgba.copy ? rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride) : raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

// ---------- 画布 ----------
const COLORS = {
  ink: [17, 17, 17, 255],
  paper: [245, 241, 232, 255],
  yellow: [255, 220, 88, 255],
  white: [255, 255, 255, 255],
  pink: [255, 144, 232, 255],
}

function makeIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3]
  }
  const fillRect = (x0, y0, w, h, c) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c)
  }

  // 黄色背景 + 黑色粗边框
  fillRect(0, 0, size, size, COLORS.yellow)
  const bw = Math.max(4, Math.round(size * 0.045))
  fillRect(0, 0, size, bw, COLORS.ink)
  fillRect(0, size - bw, size, bw, COLORS.ink)
  fillRect(0, 0, bw, size, COLORS.ink)
  fillRect(size - bw, 0, bw, size, COLORS.ink)

  // 内部白色区域(maskable 需要更大的安全区)
  const pad = maskable ? Math.round(size * 0.19) : Math.round(size * 0.12)
  const area = size - pad * 2
  fillRect(pad, pad, area, area, COLORS.white)
  const ib = Math.max(3, Math.round(size * 0.022))
  fillRect(pad - ib, pad - ib, area + ib * 2, ib, COLORS.ink)
  fillRect(pad - ib, pad + area, area + ib * 2, ib, COLORS.ink)
  fillRect(pad - ib, pad - ib, ib, area + ib * 2, COLORS.ink)
  fillRect(pad + area, pad - ib, ib, area + ib * 2, COLORS.ink)

  // QR:三个定位方块 + 固定伪随机模块
  const cell = area / 9
  const finder = (gx, gy) => {
    const x0 = Math.round(pad + gx * cell)
    const y0 = Math.round(pad + gy * cell)
    const s = Math.round(cell * 3)
    const unit = Math.max(2, Math.round(s / 7))
    fillRect(x0, y0, s, s, COLORS.ink)
    fillRect(x0 + unit, y0 + unit, s - unit * 2, s - unit * 2, COLORS.white)
    fillRect(x0 + unit * 2, y0 + unit * 2, s - unit * 4, s - unit * 4, COLORS.ink)
  }
  finder(0, 0)
  finder(6, 0)
  finder(0, 6)

  let seed = 0x5f2a
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let gy = 0; gy < 9; gy++) {
    for (let gx = 0; gx < 9; gx++) {
      const inFinder = (gx < 4 && gy < 4) || (gx > 4 && gy < 4) || (gx < 4 && gy > 4)
      if (inFinder) continue
      if (rand() < 0.42) {
        fillRect(
          Math.round(pad + gx * cell) + 1,
          Math.round(pad + gy * cell) + 1,
          Math.max(2, Math.round(cell) - 2),
          Math.max(2, Math.round(cell) - 2),
          COLORS.ink,
        )
      }
    }
  }
  // 粉色点缀块(Neo Brutalism)
  const accent = Math.round(pad + area * 0.66)
  const aSize = Math.round(cell * 1.6)
  fillRect(accent, accent, aSize, aSize, COLORS.pink)

  return encodePng(size, size, buf)
}

writeFileSync(join(outDir, 'icon-192.png'), makeIcon(192))
writeFileSync(join(outDir, 'icon-512.png'), makeIcon(512))
writeFileSync(join(outDir, 'icon-512-maskable.png'), makeIcon(512, { maskable: true }))
console.log('icons written to', outDir)
