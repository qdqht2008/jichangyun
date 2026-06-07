# 导航栏重新设计实施方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将网站顶部改为胶囊式导航栏，移除下载中心相关链接，保留左侧边栏作为二级导航

**Architecture:** 顶部导航栏（胶囊样式） + 左侧边栏（动态子导航）+ 主内容区

**Tech Stack:** HTML5, CSS3, Bootstrap 4.6, jQuery

---

## 文件结构

```
修改文件:
- css/main.css                    # 添加顶部导航栏样式
- index.html                      # 添加顶部导航，移除下载相关
- jichang/index.html              # 更新侧边栏内容
- tutorial/index.html             # 更新侧边栏内容
- guide/avoid-traps/index.html    # 更新侧边栏内容
- jichang/*.html                  # 各机场详情页（14个文件）
- tutorial/*.html                 # 各教程页（10个文件）
```

---

## Task 1: 修改 CSS 添加顶部导航栏样式

**Files:**
- Modify: `css/main.css:51-109`

- [ ] **Step 1: 添加顶部导航栏 CSS 样式**

在 `.header` 样式之后添加新的 `.top-navbar` 样式：

```css
/* ===== Top Navigation Bar ===== */
.top-navbar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}

.top-navbar .nav-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 20px;
  transition: all 0.3s ease;
  background: transparent;
}

.top-navbar .nav-item:hover {
  color: var(--accent-primary);
  background: linear-gradient(90deg, rgba(224,122,95,0.08) 0%, transparent 100%);
}

.top-navbar .nav-item.active {
  color: #fff;
  background: var(--accent-primary);
  font-weight: 600;
}

.top-navbar .nav-item.active:hover {
  background: var(--accent-primary);
  color: #fff;
}
```

- [ ] **Step 2: 调整现有 header 样式**

将现有 `.header` 的背景改为透明，并移除 logo 区域的 brand 展示：

```css
.header {
  background: transparent;
  border-bottom: none;
  padding: 15px 0;
  position: relative;
}

.header::after {
  display: none;
}
```

- [ ] **Step 3: 添加响应式样式**

在文件末尾 `@media (max-width: 768px)` 中添加：

```css
.top-navbar {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.top-navbar::-webkit-scrollbar {
  display: none;
}

.top-navbar .nav-item {
  white-space: nowrap;
  padding: 8px 16px;
  font-size: 13px;
}
```

- [ ] **Step 4: 提交**

```bash
git add css/main.css
git commit -m "style: add top navbar capsule navigation styles"
```

---

## Task 2: 修改首页 index.html

**Files:**
- Modify: `index.html:119-136` (header 部分)
- Modify: `index.html:145-161` (删除客户端下载卡片)
- Modify: `index.html:188-189` (删除下载链接按钮)

- [ ] **Step 1: 替换 header 结构**

将原来的 header 替换为包含顶部导航栏的新结构：

```html
<header class="header">
  <div class="container">
    <div class="logo"><a href="/"><img src="/img/logo.png" alt="Clash节点">Clash节点</a></div>
  </div>
</header>

<nav class="top-navbar">
  <div class="container" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
    <a href="/" class="nav-item active">首页</a>
    <a href="/jichang/" class="nav-item">机场推荐</a>
    <a href="/tutorial/" class="nav-item">使用教程</a>
    <a href="/guide/avoid-traps/" class="nav-item">避坑指南</a>
  </div>
</nav>
```

- [ ] **Step 2: 删除客户端下载卡片**

删除整个 `.category-grid` 中的第一个卡片（客户端下载），保留机场推荐和使用教程两个卡片。

删除：
```html
<a href="/download/" class="category-card">
  <div class="icon">📥</div>
  <h2>客户端下载</h2>
  <p>Clash Verge、FlClash、Clash for Windows 等多平台客户端下载</p>
</a>
```

- [ ] **Step 3: 删除页面中的下载相关链接**

删除 "Clash各版本客户端下载" 区域的 `<a href="/download/" class="btn btn-primary">查看全部下载 →</a>` 按钮。

- [ ] **Step 4: 提交**

```bash
git add index.html
git commit -m "refactor: add top navbar, remove download links from homepage"
```

---

## Task 3: 修改机场推荐页面 jichang/index.html

**Files:**
- Modify: `jichang/index.html:100-117` (侧边栏更新)
- Modify: `jichang/index.html:93-98` (header 部分添加顶部导航)

- [ ] **Step 1: 更新 header 和添加顶部导航**

替换 header 并添加顶部导航：

```html
<header class="header">
  <div class="container">
    <div class="logo"><a href="/"><img src="/img/logo.png" alt="Clash节点">Clash节点</a></div>
  </div>
</header>

<nav class="top-navbar">
  <div class="container" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
    <a href="/" class="nav-item">首页</a>
    <a href="/jichang/" class="nav-item active">机场推荐</a>
    <a href="/tutorial/" class="nav-item">使用教程</a>
    <a href="/guide/avoid-traps/" class="nav-item">避坑指南</a>
  </div>
</nav>
```

- [ ] **Step 2: 更新侧边栏，移除下载中心，添加机场列表**

将侧边栏导航更新为：
```html
<ul class="site-nav site-navbar">
  <li><a href="/">首页</a></li>
  <li class="active"><a href="/jichang/">机场推荐</a></li>
  <li><a href="/tutorial/">使用教程</a></li>
  <li><a href="/guide/avoid-traps/">避坑指南</a></li>
</ul>
```

