# 购买避坑页证据化改版实施计划

**目标：** 将购买避坑页改为可核对、可回退、无承诺式判断的购买前检查清单。

**设计依据：** `docs/superpowers/specs/2026-07-07-avoid-traps-evidence-refresh-design.md`

## Task 1：审计测试先行

1. 新增测试要求 `avoid-traps` HTML 与 Markdown 均包含购买前核对、短周期自查、公开信息边界。
2. 禁止“避开90%”“稳定可靠”“不跑路”“唯一可靠”“优秀阈值”“20-50 元合理”等旧口径。
3. 要求结构化数据作者、日期、社交图和 FAQ 同步。
4. 要求 guide hub 避坑卡与 sitemap 日期同步。
5. 运行目标测试，观察预期失败。

## Task 2：改版页面与 Markdown

1. 更新 head 元数据、Article JSON-LD、FAQ JSON-LD。
2. 重写正文为购买前核对清单与短周期自查步骤。
3. 同步 Markdown 源文案。
4. 更新 guide hub 卡片文案。
5. 更新 sitemap 日期。

## Task 3：验证与提交

1. 跑目标测试，确认红转绿。
2. 跑全量 `node --test tests/site-audit.test.mjs`。
3. 跑 `node --check js/nav.js` 与 `git diff --check`。
4. 浏览器查看桌面与 390px 移动端。
5. 创建本地提交并合并回本地 `main`；不推送。
