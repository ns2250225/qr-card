// 扫码:优先 BarcodeDetector API,不支持时动态加载 ZXing(仅扫描页加载)
let zxingReader: any = null
let barDetector: any = null

async function getDetector(): Promise<any | null> {
  const BD = (globalThis as any).BarcodeDetector
  if (typeof BD !== 'function') return null
  if (!barDetector) {
    try {
      barDetector = new BD({ formats: ['qr_code'] })
    } catch {
      return null
    }
  }
  return barDetector
}

async function getZxingReader(): Promise<any> {
  if (zxingReader) return zxingReader
  const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import('@zxing/library')
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
  hints.set(DecodeHintType.TRY_HARDER, true)
  zxingReader = new BrowserMultiFormatReader(hints)
  return zxingReader
}

/** 把视频帧 / 位图画到画布上(限制最大边长,降低解码压力) */
export function drawSourceToCanvas(source: CanvasImageSource, canvas: HTMLCanvasElement, maxSide = 720): void {
  const w = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || (source as HTMLImageElement).width
  const h = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || (source as HTMLImageElement).height
  if (!w || !h) return
  const scale = Math.min(1, maxSide / Math.max(w, h))
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
}

/** 在画布上识别二维码,返回文本或 null */
export async function decodeCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const detector = await getDetector()
  if (detector) {
    try {
      const codes = await detector.detect(canvas)
      if (codes && codes.length && codes[0].rawValue) return codes[0].rawValue
    } catch {
      /* 落到 ZXing */
    }
  }
  try {
    const reader = await getZxingReader()
    const result = reader.decodeFromCanvas(canvas)
    return result ? result.getText() : null
  } catch {
    return null
  }
}

/** 从图片文件识别二维码 */
export async function decodeImageFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'sync'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片读取失败'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    drawSourceToCanvas(img, canvas, 1200)
    return await decodeCanvas(canvas)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** 摄像头连续扫描控制器 */
export class CameraScanner {
  private stream: MediaStream | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private canvas = document.createElement('canvas')

  get running(): boolean {
    return !!this.stream
  }

  async start(video: HTMLVideoElement, onText: (text: string) => void, onFrame?: () => void): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前环境不支持摄像头(需要 HTTPS 或 localhost)')
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
    video.srcObject = this.stream
    video.setAttribute('playsinline', 'true')
    await video.play()

    this.timer = setInterval(async () => {
      if (video.readyState < 2) return
      drawSourceToCanvas(video, this.canvas)
      onFrame?.()
      const text = await decodeCanvas(this.canvas)
      if (text) {
        this.stop()
        onText(text)
      }
    }, 220)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
  }
}
