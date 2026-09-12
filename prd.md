# QRCard「二维码即个人主页」产品需求文档 PRD

> 产品定位：把个人主页“装进二维码”  
> 产品形态：纯前端 Web 应用  
> 核心原则：无需注册、无需服务器、无需数据库、无需云存储、个人数据不上传  
> 技术建议：HTML + CSS + JavaScript / Vue 3 + Vite

---

# 1. 产品概述

## 1.1 产品名称

暂定名称：

**QRCard**

Slogan：

> 一个二维码，就是你的个人主页。

其他候选名称：

- QRMe
- CardQR
- QRPage
- MeQR
- 一码名片
- 一码主页
- QR Profile

---

# 2. 产品背景

传统电子名片通常采用：

```text
二维码
  ↓
https://example.com/u/zhangsan
  ↓
服务器
  ↓
数据库
  ↓
个人主页
```

这种模式存在几个问题：

- 需要服务器
- 需要数据库
- 需要注册账号
- 依赖域名长期存在
- 服务停止后二维码失效
- 用户个人资料需要上传服务器
- 存在隐私问题
- 长期维护成本较高

QRCard 希望采用完全不同的设计：

```text
个人资料
   ↓
结构化 JSON
   ↓
字段压缩
   ↓
Deflate / Brotli 等压缩
   ↓
Base64URL / Base45 编码
   ↓
二维码
```

扫码之后：

```text
二维码
 ↓
QRCard Reader
 ↓
读取 Payload
 ↓
解码
 ↓
解压缩
 ↓
JSON
 ↓
浏览器动态生成个人主页
```

因此：

> 二维码不是“个人主页的地址”。

而是：

> 二维码本身携带生成个人主页所需要的数据。

即：

**QR Code = Profile Data**

---

# 3. 产品目标

打造一个完全运行于浏览器中的个人电子名片 / 个人主页生成工具。

用户可以填写：

- 姓名
- 头像
- 职业
- 公司
- 简介
- 电话
- 邮箱
- 微信
- QQ
- GitHub
- Bilibili
- 小红书
- 抖音
- 微博
- 个人网站
- 自定义链接

系统自动将这些数据压缩并生成二维码。

其他用户扫描二维码后即可看到完整个人主页。

整个过程：

**不需要注册、不需要登录、不需要后端、不需要数据库。**

---

# 4. 核心设计原则

## 4.1 Local First

所有数据默认只存在：

```text
用户浏览器
+
生成的二维码
```

不得默认上传：

- 头像
- 联系方式
- 社交账号
- 个人简介
- 二维码 Payload

---

## 4.2 Zero Backend

MVP 不允许依赖：

```text
Node.js Server
PHP
Python
Java
数据库
对象存储
用户系统
云函数
```

网站应可以直接部署到：

```text
GitHub Pages
Cloudflare Pages
Vercel Static
Netlify Static
普通 Nginx
本地文件
```

---

# 5. 用户场景

## 场景 A：线下认识

用户打开自己的二维码。

对方扫码：

```text
扫一扫

   ↓

张三
独立开发者

喜欢 AI / 游戏 / 开源项目

GitHub
微信
邮箱
个人网站

[保存联系人]
```

---

## 场景 B：会议胸牌

用户将二维码打印在：

- 胸牌
- 名片
- 工牌
- 海报
- 简历
- 展会资料

别人扫码即可查看个人主页。

---

## 场景 C：社交媒体头像/图片

用户将 QRCard 二维码分享到：

- 微信
- QQ
- 小红书
- 微博
- Bilibili
- Discord

别人扫码即可查看主页。

---

## 场景 D：离线环境

即使没有个人服务器，也不会因为：

```text
服务器关闭
域名过期
账号注销
数据库删除
```

导致二维码中保存的个人资料消失。

---

# 6. 产品架构

整体架构：

