# 极速云侧栏入口修正设计

**日期：** 2026-07-30
**状态：** 已获用户口头批准，待书面复核

## 问题与原因

极速云详情页、机场推荐卡片和 Sitemap 已发布，但机场详情页左侧导航由 `js/nav.js` 中的 `SIDEBAR_SECTIONS.jichang.items` 独立维护。新增页面时没有同步这份静态配置，因此用户在 Quick Cloud 等详情页的左侧机场列表中看不到极速云。

这是入口同步遗漏，不是极速云页面、卡片或线上部署缺失。

## 修复

- 在 `js/nav.js` 的 Quick Cloud 后加入 `{ href: '/jichang/jisuyun/', label: '极速云' }`。
- 保持现有侧栏顺序不变，使其与机场推荐卡片中 Quick Cloud、极速云、飞鸟云的相邻顺序一致。
- 复用现有 `isActiveSidebar` 逻辑；访问 `/jichang/jisuyun/` 时自动为极速云导航项添加 `active`，不新增脚本或样式。
- 在 `tests/airport-features.test.mjs` 添加回归断言，要求机场侧栏配置包含极速云的准确路径和名称。

## 防复发约束

以后新增处于活跃状态的机场详情页时，必须同步核对三个入口：

1. `jichang/index.html` 的机场卡片。
2. `sitemap.xml` 的公开 URL。
3. `js/nav.js` 的机场详情页侧栏。

自动化测试至少锁定新增机场的侧栏路径，避免页面存在但站内详情导航不可发现。

## 验证与完成条件

- 新增测试先因 `js/nav.js` 缺少极速云而失败，再在补充配置后转绿。
- 运行 `tests/airport-features.test.mjs` 和 `tests/site-audit.test.mjs`，要求零失败、零跳过。
- 运行 `node --check js/nav.js` 和 `git diff --check`。
- 在本地浏览器打开 Quick Cloud 与极速云详情页，确认侧栏均显示极速云，并且只在极速云详情页高亮。
- 只提交规格、`js/nav.js` 和测试；不暂存 `.DS_Store`、`data/airport-health-history.json` 或 `data/airports.json`。

## 非目标

- 不从数据文件动态生成导航。
- 不调整其他机场的排序、名称或链接。
- 不修改极速云套餐正文、机场卡片、Sitemap、首页或排行榜。
