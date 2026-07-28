# Peanup 静态站部署与回滚

本文只记录可公开的部署结构和验收方法，不保存服务器地址、账户、私钥、Cloudflare 密钥或证书私钥。

## 部署结构

- 构建产物：Astro 静态目录 `dist/`
- 站点目录：`/www/wwwroot/pean.caiths.com`
- 不可变版本：`/www/wwwroot/pean.caiths.com/releases/<git-sha>`
- 生产入口：`/www/wwwroot/pean.caiths.com/current`
- Nginx `root`：`/www/wwwroot/pean.caiths.com/current`

生产站是纯静态站点。Nginx 不应反向代理到 `astro dev`、Node.js 或本机开发端口，否则开发进程退出后会表现为 502。

## GitHub 配置

在 GitHub 仓库的 `production` Environment 中配置：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PORT`，未配置时使用 `22`

推送到 `main` 后，工作流会构建、上传新 release，并在激活前记录 `current` 的绝对目标。新 release 必须包含非空 `index.html` 才能原子切换；切换后还会确认 `current` 精确指向本次 Git SHA，再检查公网 HTTPS、Docs、工程文档、sitemap、robots、404、HTTP 跳转和图片索引响应头。公网状态最多重试 12 次，每次间隔 5 秒。

自动回滚只在激活步骤已经成功、release 或公网验收失败时运行。它会同时确认上一版本目录仍存在，并确认 `current` 仍指向本次失败 release，避免覆盖运维人员在验收期间做出的手动切换。满足两项条件后才原子恢复旧链接；如果不存在上一版本，工作流会明确记录但无法自动恢复，需要人工选择可用 release。release 清理只在整次部署成功后执行，并保留最新五个版本。

## 宝塔 / Nginx

核心配置应与下面的语义一致。证书路径由宝塔或实际证书管理器维护，不写入仓库。

```nginx
server {
    listen 80;
    server_name pean.caiths.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pean.caiths.com;
    root /www/wwwroot/pean.caiths.com/current;
    index index.html;

    error_page 404 /404.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header Cross-Origin-Resource-Policy "same-origin" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Robots-Tag "noindex, noarchive" always;
        try_files $uri =404;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=3600, stale-while-revalidate=86400" always;
        add_header X-Robots-Tag "noindex, noimageindex, max-image-preview:none" always;
        try_files $uri =404;
    }
}
```

每次修改宝塔站点配置后先执行 `nginx -t`，只有检查通过才 reload。TLS 应使用仍在有效期内、覆盖 `pean.caiths.com` 的源站证书。Cloudflare 记录为代理状态时使用 `Full (strict)`；DNS-only 时访问者直接连接源站，Cloudflare SSL/TLS 模式不参与这条链路。证书由哪套工具签发，就由同一套工具完成自动续期，并定期验证续期任务与 reload hook。

## 手动验收

```bash
curl -I https://pean.caiths.com/
curl -I https://pean.caiths.com/docs/
curl -I https://pean.caiths.com/docs/engineering/
curl -I https://pean.caiths.com/sitemap.xml
curl -I https://pean.caiths.com/robots.txt
curl -I https://pean.caiths.com/__deployment-smoke-test-not-found__
curl -I https://pean.caiths.com/assets/peanup-product.avif
curl -I http://pean.caiths.com/
```

验收标准：HTTPS 页面为 `200`，不存在的路由为 `404`，HTTP 使用 `301`、`302`、`307` 或 `308` 跳到同域 HTTPS，产品图片响应的 `X-Robots-Tag` 至少包含 `noimageindex`，浏览器证书链有效且没有混合内容。自动工作流使用相同检查；人工验收还应打开首页、Docs 与 404，确认静态资源没有旧版本混用。

## 手动回滚

先读取当前目标、列出 release，并确认回滚版本存在非空 `index.html`。再原子替换链接，并立即核对结果：

```bash
readlink -f /www/wwwroot/pean.caiths.com/current
ls -lt /www/wwwroot/pean.caiths.com/releases
test -s /www/wwwroot/pean.caiths.com/releases/<previous-git-sha>/index.html
ln -sfn /www/wwwroot/pean.caiths.com/releases/<previous-git-sha> /www/wwwroot/pean.caiths.com/current
test "$(readlink -f /www/wwwroot/pean.caiths.com/current)" = "/www/wwwroot/pean.caiths.com/releases/<previous-git-sha>"
```

回滚后重复全部公网验收，尤其是首页、Docs、合成 404、HTTP 跳转和产品图片响应头。自动回滚完成后 Action 仍会保持失败状态，因此也需要运维人员确认公网确实恢复。不要删除当前版本、上一版本或尚在验证中的 release。

## Cloudflare 与凭据

DNS 的 `pean` 记录应指向实际承载静态目录的源站。任何 Global API Key、Token、密码或私钥都不得写入仓库、Action 日志和交接文档。公开过的密钥必须在 Cloudflare 控制台轮换，并优先改用仅具备该 DNS Zone 最小权限的 API Token。
