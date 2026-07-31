# ChatGPT 手机教程原文对齐实施计划

**Goal:** 将 Android 与 iPhone 两篇 ChatGPT 订阅教程收紧为用户确认的原文流程，只保留必要且准确的官方补充。

**Architecture:** 保留现有页面骨架、SEO、结构化数据、侧栏和站内入口；仅调整两篇文章的 HowTo 数据、页面内样式和正文内容，并同步静态审计断言。

**Tech Stack:** HTML5、页面内 CSS、现有 `css/main.css`、Node.js `node:test` 静态审计。

**Spec:** `docs/superpowers/specs/2026-07-31-chatgpt-mobile-tutorials-source-alignment-design.md`

## Task 1：更新内容审计

**Files:**

- Modify: `tests/site-audit.test.mjs`

1. 将 Android 断言改为四段主流程及关键路径。
2. 将 iPhone 断言改为三段主流程、支付宝礼品卡步骤和美区 Apple ID 教程入口。
3. 保留设备要求、官方链接、取消订阅、恢复购买和重复订阅提醒断言。
4. 新增否定断言，确保页面不含 WaytoAGI、飞书 URL、“整理依据”、路线图和检查卡。

## Task 2：收紧 Android 教程

**Files:**

- Modify: `tutorial/chatgpt-subscription-android/index.html`

1. 将 HowTo 数据改为 Google 基础服务、Google Play、ChatGPT 安装、订阅四步。
2. 删除路线图、开始前检查卡及对应 CSS。
3. 正文按红米 K60 开启 Google 基础服务、安装 Google Play、安装 ChatGPT、订阅 ChatGPT Plus 的顺序改写。
4. 保留 Android 7.0+、官方商店、取消订阅、常见问题和重复扣费提醒。
5. 删除飞书来源链接和来源归属文案，来源区只列官方资料。

## Task 3：收紧 iPhone 教程

**Files:**

- Modify: `tutorial/chatgpt-subscription-iphone/index.html`

1. 将 HowTo 数据改为准备美区 Apple ID、购买并兑换礼品卡、应用内订阅三步。
2. 删除路线图、开始前检查卡及对应 CSS。
3. 正文按准备美区 Apple ID、支付宝购买并兑换 Apple 礼品卡、ChatGPT 应用内订阅的顺序改写。
4. 保留 Apple ID 站内教程按钮、官方 App Store 链接、Restore purchases、取消订阅、常见问题和重复扣费提醒。
5. 删除飞书来源链接和来源归属文案，来源区只列官方资料。

## Task 4：验证

1. 运行 ChatGPT 教程定向审计。
2. 运行完整 `tests/site-audit.test.mjs`。
3. 运行 `node --check js/nav.js`。
4. 解析两篇页面的全部 JSON-LD。
5. 运行 `git diff --check`。
6. 在桌面与手机视口检查两篇页面的层级、链接与横向溢出。
7. 检查 Git 变更范围，确保不包含用户现有机场数据文件。

## Task 5：提交与推送

1. 只暂存实施计划、两篇教程和审计测试。
2. 检查暂存区文件清单与格式。
3. 创建实现提交并推送当前分支。