```text
┌───────────────────────────────┐
│           QRCard Web          │
│                               │
│  ┌──────────┐   ┌──────────┐ │
│  │ Creator  │   │ Reader   │ │
│  └────┬─────┘   └────┬─────┘ │
│       │              │        │
│       ▼              ▼        │
│ Profile JSON      QR Scanner  │
│       │              │        │
│       ▼              ▼        │
│ Serializer        Decoder     │
│       │              │        │
│       ▼              ▼        │
│ Compressor       Decompress   │
│       │              │        │
│       ▼              ▼        │
│ Encoder           JSON        │
│       │              │        │
│       ▼              ▼        │
│ QR Generator    Profile UI    │
│                               │
└───────────────────────────────┘
```

所有模块运行在浏览器。

---

# 7. 页面结构

产品包含四个主要页面：

```text
/
├── 首页
├── /create
│   └── 创建名片
├── /scan
│   └── 扫描二维码
└── /view
    └── 查看个人主页
```

如果采用 SPA：

```text
/#/create
/#/scan
/#/view
```

优先使用 Hash Router，以提高静态部署兼容性。

---

# 8. 首页

首页重点表达核心概念：

```text
         QRCard

   一个二维码
   就是你的个人主页

无需注册
无需服务器
无需数据库
个人资料不上云

[创建我的二维码]

       [扫描二维码]
```

下方通过动画展示：

```text
填写资料
   ↓
  JSON
   ↓
 压缩
   ↓
 QR Code
   ↓
 扫一扫
   ↓
个人主页
```

---

# 9. 创建个人主页

## 9.1 页面布局

桌面端：

```text
┌────────────────────────────────────────┐
│ QRCard                  扫描二维码     │
├───────────────────┬────────────────────┤
│                   │                    │
│ 编辑个人资料      │   手机实时预览     │
│                   │                    │
│ 头像              │    ┌─────────┐    │
│ 姓名              │    │  Avatar │    │
│ 职业              │    │  张三   │    │
│ 简介              │    │ Developer│   │
│ 联系方式          │    │         │    │
│ 社交账号          │    │ GitHub  │    │
│                   │    │ 微信    │    │
│                   │    └─────────┘    │
│                   │                    │
│ [生成二维码]      │                    │
└───────────────────┴────────────────────┘
```

移动端采用上下布局：

```text
编辑资料

↓

实时预览

↓

生成二维码
```

---

# 10. 个人资料字段

## 10.1 基础信息

支持：

```text
头像
姓名 *
昵称
职业
公司
城市
一句话简介
详细介绍
```

只有姓名为必填。

---

# 11. 联系方式

支持：

```text
手机号
邮箱
微信号
QQ
Telegram
Discord
```

用户可以单独设置是否显示。

---

# 12. 社交链接

默认提供：

```text
GitHub
Bilibili
小红书
抖音
微博
知乎
X
YouTube
LinkedIn
个人网站
```

同时支持：

```text
+ 添加自定义链接
```

数据结构：

```json
{
  "label": "我的博客",
  "url": "https://example.com"
}
```

---

# 13. 头像设计

头像是二维码容量最大的潜在消耗来源。

因此提供三个模式。

## 模式 A：不保存头像

最推荐。

二维码只保存：

```text
姓名
职业
简介
联系方式
社交账号
```

二维码最小。

---

## 模式 B：Emoji / 内置头像

用户选择：

```text
👨‍💻
👩‍🎨
🧑‍🚀
🐱
🐶
🤖
```

几乎不增加容量。

也可以内置几十种 SVG Avatar。

二维码只保存：

```text
avatar: 12
```

而不是 SVG 本身。

---

## 模式 C：照片头像

允许上传照片。

浏览器自动：

```text
原图
 ↓
裁剪 1:1
 ↓
64 × 64
 ↓
WebP / AVIF
 ↓
降低质量
 ↓
Base64 / Binary
```

建议目标：

```text
500B – 1500B
```

如果头像导致二维码过于复杂：