在页面底部添加机场子导航（侧边栏下方区域显示）：
```html
<div class="pagemenus" style="margin-top: 20px;">
  <h4 style="font-size: 12px; color: var(--text-muted); padding: 10px 28px; margin: 0;">机场列表</h4>
  <ul class="site-nav site-navbar">
    <li><a href="/jichang/dageyun/">大哥云</a></li>
    <li><a href="/jichang/feimiaoyun/">肥猫云</a></li>
    <li><a href="/jichang/feiniaoyun/">飞鸟云</a></li>
    <li><a href="/jichang/jilianyun/">极连云</a></li>
    <li><a href="/jichang/jinglingxueyuan/">精灵学院</a></li>
    <li><a href="/jichang/longmiaoyun/">龙猫云</a></li>
    <li><a href="/jichang/ny/">奈云</a></li>
    <li><a href="/jichang/sy/">瞬云</a></li>
    <li><a href="/jichang/yangfanyun/">扬帆云</a></li>
    <li><a href="/jichang/yuzhouyun/">宇宙云</a></li>
    <li><a href="/jichang/tnt/">TNT Cloud</a></li>
    <li><a href="/jichang/youxinyun/">优信云</a></li>
    <li><a href="/jichang/wanxiang/">万象加速</a></li>
  </ul>
</div>
```

- [ ] **Step 3: 提交**

```bash
git add jichang/index.html
git commit -m "refactor: add top navbar, update sidebar with airport list"
```

---

## Task 4: 修改使用教程页面 tutorial/index.html

**Files:**
- Modify: `tutorial/index.html:93-111` (header 和侧边栏)
- Modify: `tutorial/index.html:219-227` (删除下载中心引用)

- [ ] **Step 1: 更新 header 和添加顶部导航**

与 Task 3 类似，但 active 项为"使用教程"。

- [ ] **Step 2: 更新侧边栏**

移除下载中心，添加教程子导航：
```html
<h4 style="font-size: 12px; color: var(--text-muted); padding: 10px 28px; margin: 0;">教程分类</h4>
<ul class="site-nav site-navbar">
  <li><a href="/tutorial/clash-verge/">Clash Verge 教程</a></li>
  <li><a href="/tutorial/clash-for-windows/">Clash for Windows 教程</a></li>
  <li><a href="/tutorial/flclash/">FlClash 教程</a></li>
  <li><a href="/tutorial/clash-meta-for-android/">Clash Meta for Android 教程</a></li>
  <li><a href="/tutorial/clash-for-android/">Clash for Android 教程</a></li>
  <li><a href="/tutorial/clashx/">ClashX Pro 教程</a></li>
  <li><a href="/tutorial/potatso/">Potatso 教程</a></li>
  <li><a href="/tutorial/line-selection/">线路选择教程</a></li>
  <li><a href="/tutorial/switchyomega/">SwitchyOmega 教程</a></li>
</ul>
```

- [ ] **Step 3: 删除快速入门中的下载中心引用**

将"在下载中心下载对应的客户端"改为"在对应客户端官网下载"。

- [ ] **Step 4: 提交**

```bash
git add tutorial/index.html
git commit -m "refactor: add top navbar, update sidebar with tutorial list"
```

---

## Task 5: 修改避坑指南页面 guide/avoid-traps/index.html

**Files:**
- Modify: `guide/avoid-traps/index.html:208-226` (header 和侧边栏)

- [ ] **Step 1: 更新 header 和添加顶部导航**

与之前类似，active 项为"避坑指南"。

- [ ] **Step 2: 移除侧边栏中的下载中心链接**

更新侧边栏导航，移除下载中心链接。

- [ ] **Step 3: 提交**

```bash
git add guide/avoid-traps/index.html
git commit -m "refactor: add top navbar, remove download link from avoid-traps page"
```

---

## Task 6: 修改所有机场详情页 (jichang/*.html)

**Files:**
- Modify: 14 个文件 `jichang/dageyun/index.html` 等

每个文件需要：
1. 添加顶部导航栏（机场推荐高亮）
2. 更新侧边栏，保留机场列表导航

由于这些页面结构类似，统一执行以下修改：

- [ ] **Step 1: 在 header 后添加顶部导航栏**
- [ ] **Step 2: 更新侧边栏添加机场子导航**

```bash
git add jichang/dageyun/index.html jichang/feimiaoyun/index.html jichang/feiniaoyun/index.html jichang/guangnian/index.html jichang/jilianyun/index.html jichang/jinglingxueyuan/index.html jichang/longmiaoyun/index.html jichang/ny/index.html jichang/sy/index.html jichang/tnt/index.html jichang/wanxiang/index.html jichang/yangfanyun/index.html jichang/youxinyun/index.html jichang/yuzhouyun/index.html
git commit -m "refactor: add top navbar and sidebar to all airport detail pages"
```

---

## Task 7: 修改所有教程详情页 (tutorial/*.html)

**Files:**
- Modify: 10 个文件 `tutorial/clash-verge/index.html` 等

与 Task 6 类似，每个文件需要：
1. 添加顶部导航栏（使用教程高亮）
2. 更新侧边栏添加教程子导航

```bash
git add tutorial/clash-for-android/index.html tutorial/clash-for-windows/index.html tutorial/clash-meta-for-android/index.html tutorial/clash-verge/index.html tutorial/clashx/index.html tutorial/flclash/index.html tutorial/line-selection/index.html tutorial/potatso/index.html tutorial/switchyomega/index.html
git commit -m "refactor: add top navbar and sidebar to all tutorial detail pages"
```

---

## 验证步骤

完成所有任务后，验证以下内容：

- [ ] 打开 http://localhost:8080 首页，顶部导航栏显示"首页、机场推荐、使用教程、避坑指南"，胶囊样式
- [ ] 点击"机场推荐"，顶部导航激活项切换到机场推荐，左侧边栏显示机场列表
- [ ] 首页不再显示"客户端下载"卡片
- [ ] 所有页面顶部导航一致，无下载中心入口
- [ ] 移动端导航可横向滚动