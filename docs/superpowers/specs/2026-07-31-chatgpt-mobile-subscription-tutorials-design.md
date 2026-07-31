# ChatGPT 手机订阅双平台教程设计

**日期：** 2026-07-31
**状态：** 已获用户口头批准，待书面复核

## 目标

把用户指定的飞书文档中与手机订阅有关的内容整理为两篇独立教程，并纳入本站“使用教程”：

- Android 手机订阅 ChatGPT 套餐。
- iPhone 订阅 ChatGPT 套餐。

两篇页面分别服务明确的平台搜索和阅读意图；不创建合并总页，不改造现有客户端教程。

## 内容来源与时效边界

主要整理来源：

- WaytoAGI 飞书文档：`https://waytoagi.feishu.cn/wiki/HjPJwAJJdi0sl4k9IslcoU9ZnIh`
- 文档标注原文创建于 2024 年，包含 Android 的 Google Play 订阅路线和 iPhone 的美区 Apple 账户、礼品卡订阅路线。

来源文档中的 `GPT4`、`Get Plus`、固定价格及付款限制属于当时界面和政策描述。发布时统一使用“ChatGPT 套餐”或“ChatGPT Plus”等仍适用的名称，不承诺固定价格、按钮文案、税费或某一种支付方式永久可用。

实现前对易变化信息使用 OpenAI、Google Play 和 Apple 的当前官方资料复核。两篇页面都明确提示：以应用内实际显示的套餐、价格、税费和付款可用性为准。

不复制飞书截图；只提炼操作顺序并按本站语气重写。页面保留“整理依据”链接和来源日期说明。

## 冲突处理

飞书原文与本站 2026 年的 `/tutorial/us-apple-id/` 在 Apple 账户注册网络环境建议上存在冲突：

- 飞书原文一处建议美国 IP，另一处又写中国 IP 可注册。
- 现有本站教程明确建议使用稳定的国内网络并关闭代理，以减少风控。

本次不融合这两套矛盾建议。iPhone 篇不重复编写 Apple 账户注册细节，明确以前置链接 `/tutorial/us-apple-id/` 为准；飞书内容只用于下载、充值和订阅主流程。Android 篇同样不把“双币信用卡或全币信用卡”写成唯一支付结论，而是引导用户查看 Google Play 当前提供的付款方式。

## 页面一：Android 手机教程

**路径：** `/tutorial/chatgpt-subscription-android/`
**H1：** `安卓手机订阅 ChatGPT 套餐教程`
**核心结果：** 用户从确认 Google 服务可用，到安装官方 ChatGPT 应用并完成 Google Play 应用内订阅。

内容顺序：

1. 适用范围与准备条件：
   - 可正常使用 Google Play 的 Android 设备。
   - 已有 ChatGPT 账号和可用的 Google 账号。
   - 部分国产机型没有完整 Google 移动服务；不提供非官方框架安装包。
2. 确认或启用 Google 基础服务：
   - 以飞书中的“小米/红米示例路径”为示例，不声称适用于所有品牌。
   - 找不到对应开关时，要求查阅设备厂商说明。
3. 从 Google Play 核对开发者并安装官方 ChatGPT。
4. 在 Google Play 的“付款和订阅”中添加当前可用付款方式。
5. 打开 ChatGPT、登录账号、进入升级入口并在 Google Play 确认套餐和金额。
6. 在 Google Play 管理或取消订阅。
7. 常见问题：
   - 找不到 ChatGPT。
   - 设备没有 Google Play 或无法登录。
   - 付款方式被拒绝。
   - 已付款但账户未显示套餐。

## 页面二：iPhone 教程

**路径：** `/tutorial/chatgpt-subscription-iphone/`
**H1：** `苹果手机订阅 ChatGPT 套餐教程`
**核心结果：** 用户使用可下载 ChatGPT 的 App Store 账户安装官方应用，通过 Apple 账户余额或 App Store 当前支持的方式完成应用内订阅。

内容顺序：

