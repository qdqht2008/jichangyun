# Vercel 部署

本项目采用静态优先架构：HTML、CSS、浏览器 JavaScript 与 JSON 无需构建；`/api/streaming-check` 是唯一的 Vercel Node.js Function，用于按用户操作返回本次请求的网络地区信息。接口不写数据库、不保存检测历史，也无需环境变量。

## 项目设置

在 Vercel 导入仓库并使用以下设置：

| 设置 | 本项目值 |
|---|---|
| Framework Preset | Other |
| Root Directory | 仓库根目录 |
| Build Command | 留空 |
| Output Directory | 留空 |
| Environment Variables | 无 |

Vercel 会直接分发根目录中的静态文件，并自动把根目录 `api/` 下的函数发布为 `/api/*`，不需要 `vercel.json`。

## 部署验证

部署后逐项确认：

- `/`、`/rankings/`、`/risk-monitor/` 与 `/tools/streaming-check/` 返回 200；
- 向 `/api/streaming-check` 发送 `POST` 返回 JSON，响应包含 `Cache-Control: no-store`；
- 同一路径使用 `GET` 返回 405；
- `/sitemap.xml`、`/robots.txt` 与 `/favicon.ico` 可访问；
- canonical 指向正式域名，移动端没有整页横向溢出。

## 预览与回滚

非生产分支或 Pull Request 使用 Preview Deployment 验证。生产异常时，在项目 Deployments 中找到上一条已验证的生产部署并执行回滚；回滚后再次执行上述静态页面与 API 检查。

## 隐私与凭据

检测接口只返回本次请求的边缘网络信息，不落库、不设置 Cookie。页面必须在用户主动点击后才发起检测。不要在代码或 Vercel 项目中加入订阅地址、Token、Cookie 或账号。

历史 Waline 初始化脚本曾包含明文数据库凭据。删除代码不会清除 Git 历史，也不能使凭据失效；必须在数据库服务商后台撤销并轮换旧凭据。

## 官方资料

- [Vercel：Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel：Builds](https://vercel.com/docs/builds)
- [Vercel：Deployments](https://vercel.com/docs/deployments/overview)