```text
⚠ 当前头像占用了 63% 的二维码容量

建议：
[降低头像质量]
[使用 Emoji]
[删除头像]
```

---

# 14. 数据结构

开发阶段使用可读结构：

```json
{
  "version": 1,
  "name": "张三",
  "title": "独立开发者",
  "company": "",
  "bio": "喜欢做一些有趣的小工具",
  "phone": "13800000000",
  "email": "hello@example.com",
  "wechat": "zhangsan",
  "links": [
    {
      "type": "github",
      "value": "zhangsan"
    },
    {
      "type": "website",
      "value": "https://example.com"
    }
  ]
}
```

实际二维码中不得直接保存如此冗长的字段名称。

---

# 15. 紧凑数据结构

生产版本改为：

```json
{
  "v": 1,
  "n": "张三",
  "t": "独立开发者",
  "b": "喜欢做一些有趣的小工具",
  "p": "13800000000",
  "e": "hello@example.com",
  "w": "zhangsan",
  "l": [
    ["g", "zhangsan"],
    ["u", "https://example.com"]
  ]
}
```

字段映射：

```text
v = version
n = name
t = title
c = company
b = bio
p = phone
e = email
w = wechat
q = qq
l = links
a = avatar
s = style
```

进一步减少二维码 Payload。

---

# 16. 数据编码协议

定义 QRCard Protocol：

```text
QRCARD:1:<payload>
```

例如：

```text
QRCARD:1:eJyrVspLzE1Vsl...
```

协议结构：

```text
QRCARD
:
Protocol Version
:
Compressed Payload
```

Reader 首先检查：

```javascript
data.startsWith("QRCARD:")
```

然后解析版本。

---

# 17. 压缩流程

推荐：

```text
Profile Object
      ↓
Compact JSON
      ↓
UTF-8
      ↓
Compression
      ↓
Binary
      ↓
Base64URL
      ↓
QRCARD:1:xxxx
```

MVP 推荐：

**CompressionStream("deflate")**

现代浏览器可以直接使用浏览器原生 Compression Streams API。

兼容性不足时：

```text
pako
```

作为 fallback。

---

# 18. Base64URL

不要直接使用传统 Base64：

```text
+ / =
```

建议使用 Base64URL：

```text
-
_
```

Payload：

```text
QRCARD:1:AbCdEf123...
```

便于：

- URL
- QR
- 分享
- 复制

---

# 19. 二维码生成

推荐库：

```text
qrcode
QRCode.js
qr-code-styling
```

默认使用普通黑白二维码。

不要默认：

- 渐变
- 花纹
- 圆点
- Logo 覆盖
- 复杂背景

因为本项目二维码 Payload 通常比 URL 更大。

首要目标：

> 扫码成功率 > 美观。

---

# 20. 二维码纠错等级

提供：

```text
L
M
Q
H
```

默认：

```text
M
```

如果数据过大：

```text
建议降低到 L
```

如果二维码用于打印：

```text
建议 M / Q
```

UI 不需要让普通用户理解技术细节，可显示：

```text
扫码稳定性

○ 最大容量
● 平衡
○ 高可靠
```

---

# 21. 容量监控

创建页面必须实时显示：

```text
二维码容量

████████░░░░░░

52%

当前数据：
1.8 KB

状态：
✓ 可以生成
```

容量等级：

```text
0–40%
绿色

40–70%
正常

70–90%
警告

90–100%
危险

>100%
无法生成
```

提示：

```text
二维码内容过多。

建议：

• 缩短个人介绍
• 删除部分链接
• 压缩头像
• 删除头像
```

---

# 22. 二维码生成结果

生成后显示：

```text
        我的 QRCard

     █████████████
     █ ▄▄▄▄▄ █ █
     █ █   █ █ █
     █ █▄▄▄█ █ █
     █████████████

        张三
     独立开发者

   扫一扫认识我

[保存二维码]

[打印]

[复制数据]

[导出名片]

[重新编辑]
```

---

