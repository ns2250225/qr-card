# QRCard Protocol Specification — `QRCARD:1`

> 状态:**Stable**。协议一旦发布不做破坏性修改;未来扩展只增加新版本号(`QRCARD:2:` …)。
> 目标:10 年后的 Reader 仍然能够读取今天生成的二维码。

## 1. 协议格式

```text
QRCARD:<version>:<payload>
```

示例:

```text
QRCARD:1:eJxFyr0KglAchvFbiXf-E5l9yJlq7BrEQeOgg19QVBSBDUFhYDW01FCtSbOFd1...
```

Reader 判定流程:

1. 检查字符串是否以 `QRCARD:` 开头;否则按普通二维码处理(展示内容,不尝试解析)。
2. 读取版本号;版本高于自身支持范围时提示升级,不得猜测解析。
3. 对 payload 执行 Base64URL 解码 → Deflate 解压 → UTF-8 解码 → `JSON.parse` → Schema 校验 → Sanitize → 渲染。

## 2. 编码管线

```text
Profile 对象
  → 紧凑 JSON(短字段名,省略空字段)
  → UTF-8 字节
  → Deflate(zlib / RFC1950;浏览器原生 CompressionStream("deflate"),不可用时 pako)
  → Base64URL(- 和 _ 替代 + 和 /,去除 = 填充)
  → QRCARD:1:<payload>
```

## 3. 紧凑 JSON Schema(v1)

```json
{
  "v": 1,
  "n": "张三",
  "nn": "三哥",
  "t": "独立开发者",
  "c": "自由职业",
  "ct": "上海",
  "b": "喜欢做一些有趣的小工具",
  "bd": "详细介绍…",
  "p": "13800000000",
  "e": "hello@example.com",
  "w": "zhangsan",
  "q": "10000",
  "tg": "username",
  "dc": "username",
  "a": "🤖 | data:image/webp;base64,…",
  "s": 3,
  "cc": ["f5f1e8", "ffdc58", "111111", "ffffff"],
  "l": [["gh", "zhangsan"], ["b", "12345678"], ["u", "https://example.com"], ["c", "我的博客", "https://blog.example.com"]]
}
```

### 字段映射

| 键 | 含义 | 类型 | 最大长度 |
| --- | --- | --- | --- |
| `v` | 协议版本 | number(固定 1) | — |
| `n` | 姓名(必填) | string | 60 |
| `nn` | 昵称 | string | 40 |
| `t` | 职业 | string | 60 |
| `c` | 公司/组织 | string | 60 |
| `ct` | 城市 | string | 30 |
| `b` | 一句话简介 | string | 160 |
| `bd` | 详细介绍 | string | 800 |
| `p` | 手机号 | string | 30 |
| `e` | 邮箱 | string | 120 |
| `w` | 微信号 | string | 60 |
| `q` | QQ | string | 20 |
| `tg` | Telegram(不含 @) | string | 60 |
| `dc` | Discord | string | 60 |
| `a` | 头像:emoji 或 `data:image/(png\|jpeg\|webp);base64,` | string | 16 / 4096 |
| `s` | 主题 ID(0–7,0 时省略) | number | — |
| `cc` | 自定义颜色 `[背景, 主色, 文字, 卡片]`,无 `#` hex | string[4] | — |
| `l` | 链接数组 | array | 16 项 |

空字段与默认值必须省略,不写入 payload。

### 链接编码

- 已知平台存储 `[code, value]`,value 为**剥离 URL 前缀后的 handle**;Reader 端用前缀表还原:

| code | 平台 | 前缀 |
| --- | --- | --- |
| `gh` | GitHub | `https://github.com/` |
| `b` | Bilibili | `https://space.bilibili.com/` |
| `xhs` | 小红书 | `https://www.xiaohongshu.com/user/profile/` |
| `dy` | 抖音 | `https://www.douyin.com/user/` |
| `wb` | 微博 | `https://weibo.com/` |
| `zh` | 知乎 | `https://www.zhihu.com/people/` |
| `x` | X | `https://x.com/` |
| `yt` | YouTube | `https://www.youtube.com/@` |
| `li` | LinkedIn | `https://www.linkedin.com/in/` |
| `u` | 个人网站 | (必须完整 URL) |
| `c` | 自定义 | `[c, label, url]` 三元,完整 URL |

- 兼容规则:value 若本身是 `http(s)://` 完整链接则直接使用;匹配前缀的完整链接在编码时剥离,不匹配时原样保存,保证往返无损。
- 未知 code:仅当 value 是安全 `http(s)://` URL 时保留。

## 4. 两种二维码形态

| 模式 | 二维码内容 | 说明 |
| --- | --- | --- |
| 通用模式(默认) | `<app-base-url>#/p/QRCARD:1:<payload>` | 手机相机扫码直接打开静态页,数据全部在 URL hash 中,服务器不存任何数据 |
| 完全离线模式 | `QRCARD:1:<payload>` | 不依赖域名与服务器,需 QRCard Reader 打开 |

## 5. Reader 安全要求(强制)

- 二维码数据是**不可信输入**:所有文本必须以 `textContent` 等安全方式渲染,禁止 `innerHTML` / `eval` / `new Function` / 动态脚本。
- URL 白名单:仅 `https:` `http:` `mailto:` `tel:`;禁止 `javascript:` `data:text/html` `vbscript:`。
- 头像仅接受 `data:image/(png|jpeg|webp);base64,` 且长度受限。
- 所有字符串按上表截断;数组限长;校验失败时展示明确错误,不得部分渲染。

## 6. 容量参考(字节模式)

| 纠错等级 | 最大字节 |
| --- | --- |
| L | 2953 |
| M(默认) | 2331 |
| Q | 1663 |
| H | 1273 |
