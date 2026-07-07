# 网站流量优化 P3：问题导向分发素材包实施计划

**目标：** 基于三篇现有指南生成可人工发布的社区短文和 60 秒视频脚本，不传播旧结论或商业推广。

**设计依据：** `docs/superpowers/specs/2026-07-07-p3-problem-led-distribution-kit-design.md`

## Task 1：复核来源与冲突

1. 复核 `subscription-update-failed`、`connected-but-no-internet`、`line-selection` 三张落地页。
2. 确认旧 `codex/p3-distribution-kit` 分支不能直接合并，因为它基于旧线路选择页，会与当前证据化改版冲突。
3. 选择从当前 HEAD 新建同步分支，仅移植 P3 素材包本身。

## Task 2：先写审计测试

1. 要求 `docs/distribution/2026-07-problem-led-launch-kit.md` 存在。
2. 要求三组活动及固定素材结构。
3. 锁定三个正式 HTTPS 落地页，并确认本地页面存在。
4. 锁定故障排查的可逆动作、线路页的三段核验口径、UTM 字段和发布检查表。
5. 禁止旧线路性能结论、商家推荐、套餐价格、推广参数和无证据性能数字。
6. 运行目标测试，确认因素材包缺失而失败。

## Task 3：生成素材包

1. 为三组活动各写标题、社区短文、视频分镜、短摘要、主链接和 UTM 示例。
2. 保持先提供可执行步骤，再放单一相关链接。
3. 线路内容使用“本地与接入段、运营商与跨网段、落地与目标段”的新版表述。
4. 添加统一内容边界和发布前检查表。
5. 运行目标测试直至通过。

## Task 4：全量验证与提交

1. 运行 `node --test tests/site-audit.test.mjs`。
2. 运行 `node --check js/nav.js`。
3. 运行 `git diff --check`。
4. 检查 diff 仅包含素材包、审计测试和本轮设计/计划记录。
5. 创建本地提交；不推送、不发布、不部署。
