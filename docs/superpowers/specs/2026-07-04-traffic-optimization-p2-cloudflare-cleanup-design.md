# P2 Cloudflare Pages 部署与遗留清理设计

**日期：** 2026-07-04
**状态：** 已确认，待实施计划
**范围：** Cloudflare Pages 部署文档、Vercel/Waline 遗留删除、文档一致性

## 1. 背景与冲突选择

项目目标架构是无构建步骤的纯 Cloudflare Pages 静态站，但仓库仍包含：

- 根目录 `vercel.json`；
- 完整 `waline/` 服务端目录、依赖和已跟踪 `node_modules`；
- `css/main.css` 中未使用的 Waline 样式；
- `.gitignore` 与 `CLAUDE.md` 中的 Vercel 描述。

当前页面实际使用 Giscus，未发现 Waline 运行时引用。两套范式互相冲突，本批明确选择 Cloudflare Pages + Giscus，删除 Vercel + Waline，不做折中保留。

## 2. 安全边界

`waline/init-db.js` 含已提交的明文数据库凭据。删除当前分支文件不能从 Git 历史中消除该凭据，也不能证明凭据已经失效。

- 用户必须在数据库服务商后台撤销并轮换该凭据。
- 本批不使用、测试、复制或迁移该凭据。
- 本批不重写 Git 历史；历史清理需要单独授权、备份与协作安排。
- 文档只记录轮换要求，不记录任何凭据值。

## 3. 方案

采用完整删除方案：

- 删除 `waline/` 全目录，包括源码、锁文件和已跟踪依赖。
- 删除 `vercel.json`。
- 删除 `css/main.css` 中 `#waline` 专属样式。
- 从 `.gitignore` 删除 `.vercel` 遗留项。
- 保留所有 Giscus HTML、脚本和仓库配置。
- 新增 Cloudflare Pages 部署文档。
- 更新 `CLAUDE.md` 的架构、目录和部署说明。
- 不修改用户控制的 `AGENTS.md`。

## 4. Cloudflare Pages 文档

新增 `docs/cloudflare-pages-deployment.md`，只使用 Cloudflare 官方文档核验部署字段。文档至少覆盖：

- Git 集成部署与项目根目录；
- 无框架、无构建命令的静态站设置；
- 静态输出目录的准确配置；
- 本项目不需要运行时环境变量或服务端函数；
- 自定义域名、HTTPS 与部署后检查；
- 回滚/预览部署入口；
- 部署验证清单：主页、Sitemap、robots、favicon、分享图和深层路径。

文档不宣称已经部署，不写入账户、域名 DNS 凭据或 Cloudflare API Token。

## 5. 文档一致性

更新 `CLAUDE.md`：

- 将部署平台改为 Cloudflare Pages。
- 明确纯静态、无构建步骤。
- 删除不存在的 `download/` 目录说明。
- 删除 `.vercel/` 自动部署说明。
- 指向新的 Cloudflare Pages 部署文档。

`AGENTS.md` 中的旧 Vercel 描述保留为待用户维护项，不在本批暗中修改。

## 6. TDD 与验收

### 6.1 自动审计

先写失败测试，再删除文件：

- `waline/` 与 `vercel.json` 不存在。
- Git 索引不再包含任何 `node_modules` 路径。
- `css/main.css` 不包含 Waline 选择器。
- `.gitignore` 不包含 `.vercel`。
- Giscus 仍出现在内容页且商业/内容审计不回归。
- Cloudflare 部署文档存在，并明确静态、无构建、无环境变量和部署验证。
- `CLAUDE.md` 不再把 Vercel 或不存在的 `download/` 当作当前架构。

### 6.2 验证

- 全量 Node 审计零失败、零跳过。
- `git diff --check` 通过。
- `git status` 只包含计划内删除和文档修改。
- 本地静态服务器仍能访问首页、深层页面、Sitemap、robots、favicon 与分享图。
- 不执行远端部署或凭据操作。

## 7. 完成条件

- 当前树不再包含 Vercel/Waline 运行时代码或依赖。
- Cloudflare Pages 部署步骤有官方依据且与当前静态架构一致。
- Giscus 保持工作路径。
- 明文凭据轮换仍明确标记为用户侧必要动作，未虚假宣称完成。
- 创建本地提交；未经明确授权不推送、不部署。
