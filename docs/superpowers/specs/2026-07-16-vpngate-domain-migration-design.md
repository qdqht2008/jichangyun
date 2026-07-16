# vpngate.shop 域名迁移设计

**日期：** 2026-07-16
**状态：** 已确认，待实施
**范围：** 将当前公开站点域名从 `www.jichangyun.top` 统一迁移到 `vpngate.shop`

## 背景与约束

旧域名 `jichangyun.top` 已不可用，无法配置逐页 301，也无法完成标准的搜索信号迁移。因此本次按新域名重新上线处理，不宣称能够保留旧域名的收录、外链权重或历史排名。

新域名选择 `https://vpngate.shop` 作为唯一 canonical 主机名。`www.vpngate.shop` 由 Cloudflare 控制台配置 301 到根域名，不在静态页面中形成第二套 canonical。

## 目标与成功标准

- 所有现行公开页面的 canonical、Open Graph、Twitter 图片和 JSON-LD 绝对 URL 使用 `https://vpngate.shop`。
- `sitemap.xml` 只包含新域名 URL，`robots.txt` 指向新 Sitemap。
- README、当前部署文档和公开分发材料中的站点链接使用新域名。
- 页面路径、正文、评分、机场数据、风险状态和视觉保持不变。
- 现行站点文件不再残留 `jichangyun.top`；历史规格与实施记录可以保留当时域名，避免篡改历史。
- 全量测试、结构化数据解析、站内链接审计和差异格式检查全部通过，无跳过项。

## URL 规则

迁移只替换主机名，不调整路径：

```text
https://www.jichangyun.top/guide/avoid-traps/
→
https://vpngate.shop/guide/avoid-traps/
```

统一规则：

- 协议固定为 HTTPS。
- canonical 主机固定为 `vpngate.shop`，不带 `www`。
- 目录页面继续保留末尾斜杠。
- 图片、Logo、站点根地址和面包屑同步更换主机名。
- 相对站内链接保持相对形式，不改写为绝对 URL。

## 文件范围

需要修改：

- 根目录、`jichang/`、`guide/`、`tutorial/`、`rankings/`、`risk-monitor/` 与 `tools/` 下的公开 HTML。
- `sitemap.xml`、`robots.txt`、`README.md`。
- `docs/distribution/` 下仍可对外使用的分发链接。
- `tests/site-audit.test.mjs`、`tests/streaming-check-api.test.mjs` 等包含站点主机断言的测试。
- 当前部署说明中涉及正式访问域名的验证步骤（如果存在）。

不修改：

- `docs/superpowers/specs/` 与 `docs/superpowers/plans/` 中的历史域名记录，除本设计文档外。
- 商家官网、注册入口、官方教程来源等第三方域名。
- Giscus 仓库配置、GA4 Measurement ID 与 Cloudflare Function 路由。

## Cloudflare 控制台操作

代码部署前后由站点管理员完成：

1. 将 `vpngate.shop` 添加为 Cloudflare Zone，并确认域名注册商 Nameserver 已指向 Cloudflare。
2. 在 Pages 项目 `Custom domains` 中关联 `vpngate.shop`，等待 DNS 与证书变为 Active。
3. 同时关联或建立 `www.vpngate.shop` 的代理 DNS，然后配置 301 到 `https://vpngate.shop`，保留路径和查询参数。
4. 根据需要把生产 `*.pages.dev` 地址 301 到根域名，避免形成可索引副本。

旧域名不可用，因此不创建声称有效的旧域名跳转规则。

## 搜索引擎上线步骤

- 在 Google Search Console 验证 `vpngate.shop` 域名属性。
- 部署后提交 `https://vpngate.shop/sitemap.xml`。
- 使用 URL 检查请求抓取首页、榜单、机场聚合页、教程聚合页和百科聚合页。
- 监控 Page indexing、404、canonical 选择和抓取统计。
- 更新能够控制的 GitHub、社交主页、广告和外部介绍链接。

由于旧域名无法提供 301，不使用 Search Console 地址变更工具来伪装成标准迁移。

## 测试与失败边界

- 测试先改为要求新域名并观察旧代码失败，再进行替换。
- 解析全部公开 HTML，确认 canonical 与预期路径一一对应。
- 解析全部 JSON-LD，确认 JSON 语法仍有效且主站 URL 已更新。
- 检查 Sitemap 覆盖全部公开页面且只使用新域名。
- 搜索现行文件中的旧域名，任何残留都必须分类：应替换或明确属于历史记录。
- 本地静态服务器验证首页、榜单、风险页与至少一篇详情页；Pages Function 继续由既有测试覆盖。

如果新域名在 Cloudflare 尚未 Active，代码可以完成并提交，但不得宣称生产迁移已完成。
