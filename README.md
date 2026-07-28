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

产品页在构建期使用类型化字典生成，不引入运行时翻译框架。根路径的静态内容和 `x-default` 为简体中文；首次进入时会优先尊重保存的语言选择，再根据可识别的时区与 UTC 偏移判断地区，最后参考浏览器语言。无法判断时保持简体中文，手动选择后不再重复猜测。

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
- 三幕自然场景保留原有 p5 绘图语义，但由项目内 `miniP5.ts` 提供所需的轻量 Canvas API，不加载完整 p5 包；第四幕在线体验使用原生 Canvas。所有动画只存在于产品的电子纸有效区，12 种本地雨滴轮廓合并为一张透明 WebP 图集，只产生一次素材请求。
- 四幕内部绘制统一使用厂家面板的 `528 × 792` 像素矩阵；外层舞台沿用线上版本更适合观看的 `3:4` 展示比例，桌面约 `510 × 680px`、移动端约 `315 × 420px`。网页比例不代表 3.68 英寸实体大小。
- 六色云雨、5 条花枝与花瓶、30 只飞燕和琴弦波动共享同一套 880ms 自下向上写屏过渡；其中 6 只飞燕会停在谱线附近，拨动或拖过屏幕会触发约 900ms 的琴弦余波。
- `01–03` 切换时缓存旧 Canvas 帧；进入或离开 `04` 时保留在线工作区 DOM，并用同一写屏进度裁切。点击 Tab 会立即锁定目标幕再平滑移动页面，避免途中误触发其他幕。照片和文字输入始终同时可见，工具栏在写屏结束后出现；240 字以内文本会在 528 × 792 画布内自动换行与缩放。
- Canvas 在滚动、切幕和短时场景动画期间按需绘制，离开视口或页面隐藏时暂停。
- 硬件能力卡使用四个本地 SVG 图标；正面纯白、背面 `#ecece8`，支持悬浮、点击、键盘和减少动态模式。
- 亮色与暗色共享同一套编辑画册主题；太阳/月亮滑轨跟随系统偏好并记住手动选择。进入暗色时先等待目标图解码并以 360ms 黑幕覆盖，再用 400ms 向下揭开；回到亮色时用 560ms 向上揭开。产品摄影、六色色板和电子纸有效区不会被全局反相。
- 首页、基础壳层和 Docs 样式分别位于 `src/styles/global.css`、`src/styles/base.css` 和 `src/styles/docs.css`。
- 首屏图片优先加载，其余图片使用 AVIF/WebP、固有尺寸和懒加载；交互功能接近视口时才加载。
- 当前手机图与手持图均为 `1122 × 1402`；公开 Docs 的 `TechArticle` 结构化数据包含发布日期、修改日期与分享图。
- 2026-07-28 本地生产构建基线：三幕动画 chunk 为 `26,872 B`、约 `9.9 KB gzip`；六个交互 chunk 合计 `40,018 B` 原始、逐文件合计约 `16.7 KB gzip`。雨滴图集为 `4,930 B`，只在四幕接近视口后请求。产品页首屏 HTML、CSS 与常驻 JS 约 `27.0 KB gzip`，两张主题首图 AVIF 合计 `63,727 B`。

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

所有展示图片通过 CSS 禁止选择、浏览器拖拽与触摸长按呼出，并在 HTML 中使用 `draggable="false"`。所有页面共享的轻量脚本只对 `img`、`picture` 或 `.protected-media` 内的事件阻止拖拽和右键菜单，不影响正文和普通链接。页面使用 `noimageindex` 与 `max-image-preview:none`；Vercel 或生产 Nginx 需要为 `/assets/*` 增加 `X-Robots-Tag`，GitHub Actions 会检查产品图响应头。社交分享使用单独的低分辨率品牌图。

这些措施用于减少误操作和遵守规则的搜索引擎图片曝光，不是 DRM，也不能保证所有爬虫遵守指令。公开网页无法真正阻止访客从 Network、缓存、源码或截图取得已经传输到浏览器的素材。因此仓库只应保存网页展示尺寸资源，不应加入摄影原片，也不使用 Base64 或全站禁右键伪装成下载保护。

## 发布

推送到 `main` 后，GitHub Actions 会执行 Astro 检查和静态构建，再上传 `dist/` 并原子切换 `/www/wwwroot/pean.caiths.com/current`。切换前记录旧链接，切换后校验 release 与 `current`，并重试验收公网 HTTPS、Docs、404、索引文件、HTTP 跳转和图片响应头。激活后的检查失败时，仅当上一版本仍存在且 `current` 仍指向本次失败 release，工作流才原子恢复旧链接；没有上一版本时需要人工处理。只在验收成功后保留最新五个 release。

GitHub `production` Environment 需要 `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY` 和可选的 `DEPLOY_PORT` Secrets。Nginx 站点根目录必须指向 `/www/wwwroot/pean.caiths.com/current`；这是纯静态站点，不应反向代理到 Astro 开发端口。修改宝塔 Nginx 配置后先执行 `nginx -t`，通过后再 reload。

Cloudflare 凭据、服务器密码、私钥和其他密钥不得写入仓库或文档。DNS 中的 `pean` 记录应指向实际承载该静态目录的源站，并根据 Cloudflare SSL 模式配置对应的源站证书。

完整的宝塔 / Nginx、TLS、验收和回滚说明见 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)。

## 许可

网站源代码使用 [Apache License 2.0](./LICENSE)。Peanup / 花生片的品牌名称、标志、产品设计、摄影图片和宣传素材不在该开源许可范围内，详见 [NOTICE](./NOTICE)。
