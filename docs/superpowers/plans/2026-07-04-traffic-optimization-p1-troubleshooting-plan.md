# 网站流量优化 P1：故障排查长尾内容实施计划

**目标：** 用一个故障分流入口和两篇症状型长尾页覆盖“Clash 连不上/频繁断线”“订阅更新失败”“已连接但无法上网”三类搜索意图，同时删除危险捷径并建立可复跑的内容审计。

**架构：** 继续使用纯静态 HTML、现有导航和 Giscus；症状页采用统一的诊断语义结构，官方文档负责技术事实，编辑内容只负责排查顺序和停止条件；Node 内置测试锁定路径、SEO 分工、证据、安全提示与内链。

**实施策略：** 按“证据基线 → 订阅更新失败 → 已连接但无法上网 → 故障分流入口 → 聚合与一致性”的顺序逐页 RED/GREEN。每个子批都运行完整审计，不在一个未验证的大改中同时创建全部内容。

**技术栈：** HTML5、现有 CSS3、原生 JavaScript 导航、Node.js 内置测试模块、Cloudflare Pages。

**设计依据：** `docs/superpowers/specs/2026-07-04-traffic-optimization-p1-troubleshooting-design.md`

---

## Task 1：建立官方技术事实基线

**文件：**

- 读取：`docs/superpowers/specs/2026-07-04-traffic-optimization-p1-troubleshooting-design.md`
- 读取：`guide/frequent-disconnections/index.html`
- 读取：`guide/index.html`
- 读取：相关客户端教程
- 不新增事实数据文件

**步骤：**

1. 从 Mihomo 官方全局配置文档确认运行模式、日志和 IPv6 等概念边界。
2. 从 Mihomo 官方 TUN 文档确认 TUN、自动路由、接口检测和 DNS 劫持各自职责。
3. 从 Clash Verge Rev 官方文档或官方仓库确认系统代理、TUN、订阅、配置校验和日志界面中的客户端特有行为。
4. 从 Windows 和 macOS 官方资料确认恢复系统代理的安全入口；只描述图形界面路径，不引入危险脚本。
5. 将第三方搜索结果仅用于整理用户措辞，不引用其中关闭 DNS、删除目录、关闭安全软件等万能修复建议。
6. 记录每条正文技术结论的来源归属；无法由官方来源支持的内容删去或改成观察建议。

## Task 2：复核现有结构、样式与测试基线

**文件：**

- 读取：`css/main.css`
- 读取：`guide/frequent-disconnections/index.html`
- 读取：`guide/node-speed-differences/index.html`
- 读取：`guide/avoid-traps/index.html`
- 读取：`tests/site-audit.test.mjs`

**步骤：**

1. 运行 `node --test tests/site-audit.test.mjs`，记录修改前零失败、零跳过基线。
2. 确认现有文章外壳、编辑信息、提示框、来源区和响应式表格中可直接复用的 class。
3. 确认诊断流程和错误对照表是否需要最小共享样式；默认优先使用现有样式。
4. 检查 `guide/index.html` 的 canonical 错误和当前卡片顺序，但此 Task 不修改文件。
5. 检查本批之外文件的工作区状态，保证 `AGENTS.md`、教程正文、导航和机场页不进入 diff。

## Task 3：订阅更新失败页审计（RED 1）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 为 `guide/subscription-update-failed/index.html` 增加存在性和 Sitemap 覆盖断言。
2. 锁定独立 title、description、canonical、Article、BreadcrumbList 和 FAQPage。
3. 要求页面区分下载失败、授权错误、解析错误、配置校验错误和更新后无节点。
4. 要求出现 401、403、timeout/network error、parse/config validation 等错误映射，但不把某一错误绑定成唯一根因。
5. 要求排查顺序包含账号/链接、网络、客户端兼容、日志和商家工单。
6. 要求日志脱敏提示至少覆盖订阅 URL、令牌、账号和节点地址。
7. 禁止第三方订阅转换站推荐、真实订阅示例和确定性“万能修复”。
8. 运行完整审计，确认新增意图测试因页面缺失按预期失败，原有 27 项保持通过。

