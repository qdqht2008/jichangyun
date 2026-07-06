# 网站流量优化 P3：GitHub 分发型 README 设计

**日期：** 2026-07-06
**状态：** 已确认，待实施计划
**范围：** 根目录 `README.md` 与站点审计

## 1. 目标

为 GitHub 仓库建立清晰、可引用的项目入口，让访问仓库的读者能理解网站提供什么、内容如何核验，并直接进入 `jichangyun.top` 的机场评测、客户端教程和故障排查内容。

README 是项目说明和 GitHub 分发入口，不冒充自然外链，不把仓库改造成商家推广页，也不替代网站正文。

## 2. 读者与语言

README 以简体中文为主，面向三类读者：

- 从 GitHub 搜索 Clash 客户端配置或故障排查的普通读者。
- 想了解机场套餐信息如何核验的读者。
- 准备本地运行、审计或改进该静态网站的开发者。

本批不制作英文镜像。网站主体和现有内容均为中文，双语版本会增加维护成本而没有当前需求证据。

## 3. README 结构

### 3.1 首屏

- 标题使用站点品牌“优质机场推荐”。
- 一句话说明：整理公开机场套餐资料、Clash 客户端教程与故障排查指南。
- 显示正式站点链接 `https://www.jichangyun.top/`。
- 不使用下载量、Stars、构建状态等尚无稳定数据源或 CI 支持的徽章。

### 3.2 内容入口

使用三组直接 HTTPS 链接，不依赖 GitHub 相对路径跳转到网站：

1. 机场资料
   - `https://www.jichangyun.top/jichang/`
   - `https://www.jichangyun.top/tutorial/line-selection/`
   - `https://www.jichangyun.top/guide/avoid-traps/`
2. 客户端教程
   - `https://www.jichangyun.top/tutorial/clash-verge/`
   - `https://www.jichangyun.top/tutorial/flclash/`
   - `https://www.jichangyun.top/tutorial/clash-meta-for-android/`
3. 故障排查
   - `https://www.jichangyun.top/guide/frequent-disconnections/`
   - `https://www.jichangyun.top/guide/subscription-update-failed/`
   - `https://www.jichangyun.top/guide/connected-but-no-internet/`

链接文字说明页面解决的问题，不堆砌“机场、VPN、翻墙”等重复关键词。

### 3.3 证据原则

README 明确以下边界：

- 套餐、价格、流量和限制注明来源与核验日期。
- 商家的线路、节点、解锁和客服描述保留商家归因。
- 不把公开资料改写成本站测速、稳定性或持续可用保证。
- 实际体验可能因地区、运营商、设备和时段变化。
- 商业链接在网站内使用 `sponsored nofollow noopener`；README 不复制商家注册链接、邀请码或优惠码。

README 不列商家排名、推荐分数、稳定性榜单或“最佳机场”结论。

### 3.4 项目与开发说明

- 技术栈：HTML5、CSS、原生 JavaScript，纯静态 Cloudflare Pages 架构。
- 目录简表只列 `jichang/`、`tutorial/`、`guide/`、`css/`、`js/` 与 `tests/`。
- 本地运行使用 `python3 -m http.server 8080`，访问 `http://localhost:8080`。
- 审计命令使用 `node --test tests/site-audit.test.mjs`。
- 部署说明链接到仓库内 `docs/cloudflare-pages-deployment.md`。
- 不重新记录完整部署步骤，避免 README 与权威部署文档漂移。

### 3.5 贡献边界

贡献说明保持简短：提交套餐或版本更新时附公开来源和核验日期；不要提交账号、Token、Cookie、订阅地址或其他敏感信息；不要用无法复现的个人体验替代来源。

不声明仓库采用某种开源许可证，因为当前仓库没有 `LICENSE` 文件。

## 4. 测试设计

先在 `tests/site-audit.test.mjs` 增加失败测试并观察 RED，再创建 README：

- 根目录存在 `README.md`。
- README 包含正式站点首页和九个指定深层入口，链接均使用 HTTPS。
- README 包含证据来源、核验日期、商家归因和体验边界。
- README 不含商家注册 URL、邀请码、优惠码、排名、稳定性实测或持续可用保证。
- README 声明纯静态 Cloudflare Pages 架构，并提供本地运行、审计和部署文档入口。
- README 不声称具有自然外链、社区背书、Stars 数量或不存在的许可证。
- README 中所有仓库相对文件链接指向实际存在的文件。

本批不需要浏览器视觉验证；GitHub Markdown 的层级、列表和链接通过源码审阅与确定性测试验证。

## 5. 完成条件与非目标

完成条件：README 内容完整、链接可验证、证据边界清楚，全量 Node 审计零失败零跳过，`git diff --check` 通过，并创建本地提交。

本批不包含：

- 修改网站 HTML、Sitemap 或页面 `lastmod`。
- 发布月度稳定性报告或建立测速数据。
- 代发 GitHub Issue、Release、社区帖子或视频。
- 获取、购买或交换外链。
- 推送或部署，除非用户另行明确要求。
