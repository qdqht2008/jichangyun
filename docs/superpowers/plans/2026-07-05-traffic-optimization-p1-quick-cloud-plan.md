# 网站流量优化 P1：Quick Cloud 评测重构实施计划

**目标：** 使用已确认的当前官方套餐资料重构 Quick Cloud，并停止主动推荐光年梯与龙猫云。

**设计依据：** `docs/superpowers/specs/2026-07-05-traffic-optimization-p1-quick-cloud-design.md`

**架构：** 继续使用纯静态 HTML、共享导航、Giscus 和现有评测 CSS；不新增运行时依赖或数据源。

---

## Task 1：复核现有页面、入口与审计约束

**读取：**

- `jichang/quickcloud/index.html`
- `jichang/wanxiang/index.html`
- `jichang/index.html`
- `index.html`
- `sitemap.xml`
- `css/main.css`
- `tests/site-audit.test.mjs`

1. 通读 Quick Cloud 的 head、正文、CTA、Giscus 与脚本。
2. 对照已完成评测页确认可复用结构，不新增一次性 CSS。
3. 盘点光年梯、龙猫云的可见入口与 sitemap 条目，区分历史文档和跑路案例中的非推荐文字。
4. 记录 sitemap 完整性测试与“保留页面但移除条目”的冲突。
5. 运行全量审计，记录修改前基线。

## Task 2：建立统一评测结构与证据边界测试（RED 1）

**修改：** `tests/site-audit.test.mjs`

1. 要求 Quick Cloud 具备 `review-meta`、结论、适合/不适合、优点/限制、套餐表、风险、来源、FAQ 与相关指南。
2. 要求官方套餐页、核验日期 2026-07-05、编辑部作者和统一体验边界。
3. 要求线路、节点、解锁和客服时效均有商家归因。
4. 禁止本站实测、保证解锁、永久可用或绝对稳定措辞。
5. 要求 CTA 保持 `sponsored nofollow noopener`。
6. 运行目标测试，确认因旧页面结构和措辞失败，而非测试语法错误。

## Task 3：建立普通套餐事实测试（RED 2）

**修改：** `tests/site-audit.test.mjs`

1. 锁定 300G、500G、1000G 三档月付套餐的价格、流量、周期和线路原文差异。
2. 锁定 800G、2000G、5000G 三档一次性流量包的价格、不重置和不限时规则。
3. 要求“推荐”仅归因给官方套餐页，不写成本站结论。
4. 要求 60+ 节点、住宅家宽、解锁、冷门国家、12 小时工单和活动状态有商家归因与时效提醒。
5. 禁止补写普通套餐的设备数、限速或退款结论。
6. 运行目标测试并观察预期失败。

## Task 4：建立节点定制事实与风险测试（RED 3）

**修改：** `tests/site-audit.test.mjs`

1. 锁定 ¥189/月、按月重置、最高峰值 1000Mbps。
2. 区分托管式 2500GB/8 倍率/不限设备与非托管式 1000GB/无倍率/root 自部署。
3. 要求 3 个工作日交付、可选地区、额外 IP 规则、7×24 小时支持和库存确认。
4. 要求“独立原生纯净节点”明确为商家声明。
5. 要求非托管式技术门槛与潜在额外费用进入显著风险区。
6. 运行目标测试并观察预期失败。

## Task 5：建立退役入口测试并修正 sitemap 意图（RED 4）

**修改：** `tests/site-audit.test.mjs`

1. 要求机场汇总页不含龙猫云卡片或 `/jichang/longmiaoyun/` 链接。
2. 要求 sitemap 不含 `/jichang/guangnian/` 与 `/jichang/longmiaoyun/`。
3. 要求两份旧详情页文件继续存在，且本次不添加 `noindex`。
4. 将 sitemap 完整性审计改为：除精确白名单中的两个退役入口外，所有公开页面必须收录；sitemap 也不得出现不存在的页面。
5. 白名单只允许这两个路径，避免为其他漏收录提供宽泛豁免。
6. 要求 Quick Cloud 卡片和 sitemap 日期同步为 2026-07-05。
7. 运行目标测试并观察预期失败。

## Task 6：重构 Quick Cloud 页面（GREEN 1–3）

**修改：** `jichang/quickcloud/index.html`

1. 收紧 title、description、Open Graph、Twitter 与 Article/FAQ JSON-LD。
2. 按统一结构重写文章，分别制作月付套餐表、不限时流量包表和节点定制说明。
3. 删除旧套餐截图依赖与未经归因的宣传段落。
4. 对 IEPL、住宅节点、60+ 节点、解锁、客服时效、独立原生纯净节点等统一使用商家归因。
5. 显著呈现普通套餐退款/设备/限速信息缺口、不限时服务持续性、活动规则缺口和定制技术门槛。
6. 保留现有 CTA、Giscus、导航与 GA4。
7. 逐组运行目标测试，直至 Quick Cloud 相关测试通过。

## Task 7：同步机场汇总页与 Sitemap（GREEN 4）

**修改：** `jichang/index.html`、`sitemap.xml`

1. 更新 Quick Cloud 卡片为当前起价、流量类型和核验日期。
2. 精确删除龙猫云整张卡片，不调整其他卡片顺序或内容。
3. 将 Quick Cloud 的 sitemap `lastmod` 更新为 2026-07-05。
4. 删除光年梯、龙猫云 sitemap 条目；保留对应详情页文件。
5. 保持机场汇总页当前 2026-07-05 日期，不制造无关日期变更。
6. 运行入口与 sitemap 目标测试并转绿。

## Task 8：全量自动验证

1. 运行 `node --test tests/site-audit.test.mjs`，要求零失败、零跳过。
2. 解析 Quick Cloud 全部 JSON-LD，确认与正文一致。
3. 用 `rg` 检查旧截图、绝对化性能、本站实测暗示和退役入口。
4. 运行 `node --check js/nav.js` 与 `git diff --check`。
5. 检查工作区只包含设计允许的 Quick Cloud、汇总页、Sitemap、测试和计划文档。

## Task 9：桌面与移动浏览器验证

1. 启动本地静态服务器。
2. 在桌面和 390×844 检查 Quick Cloud 与机场汇总页。
3. 确认套餐表只在容器内滚动，页面无整体横向溢出。
4. 检查首屏风险、CTA、来源、FAQ、相关指南与汇总页退役入口。
5. 检查控制台无本站静态资源错误；不访问商业目标，不创建账号或购买套餐。

## Task 10：提交实现

1. 对照设计和计划逐项检查完成范围。
2. 重新运行完整自动验证并读取输出。
3. 只暂存计划内文件并创建一个 Quick Cloud 实现提交。
4. 不推送、不部署，不修改 GA4 管理端。