## Task 4：实现订阅更新失败页（GREEN 1）

**文件：**

- 新增：`guide/subscription-update-failed/index.html`
- 修改：`sitemap.xml`
- 可选修改：`css/main.css`

**步骤：**

1. 复用现有站点外壳、导航、页尾和 Giscus，创建纯静态页面。
2. 按“症状判断 → 两分钟检查 → 错误对照 → 深入排查 → 停止条件 → FAQ → 来源 → 相关教程”组织正文。
3. 401/403 只引导检查账号、授权和商家后台链接；timeout 只说明网络不可达是一种可能；解析错误引导检查客户端兼容和商家输出格式。
4. 不展示订阅 URL 格式细节，不提供第三方转换服务。
5. 加入 Mihomo 与 Clash Verge Rev 官方来源，明确客户端界面名称可能不同。
6. 只把新路径加入 Sitemap 并使用实际修改日期。
7. 如新增共享 CSS，限制为诊断流程和错误表格所需的最小 class，并确认不影响机场套餐表。
8. 运行完整审计，确认 RED 1 转绿且其他测试保持通过。

## Task 5：已连接但无法上网页审计（RED 2）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 为 `guide/connected-but-no-internet/index.html` 增加存在性和 Sitemap 覆盖断言。
2. 锁定独立 title、description、canonical 和三类 JSON-LD。
3. 要求页面明确“延迟测试成功不等于应用流量已经经过代理”。
4. 要求按节点、系统代理/TUN、规则、DNS、应用绕过和软件冲突分层排查。
5. 要求包含安全恢复系统代理的顺序和普通网络恢复检查。
6. 要求对 TUN 与系统代理使用职责描述，不强制同时开启，不给出通用 YAML。
7. 禁止“关闭防火墙”“关闭 DNS”“重装系统”“清空所有配置”等危险捷径。
8. 运行完整审计，确认新增测试按预期失败，订阅页和既有内容保持通过。

## Task 6：实现已连接但无法上网页（GREEN 2）

**文件：**

- 新增：`guide/connected-but-no-internet/index.html`
- 修改：`sitemap.xml`
- 可选修改：`css/main.css`

**步骤：**

1. 使用与订阅页相同的诊断语义结构和视觉语言，不复制其错误说明段落。
2. 先验证节点和流量接管，再检查规则与 DNS，最后检查单个应用和软件冲突。
3. 对系统代理和 TUN 的适用范围使用官方资料归因，强调不同客户端入口名称可能不同。
4. 提供可逆恢复步骤：关闭客户端接管、恢复系统代理、确认普通网络、再选择一种接管方式测试。
5. 日志只要求读取失败时间附近的错误，并提醒脱敏。
6. 加入官方来源和现有 Clash Verge、Android、FlClash 教程内链。
7. 只更新新路径 Sitemap 日期；运行完整审计确认 RED 2 转绿。

## Task 7：故障分流入口审计（RED 3）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 锁定 `guide/frequent-disconnections/index.html` 的新标题、更新时间和统一诊断结构。
2. 要求入口覆盖六个症状分支：订阅为空、延迟正常但无网、少数节点失败、全部节点超时、部分应用失败、退出后仍断网。
3. 要求入口链接两篇新症状页、节点速度差异页和相关客户端教程。
4. 要求删除现有“暂时关闭杀毒软件/防火墙”“换协议即可”等宽泛危险建议。
5. 要求加入安全恢复、日志脱敏、停止自行修改和官方来源。
6. 要求 FAQ 可见且与 FAQPage JSON-LD 一致。
7. 运行完整审计，确认新断言按预期失败，两个新页面保持通过。

## Task 8：重构故障分流入口（GREEN 3）

**文件：**

- 修改：`guide/frequent-disconnections/index.html`

**步骤：**

