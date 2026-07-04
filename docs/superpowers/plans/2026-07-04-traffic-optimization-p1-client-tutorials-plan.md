# 网站流量优化 P1：客户端教程更新实施计划

**目标：** 更新 Clash Verge Rev、FlClash 和 Clash Meta for Android 三篇活跃客户端教程，建立官方版本证据、平台选择、最短配置路径与故障分流，并让教程聚合页明确区分当前维护、历史客户端和通用教程。

**架构：** 继续使用纯静态 HTML、现有导航、Giscus 和 `css/main.css` 变量；三篇教程共享编辑型信息结构但保留平台差异；官方 GitHub 仓库与 Releases 负责版本和平台事实，Node 审计锁定来源、版本日期、安全边界、SEO 和内链。

**实施策略：** 按“证据基线 → 共享教程契约 → Clash Verge Rev → FlClash → Clash Meta for Android → 教程聚合页 → 全量验证”的顺序逐页 RED/GREEN。每完成一页都运行全量审计，不一次批量重写三页。

**技术栈：** HTML5、现有 CSS3、原生 JavaScript 导航、Node.js 内置测试模块、Cloudflare Pages。

**设计依据：** `docs/superpowers/specs/2026-07-04-traffic-optimization-p1-client-tutorials-design.md`

---

## Task 1：复核官方版本与平台证据

**文件：**

- 读取：设计文档
- 读取：三款客户端官方仓库与 Releases
- 不新增版本数据文件

**步骤：**

1. 重新打开 Clash Verge Rev 官方 latest Release，确认 v2.5.1、Windows/macOS/Linux 资产和 Windows 7 支持说明仍与设计基线一致。
2. 重新打开 FlClash 官方 latest Release，确认 v0.8.93 与 Windows/macOS/Linux/Android 平台范围。
3. 重新打开 Clash Meta for Android 官方仓库或 latest Release，确认 v2.11.30 与官方 APK 资产说明。
4. 从 Mihomo 官方文档复核规则模式、系统代理和 TUN 的职责边界；只把可归因事实写入正文。
5. 若官方版本在实施前已变化，显式更新设计基线、测试期望和页面核验版本，不融合旧新版本。
6. 不使用第三方下载站、镜像站或聚合教程证明维护状态与版本。

## Task 2：检查页面、样式与测试基线

**文件：**

- 读取：`tutorial/clash-verge/index.html`
- 读取：`tutorial/flclash/index.html`
- 读取：`tutorial/clash-meta-for-android/index.html`
- 读取：`tutorial/index.html`
- 读取：`css/main.css`
- 读取：`tests/site-audit.test.mjs`

**步骤：**

1. 运行 `node --test tests/site-audit.test.mjs`，记录修改前零失败、零跳过基线。
2. 通读每个页面 head、正文、JSON-LD、外链、Giscus 和相关教程，确认现有接口与重复结构。
3. 搜索旧版本号、`github.clash.download`、安全断言和固定资产直链。
4. 确认故障排查三页和教程聚合页当前路径可解析。
5. 确认 `css/main.css` 中评测、故障排查和响应式表格样式哪些可复用。
6. 检查工作区状态，保证历史客户端正文、导航、机场页和部署配置不进入本批 diff。

## Task 3：建立三篇教程的共享审计契约（RED 1）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 定义三篇活跃教程的路径、正式名称、核验版本、官方来源和平台期望。
2. 要求每页包含统一结构 class：编辑核验信息、适用判断、版本平台表、官方下载、快速配置、安全提示、故障分流、官方来源和相关教程。
3. 要求作者为“优质机场推荐编辑部”，可见核验日期与 Article `dateModified` 一致。
4. 要求每页包含 Article、BreadcrumbList、FAQPage，且 JSON-LD 可解析。
5. 要求三个故障入口完整，所有站内链接能解析到文件。
6. 禁止 `github.clash.download`、旧版本号、固定旧资产直链和“安全的”“最受欢迎”“最好用”“完全兼容”等表述。
7. 禁止关闭防火墙、杀毒软件、系统安全保护或绕过安全警告的建议。
8. 运行全量审计，确认新增共享契约因现有页面结构不足而失败，既有 31 项保持通过。

## Task 4：添加最小共享教程样式（GREEN 1A）

**文件：**

- 修改：`css/main.css`

**步骤：**

1. 只添加三篇教程实际需要的共享 class，不修改既有导航、机场评测或故障排查样式语义。
2. 复用暖色变量实现核验信息、适用判断、平台表、配置步骤、安全提示、来源与相关教程。
3. 平台表使用容器局部滚动，设置合理最小宽度，不让整个页面横向溢出。
4. 下载按钮和长项目名在窄屏允许换行，不固定像素宽度。
5. 本 Task 不为了让测试整体转绿而提前改三篇正文；共享结构测试可以继续失败。