# 23. 二维码扫描

扫描页面：

```text
扫描 QRCard

┌──────────────────┐
│                  │
│      CAMERA      │
│                  │
│    ┌────────┐    │
│    │        │    │
│    └────────┘    │
│                  │
└──────────────────┘

将二维码放入框内

或者

[上传二维码图片]
```

---

# 24. 扫码技术

推荐：

```text
BarcodeDetector API
```

如果浏览器不支持：

```text
ZXing JS
```

或：

```text
html5-qrcode
```

Fallback：

```text
Camera
 ↓
Canvas
 ↓
ZXing
 ↓
QR Payload
```

---

# 25. 非 QRCard 二维码

如果扫描：

```text
https://example.com
```

显示：

```text
这不是 QRCard 二维码。

识别内容：

https://example.com

[打开链接]
```

不得尝试当成 QRCard 数据解析。

---

# 26. Reader 解码流程

```text
扫描二维码
   ↓
读取字符串
   ↓
检查 QRCARD:
   ↓
读取协议版本
   ↓
Base64URL Decode
   ↓
Decompress
   ↓
UTF-8 Decode
   ↓
JSON.parse()
   ↓
Schema Validate
   ↓
Sanitize
   ↓
Profile Renderer
```

---

# 27. 安全设计

二维码数据必须视为：

> 不可信输入。

禁止：

```text
eval()
new Function()
innerHTML = userData
动态 script
远程 JS
iframe HTML
```

所有字段必须使用：

```text
textContent
```

渲染。

URL 必须验证协议。

允许：

```text
https:
http:
mailto:
tel:
```

禁止：

```text
javascript:
data:text/html
vbscript:
```

避免恶意 QRCard 形成 XSS。

---

# 28. 个人主页

扫码成功后：

```text
┌──────────────────────────┐
│                          │
│          Avatar          │
│                          │
│           张三           │
│        独立开发者        │
│                          │
│ 喜欢做一些有趣的小工具   │
│                          │
│ ┌──────────────────────┐ │
│ │       加微信         │ │
│ └──────────────────────┘ │
│                          │
│ ┌────────┐ ┌────────┐   │
│ │ GitHub │ │ Bilibili│  │
│ └────────┘ └────────┘   │
│                          │
│      [保存联系人]        │
│                          │
│       Powered QRCard     │
└──────────────────────────┘
```

---

# 29. 保存联系人

根据 Profile 自动生成：

```text
.vcf
```

例如：

```text
BEGIN:VCARD
VERSION:3.0
FN:张三
TEL:13800000000
EMAIL:hello@example.com
URL:https://example.com
END:VCARD
```

浏览器生成：

```javascript
Blob
 ↓
Object URL
 ↓
Download
```

无需服务器。

---

# 30. 微信设计

由于微信无法通过网页直接“添加好友”，因此采用：

```text
微信

zhangsan

[复制微信号]
```

可选：

```text
显示微信二维码
```

但微信二维码图片会明显增加 QRCard 容量。

默认不推荐嵌入。

---

# 31. 页面主题

提供内置主题。

例如：

```text
01 Minimal
02 Glass
03 Cyberpunk
04 Pixel
05 Business
06 Paper
07 Terminal
08 Cute
```

二维码只保存：

```text
"s": 3
```

Reader 根据 ID 加载内置 CSS。

因此主题不会增加二维码大小。

---

# 32. 自定义颜色

允许：

```text
背景色
主色
文字色
卡片颜色
```

压缩保存：

```text
["fff","111","36f"]
```

避免保存完整 CSS。

禁止用户输入自定义 CSS。

---

# 33. 离线支持

QRCard 应实现 PWA。

首次访问：

```text
QRCard
 ↓
Service Worker
 ↓
Cache App Shell
```

缓存：

```text
HTML
CSS
JS
Icons
QR Scanner
Themes
```

之后即使断网，也可以：

```text
打开 QRCard
扫描二维码
解析二维码
查看个人主页
```

