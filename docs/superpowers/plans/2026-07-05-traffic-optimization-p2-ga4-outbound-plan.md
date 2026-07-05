# 网站流量优化 P2：GA4 外链点击统计实施计划

**目标：** 用共享脚本采集隐私最小化的 GA4 外链事件，补齐 4 个关键教程页的 GA4 初始化，并记录管理端必要配置。

**设计依据：** `docs/superpowers/specs/2026-07-05-traffic-optimization-p2-ga4-outbound-design.md`

---

## Task 1：建立真实行为测试（RED）

**修改：** `tests/site-audit.test.mjs`

1. 使用 Node `vm` 执行真实 `js/nav.js`，用最小 DOM 桩捕获点击监听器。
2. 验证 `sponsored`、`official`、`external` 的分类和商业优先级。
3. 严格验证事件仅含 `link_domain`、`link_type`、`page_path`。
4. 验证目标路径、查询参数、片段、推广码和链接文字不进入事件。
5. 验证站内地址、非 HTTP(S)、无效 href 与不支持 `closest()` 的目标被忽略。
6. 验证 `gtag` 缺失不抛错，且处理器不调用 `preventDefault()`。
7. 验证 4 个关键教程页加载统一测量 ID。
8. 运行新增测试，确认因实现缺失而正确失败。

## Task 2：实现共享外链统计（GREEN）

**修改：** `js/nav.js`

1. 增加独立外链统计区块，不改导航渲染函数。
2. 注册一个 document 级 `click` 监听器。
3. 解析并过滤非 HTTP(S) 与站内地址。
4. 按固定优先级计算链接类型。
5. 只发送三个允许参数，不阻止或延迟导航。
6. 运行行为测试直至通过，再运行全量 Node 审计。

## Task 3：补齐关键教程页 GA4 初始化

**修改：**

- `tutorial/index.html`
- `tutorial/clash-verge/index.html`
- `tutorial/flclash/index.html`
- `tutorial/clash-meta-for-android/index.html`

1. 复制仓库现有 GA4 初始化片段，保持测量 ID `G-HPYY57ECEX`。
2. 不调整其他 head 元数据、正文或脚本顺序。
3. 运行集成审计，确认 4 页均接入且 ID 不分叉。

## Task 4：新增 GA4 管理端说明

**新增：** `docs/ga4-outbound-tracking.md`

1. 说明部署前必须关闭增强型衡量中的自动出站点击。
2. 记录 `outbound_link` 与三个允许参数。
3. 记录 DebugView / 实时报告验证步骤及失败判据。
4. 明确仓库实现不代表 GA4 账户已配置，不宣称生产隐私边界已完成。
5. 链接 Google 官方文档，不引入第三方推断。

## Task 5：浏览器与仓库验证

1. 运行全量 Node 审计，要求零失败、零跳过。
2. 运行 `git diff --check`。
3. 启动本地静态服务器。
4. 浏览器验证商业 CTA、官方资料、普通外链和站内链接。
5. 通过注入本地 `gtag` spy 确认事件内容和导航行为，无控制台错误。
6. 检查工作区只包含计划内文件。

## Task 6：提交实现

1. 重新读取设计与完整验证输出。
2. 只暂存计划内文件。
3. 创建一个 P2 GA4 外链统计实现提交。
4. 不推送、不部署，不代替用户操作 GA4 管理端。
