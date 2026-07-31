# ChatGPT 手机订阅双平台教程实施计划

**Goal:** 新建 Android 与 iPhone 两篇 ChatGPT 套餐订阅教程，并接入教程中心、侧栏和 Sitemap。

**Architecture:** 两篇页面复用现有静态教程骨架和全局暖色主题，以页面内样式实现平台标识、步骤卡片、核对清单和 FAQ。飞书文档提供流程骨架，OpenAI、Google Play 与 Apple 官方资料负责校正当前应用要求、订阅归属、兑换和取消规则。

**Tech Stack:** HTML5、页面内 CSS、现有 `css/main.css`、`js/nav.js`、Node.js `node:test` 静态审计。

**Spec:** `docs/superpowers/specs/2026-07-31-chatgpt-mobile-subscription-tutorials-design.md`

## Task 1：先补回归测试

**Files:**

- Modify: `tests/site-audit.test.mjs`

1. 增加两个教程页面的路径、canonical、H1、Article、HowTo、FAQPage 和更新时间断言。
2. 断言 Android 页面包含官方 Google Play 安装链接、Android 7.0、OpenAI 发布者、Google Play 取消路径和平台重复订阅提醒。
3. 断言 iPhone 页面包含现有美区 Apple 账户教程链接、Apple 礼品卡地区匹配、兑换步骤、Apple 取消路径、Restore purchases 和平台重复订阅提醒。
4. 断言教程中心、`js/nav.js` 和 Sitemap 都包含两个新入口。
5. 先运行新增测试，确认因为页面与入口尚不存在而失败。

## Task 2：创建两篇教程页面

**Files:**

- Create: `tutorial/chatgpt-subscription-android/index.html`
- Create: `tutorial/chatgpt-subscription-iphone/index.html`

1. 复用现有 header、top navbar、sidebar、content、footer、Giscus 和分析脚本结构。
2. 添加完整 SEO 元数据以及 Article、BreadcrumbList、HowTo、FAQPage JSON-LD。
3. 使用共享的页面内视觉语言：
   - 平台色标签。
   - “先检查”三列核对卡。
   - 编号步骤卡。
   - 风险提示和 FAQ。
   - 手机端单列布局。
4. Android 页面写入：
   - Google Play 和 Android 7.0+ 前置条件。
   - 小米/红米 Google 基础服务路径仅作示例。
   - 官方 ChatGPT 应用核验与安装。
   - Google Play 当前可用付款方式、应用内确认、取消和排障。
5. iPhone 页面写入：
   - 链接既有美区 Apple 账户教程。
   - App Store 官方应用安装。
   - 对应地区礼品卡购买、兑换、余额和可能要求备用付款方式的限制。
   - 应用内升级、恢复购买、取消和排障。
6. 两篇都写入来源区，并避免固定价格、第三方渠道保证、非官方安装包和共享账号建议。

## Task 3：接入站内入口

**Files:**

- Modify: `tutorial/index.html`
- Modify: `js/nav.js`
- Modify: `sitemap.xml`

1. 在教程中心“通用教程”增加 Android 和 iPhone 两张卡。
2. 更新教程中心标题、description 和 CollectionPage 描述，使其覆盖 ChatGPT 手机订阅内容。
3. 在教程侧栏现有美区 Apple 账户项后追加两个新入口。
4. 在 Sitemap 添加两个新 URL，`lastmod` 为 `2026-07-31`。
5. 把教程中心 `/tutorial/` 的 `lastmod` 更新为 `2026-07-31`。

## Task 4：自动化验证

1. 运行新增的定向 Node 测试，确认从红转绿。
2. 运行完整 `tests/site-audit.test.mjs`。
3. 运行 `node --check js/nav.js`。
4. 解析两个页面的所有 JSON-LD。
5. 运行 `git diff --check`。
6. 检查 `git status`，确认没有暂存或覆盖用户已有的 `.DS_Store` 和机场数据文件修改。

## Task 5：浏览器验证

1. 启动 `python3 -m http.server 8080`。
2. 使用浏览器分别检查教程中心、Android 教程和 iPhone 教程。
3. 在桌面与手机视口确认：
   - 页面无横向溢出。
   - 步骤卡和核对卡布局正确。
   - 侧栏显示并准确高亮当前页面。
   - 教程中心入口和关键站内链接可点击。
4. 修复发现的问题并重新执行自动化验证。

## Task 6：提交

1. 只暂存实施计划、两个新页面、教程中心、导航、Sitemap 和测试。
2. 检查暂存区格式与文件清单。
3. 创建单一实现提交，不包含用户原有数据修改。
