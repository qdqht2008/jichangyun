# vpngate.shop 域名迁移实施计划

**目标：** 将现行公开站点的唯一主域名从 `www.jichangyun.top` 迁移到 `vpngate.shop`，保持路径、内容与功能不变，并用确定性审计防止旧域名残留。

**设计依据：** `docs/superpowers/specs/2026-07-16-vpngate-domain-migration-design.md`

## Task 1：建立新域名审计（RED）

**修改：** `tests/site-audit.test.mjs`、`tests/streaming-check-api.test.mjs`

1. 将站点主机基准改为 `vpngate.shop`。
2. 要求 canonical、Sitemap、结构化数据与 README 使用新域名。
3. 增加现行文件旧域名零残留约束；排除历史 `docs/superpowers`。
4. 运行目标测试，确认旧页面因域名不一致而失败。

## Task 2：迁移公开页面与索引文件（GREEN 1）

**修改：** 现行 HTML、`sitemap.xml`、`robots.txt`

1. 将 `https://www.jichangyun.top` 机械替换为 `https://vpngate.shop`。
2. 将无 `www` 的旧域名变体统一替换为根域新域名。
3. 不改相对链接、路径、正文、日期和第三方 URL。
4. 解析 canonical、JSON-LD 与 Sitemap，确认语法和路径一致。

## Task 3：迁移公开仓库链接（GREEN 2）

**修改：** `README.md`、`docs/distribution/` 下现行分发材料

1. 更新网站入口、深层链接和公开投放链接。
2. 不修改历史设计与计划记录。
3. 搜索现行文件，要求旧域名零残留。

## Task 4：验证站点行为

1. 运行全部 Node 测试，要求零失败、零跳过。
2. 运行 `git diff --check`。
3. 启动本地静态服务器，检查首页、榜单、风险页、检测页和一篇详情页。
4. 检查桌面与 390px 移动端无横向溢出、控制台无错误。
5. 确认本地预览不等于 Cloudflare 自定义域名已 Active。

## Task 5：提交与交付

1. 只暂存本次域名迁移文件，排除用户的 `.DS_Store`。
2. 提交域名迁移。
3. 提供 Cloudflare Pages 根域关联、`www` 到根域 301、Search Console 和 Sitemap 操作清单。