## Task 5：Clash Verge Rev 页面审计（RED 2）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 锁定正式名称“Clash Verge Rev”、独立 title、description、canonical 和 H1。
2. 要求出现“截至 2026-07-04 核验：v2.5.1”，不得写成无日期的永久“最新版”。
3. 要求平台表覆盖 Windows x64/ARM64、macOS Apple 芯片/Intel 芯片与 Linux 常见包格式。
4. 要求按官方 Release 说明表述 Windows 7 不再支持，不推导其他系统兼容性。
5. 要求下载主入口指向 `clash-verge-rev/clash-verge-rev/releases/latest`，外链包含 `nofollow noopener` 且不含 `sponsored`。
6. 要求配置路径覆盖导入订阅、选择节点、系统代理和 TUN 的边界。
7. 运行全量审计，确认 Verge 专项测试按预期失败。

## Task 6：重构 Clash Verge Rev 页面（GREEN 2）

**文件：**

- 修改：`tutorial/clash-verge/index.html`
- 修改：`sitemap.xml`

**步骤：**

1. 保留 URL、站点外壳、导航、页尾和 Giscus，删除页面内可被共享 CSS 替代的重复样式。
2. 按统一结构重写正文，使用正式项目名与核验日期。
3. 删除 v2.4.7 固定资产直链和第三方镜像按钮，官方下载指向 official latest Release。
4. 平台表只告诉用户如何选系统、架构和包格式，不复制完整资产列表。
5. 将系统代理和 TUN 作为不同接管方式解释，不要求同时开启。
6. 加入安全提示、三个故障入口、FAQ、官方来源和相关教程。
7. 更新 Article/BreadcrumbList/FAQPage 与实际 Sitemap 日期。
8. 运行全量审计，确认 Verge 专项与共享契约中该页部分转绿。

## Task 7：FlClash 页面审计（RED 3）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 锁定 FlClash 独立 title、description、canonical、H1 和 v0.8.93 核验基线。
2. 要求平台范围覆盖 Windows、macOS、Linux 和 Android。
3. 要求正文明确不同平台的系统权限、界面入口与安装包并不完全相同。
4. 要求下载入口只指向 `chen08209/FlClash/releases/latest`，删除 v0.8.92 和镜像域名。
5. 要求配置路径覆盖订阅导入、节点选择、系统代理或 VPN 接管。
6. 要求与 Clash Verge Rev、Android 教程及三个故障页形成相关内链。
7. 运行全量审计，确认 FlClash 专项测试按预期失败，Verge 保持通过。

## Task 8：重构 FlClash 页面（GREEN 3）

**文件：**

- 修改：`tutorial/flclash/index.html`
- 修改：`sitemap.xml`

**步骤：**

1. 复用统一教程结构与共享 CSS，不复制 Verge 的桌面专属说明。
2. 删除 v0.8.92 固定资产直链和第三方镜像按钮。
3. 以官方 latest Release 为下载入口，正文记录 v0.8.93 与核验日期。
4. 使用平台选择表说明 Windows、macOS、Linux 和 Android 的差异，不承诺跨平台体验一致。
5. 提供最短配置路径、安全与隐私提示、故障分流、FAQ 和官方来源。
6. 更新结构化数据和实际 Sitemap 日期。
7. 运行全量审计，确认 FlClash 专项与共享契约中该页部分转绿。

## Task 9：Clash Meta for Android 页面审计（RED 4）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 锁定正式项目名、独立元数据、H1 与 v2.11.30 核验基线。
2. 要求解释 Android APK 架构选择，不猜测某设备必然使用特定 ABI。
3. 要求安装路径包含来自官方 Release、Android VPN 权限和系统后台限制。
4. 要求把 VPN 权限提示描述为正常的系统授权流程，而不是安全保证或故障。
5. 要求下载入口指向 MetaCubeX 官方仓库或 official latest Release，删除 v2.11.24 和镜像域名。
6. 要求故障分流和日志脱敏边界完整。
7. 运行全量审计，确认 Android 专项测试按预期失败，前两页保持通过。

## Task 10：重构 Clash Meta for Android 页面（GREEN 4）

**文件：**

- 修改：`tutorial/clash-meta-for-android/index.html`
- 修改：`sitemap.xml`

**步骤：**