1. 保留 URL、站点外壳、Giscus 和真实 `datePublished`，更新实际 `dateModified`。
2. 把五个通用原因改成按可见症状分流的诊断入口。
3. 每个分支只给一个首要安全动作和一个下一步链接，不复制详情页完整内容。
4. 全部节点超时时要求对比节点、设备和网络后再判断；不得直接归因商家或本地网络。
5. 退出后仍断网时优先恢复系统代理，不建议继续叠加 TUN、浏览器扩展或其他 VPN。
6. 收紧 title、description、Article 与 FAQ，加入官方来源和相关教程。
7. 运行完整审计，确认 RED 3 转绿。

## Task 9：聚合页、跨页内链与 SEO 审计（RED 4）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 要求 `guide/index.html` canonical 为 `https://www.jichangyun.top/guide/`。
2. 要求聚合页包含三张故障内容卡片，摘要和标签分别对应三个搜索意图。
3. 要求三页 title、description 和 H1 不相同，并各自包含目标症状词。
4. 要求三页互链，同时链接节点速度差异和当前维护的客户端教程。
5. Clash for Windows 只能标为遗留客户端参考，不得继续推荐安装。
6. 要求危险短语扫描覆盖三页可见正文和结构化数据。
7. 运行完整审计，确认新增聚合与跨页断言按预期失败。

## Task 10：完成聚合页和跨页整合（GREEN 4）

**文件：**

- 修改：`guide/index.html`
- 修改：三个故障排查页
- 修改：`sitemap.xml`

**步骤：**

1. 修正 guide canonical，按即时问题优先排列三张故障内容卡片。
2. 更新断线入口卡片摘要和日期，增加两个新页面卡片。
3. 完成三页互链和客户端教程链接，避免重复大段说明。
4. 更新 `/guide/`、入口页和两个新页面的真实 Sitemap 日期，不改无关页面日期。
5. 运行完整审计和 `git diff --check`，确认 RED 4 转绿。

## Task 11：内容、证据与结构化数据复核

**文件：**

- 检查：三个故障排查页
- 检查：`guide/index.html`
- 检查：`sitemap.xml`
- 检查：`tests/site-audit.test.mjs`

**步骤：**

1. 逐项对照设计文档，确认三个搜索意图没有互相吞并。
2. 检查技术结论附近存在官方来源或清楚的客户端限定。
3. 用 `rg` 扫描关闭安全功能、万能修复、删除全部配置、真实凭据示例和确定性承诺。
4. 解析全部新增或修改页面的 JSON-LD，确认 Article、BreadcrumbList、FAQPage 合法且与可见正文一致。
5. 检查新页面 canonical、guide canonical、内链和 Sitemap 路径一致。
6. 检查没有修改 `AGENTS.md`、教程正文、导航脚本、机场页或部署配置。

## Task 12：全量自动验证

**步骤：**

1. 运行 `node --test tests/site-audit.test.mjs`，要求零失败、零跳过。
2. 运行 `git diff --check`，要求无空白错误。
3. 查看 `git diff --name-only` 和 `git status --short`，确认仅包含计划内文件。
4. 检查 sitemap 全覆盖、根路径链接和商业链接审计继续通过。
5. 任何测试失败或跳过时不得进入浏览器验收或提交。

## Task 13：桌面与移动端浏览器验证

**步骤：**

1. 使用 `python3 -m http.server 8080` 启动本地站点。
2. 检查 guide 聚合页和三个故障排查页的区块顺序、链接、FAQ、来源和页尾。
3. 在桌面视口验证诊断流程与错误对照表可读，链接目标正确。
4. 在 390×844 验证卡片折叠、表格局部滚动、顶部导航和相关链接可操作。
5. 确认整页无横向溢出，控制台没有本批引入错误。
6. 记录已知 favicon 404 为 P2，不将其误报为本批回归。

## Task 14：提交实现

**步骤：**

1. 对照设计、计划和最终 diff 复核实际完成范围。
2. 重新运行 Task 12 的完整验证并读取全部结果。
3. 只暂存计划内文件，创建一个 P1 故障排查内容提交。
4. 提交信息不得暗示客户端教程或 P2 项目已经完成。
5. 不推送、不部署；除非用户另行明确要求。
