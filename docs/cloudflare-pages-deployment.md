# Cloudflare Pages 部署

本项目采用静态优先架构：HTML、CSS、浏览器 JavaScript 与 JSON 无需构建；`/api/streaming-check` 是唯一的 Cloudflare Pages Function，用于按用户操作返回本次请求的网络地区信息。接口不写数据库、不保存检测历史，也无需环境变量。

## Git 集成设置

在 Cloudflare 控制台进入 **Workers & Pages → Create application → Pages → Import an existing Git repository**，选择本仓库后设置：

| 设置 | 本项目值 |
|---|---|
| Framework preset | None / 无框架 |
| Production branch | `main` |
| Root directory | 留空，使用仓库根目录 |
| Build command | `exit 0` |
| Build output directory | 仓库根目录 |
| Environment variables | 无 |

Cloudflare Pages 根据根目录 `functions/` 自动生成文件路由；`functions/api/streaming-check.js` 对应 `/api/streaming-check`。本项目不需要 Wrangler 配置、Node.js 兼容标志或其他运行时依赖。

## 本地完整预览

普通 `python3 -m http.server` 只能预览静态页面，不能运行 Pages Functions。完整预览使用：

```bash
npx wrangler pages dev . --port 8002
```

## 部署验证

- `/`、`/rankings/`、`/risk-monitor/` 与 `/tools/streaming-check/` 返回 200；
- 向 `/api/streaming-check` 发送 POST 返回 JSON，响应包含 `Cache-Control: no-store`；
- 同一路径使用 GET 返回 405；
- `/sitemap.xml`、`/robots.txt` 与 `/favicon.ico` 可访问；
- canonical 指向正式域名，移动端没有整页横向溢出。

## 预览与回滚

非生产分支或 Pull Request 使用 Preview Deployment 验证。生产异常时，在 Pages 项目的 Deployments 中找到上一条已验证的生产部署并执行回滚；回滚后再次执行上述静态页面与 API 检查。

## 隐私与凭据

检测接口只返回本次请求的边缘网络信息，不落库、不设置 Cookie。页面必须在用户主动点击后才发起检测。不要在代码或 Cloudflare 项目中加入订阅地址、Token、Cookie 或账号。

历史 Waline 初始化脚本曾包含明文数据库凭据。删除代码不会清除 Git 历史，也不能使凭据失效；必须在数据库服务商后台撤销并轮换旧凭据。

## 官方资料

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions 路由](https://developers.cloudflare.com/pages/functions/routing/)
- [Pages Functions 本地开发](https://developers.cloudflare.com/pages/functions/local-development/)