1. 适用范围与准备条件。
2. Apple 账户前置条件：
   - 需要可下载 ChatGPT 的 App Store 地区账户。
   - 直接链接现有 `/tutorial/us-apple-id/`，不复制其注册流程。
   - 保留中国区 iCloud 账户、仅在“媒体与购买项目/App Store”使用其他地区账户的双账号边界。
3. 从 App Store 核对开发者并安装官方 ChatGPT。
4. 充值路线：
   - 根据飞书原文整理“购买对应地区 Apple 礼品卡 → 获取兑换码 → App Store 手动兑换”。
   - 支付宝入口可能变化，仅作为可用性需现场确认的示例，不写成官方保证。
   - 礼品卡地区必须与 Apple 账户地区一致。
5. 打开 ChatGPT、登录账号、进入升级入口并用 Apple 应用内购买确认套餐。
6. 提醒预留税费差额，以实际结算金额为准。
7. 在 iPhone 的订阅管理中取消自动续费。
8. 常见问题：
   - App Store 搜不到 ChatGPT。
   - 礼品卡无法兑换。
   - 余额充足但仍提示不足。
   - 付款完成后套餐未生效。

## 页面结构与视觉

复用现有静态教程页面结构：

- `header`、`#top-navbar`、`#page-sidebar`、`.content`、`footer`。
- 使用 `css/main.css` 的现有颜色、字体、按钮和文章布局。
- 页面内仅添加必要的步骤卡片、提示块与 FAQ 样式；不修改全局 CSS，不引入新脚本或框架。
- 每篇包含 Article、BreadcrumbList、HowTo 和 FAQPage JSON-LD；结构化数据必须与正文一致。
- 每篇包含作者、整理依据、更新时间和官方资料区。
- 两篇互相链接，并分别链接教程中心；iPhone 篇另链接美区 Apple 账户教程。

## 站内入口

在 `/tutorial/index.html` 的“通用教程”中新增两张卡片：

- `Android`：安卓手机订阅 ChatGPT。
- `iPhone`：苹果手机订阅 ChatGPT。

在 `js/nav.js` 的教程侧栏追加两个准确路径。保持现有教程顺序与其他项目不变。

在 `sitemap.xml` 收录两个新 URL，并把教程中心 `/tutorial/` 的 `lastmod` 更新为 `2026-07-31`。Sitemap 继续遵守仓库约束，只写 `loc` 和 `lastmod`。

## 涉及文件

预期只改动：

1. 新建 `tutorial/chatgpt-subscription-android/index.html`。
2. 新建 `tutorial/chatgpt-subscription-iphone/index.html`。
3. 编辑 `tutorial/index.html`。
4. 编辑 `js/nav.js`。
5. 编辑 `sitemap.xml`。
6. 在现有测试文件中增加针对两篇教程入口、元数据、关键安全边界和 Sitemap 的回归断言。

不修改当前工作区已有的 `.DS_Store`、`data/airport-health-history.json` 或 `data/airports.json`。

## 验证与完成条件

- 两个页面的 canonical、H1、结构化数据、来源说明和更新时间正确。
- Android 篇没有把小米设置路径冒充为所有 Android 设备的统一路径。
- iPhone 篇不重复或改写现有 Apple 账户注册流程，并明确礼品卡地区匹配与税费风险。
- 教程中心与教程侧栏都能到达两个新页面，两个页面之间存在相关教程链接。
- 所有新增站内链接指向实际文件；所有外链带有合适的 `target` 和 `rel`。
- Sitemap 覆盖两个新页面，且没有 `priority` 或 `changefreq`。
- JSON-LD 可解析，HTML 基础结构完整。
- 运行相关 Node 测试、`node --check js/nav.js`、`git diff --check`，零失败、零跳过。
- 通过本地静态服务器在桌面和手机视口检查教程中心及两个详情页，确认无横向溢出、遮挡或导航高亮错误。

## 非目标

- 不售卖或代购 ChatGPT、Google Play、Apple 账户或礼品卡。
- 不提供虚拟信用卡、非官方 APK、Google 服务框架安装包或共享账号。
- 不保证特定地区、银行卡、支付宝入口或礼品卡渠道长期可用。
- 不复制飞书图片、评论或过时的固定价格。
- 不重构现有美区 Apple 账户教程、导航系统或全局样式。
