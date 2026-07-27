# 花生片 Peanup

花生片 Peanup 是一款正在打磨中的 4 寸六色蓝牙电子墨水屏。这个仓库包含产品预览网站与开放技术文档，面向 Kickstarter 发布前展示。

网站：[pean.caiths.com](https://pean.caiths.com) · 联系：[i@caiths.com](mailto:i@caiths.com)

## 网站内容

- 六色电子纸产品与使用场景展示
- 屏内 p5.js 动态演示：六色雨帘、自然生长的花枝、飞燕与琴弦波动
- 照片、日历、天气与书摘等内容预览
- 六色抖动、蓝牙传输、低功耗与 NFC 技术说明
- 响应式桌面、平板与手机布局

## 本地开发

需要 Node.js 20 或更高版本。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

默认开发地址由 Astro 输出。生产构建：

```bash
pnpm build
```

静态产物位于 `dist/`，可部署到 Vercel、Cloudflare Pages 或任意 Nginx 静态站点。

## 发布

推送到 `main` 后，GitHub Actions 会先完成 Astro 类型检查与静态构建。配置生产环境 Secrets 后，工作流将 `dist/` 上传到服务器的新版本目录，再原子切换 `current` 软链接。

需要配置：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PORT`（可选，默认 `22`）
- 仓库变量 `PRODUCTION_DEPLOY=enabled`

服务器站点根目录固定为 `/www/wwwroot/pean.caiths.com/current`。Cloudflare 凭据、服务器密码与私钥不得写入仓库。

## 技术栈

Astro · TypeScript · p5.js · CSS · Vercel static output

## 许可

网站源代码使用 [Apache License 2.0](./LICENSE)。Peanup / 花生片的品牌名称、标志、产品设计、摄影图片和宣传素材不在该开源许可范围内，详见 [NOTICE](./NOTICE)。
