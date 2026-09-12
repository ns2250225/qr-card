// QRCard 核心类型定义

/** 二维码纠错等级 */
export type ECLevel = 'L' | 'M' | 'Q' | 'H'

/** 二维码模式:通用(URL 携带数据)/ 完全离线(QRCARD:1 裸协议) */
export type QRMode = 'universal' | 'offline'

/** 社交/自定义链接(编辑态) */
export interface LinkItem {
  /** 平台代码: gh | b | xhs | dy | wb | zh | x | yt | li | u(网站) | c(自定义) */
  type: string
  /** 值:已知平台存 handle 或完整 URL;自定义存完整 URL */
  value: string
  /** 自定义链接的名称(type === 'c' 时使用) */
  label?: string
  /** 是否展示在名片上 */
  enabled: boolean
}

/** 自定义颜色(压缩保存为无 # 的 hex) */
export interface CustomColors {
  bg: string
  primary: string
  text: string
  card: string
}

/** 名片完整编辑态(仅存在于本地草稿,二维码只含可见字段) */
export interface Profile {
  // 基础信息
  name: string
  nickname: string
  title: string
  company: string
  city: string
  bio: string
  bioLong: string
  // 联系方式
  phone: string
  email: string
  wechat: string
  qq: string
  telegram: string
  discord: string
  /** 联系方式字段可见性,key 为字段名 */
  hidden: Record<string, boolean>
  // 头像:'' | emoji | data:image/...
  avatar: string
  /** 原始头像 dataURL,仅存本地草稿用于再次压缩,永不写入二维码 */
  avatarOriginal: string
  // 外观
  style: number
  colors: CustomColors | null
  // 链接
  links: LinkItem[]
  // 生成设置(不写入协议 payload)
  ec: ECLevel
  qrMode: QRMode
}

/** 对外展示的名片(扫码 / 预览渲染用,已完成安全过滤) */
export interface PublicLink {
  type: string
  label: string
  url: string
}

export interface PublicProfile {
  name: string
  nickname: string
  title: string
  company: string
  city: string
  bio: string
  bioLong: string
  phone: string
  email: string
  wechat: string
  qq: string
  telegram: string
  discord: string
  avatar: string
  style: number
  colors: CustomColors | null
  links: PublicLink[]
}

/** IndexedDB 本地草稿 */
export interface DraftCard {
  id: string
  profile: Profile
  updatedAt: number
}

/** .qrcard 导出文件结构 */
export interface QrcardFile {
  version: 1
  profile: Profile
}
