# 网站流量优化 P1：内容信任与评测质量实施计划

**目标：** 在纯静态架构中建立可复用的机场评测结构，并首批改造机场聚合页、大哥云、肥猫云与精灵学院页面。

**架构：** 三张详情页手工采用统一的语义 HTML 与 class；公共视觉集中到 `css/main.css`；正文不由 JavaScript 注入；零依赖 Node 审计锁定编辑规则、套餐事实与 SEO 一致性。

**视觉方向：** 延续暖白、珊瑚色与绿色辅助色的编辑型视觉。新增信息条、结论卡、双栏判断区、套餐表、风险提示和来源区；移动端双栏折叠，表格仅在自身容器内滚动。

**技术栈：** HTML5、CSS3、现有原生 JavaScript 导航、Node.js 内置测试模块、Cloudflare Pages。

**设计依据：** `docs/superpowers/specs/2026-07-02-traffic-optimization-p1-content-trust-design.md`

---

## Task 1：建立 P1 内容信任审计（RED）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 完整阅读现有审计测试，沿用 `node:test`、`node:assert/strict`、`node:fs` 和 `node:path`，不增加依赖。
2. 新增 P1 目标页清单：
   - `jichang/dageyun/index.html`
   - `jichang/feimiaoyun/index.html`
   - `jichang/jinglingxueyuan/index.html`
3. 为三页统一结构增加意图测试，要求每页存在：
   - `.review-meta`
   - `.review-verdict`
   - `.review-audience`
   - `.review-pros-cons`
   - `.plan-table-wrap` 与语义化 `<table>`
   - `.review-risk`
   - `.review-sources`
4. 检查作者“优质机场推荐编辑部”、审核方式、`2026-07-02` 核验日期，以及公开资料边界提示。
5. 检查三页的关键套餐事实，避免测试完整复制页面文案：
   - 大哥云：`¥19.90`、`100GB`、`¥299`、`500GB`、`mcuE8uOq`。
   - 肥猫云：`¥96`、`60GB`、`¥100`、`700GB`、`¥600`、`500GB`。
   - 精灵学院：Iron、Silver、Alloy、Gold、Diamond、Master、不限时流量 Small 及其关键价格/流量。
6. 检查已过期或冲突内容消失：
   - 大哥云 `dgy2026` 和 `2026/2/23`。
   - 肥猫云旧“10月份”说明与旗舰 `750GB`。
   - 精灵学院 `New2025` 和把“买前必看”渲染成套餐行的情况。
7. 检查三个商业 CTA 继续带有 `rel="sponsored nofollow noopener"`，但测试不得要求可见推广/佣金披露。
8. 检查目标页的 meta/JSON-LD 不包含已删除的确定性稳定、全解锁或安全性承诺；Article 作者与 `dateModified` 正确。
9. 检查 `jichang/index.html` 存在评测方法说明，且仅要求本批三张卡片使用新摘要标记，不约束其余卡片文案。
10. 运行 `node --test tests/site-audit.test.mjs`，确认新增测试因目标结构尚不存在而失败，不得因语法或路径错误失败。

## Task 2：增加共享评测样式

**文件：**

- 修改：`css/main.css`

**步骤：**

1. 完整阅读现有文章、卡片、表格和响应式样式，复用已有变量。
2. 为 Task 1 中的结构约定增加最少样式：
   - 编辑信息条和资料标签。
   - 结论卡。
   - 两组双栏布局与普通列表。
   - 套餐表、表头、数字列、斑马层次与滚动容器。
   - 风险提示和来源列表。
3. 在 768px 以下把双栏改为单栏；为 `.plan-table-wrap` 设置局部横向滚动，并确保其父级可收缩。
4. 不修改主题变量，不增加动画、图标库或 JavaScript。
5. 运行 P1 审计；结构测试仍应失败，但 CSS 选择器和现有 P0 测试不得出现新失败。

## Task 3：改造大哥云详情页（GREEN 1）

**文件：**

- 修改：`jichang/dageyun/index.html`

**步骤：**

1. 完整阅读页面 head、JSON-LD、FAQ、正文、CTA 和评论区。
2. 按设计顺序重写 `<article>`，使用统一 class；保留导航、Giscus 和现有 CTA URL。
3. 套餐表严格采用设计文档中的五档套餐与共同约束。
4. 删除已过期的新年八折活动；只在两档年付 A 套餐中展示当前 9 折码 `mcuE8uOq`。
5. 适合/不适合与优缺点只从套餐周期、流量、带宽上限、新疆不可用和退款限制推导。
6. 线路、协议和性能使用商家归因措辞；第三方来源只有在日期、环境和工具均可复核时才展示具体结果。
7. 收紧 title 以外的 description、Open Graph、Twitter、Article 与 FAQ；保留正确 canonical 和 BreadcrumbList。
8. 更新 Article 作者与 `dateModified`。
9. 运行审计，确认大哥云相关新增测试转绿，另两页结构测试仍按预期失败。