因此形成：

> Offline Digital Business Card

---

# 34. “真正离线”的边界

需要明确：

二维码可以保存个人资料。

但是扫码设备仍然需要一个能够理解：

```text
QRCARD:1:
```

协议的 Reader。

普通系统相机并不会自动把自定义 Payload 渲染成网页。

因此产品必须避免宣传：

> 任何手机扫码都能直接打开网页。

正确描述：

> 使用 QRCard 扫描器即可从二维码本地还原个人主页。

---

# 35. 普通相机兼容模式

为了降低上述门槛，可以增加第二种模式：

## 在线兼容模式

二维码：

```text
https://qrcard.app/#/p/<payload>
```

这里 `<payload>` 仍然包含全部个人数据。

服务器不存数据。

浏览器打开：

```text
URL
 ↓
读取 Hash
 ↓
本地 Decode
 ↓
生成个人主页
```

服务器只负责提供静态 HTML / JS。

个人数据仍不存在数据库。

---

# 36. 推荐双模式设计

这是正式产品最推荐的设计。

创建二维码时：

```text
二维码模式

● 通用模式
  手机相机扫码即可打开

○ 完全离线模式
  需要 QRCard 扫描器
```

---

# 37. 通用模式

二维码内容：

```text
https://qrcard.app/#/p/<payload>
```

优点：

```text
微信扫一扫 ✓
iPhone Camera ✓
Android Camera ✓
浏览器 ✓
```

而且：

```text
个人数据不上传服务器
数据库不存在
```

静态页面从 Hash 中读取数据。

---

# 38. 离线模式

二维码：

```text
QRCARD:1:<payload>
```

优点：

```text
完全不依赖域名
完全不依赖服务器
```

缺点：

```text
需要 QRCard Reader
```

---

# 39. 推荐产品默认模式

默认：

**通用模式**

高级选项：

**完全离线模式**

这样兼顾：

```text
易用性
+
隐私
+
去中心化
+
长期可用性
```

---

# 40. 本地草稿

使用：

```text
IndexedDB
```

保存用户最近编辑的名片。

例如：

```text
我的名片

张三
修改于 09-12

[编辑]

李四
修改于 09-10

[编辑]
```

所有数据只存在浏览器。

提供：

```text
清空本地数据
```

---

# 41. 导入 / 导出

支持：

```text
.qrcard
```

本质为：

```json
{
  "version": 1,
  "profile": {}
}
```

用户可以：

```text
导出 QRCard
导入 QRCard
```

方便以后修改。

---

# 42. 分享卡片

除了 QR Code，自动生成分享图片：

```text
┌───────────────────────────┐
│                           │
│         👨‍💻              │
│                           │
│          张三             │
│       独立开发者          │
│                           │
│     扫一扫认识我          │
│                           │
│      ███████████          │
│      █ QR CODE █          │
│      ███████████          │
│                           │
│     qrcard                │
└───────────────────────────┘
```

Canvas 本地生成 PNG。

---

# 43. 打印模式

支持：

```text
标准名片
85 × 54 mm
```

布局：

```text
┌───────────────────────────┐
│ 张三               █████ │
│ 独立开发者         █ QR █ │
│                    █████ │
│                           │
│ 扫一扫认识我              │
└───────────────────────────┘
```

使用 CSS：

```text
@media print
```

实现。

---

# 44. 性能目标

首屏：

```text
< 1 秒
```

核心 JS：

```text
< 300 KB gzip
```

无：

```text
Google Analytics
广告 SDK
第三方 Tracking
```

扫描相关库可以：

```text
动态 import()
```

只有进入扫描页面才加载。

---

# 45. 推荐技术栈

正式版本推荐：

