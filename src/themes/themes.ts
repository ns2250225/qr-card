// 内置主题:二维码只保存主题 ID("s": n),Reader 端加载内置样式,不增加容量
import type { CustomColors } from '../types'

export interface Theme {
  id: string
  name: string
  swatch: string[]
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    id: 'minimal',
    name: 'Minimal 极简',
    swatch: ['#ffffff', '#2563eb', '#111111'],
    vars: {
      '--p-bg': '#ffffff',
      '--p-bg-image': 'none',
      '--p-card': '#fafafa',
      '--p-text': '#111111',
      '--p-muted': '#6b7280',
      '--p-accent': '#2563eb',
      '--p-accent-ink': '#ffffff',
      '--p-border': '#e5e7eb',
      '--p-border-w': '1.5px',
      '--p-radius': '16px',
      '--p-shadow': 'none',
      '--p-backdrop': 'none',
      '--p-font': 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
  {
    id: 'glass',
    name: 'Glass 玻璃',
    swatch: ['#7c6eea', '#ffdd67', '#ffffff'],
    vars: {
      '--p-bg': '#2b3170',
      '--p-bg-image': 'linear-gradient(135deg, #667eea 0%, #764ba2 55%, #6ee7b7 130%)',
      '--p-card': 'rgba(255,255,255,0.14)',
      '--p-text': '#ffffff',
      '--p-muted': 'rgba(255,255,255,0.72)',
      '--p-accent': '#ffdd67',
      '--p-accent-ink': '#3b2f00',
      '--p-border': 'rgba(255,255,255,0.35)',
      '--p-border-w': '1.5px',
      '--p-radius': '20px',
      '--p-shadow': '0 18px 40px rgba(20,20,60,0.35)',
      '--p-backdrop': 'blur(14px)',
      '--p-font': 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
  {
    id: 'cyber',
    name: 'Cyberpunk 赛博',
    swatch: ['#0a0a12', '#ff2bd6', '#eaeaea'],
    vars: {
      '--p-bg': '#0a0a12',
      '--p-bg-image': 'radial-gradient(ellipse at 50% 0%, rgba(255,43,214,0.22), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(0,229,255,0.16), transparent 50%)',
      '--p-card': '#12121f',
      '--p-text': '#f2f2f2',
      '--p-muted': '#9aa0b4',
      '--p-accent': '#ff2bd6',
      '--p-accent-ink': '#0a0a12',
      '--p-border': 'rgba(255,43,214,0.55)',
      '--p-border-w': '1.5px',
      '--p-radius': '4px',
      '--p-shadow': '0 0 18px rgba(255,43,214,0.35)',
      '--p-backdrop': 'none',
      '--p-font': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  },
  {
    id: 'pixel',
    name: 'Pixel 像素',
    swatch: ['#1b1b2f', '#ffd93d', '#f1f1ff'],
    vars: {
      '--p-bg': '#1b1b2f',
      '--p-bg-image': 'none',
      '--p-card': '#24243e',
      '--p-text': '#f1f1ff',
      '--p-muted': '#8f8fb8',
      '--p-accent': '#ffd93d',
      '--p-accent-ink': '#1b1b2f',
      '--p-border': '#0a0a14',
      '--p-border-w': '3px',
      '--p-radius': '0px',
      '--p-shadow': '5px 5px 0 #0a0a14',
      '--p-backdrop': 'none',
      '--p-font': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  },
  {
    id: 'business',
    name: 'Business 商务',
    swatch: ['#f4f6f8', '#0f766e', '#16283c'],
    vars: {
      '--p-bg': '#f4f6f8',
      '--p-bg-image': 'none',
      '--p-card': '#ffffff',
      '--p-text': '#16283c',
      '--p-muted': '#5a6b7c',
      '--p-accent': '#0f766e',
      '--p-accent-ink': '#ffffff',
      '--p-border': '#d7dee6',
      '--p-border-w': '1px',
      '--p-radius': '10px',
      '--p-shadow': '0 10px 30px rgba(22,40,60,0.10)',
      '--p-backdrop': 'none',
      '--p-font': 'Georgia, "Songti SC", "SimSun", system-ui, serif',
    },
  },
  {
    id: 'paper',
    name: 'Paper 纸质',
    swatch: ['#f7f2e7', '#c0392b', '#2d2a26'],
    vars: {
      '--p-bg': '#f7f2e7',
      '--p-bg-image': 'repeating-linear-gradient(0deg, transparent 0 27px, rgba(160,140,100,0.14) 27px 28px)',
      '--p-card': '#fffdf6',
      '--p-text': '#2d2a26',
      '--p-muted': '#8a8070',
      '--p-accent': '#c0392b',
      '--p-accent-ink': '#fffdf6',
      '--p-border': '#d8cfba',
      '--p-border-w': '1.5px',
      '--p-radius': '6px',
      '--p-shadow': '3px 3px 0 rgba(45,42,38,0.16)',
      '--p-backdrop': 'none',
      '--p-font': 'Georgia, "Kaiti SC", "STKaiti", serif',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal 终端',
    swatch: ['#0c0c0c', '#33ff66', '#33ff66'],
    vars: {
      '--p-bg': '#0c0c0c',
      '--p-bg-image': 'none',
      '--p-card': '#141414',
      '--p-text': '#33ff66',
      '--p-muted': '#1f9f4d',
      '--p-accent': '#33ff66',
      '--p-accent-ink': '#031a09',
      '--p-border': '#1f5c33',
      '--p-border-w': '1px',
      '--p-radius': '0px',
      '--p-shadow': 'none',
      '--p-backdrop': 'none',
      '--p-font': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  },
  {
    id: 'cute',
    name: 'Cute 可爱',
    swatch: ['#ffeef5', '#ff7eb6', '#4a2b3a'],
    vars: {
      '--p-bg': '#ffeef5',
      '--p-bg-image': 'radial-gradient(circle at 15% 20%, rgba(255,126,182,0.18) 0 60px, transparent 61px), radial-gradient(circle at 85% 75%, rgba(196,161,255,0.2) 0 80px, transparent 81px)',
      '--p-card': '#ffffff',
      '--p-text': '#4a2b3a',
      '--p-muted': '#a87b93',
      '--p-accent': '#ff7eb6',
      '--p-accent-ink': '#ffffff',
      '--p-border': '#ffb7d5',
      '--p-border-w': '2px',
      '--p-radius': '24px',
      '--p-shadow': '0 14px 30px rgba(255,126,182,0.28)',
      '--p-backdrop': 'none',
      '--p-font': 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
]

export const DEFAULT_THEME = 0

/** 十六进制亮度决定按钮文字用黑还是白 */
export function inkFor(hexColor: string): string {
  const h = hexColor.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0')
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.62 ? '#111111' : '#ffffff'
}

const CSS = (c: string) => `#${c}`

/** 计算某个主题(+可选自定义颜色)的 CSS 变量 */
export function themeVars(style: number, colors?: CustomColors | null): Record<string, string> {
  const theme = THEMES[Math.min(Math.max(0, Math.floor(style) || 0), THEMES.length - 1)]
  const vars = { ...theme.vars }
  if (colors) {
    if (colors.bg) {
      vars['--p-bg'] = CSS(colors.bg)
      vars['--p-bg-image'] = 'none'
    }
    if (colors.card) vars['--p-card'] = CSS(colors.card)
    if (colors.text) {
      vars['--p-text'] = CSS(colors.text)
      vars['--p-muted'] = CSS(colors.text) + 'b3'
    }
    if (colors.primary) {
      vars['--p-accent'] = CSS(colors.primary)
      vars['--p-accent-ink'] = inkFor(colors.primary)
    }
  }
  return vars
}