1. 复用统一结构，但使用 Android 专属的平台选择、VPN 权限和后台限制说明。
2. 删除 v2.11.24 固定 APK 直链和第三方镜像按钮。
3. 记录 v2.11.30 与核验日期，下载入口只指向官方页面。
4. 不指导用户绕过来源警告、关闭系统保护或盲目安装不匹配架构。
5. 提供订阅导入、节点选择、VPN 启用、安全提示、FAQ、来源和相关教程。
6. 更新结构化数据与实际 Sitemap 日期。
7. 运行全量审计，确认三篇共享契约和 Android 专项全部转绿。

## Task 11：教程聚合页分组审计（RED 5）

**文件：**

- 修改：`tests/site-audit.test.mjs`

**步骤：**

1. 要求 `tutorial/index.html` 存在“当前维护客户端”“历史客户端”“通用教程”三个可识别分组。
2. 要求三款活跃客户端只出现在当前维护组，并显示平台和核验日期或维护状态。
3. 要求 Clash for Windows、Clash for Android 不出现在当前维护组，历史组明确其停止维护定位。
4. 要求三个活跃教程卡片链接、标题与摘要差异化。
5. 要求聚合页不把“开源”写成安全保证，也不继续推荐第三方镜像。
6. 要求 `/tutorial/` Sitemap 日期仅在聚合页实际修改后更新。
7. 运行全量审计，确认聚合页分组测试按预期失败。

## Task 12：重构教程聚合页（GREEN 5）

**文件：**

- 修改：`tutorial/index.html`
- 修改：`sitemap.xml`

**步骤：**

1. 保留现有 URL、页面外壳和非客户端教程卡片。
2. 按当前维护、历史客户端和通用教程重新组织卡片，不删除历史页面入口。
3. 当前维护组优先展示 Clash Verge Rev、FlClash、Clash Meta for Android。
4. 历史组对 Clash for Windows、Clash for Android 使用事实性的停止维护提示和迁移入口，不在本批改其正文。
5. 保留 macOS、iOS 和浏览器相关入口，但不把未核验项目标成当前首选。
6. 更新聚合页元数据中与当前结构冲突的描述及实际 Sitemap 日期。
7. 运行全量审计，确认 RED 5 转绿。

## Task 13：内容、证据与 SEO 复核

**文件：**

- 检查：三篇活跃客户端教程
- 检查：`tutorial/index.html`
- 检查：`css/main.css`
- 检查：`sitemap.xml`
- 检查：`tests/site-audit.test.mjs`

**步骤：**

1. 逐项对照设计文档，确认三页定位、平台和步骤没有被模板抹平。
2. 检查每个版本与支持平台陈述附近存在官方来源或明确核验语境。
3. 用 `rg` 扫描旧版本、镜像域名、安全绝对化、关闭安全功能和真实订阅凭据。
4. 解析所有修改页面 JSON-LD，确认 Article、BreadcrumbList、FAQPage 与可见正文一致。
5. 检查 title、description、canonical、H1、Open Graph 与 Sitemap 自洽。
6. 检查外部官方链接 `rel`，商业 CTA 规则不因本批教程修改而回归。
7. 确认历史客户端正文、导航、机场页、故障页和部署文件未被修改。

## Task 14：全量自动验证

**步骤：**

1. 运行 `node --test tests/site-audit.test.mjs`，要求零失败、零跳过。
2. 运行 `git diff --check`，要求无空白错误。
3. 查看 `git diff --name-only` 和 `git status --short`，确认仅包含计划文件。
4. 确认 Sitemap 全覆盖、根路径链接、商业链接与故障内容审计继续通过。
5. 任何测试失败或跳过时不得进入浏览器验收或提交。

## Task 15：桌面与移动端浏览器验证

**步骤：**

1. 使用可用端口启动 `python3 -m http.server`，确认服务根目录为当前 worktree。
2. 在桌面视口检查教程聚合页和三篇教程的信息层级、平台表、下载入口、FAQ、来源与页尾。
3. 在 390×844 检查长项目名、版本表、按钮和步骤不裁切。
4. 用脚本读取 `innerWidth` 与文档 `scrollWidth`，要求整页无横向溢出；平台表只在自身容器内滚动。
5. 抽查三个官方 Releases 入口和三个故障入口指向正确目标。
6. 检查控制台没有本批引入错误；favicon 404 继续记录为 P2，不误报为本批回归。

## Task 16：提交实现

**步骤：**

1. 对照设计、计划与最终 diff 复核实际完成范围。
2. 重新运行 Task 14 的完整验证并读取全部结果。
3. 只暂存计划内文件，创建一个 P1 客户端教程更新提交。
4. 提交信息不得暗示历史客户端重写、P2、推送或部署已经完成。
5. 不推送、不部署；除非用户另行明确要求。