```text
Vue 3
Vite
TypeScript

UI
├── Tailwind CSS
└── Lucide Icons

QR
├── qrcode
└── ZXing JS

Compression
├── CompressionStream
└── pako fallback

Storage
└── IndexedDB

Image
├── Canvas
├── WebP
└── AVIF（支持时）

Offline
├── Service Worker
└── PWA

Deploy
├── Cloudflare Pages
├── GitHub Pages
└── Vercel
```

---

# 46. 推荐项目目录

```text
qrcard/
│
├── public/
│   ├── icons/
│   ├── avatars/
│   └── manifest.webmanifest
│
├── src/
│
│   ├── components/
│   │   ├── ProfileEditor.vue
│   │   ├── ProfilePreview.vue
│   │   ├── QRGenerator.vue
│   │   ├── QRScanner.vue
│   │   ├── CapacityMeter.vue
│   │   ├── AvatarEditor.vue
│   │   ├── SocialLinks.vue
│   │   └── VCardButton.vue
│
│   ├── pages/
│   │   ├── Home.vue
│   │   ├── Create.vue
│   │   ├── Scan.vue
│   │   └── Profile.vue
│
│   ├── protocol/
│   │   ├── schema.ts
│   │   ├── serialize.ts
│   │   ├── deserialize.ts
│   │   ├── compress.ts
│   │   ├── decompress.ts
│   │   ├── encode.ts
│   │   └── decode.ts
│
│   ├── qr/
│   │   ├── generate.ts
│   │   └── scan.ts
│
│   ├── profile/
│   │   ├── vcard.ts
│   │   ├── avatar.ts
│   │   └── sanitize.ts
│
│   ├── themes/
│   │   ├── minimal.css
│   │   ├── glass.css
│   │   ├── cyber.css
│   │   ├── pixel.css
│   │   └── terminal.css
│
│   ├── storage/
│   │   └── indexeddb.ts
│
│   ├── App.vue
│   └── main.ts
│
├── index.html
├── vite.config.ts
└── package.json
```

---

# 47. 数据处理状态机

```text
EMPTY

 ↓ 用户输入

EDITING

 ↓

SERIALIZING

 ↓

COMPRESSING

 ↓

ENCODING

 ↓

CHECK_CAPACITY

 ├───────────────┐
 ↓               ↓
VALID          TOO_LARGE
 ↓               ↓
GENERATE       OPTIMIZE
 ↓               │
READY ←──────────┘
```

---

# 48. 扫码状态机

```text
IDLE

 ↓

CAMERA_REQUEST

 ├───────────────┐
 ↓               ↓
SCANNING       DENIED
 ↓
DETECTED
 ↓
PROTOCOL_CHECK

 ├───────────────┐
 ↓               ↓
QRCARD         OTHER_QR
 ↓
DECODE
 ↓
DECOMPRESS
 ↓
VALIDATE

 ├───────────────┐
 ↓               ↓
VALID          INVALID
 ↓
RENDER
 ↓
PROFILE
```

---

# 49. 自动容量优化

如果 Payload 太大，系统可以提供：

```text
智能瘦身
```

点击后依次：

```text
头像质量 80%
 ↓
头像质量 60%
 ↓
64×64 → 48×48
 ↓
删除无效空字段
 ↓
压缩 URL
 ↓
删除重复协议字符
 ↓
降低二维码纠错等级
```

每一步实时重新计算二维码。

---

# 50. URL 优化

例如：

```text
https://github.com/zhangsan
```

不要完整保存。

保存：

```text
["gh","zhangsan"]
```

Reader 自动恢复：

```text
gh
 ↓
https://github.com/
 ↓
https://github.com/zhangsan
```

同理：

```text
b = Bilibili
x = X
wb = 微博
zh = 知乎
dy = 抖音
xhs = 小红书
```

可以大幅减少二维码数据量。

---

# 51. Protocol Version

必须从第一版就设计版本号：

```text
QRCARD:1:
```

未来可以：

```text
QRCARD:2:
QRCARD:3:
```

Reader：

```text
v1 → DecoderV1
v2 → DecoderV2
```

确保以后修改数据格式不会导致旧二维码失效。

