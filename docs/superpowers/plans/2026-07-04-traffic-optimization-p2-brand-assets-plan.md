# 网站流量优化 P2：品牌资源与社交分享元数据实施计划

**目标：** 修复根目录 favicon 404，创建 1200×630 默认社交分享图，并让首页、机场推荐、教程、百科四个入口页使用完整一致的 Open Graph 与 Twitter 图片元数据。

**架构：** 从现有 `logo.svg` 品牌图形派生静态资源；生成过程不进入线上构建链；四个纯静态 HTML 入口只修改 head 元数据；Node 审计读取图片头与页面标签验证意图。

**设计依据：** `docs/superpowers/specs/2026-07-04-traffic-optimization-p2-brand-assets-design.md`

---

## Task 1：确认资产与工具基线

1. 通读 `img/logo.svg`，确认节点标记的颜色与几何结构。
2. 检查本地可用的 SVG→PNG 与 PNG→ICO 工具，不下载运行时依赖。
3. 运行现有全量 Node 审计，记录零失败、零跳过基线。
4. 检查四个入口页当前 favicon、Open Graph 与 Twitter 图片元数据。

## Task 2：资源审计（RED 1）

**修改：** `tests/site-audit.test.mjs`

1. 要求根目录 `favicon.ico` 存在、非空并具有 ICO 文件头。
2. 要求 `img/social-share-1200x630.png` 存在且 PNG IHDR 尺寸为 1200×630。
3. 要求分享图不是现有 300×300 图片的复制品。
4. 运行全量审计，确认新增测试因资源缺失按预期失败。

## Task 3：生成品牌资源（GREEN 1）

**新增：** `favicon.ico`、`img/social-share-1200x630.svg`、`img/social-share-1200x630.png`

1. 用现有 Logo 图形和品牌色创建可复现 SVG 源。
2. 分享图使用暖米色背景、节点标记、主标题与三项副标题，不添加营销承诺。
3. 将 SVG 渲染为 1200×630 PNG。
4. 从品牌标记生成透明 favicon.ico。
5. 运行资源测试，确认 RED 1 转绿。

## Task 4：核心入口元数据审计（RED 2）

**修改：** `tests/site-audit.test.mjs`

1. 锁定首页、`/jichang/`、`/tutorial/`、`/guide/` 四页。
2. 要求 favicon、横向 `og:image`、1200×630 宽高、页面语境 alt、`twitter:image` 与 alt。
3. 要求四页不再把 `clash-300x300.png` 用作社交图片。
4. 运行全量审计，确认元数据测试按预期失败。

## Task 5：更新四个入口页（GREEN 2）

**修改：** `index.html`、`jichang/index.html`、`tutorial/index.html`、`guide/index.html`

1. 只修改 head 中与 favicon、Open Graph、Twitter 图片相关的标签。
2. 四页使用同一资源，alt 分别对应首页、机场推荐、教程和百科语境。
3. 保留各页现有 title、description、canonical 和正文。
4. 运行全量审计，确认 RED 2 转绿。

## Task 6：内容与文件复核

1. 验证 PNG 和 ICO 文件头、尺寸与非空状态。
2. 检查四页资源 URL、宽高、alt 和 card 类型一致。
3. 检查本批之外页面没有被批量迁移。
4. 运行 `git diff --check` 并核对文件范围。

## Task 7：浏览器验收

1. 启动本地静态服务器。
2. 验证 `/favicon.ico` 和分享图返回 200。
3. 在浏览器读取四页 head 元数据，确认一致且无重复冲突标签。
4. 查看 1200×630 原图，确认文字清晰、图形无裁切。
5. 检查控制台不再出现 favicon 404；记录与本批无关的第三方 warning。

## Task 8：提交实现

1. 重新运行全量 Node 审计与 `git diff --check`。
2. 只暂存计划内文件并创建一个 P2 品牌资源提交。
3. 不推送、不部署，除非用户另行明确要求。
