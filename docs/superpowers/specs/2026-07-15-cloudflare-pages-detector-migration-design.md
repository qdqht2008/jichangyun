# 检测工具迁移到 Cloudflare Pages Functions 设计

**日期：** 2026-07-15
**状态：** 已确认，待实施
**范围：** 仅迁移 `/api/streaming-check` 的运行时与当前部署说明

## 背景与冲突选择

检测工具当前把服务端入口放在根目录 `api/streaming-check.js`，这是 Vercel 的目录约定。生产环境实际为 Cloudflare Pages，因此该文件只会作为静态文件处理，无法响应页面发出的 `POST /api/streaming-check`。

本次明确选择 Cloudflare Pages 为唯一当前部署架构。此前新增的 Vercel 当前部署说明属于错误实现，应删除；更早的历史设计文档保留为历史记录，不改写其当时背景。

## 目标与成功标准

- Cloudflare Pages 部署后，`POST /api/streaming-check` 返回本次请求的网络地区信息。
- `GET /api/streaming-check` 明确返回 405，并声明允许 `POST`。
- 响应使用 `Cache-Control: no-store`，不写数据库、Cookie 或检测历史。
- 前端请求路径、页面结构和六项基础资源探测保持不变。
- 本地通过 `wrangler pages dev` 同时运行静态资源与 Pages Function。
- 自动化测试、站点审计与浏览器检查全部通过，无跳过项。

## 架构

将服务端实现迁移为：

```text
functions/api/streaming-check.js  →  /api/streaming-check
```

文件导出 Cloudflare Pages Functions 支持的 `onRequestPost`，并提供通用 `onRequest` 处理其他方法。处理器使用 Web 标准 `Request` 与 `Response`，不依赖 Node.js API，因此无需 `nodejs_compat`、环境变量或额外包。

网络信息来源：

- 国家或地区优先使用 `request.cf.country`；缺失或无效时返回 `XX` 与“未知”。
- IP 优先读取 Cloudflare 注入的 `CF-Connecting-IP`；只有合法 IP 才返回，否则返回 `null`。
- 服务地区参考继续使用当前保守映射；未收录地区保持 `unknown`，不推断为不支持。

## 数据流与错误边界

1. 用户主动点击“开始检测”。
2. 浏览器向同源 `/api/streaming-check` 发送 POST。
3. Pages Function 返回网络地区、检测时间与六项地区参考。
4. 浏览器再探测六项服务的公开基础资源，并显示“可达、受限或超时”。

Function 失败时，前端继续使用当前显式失败界面，不伪造 IP、地区或服务结果。基础资源可达仍不等于账号可登录、片库完整或实际播放成功。

## 文件变更

- 删除：`api/streaming-check.js`
- 新增：`functions/api/streaming-check.js`
- 修改：`tests/streaming-check-api.test.mjs`
- 修改：`tests/site-audit.test.mjs`
- 删除：`docs/vercel-deployment.md`
- 新增：`docs/cloudflare-pages-deployment.md`
- 修改：`README.md`
- 修改：`CLAUDE.md`

不修改 `js/streaming-check.js` 的请求地址，不添加 Wrangler 配置文件，不引入依赖或构建步骤。

## 测试设计

- 单元测试直接调用 Pages Function 导出，验证 POST、GET、有效与缺失 Cloudflare 元数据。
- 测试断言未知地区保持未知，避免把缺失数据变成错误结论。
- 站点审计要求当前部署说明只指向 Cloudflare Pages，并确认 Vercel 运行时与说明已移除。
- 使用 `wrangler pages dev . --port 8002` 验证真实本地路由，再在浏览器点击检测并检查控制台与结果状态。

## 非目标

- 不增加数据库、KV、分析日志或检测历史。
- 不代理或抓取流媒体服务内容。
- 不承诺完整解锁、稳定性、速度或持续可用性。
- 不修改榜单评分、机场数据或风险状态。