## Task 4：改造肥猫云详情页（GREEN 2）

**文件：**

- 修改：`jichang/feimiaoyun/index.html`

**步骤：**

1. 完整阅读页面后按统一结构重写正文，保留站点外壳、CTA 与 Giscus。
2. 用六行文字表格替换旧套餐截图依赖；旗舰套餐只使用 `700GB`。
3. 将 BGP 三线、专线出口、不限速、1 倍率、解锁与设备数明确归因给商家。
4. 风险区写明套餐周期、独享节点价格与 2–3 个工作日交付信息；不推导商家未提供的退款规则。
5. 删除旧“10月份”套餐说明和泛化优惠文案。
6. 同步收紧 meta、Article 和可核验 FAQ，更新作者与 `dateModified`。
7. 运行审计，确认肥猫云测试转绿，精灵学院结构测试仍按预期失败。

## Task 5：改造精灵学院详情页（GREEN 3）

**文件：**

- 修改：`jichang/jinglingxueyuan/index.html`

**步骤：**

1. 完整阅读页面后按统一结构重写正文，保留站点外壳、CTA 与 Giscus。
2. 套餐表包含：50G 超值年付、Iron、Silver、Alloy、Gold、Diamond、Master、不限时流量 Small。
3. “买前必看（这不是套餐）”不作为套餐行。
4. 清晰表达退款、不同类套餐覆盖、不限时流量重复购买、刷新订阅等规则；对看似冲突的叠加规则提醒购买前确认，不自行调和。
5. CN2、EMBY、解锁能力、速率和客服时效全部归因给商家。
6. 删除旧 `New2025` 优惠信息。
7. 同步收紧 meta、Article 与 FAQ，更新作者与 `dateModified`。
8. 运行审计，确认三张详情页结构与事实测试全部转绿。

## Task 6：更新机场聚合页

**文件：**

- 修改：`jichang/index.html`

**步骤：**

1. 在购买提示之后、机场网格之前增加简短评测方法说明，表达资料来源、核验日期和环境差异提醒。
2. 仅更新大哥云、肥猫云、精灵学院三张卡片的摘要与特征列表，使其与详情页可核验事实一致。
3. 保持全部卡片顺序不变，不修改其余卡片正文。
4. 不增加全站排名、评分、筛选或 JavaScript。
5. 更新 CollectionPage description 中与本批方法说明冲突的夸张措辞；不扩大为全页 SEO 重写。
6. 运行审计，确认聚合页 P1 测试转绿且 P0 内容枢纽测试保持通过。

## Task 7：同步 Sitemap 与完成内容一致性检查

**文件：**

- 修改：`sitemap.xml`

**步骤：**

1. 只把 `/jichang/`、`/jichang/dageyun/`、`/jichang/feimiaoyun/`、`/jichang/jinglingxueyuan/` 的 `lastmod` 更新为 `2026-07-02`。
2. 不修改未编辑页面的日期，不恢复 `priority` 或 `changefreq`。
3. 使用 `rg` 逐项核对旧优惠、旧月份、750GB、作者、核验日期和 CTA 属性。
4. 运行完整审计，要求零失败。

## Task 8：全量自动验证

**步骤：**

1. 运行 `node --test tests/site-audit.test.mjs`，要求零失败、零跳过。
2. 运行 `git diff --check`，要求无空白错误。
3. 检查完整 diff，确认没有修改排除页面、JavaScript、主题变量或用户的 `AGENTS.md`。
4. 检查三页的 JSON-LD 均可被 `JSON.parse` 解析。
5. 检查根路径站内链接审计仍通过。

## Task 9：桌面与移动端浏览器验证

**步骤：**

1. 使用 `python3 -m http.server 8080` 启动静态站点。
2. 在桌面宽度检查聚合页和三张详情页的区块顺序、视觉层级、表格、CTA、来源链接和页尾。
3. 在 390×844 检查：
   - 双栏折叠为单栏。
   - 表格只在自身容器中横向滚动。
   - 页面没有整体横向溢出。
   - 顶部导航与 CTA 可访问。
4. 检查控制台没有由本批引入的错误。
5. 关闭本地服务器和浏览器会话。

## Task 10：提交实现

**步骤：**

1. 对照设计文档和本计划逐项复核成功标准。
2. 再次运行 Task 8 的完整验证命令，并记录实际输出。
3. 查看 `git status --short`，确保仅包含计划内文件，且不包含 `AGENTS.md`。
4. 仅暂存计划内文件并创建 P1 实现提交。
5. 不推送、不部署；除非用户另行明确要求。
