# 网站流量优化 P2：Cloudflare Pages 部署与遗留清理实施计划

**目标：** 删除 Vercel/Waline 运行时遗留与已跟踪依赖，保留 Giscus，并用官方依据建立与纯静态 Cloudflare Pages 架构一致的部署文档和仓库说明。

**设计依据：** `docs/superpowers/specs/2026-07-04-traffic-optimization-p2-cloudflare-cleanup-design.md`

---

## Task 1：核验 Cloudflare 官方部署字段

1. 查阅 Cloudflare Pages 官方 Git 集成与构建配置文档。
2. 确认无框架、无构建静态站的 Build command、Build output directory 与 Root directory 设置。
3. 查阅自定义域名、预览部署和回滚的官方说明。
4. 只使用官方 Cloudflare 文档，不采用第三方教程推断控制台字段。

## Task 2：建立清理审计（RED）

**修改：** `tests/site-audit.test.mjs`

1. 要求 `waline/` 与 `vercel.json` 不存在。
2. 要求仓库树不包含 `node_modules` 路径。
3. 要求 CSS 不含 `#waline`，`.gitignore` 不含 `.vercel`。
4. 要求 Cloudflare 部署文档存在并包含纯静态、无构建、无环境变量和验证清单。
5. 要求 `CLAUDE.md` 不再声明 Vercel 或不存在的 `download/`。
6. 要求内容页仍保留 Giscus。
7. 运行全量审计，确认新增测试因遗留存在而失败。

## Task 3：删除 Vercel/Waline 遗留（GREEN 1）

**删除：** `waline/`、`vercel.json`

1. 使用 Git 批量删除整个 Waline 目录及已跟踪依赖。
2. 删除根目录 Vercel 配置。
3. 不读取、使用或迁移旧凭据。
4. 检查删除范围只涉及已确认遗留。

## Task 4：清理样式与忽略项（GREEN 2）

**修改：** `css/main.css`、`.gitignore`

1. 删除仅服务 `#waline` 的样式块。
2. 删除 `.vercel` 忽略项，保留其他现有规则。
3. 不修改 Giscus 样式或页面脚本。

## Task 5：新增 Cloudflare Pages 部署文档（GREEN 3）

**新增：** `docs/cloudflare-pages-deployment.md`

1. 写明 Git 集成、生产分支和静态项目设置。
2. 准确记录无构建命令、根目录与输出目录字段。
3. 写明不需要 Pages Functions、环境变量或服务端数据库。
4. 覆盖预览、生产、自定义域名、回滚和部署验证。
5. 链接对应 Cloudflare 官方文档。
6. 明确旧数据库凭据必须在服务商后台轮换，代码删除不清除 Git 历史。

## Task 6：更新仓库说明（GREEN 4）

**修改：** `CLAUDE.md`

1. 将当前部署平台改为 Cloudflare Pages。
2. 删除 Vercel、`.vercel/` 与不存在的 `download/` 描述。
3. 指向 Cloudflare 部署文档。
4. 不修改用户控制的 `AGENTS.md`。

## Task 7：全量验证

1. 运行全部 Node 审计，要求零失败、零跳过。
2. 确认 Git 索引不再含 `waline/`、`node_modules` 或 `vercel.json`。
3. 运行 `git diff --check` 并复核计划内文件。
4. 启动静态服务器，访问首页、深层教程、Sitemap、robots、favicon 和分享图。
5. 确认 Giscus 脚本仍存在于内容页。

## Task 8：提交实现

1. 重新读取完整验证结果。
2. 只暂存计划内删除和文档修改。
3. 创建一个 P2 Cloudflare 清理提交。
4. 不推送、不部署，不宣称旧凭据已轮换或从 Git 历史移除。
