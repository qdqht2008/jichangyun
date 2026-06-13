# 美区 Apple ID 注册教程 加入使用教程板块 设计方案

## 1. 概述与目标

将一篇来自 gate-rank.com 的"中国大陆用户注册美区 Apple ID"教程，经改写后纳入本站 `/tutorial/` 使用教程板块，作为面向 VPN/海外应用用户的实用教程。

**核心目标：**
- 为已订阅机场、需要下载 ChatGPT/Claude/Perplexity 等海外 App 的用户提供完整美区 Apple ID 注册指南
- 填补 `/tutorial/` 中"非 Clash 客户端类"教程空白（首篇账号/订阅类教程）
- 通过站内互链把"账号注册"流量导向机场推荐（`/jichang/`）

**不做的事：**
- 不在 `/guide/`（机场百科）下创建——该板块当前定位为 VPN/机场话题
- 不复制原站竞品推广链接（jichang.best / elphantroute / nowjiasu / xlw.app）
- 不修改顶部导航 `NAV_ITEMS`
- 不在首页（`index.html`）添加入口

## 2. 内容来源与改写规则

### 2.1 来源

- 原文：`https://gate-rank.com/news/china-user-us-apple-id-guide`
- 原文标题：`中国大陆用户注册美区 Apple ID 教程与避坑指南（2026 最新版）`
- 原文作者署名：GateRank 编辑部（不继承）

### 2.2 改写规则

| 维度 | 处理方式 |
|------|---------|
| 事实内容（注册步骤、地址示例、付款方式、避坑要点、FAQ） | 保留，按本站语气改写 |
| 原文文末竞品推广（大象网络 / Now加速 / 瞬云 / 山水云 / 仙路湾） | **删除**，替换为站内 `notice-highlight` + 链接到 `/jichang/` |
| 文中 affiliate 链接（jichang.best、elphantroute.com、nowjiasu.com、xlw.app） | **全部删除**，改为纯文本 |
| 原文 OG 图片（gate-rank.com 域名 webp） | **删除**，复用 `/img/clash-300x300.png` |
| GateRank 署名 / 域名引用 | **全部清除**，作为本站原创发布 |
| 文末 ✅ emoji 列表 | 替换为 `.summary-grid` 卡片样式（与 line-selection 一致） |

### 2.3 内容大纲（改写后保留的事实骨架）

```
- 引言：点明场景（下 ChatGPT / Claude / Perplexity 需要美区 Apple ID）
- 一、为什么要注册美区 Apple ID
- 二、注册前准备（中国 +86 手机号即可）
- 三、第一步：创建美区 Apple ID（account.apple.com 步骤）
- 四、第二步：填写美国地址（含 2 个示例地址块）
- 五、第三步：登录美区 App Store
- 六、第四步：首次下载应用（付款方式选 None）
- 七、如何下载 ChatGPT
- 八、如何订阅 ChatGPT Plus（Gift Card / 美国银行卡 双方案）
- 九、推荐双账号方案（iCloud 中国区 + App Store 美区）
- 十、常见问题 Q1-Q4
- 十一、避坑指南（不买现成账号、不登录 iCloud、不频繁切区、不乱填付款）
- 十二、总结 + "下一步" 引导 → /jichang/
```

## 3. 页面元数据

- **目录**：`/tutorial/us-apple-id/index.html`
- **URL slug**：`us-apple-id`（kebab-case 英文，与现有 tutorial 命名一致）
- **Canonical**：`https://www.jichangyun.top/tutorial/us-apple-id/`
- **H1 标题**：`如何注册美区 Apple ID？大陆用户从零开始完整教程`
- **副标题**：`2026 最新版 · 包含注册步骤、付款方式与避坑指南`
- **OG 图**：`https://www.jichangyun.top/img/clash-300x300.png`
- **JSON-LD**：保留 Organization + Article + BreadcrumbList 三段

## 4. HTML 结构

完全照搬 `tutorial/line-selection/index.html` 骨架：
- `<head>`：gtag、Organization、Article、BreadcrumbList、Bootstrap、FA、main.css、per-page `<style>`
- `<body>`：`.header` → `#top-navbar` → `.container.container-page`（`#page-sidebar` + `.content`）→ `.footer`
- `.article-header`：H1 + 副标题
- `.article-content`：正文（h2 / h3 / p / ul / ol / `.notice-highlight` / `.address-block` / `.step-card` / `.faq-item` / `.pitfall-item` / `.summary-grid`）
- 文末 `<div class="giscus"></div>`

