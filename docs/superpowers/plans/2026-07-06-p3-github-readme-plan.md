# 网站流量优化 P3：GitHub 分发型 README 实施计划

**目标：** 创建中文 GitHub 项目入口，把仓库访客引导到站点的已核验内容，同时公开证据与贡献边界。

**设计依据：** `docs/superpowers/specs/2026-07-06-p3-github-readme-design.md`

---

## Task 1：建立基线与链接清单

1. 确认根目录当前没有 README。
2. 核对设计中的九个站点深层 URL 均对应现有 HTML 页面。
3. 核对 Cloudflare 部署文档、本地启动命令与审计命令。
4. 运行全量 Node 审计并记录基线。

## Task 2：README 内容与链接测试（RED 1）

**修改：** `tests/site-audit.test.mjs`

1. 要求根目录存在 `README.md`。
2. 锁定正式站点首页和九个 HTTPS 深层入口。
3. 要求三类内容分组：机场资料、客户端教程、故障排查。
4. 运行目标测试，确认因 README 缺失而失败。

## Task 3：证据与安全边界测试（RED 2）

**修改：** `tests/site-audit.test.mjs`

1. 要求来源、核验日期、商家归因和体验差异说明。
2. 禁止商家注册链接、邀请码、优惠码、排名、稳定性实测和持续可用保证。
3. 禁止自然外链、社区背书、Stars 数量和不存在的许可证声明。
4. 要求贡献说明禁止提交 Token、Cookie、账号和订阅地址。
5. 运行目标测试并观察预期失败。

## Task 4：开发说明测试（RED 3）

**修改：** `tests/site-audit.test.mjs`

1. 要求纯静态 Cloudflare Pages、HTML/CSS/JavaScript 技术栈。
2. 要求本地运行与 Node 审计命令。
3. 要求链接到 `docs/cloudflare-pages-deployment.md`。
4. 解析 README 中的仓库相对文件链接并确认目标存在。
5. 运行目标测试并观察预期失败。

## Task 5：创建 README（GREEN）

**新增：** `README.md`

1. 按设计结构写首屏、内容入口、证据原则、项目结构、本地运行、部署和贡献边界。
2. 使用简洁中文和直接 HTTPS 站点链接。
3. 不加入徽章、商家链接、排名、许可证或重复部署步骤。
4. 运行三个目标测试直至通过。

## Task 6：全量验证与提交

1. 运行 `node --test tests/site-audit.test.mjs`，要求零失败、零跳过。
2. 运行 `git diff --check`。
3. 检查只修改 README、审计测试与本计划。
4. 创建本地实现提交；不推送、不部署。
