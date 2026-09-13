// 下载兼容层:微信 / 支付宝 / QQ / 钉钉等内置 WebView 会拦截 a[download] + blob 下载(静默失败)
// 策略:普通浏览器直接下载 → 内置浏览器优先调起系统分享(可存相册/发好友)→ 兜底浮层(图片长按保存 / 文件引导用系统浏览器打开)
import { reactive } from 'vue'
import { downloadBlob } from './toast'

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
// 调试:URL 带 ?saveOverlay=1 时强制走内置浏览器兜底路径,便于桌面端验证浮层
const UA_FORCE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('saveOverlay')

export const isWeChat = /MicroMessenger/i.test(ua)
export const isAlipay = /AlipayClient/i.test(ua)
export const isDingTalk = /DingTalk/i.test(ua)
// 手机 QQ 内置浏览器(UA 含 " QQ/版本");独立安装的 QQ 浏览器 App 支持下载,不算内置拦截
export const isQQWebview = !isWeChat && /\bQQ\/[\d.]+/.test(ua)

/** 这些内置 WebView 会静默吞掉 a[download],必须走兜底 */
export const isRestrictedWebview = UA_FORCE || isWeChat || isAlipay || isDingTalk || isQQWebview

export type SaveResult = 'downloaded' | 'shared' | 'overlay' | 'cancelled'

// 兜底浮层全局状态(App.vue 挂载一次 <SaveFallbackOverlay />)
export const saveFallback = reactive({
  show: false,
  mode: 'image' as 'image' | 'file',
  imageSrc: '',
  filename: '',
  copyText: '',
})

export function closeSaveFallback(): void {
  saveFallback.show = false
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(new Error('blob 读取失败'))
    fr.readAsDataURL(blob)
  })
}

type ShareAttempt = 'shared' | 'cancelled' | 'unsupported'

/** 尝试 Web Share Level 2(分享文件给系统/微信面板,用户可"存储图像"或发给朋友);unsupported = 当前环境不可用 */
async function tryShareFile(blob: Blob, filename: string): Promise<ShareAttempt> {
  try {
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] })
      return 'shared'
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return 'cancelled' // 用户主动关掉分享面板,不算失败
  }
  return 'unsupported'
}

/**
 * 通用保存入口,替代直接的 a[download]:
 * - 普通浏览器 → 直接下载
 * - 微信/支付宝等内置浏览器 → 系统分享(若支持)→ 图片浮层「长按保存」/ 文件浮层「在浏览器打开」引导
 * @param opts.copyText 文件模式浮层里「复制内容」按钮携带的文本(如 vCard / JSON)
 */
export async function saveBlobCompat(
  blob: Blob,
  filename: string,
  opts: { copyText?: string } = {},
): Promise<SaveResult> {
  if (!isRestrictedWebview) {
    downloadBlob(blob, filename)
    return 'downloaded'
  }
  const r = await tryShareFile(blob, filename)
  if (r !== 'unsupported') return r
  if (blob.type.startsWith('image/')) {
    saveFallback.mode = 'image'
    saveFallback.imageSrc = await blobToDataUrl(blob)
  } else {
    saveFallback.mode = 'file'
    saveFallback.filename = filename
    saveFallback.copyText = opts.copyText ?? ''
  }
  saveFallback.show = true
  return 'overlay'
}