### 4.1 新增 per-page `<style>` 类

| 类名 | 用途 |
|------|------|
| `.address-block` | 美国地址示例块（`var(--bg-secondary)` 浅灰底 + 等宽字体，2 个示例上下排列，非并列） |
| `.step-card` | 第一/二/三/四步卡片（左侧 `var(--accent-primary)` 主色边 + 序号徽章 + 标题 + 内容） |
| `.faq-item` | Q1-Q4 列表项（左侧 Q 图标 + 问题标题 + 答案段落，**纯静态展示，无 JS 折叠**） |
| `.pitfall-item` | 避坑指南条目（左侧 `var(--accent-primary)` 红色边 + ⚠ emoji 图标 + 标题 + 描述） |
| `.summary-grid` / `.summary-card` | 文末总结卡片，**复制 line-selection 的 `.summary-grid` 与 `.summary-card` 实现**（grid auto-fit + linear-gradient 背景），用于替代原文 ✅ emoji 列表 |

**注意**：`.summary-grid` / `.summary-card` 在 line-selection 中以 per-page `<style>` 定义，未放入 `css/main.css`。新页面需在自身 `<style>` 块中重新声明相同规则（保持与 line-selection 完全一致），不修改全局 CSS。

## 5. 涉及的 4 个文件

| # | 文件 | 改动类型 | 具体改动 |
|---|------|---------|---------|
| 1 | `/tutorial/us-apple-id/index.html` | **新建** | 整页 HTML（含 meta、JSON-LD、per-page style、正文、Giscus） |
| 2 | `/tutorial/index.html` | **编辑** | 在 `进阶配置教程` 区块下方新增 `<div class="platform-section">`，含 1 张 `tutorial-card` |
| 3 | `/js/nav.js` | **编辑** | `SIDEBAR_SECTIONS.tutorial.items` 末尾追加 `{ href: '/tutorial/us-apple-id/', label: '美区 Apple ID 注册' }` |
| 4 | `/sitemap.xml` | **编辑** | 在 `</urlset>` 标签之前插入新的 `<url>` 块：`loc`、`lastmod 2026-06-13`、`changefreq monthly`、`priority 0.7` |

## 6. 不做的事（范围控制）

- ❌ 不修改顶部导航 `NAV_ITEMS`（保持指向 line-selection）
- ❌ 不在首页 `index.html` 添加入口
- ❌ 不在 jichang 详情页添加入口
- ❌ 不创建新全局 CSS 类（仅 per-page `<style>`）
- ❌ 不修改现有任何 article/guide/tutorial 页面
- ❌ 不创建 `/guide/` 下任何文章
- ❌ 不放置任何 affiliate / 推广链接

## 7. 验收标准（完成定义）

1. `/tutorial/us-apple-id/index.html` 文件存在，HTML 通过基础结构校验（head/body 闭合、JSON-LD 合法）
2. 页面在浏览器加载后侧边栏正确显示"美区 Apple ID 注册"项
3. `/tutorial/index.html` 列表页可见新卡片（含「海外账号」section）
4. `/js/nav.js` `SIDEBAR_SECTIONS.tutorial.items` 长度从 9 增加到 10
5. `/sitemap.xml` 末尾出现新的 `<url>` 块
6. 全文不出现 `gate-rank.com`、`jichang.best`、`elphantroute`、`nowjiasu`、`xlw.app` 等域名
7. 文末包含指向 `/jichang/` 的引导链接
8. `git status` 显示所有 4 个文件的预期改动
9. 在 `python3 -m http.server` 本地预览后，新页面与 line-selection 视觉风格一致（同字体、同色板、同卡片间距）

## 8. 风险与回退

- **风险**：原文如未来在 gate-rank 大幅修改，本页面不受影响（已删除外链和图片依赖）
- **风险**：Apple 注册流程可能随时间变化，文章内容会有时效性——在文末注明"最后更新：2026-06"，未来失效时整页更新而非逐段打补丁
- **回退**：4 个文件改动互相独立，单页回退只需 `git checkout` 对应文件即可