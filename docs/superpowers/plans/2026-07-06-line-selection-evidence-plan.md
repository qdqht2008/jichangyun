# 线路选择教程证据化重构实施计划

**目标：** 将旧版线路等级推荐页重构为可追溯、无商家推广和无性能保证的线路核验指南。

**设计依据：** `docs/superpowers/specs/2026-07-06-line-selection-evidence-design.md`

---

## Task 1：复核页面、公共组件与来源

1. 通读 `tutorial/line-selection/index.html` 的 head、正文、内联样式、评论和脚本。
2. 对照维护中教程与故障指南的 `tutorial-meta`、表格、风险、来源和相关链接结构。
3. 核对 Cloudflare、APNIC、中国联通国际三项官方资料的使用边界。
4. 运行全量 Node 审计并记录基线。

## Task 2：统一结构与来源测试（RED 1）

**修改：** `tests/site-audit.test.mjs`

1. 要求编辑信息、三段模型、标签对照、选择清单、自查方法、风险、来源、FAQ 和相关内容。
2. 要求编辑部作者、2026-07-06 日期和统一证据边界。
3. 锁定三个官方来源 URL 及外链关系。
4. 运行目标测试并观察结构缺失的失败。

## Task 3：线路标签边界测试（RED 2）

**修改：** `tests/site-audit.test.mjs`

1. 锁定本地与接入段、运营商与跨网段、落地与目标段。
2. 锁定直连、公网中转、IEPL/IPLC 的购买前确认项与不能推断项。
3. 要求页面说明三段模型是简化框架，真实路径可能跨自治系统且去回程不同。
4. 要求商家标签不能证明用户全链路。
5. 运行目标测试并观察预期失败。

## Task 4：旧结论清理与 Sitemap 测试（RED 3）

**修改：** `tests/site-audit.test.mjs`

1. 禁止价格区间、延迟范围、稳定性/封锁风险等级和固定人群标签。
2. 禁止肥猫云、宇宙云、极连云、折扣码、商家推荐卡片和旧促销图片。
3. 要求 Article/FAQ、社交图和 favicon 使用当前标准。
4. 要求 Sitemap 仅更新线路选择页为 2026-07-06。
5. 运行目标测试并观察预期失败。

## Task 5：重构 head 与结构化数据（GREEN 1）

**修改：** `tutorial/line-selection/index.html`

1. 收紧 title、description、Open Graph 与 Twitter。
2. 更新 Article 作者、日期和分享图。
3. 保留 Breadcrumb，新增只回答证据边界的 FAQPage。
4. 删除旧 Organization 重复块和过时社交图引用。

## Task 6：重构正文与最小样式（GREEN 2–3）

**修改：** `tutorial/line-selection/index.html`

1. 使用 `tutorial-meta` 和编辑结论开场。
2. 保留并简化三段链路图，明确它不是实测路径。
3. 建立标签核验表、选择问题、自查步骤和风险区。
4. 添加官方来源、FAQ 与相关内容。
5. 删除商家卡片、价格标签、总结等级和相关内联 CSS。
6. 优先复用公共组件，只保留三段图必需的页面内样式。
7. 逐组运行目标测试直至通过。

## Task 7：同步 Sitemap

**修改：** `sitemap.xml`

1. 只把 `/tutorial/line-selection/` 的 `lastmod` 更新为 2026-07-06。
2. 保持教程汇总页和其他页面日期不变。
3. 运行 Sitemap 与全量审计。

## Task 8：自动与浏览器验证

1. 运行 `node --test tests/site-audit.test.mjs`，要求零失败、零跳过。
2. 运行 `node --check js/nav.js` 与 `git diff --check`。
3. 关键词检查旧商家、折扣、性能数字与保证措辞已退出。
4. 在桌面和 390×844 检查三段图、表格、清单、来源、FAQ 与相关链接。
5. 确认表格仅在容器内滚动、页面无整体横向溢出、控制台无本地资源错误。

## Task 9：提交实现

1. 对照设计逐项检查范围。
2. 重新运行完整验证并读取输出。
3. 只暂存线路选择页、Sitemap、测试和本计划。
4. 创建本地实现提交；不推送、不部署。