---

# 52. 长期兼容原则

这是整个项目非常重要的一点。

QRCard 的目标之一是：

> 10 年后的 Reader 仍然能够读取今天生成的二维码。

因此：

**协议一旦发布不得破坏性修改。**

只能增加新版本。

建议同时公开：

```text
QRCard Protocol Specification
```

并采用开放协议。

---

# 53. 开源策略

建议：

```text
MIT License
```

公开：

```text
Creator
Reader
Protocol
Decoder
Themes
```

第三方可以自行实现：

```text
Android QRCard Reader
iOS QRCard Reader
Windows QRCard Reader
CLI Decoder
浏览器扩展
```

形成开放生态。

---

# 54. 隐私提示

创建页面明确显示：

```text
🔒 数据只在你的设备中处理

QRCard 不会上传：

✓ 姓名
✓ 手机号
✓ 邮箱
✓ 微信
✓ 头像
✓ 社交账号

二维码就是数据本身。
```

同时提醒：

> 二维码一旦分享，任何能够读取二维码的人都可能获取其中的信息。请不要写入身份证号、家庭地址、密码、密钥等敏感信息。

---

# 55. MVP 范围

第一版只实现：

### 创建

```text
姓名
头像
职业
简介
电话
邮箱
微信
社交链接
主题
```

### QR

```text
JSON
压缩
Base64URL
QR Code
容量检测
```

### Reader

```text
摄像头扫码
图片扫码
解码
个人主页
```

### Profile

```text
头像
姓名
简介
联系方式
社交链接
保存联系人
```

### Storage

```text
IndexedDB
导入
导出
```

---

# 56. V2

增加：

```text
更多主题
自定义颜色
分享海报
标准名片打印
多张个人名片
微信二维码
头像智能压缩
PWA
完全离线模式
```

---

# 57. V3

可以探索：

```text
二维码名片交换

A 扫 B
B 扫 A

↓

双方交换名片
```

以及：

```text
二维码签到
活动胸牌
会议名片
简历 QR
作品集 QR
社团成员 QR
校园个人主页
```

---

# 58. 产品最重要的差异化

普通电子名片：

```text
QR
 ↓
URL
 ↓
Server
 ↓
Database
 ↓
Profile
```

QRCard：

```text
          QR CODE
             │
             │
       Profile Data
             │
             ▼
       Browser Decode
             │
             ▼
      Personal Profile
```

核心理念：

> **二维码不是入口。**
>
> **二维码就是个人主页的数据载体。**

---

# 59. 推荐最终体验

用户进入网站：

```text
QRCard

一个二维码
就是你的个人主页

[创建我的主页]
```

填写：

```text
张三
独立开发者

喜欢 AI、游戏和开源项目

GitHub
Bilibili
微信
邮箱
```

右侧实时出现个人主页。

点击：

```text
生成 QRCard
```

出现：

```text
████████████████
██ ▄▄▄▄▄ ██ ███
██ █   █ ██ ███
██ █▄▄▄█ ██ ███
████████████████

张三

二维码容量：37%

✓ 扫码稳定
✓ 无需账号
✓ 无需数据库
✓ 数据没有上传服务器
```

另一个人扫码：

```text
        👨‍💻

         张三

      独立开发者

喜欢 AI、游戏和开源项目

 ┌──────────────┐
 │   加微信     │
 └──────────────┘

 GitHub   Bilibili   邮箱

 ┌────────────────┐
 │   保存到通讯录 │
 └────────────────┘
```

整个流程无需任何账户体系。

---

# 60. 一句话产品定义

**QRCard 是一个纯前端、Local-First、无需注册和数据库的个人电子名片工具，将个人主页数据压缩进二维码，并在扫码后由浏览器本地还原成完整个人主页。**

其最值得作为核心卖点的不是“又一个电子名片生成器”，而是：

> **Your profile lives inside the QR code.**

> **你的主页，就住在二维码里。**