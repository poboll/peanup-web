# 花生片 Peanup

花生片 Peanup 是一款正在打磨中的 3.68 英寸 E6 六色墨水屏产品，像素密度约为 258.7 PPI。

本仓库包含面向 Kickstarter 的多语言产品预览站、公开产品文档和工程说明。网站不提供预售或预约，也不把众筹目标参数写成已经量产验证的事实。

网站：[pean.caiths.com](https://pean.caiths.com) · 联系：[i@caiths.com](mailto:i@caiths.com)

继续设计或修改页面前，请先阅读 [DESIGN_HANDOFF.md](./DESIGN_HANDOFF.md)。

## 产品口径

- 3.68 英寸 E6 六色墨水屏，约 258.7 PPI。
- 通过 Bluetooth Low Energy 近场传图，画面刷新后由电子纸保持。
- 3 mm、28 g 和 1 个月以上续航是众筹目标规格；续航取决于刷新频率。
- 整机无外露接口，使用 Qi 无线充电。
- 内置磁环，兼容磁吸摆放和 MagSafe 磁吸配件；不暗示未经确认的 Apple 认证。
- iOS App 以 Apple 生态为主，支持快捷指令；另提供微信小程序传图路径和后续第三方接入空间。
- CUID NFC 仅在门禁系统支持、获得授权并符合当地规则时可用。

## 页面与语言

产品页在构建期使用类型化字典生成，不引入运行时翻译框架。根路径的静态内容和 `x-default` 为简体中文；首次进入时会优先尊重保存的语言选择，再参考浏览器语言、时区和 UTC 偏移，手动选择后不再重复猜测。

| 语言 | 路由 |
| --- | --- |
| 简体中文 | `/` |
| English | `/en/` |
| 繁體中文 | `/zh-tw/` |
| 日本語 | `/ja/` |
| Deutsch | `/de/` |
| Français | `/fr/` |

文档路由：

- `/docs/`：中文公开产品文档，也是 Docs 默认路径。
- `/docs/engineering/`：中文工程文档。
- `/en/docs/`：英文公开产品文档。
- `/en/docs/engineering/`：英文工程文档。

## 实现重点

- Astro + TypeScript 静态输出，不使用服务端运行时、React 或 i18next。
- 三幕自然场景保留原有 p5 绘图语义，但由项目内 `miniP5.ts` 提供所需的轻量 Canvas API，不加载完整 p5 包；第四幕在线体验使用原生 Canvas。所有动画只存在于产品的电子纸有效区，雨滴轮廓均来自本地资源。
- 四幕网页预览使用 `480 × 800` 逻辑 Canvas；该数值只服务于网站构图，不代表硬件分辨率、物理像素矩阵或 BLE 负载。
- 六色云雨、5 条花枝与花瓶、30 只飞燕和琴弦波动共享同一套由下向上的写屏过渡。
- Canvas 在滚动、切幕和短时场景动画期间按需绘制，离开视口或页面隐藏时暂停。
- 硬件能力卡使用四个本地 SVG 图标；正面纯白、背面 `#ecece8`，支持悬浮、点击、键盘和减少动态模式。
- 亮色与暗色共享同一套编辑画册主题；半黑半白按钮跟随系统偏好并记住手动选择，产品摄影、六色色板和电子纸有效区不会被反相。
- 首页、基础壳层和 Docs 样式分别位于 `src/styles/global.css`、`src/styles/base.css` 和 `src/styles/docs.css`。
- 首屏图片优先加载，其余图片使用 AVIF/WebP、固有尺寸和懒加载；交互功能接近视口时才加载。
- 当前三幕动画 chunk 约为 `9.0 KB gzip`，完整构建的交互 JavaScript 原始体积约为 `36.9 KB`。

## 本地开发

需要 Node.js 20 或更高版本，仓库使用 pnpm lockfile。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

质量检查与生产构建：

```bash
pnpm check
pnpm build
git diff --check
```

静态产物位于 `dist/`，可部署到 Vercel、Cloudflare Pages 或任意 Nginx 静态站点。Astro 配置不依赖静态 Vercel adapter。

## 图片保护边界

展示图片使用 `draggable="false"`、禁止媒体拖拽与长按呼出，并只在 `.protected-media` 范围内拦截拖拽和图片右键菜单。页面使用 `noimageindex` 与 `max-image-preview:none`，`/assets/*` 响应增加 `X-Robots-Tag`；社交分享使用单独的低分辨率品牌图。

这些措施用于减少误操作和搜索引擎图片曝光，不是 DRM。公开网页无法真正阻止访客从 Network、缓存、源码或截图取得已经传输到浏览器的素材。因此仓库只应保存网页展示尺寸资源，不应加入摄影原片，也不使用 Base64 或全站禁右键伪装成下载保护。

## 发布

推送到 `main` 后，GitHub Actions 会执行 Astro 检查和静态构建，再上传 `dist/` 并原子切换 `/www/wwwroot/pean.caiths.com/current`。缺少部署配置时任务会明确失败，不会以“构建成功、部署跳过”的状态结束。

GitHub `production` Environment 需要 `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY` 和可选的 `DEPLOY_PORT` Secrets。Nginx 站点根目录必须指向 `/www/wwwroot/pean.caiths.com/current`；这是纯静态站点，不应反向代理到 Astro 开发端口。修改宝塔 Nginx 配置后先执行 `nginx -t`，通过后再 reload。

Cloudflare 凭据、服务器密码、私钥和其他密钥不得写入仓库或文档。DNS 中的 `pean` 记录应指向实际承载该静态目录的源站，并根据 Cloudflare SSL 模式配置对应的源站证书。

## 许可

网站源代码使用 [Apache License 2.0](./LICENSE)。Peanup / 花生片的品牌名称、标志、产品设计、摄影图片和宣传素材不在该开源许可范围内，详见 [NOTICE](./NOTICE)。
