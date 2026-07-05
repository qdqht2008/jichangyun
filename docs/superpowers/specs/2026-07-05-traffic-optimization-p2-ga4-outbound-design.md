# 网站流量优化 P2：GA4 外链点击统计设计

**日期：** 2026-07-05
**状态：** 已确认，待实施计划
**范围：** 共享外链点击采集、隐私最小化、GA4 管理端配置与审计测试

## 1. 目标与边界

为站内商业入口、官方资料链接和其他站外链接增加统一的 GA4 点击事件，用于判断哪些内容带来有效外链访问。

本批只为自定义外链事件采集聚合分析所需的最小字段，不采集目标链接的完整 URL、查询参数、推广码、链接文案或用户标识；不改变链接跳转，不延迟页面导航，也不修改现有商业链接的 `rel="sponsored nofollow noopener"`。现有 GA4 页面浏览采集不在本批调整范围内。

## 2. 冲突选择

GA4 增强型衡量的自动出站点击会发送名为 `click` 的事件，并包含完整 `link_url`。这与“不发送查询参数或推广码”的隐私边界冲突。

本批明确选择自定义最小化事件，并要求部署前在 GA4 管理端关闭 **增强型衡量 → 出站点击**：

- 自定义事件名为 `outbound_link`；
- 自动 `click` 出站事件必须关闭，避免重复计数及完整 URL 外传；
- 前端代码无法代替 GA4 管理端关闭开关，因此该操作是部署前置条件；
- 未确认管理端开关前，不宣称生产环境已满足隐私边界。

官方依据：

- [GA4 增强型衡量事件](https://support.google.com/analytics/answer/9216061?hl=zh-Hans)
- [Google tag 事件参考](https://developers.google.com/tag-platform/gtagjs/reference/events)

## 3. 采集架构

在共享 `js/nav.js` 中增加一个独立的“外链统计”区块，使用 document 级事件委托监听标准 `click`。该选择避免给大量 HTML 页面新增脚本标签，保持纯静态架构和外科手术式修改。

审计发现 34 个加载 `nav.js` 的页面中有 4 个尚未加载现有 GA4 初始化代码：

- `tutorial/index.html`
- `tutorial/clash-verge/index.html`
- `tutorial/flclash/index.html`
- `tutorial/clash-meta-for-android/index.html`

本批在这 4 页补入与站内其他页面完全相同的 `G-HPYY57ECEX` 初始化片段，避免关键教程页只注册监听器却无法发出事件。除此之外不批量改写 HTML。

点击处理流程：

1. 从点击目标向上查找最近的 `a[href]`；找不到则忽略。
2. 使用 `URL` 解析链接；无法解析或协议不是 `http:` / `https:` 时忽略。
3. 将当前主机、`jichangyun.top` 与 `www.jichangyun.top` 视为站内地址并忽略。
4. `window.gtag` 不存在时静默跳过，页面跳转照常进行。
5. 对有效站外链接立即调用 `gtag('event', 'outbound_link', parameters)`。
6. 不调用 `preventDefault()`，不等待统计回调，不改变新窗口、组合键或普通点击行为。

监听范围是浏览器标准 `click` 事件，包括普通主键点击和键盘激活链接；本批不另行监听鼠标中键 `auxclick`，避免重复采集与扩大行为范围。

## 4. 事件字段

事件只允许以下三个自定义参数：

| 参数 | 内容 | 隐私约束 |
| --- | --- | --- |
| `link_domain` | 目标主机名，小写并去除开头的 `www.` | 不含路径、查询参数或片段 |
| `link_type` | `sponsored`、`official` 或 `external` | 由页面语义和 `rel` 确定 |
| `page_path` | 当前页面 `window.location.pathname` | 不含当前页面查询参数或片段 |

禁止发送 `link_url`、`link_text`、原始 `href`、查询参数、片段、推广码，以及 GA4 自动出站事件使用的自定义完整 URL 字段。

## 5. 链接分类

分类按固定优先级执行：

1. 链接的 `rel` 包含 `sponsored`：`sponsored`。
2. 链接位于 `.official-download`、`.tutorial-sources` 或 `.troubleshooting-sources` 内：`official`。
3. 其余有效站外链接：`external`。

`.review-sources` 不自动视为官方来源，因为评测引用中可能包含第三方证据。若某链接既有 `sponsored` 又位于官方资料区，仍归类为 `sponsored`，避免商业点击被误记为资料点击。

## 6. 失败与兼容行为

- `gtag` 尚未加载、被浏览器扩展拦截或 GA4 不可用：静默跳过，不产生控制台错误。
- href 无效或协议不受支持：忽略。
- 点击链接内部图标或文字节点：通过 `closest('a[href]')` 找到链接。
- 点击目标不支持 `closest()`：忽略，不抛出异常。
- 同站绝对 URL、相对 URL和生产域名的 `www` / 非 `www` 形式：均不记录。
- 本批不新增 cookie、存储、重试队列或服务端端点。

## 7. TDD 与验收

### 7.1 自动行为测试

在 `tests/site-audit.test.mjs` 使用 Node `vm` 和最小 DOM 桩执行真实 `js/nav.js`，先写测试并观察 RED，再实现：

- 商业链接产生一次 `outbound_link`，类型为 `sponsored`。
- 官方资料区链接归类为 `official`，普通站外链接归类为 `external`。
- 事件参数键严格等于 `link_domain`、`link_type`、`page_path`，且值中不出现路径、查询参数、片段或链接文案。
- 相对地址、同站绝对地址、`mailto:`、`tel:` 与无效 href 不触发事件。
- `gtag` 缺失时不抛错，也不阻止链接默认行为。
- 点击监听器不调用 `preventDefault()`。
- 4 个关键教程页加载与其他页面一致的 GA4 初始化代码，测量 ID 不分叉。

测试名称必须说明隐私最小化和不干扰导航的意图，而不只检查源代码字符串。

### 7.2 文档与人工验证

新增 `docs/ga4-outbound-tracking.md`，记录：

- GA4 管理端关闭自动出站点击的必要步骤；
- 自定义事件和参数定义；
- DebugView / 实时报告的验证方法；
- 不应出现自动 `click` 出站事件或完整 `link_url` 的验收项；
- 未部署、未操作 GA4 账户时必须显式标记为待用户执行。

本地浏览器验证至少覆盖一个商业 CTA、一个官方资料链接、一个普通外链和一个站内链接，并确认导航不受影响。

## 8. 完成条件

- 所有已接入共享导航和 GA4 的页面都能发送隐私最小化的 `outbound_link` 事件，4 个已知教程缺口已补齐。
- 仅发送三项允许参数，分类与过滤规则有行为测试保护。
- 所有 Node 审计零失败、零跳过，`git diff --check` 通过。
- 本地浏览器验证不阻断跳转且无控制台错误。
- GA4 管理端操作被清晰记录为部署前置条件，不虚假宣称已经完成。
- 创建本地提交；未经明确授权不推送、不部署。
