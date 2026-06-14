# 机场卡片样式优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 jichang/index.html 和各机场详情页的卡片样式统一升级为现代简约风格（去边框、纯阴影、hover 上浮）

**Architecture:** 集中管理所有卡片样式到 `/css/main.css`，使用统一的 `.airport-card` 系列 class，各页面 HTML 结构保持统一

**Tech Stack:** 纯 CSS，无需 JS改动，使用 CSS Variables 和 CSS Grid

---

## 文件结构

```
修改文件:
- css/main.css                              # 新增 .airport-card 系列样式
- jichang/index.html                        # 更新卡片 HTML 结构 + 引用新 class
- jichang/ny/index.html                     # 更新卡片 HTML 结构（其他详情页同理）
- jichang/dageyun/index.html
- jichang/longmiaoyun/index.html
- jichang/feimiaoyun/index.html
- jichang/yuzhouyun/index.html
- jichang/guangnian/index.html
- jichang/jinglingxueyuan/index.html
- jichang/yangfanyun/index.html
- jichang/feiniaoyun/index.html
- jichang/hongxing/index.html
- jichang/wanxiang/index.html
- jichang/quickcloud/index.html
- jichang/sy/index.html
```

---

## Task 1: 更新 main.css 添加卡片基础样式

**Files:**
- Modify: `css/main.css:627` (文件末尾添加新样式)

- [ ] **Step 1: 添加 .airport-card 系列样式到 main.css 末尾**

在 `main.css` 末尾 `</style>` 标签后添加以下 CSS:

```css
/* ===== Airport Cards ===== */
.airport-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  margin-top: 30px;
}

.airport-card {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.airport-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--accent-primary);
  border-radius: 0 4px 4px 0;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.airport-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(224,122,95,0.15);
}

.airport-card:hover::before {
  opacity: 1;
}

.airport-card:active {
  transform: translateY(-4px) scale(0.98);
}

.airport-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.airport-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.35s ease;
}

.airport-card:hover .airport-card-icon {
  transform: scale(1.08);
}

.airport-card-icon svg {
  width: 26px;
  height: 26px;
}

.airport-card-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--accent-tertiary);
  margin: 0;
  transition: color 0.2s;
}

.airport-card:hover .airport-card-title {
  color: var(--accent-primary);
}

.airport-card-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0 0 20px;
  line-height: 1.6;
}

.airport-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.airport-features li {
  color: var(--text-secondary);
  font-size: 12px;
  padding: 6px 12px;
  background: var(--bg-primary);
  border-radius: 20px;
  transition: all 0.2s ease;
}

.airport-features li::before {
  content: '✓ ';
  color: var(--accent-secondary);
  font-weight: bold;
}

.airport-features li:hover {
  background: rgba(129,178,154,0.15);
}

.airport-card .btn-primary {
  width: 100%;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .airport-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .airport-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}
```

- [ ] **Step 2: 验证 CSS 语法**

在浏览器 DevTools 无报错即可

---

## Task 2: 更新 jichang/index.html 卡片结构

**Files:**
- Modify: `jichang/index.html:86-302`

- [ ] **Step 1: 替换 airport-grid 容器和卡片 HTML**

删除原有的内联 `<style>` (第 85-143 行)，将 `airport-grid` 中的每个 `airport-card` 替换为新的统一结构:

旧结构:
```html
<div class="airport-card">
  <h2>奈云</h2>
  <p class="airport-desc">...</p>
  <ul class="airport-features">
    <li>Netflix全时段解锁</li>
    ...
  </ul>
  <a href="/jichang/ny/" class="btn btn-primary">查看详情</a>
</div>
```

新结构:
```html
<div class="airport-card">
  <div class="airport-card-header">
    <div class="airport-card-icon" style="background: rgba(224,122,95,0.12);">
      <svg viewBox="0 0 24 24" fill="none" stroke="#e07a5f" stroke-width="1.8">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    </div>
    <h3 class="airport-card-title">奈云</h3>
  </div>
  <p class="airport-card-desc">优质节点服务，Netflix全时段解锁，IPLC专线节点</p>
  <ul class="airport-features">
    <li>Netflix全时段解锁</li>
    <li>原生节点</li>
    <li>ChatGPT/Google加速</li>
  </ul>
  <a href="/jichang/ny/" class="btn btn-primary">查看详情 →</a>
</div>
```

**注意**: 保留 `<link rel="stylesheet" href="/css/main.css">` 已有，无需新增

- [ ] **Step 2: 验证页面显示**

本地启动 `python3 -m http.server 8080`，检查：
- 卡片三列布局正常
- hover 上浮效果正常
- 左侧强调色条显现

---

## Task 3: 更新各机场详情页卡片结构

**Files:**
- Modify: 各 jichang/*/index.html

对以下 12 个机场详情页，将页面内的机场卡片（如果有）更新为统一结构：

- jichang/ny/index.html
- jichang/dageyun/index.html
- jichang/longmiaoyun/index.html
- jichang/feimiaoyun/index.html
- jichang/yuzhouyun/index.html
- jichang/guangnian/index.html
- jichang/jinglingxueyuan/index.html
- jichang/yangfanyun/index.html
- jichang/feiniaoyun/index.html
- jichang/hongxing/index.html
- jichang/wanxiang/index.html
- jichang/quickcloud/index.html
- jichang/sy/index.html

- [ ] **Step 1: 逐一检查各详情页是否有内联卡片样式**

读取每个文件，搜索 `.airport-card` 相关内联样式，如有则替换为引用 main.css 中的统一 class

- [ ] **Step 2: 统一卡片 HTML 结构**

将各详情页中的机场对比卡片（如有）替换为 Task 2 中的新结构格式

---

## Task 4: 验证与微调

- [ ] **Step 1: 全页面响应式验证**

| 宽度 | 预期 |
|------|------|
| 375px (手机) | 单列，卡片宽度 100% |
| 768px (平板) | 双列 |
| 1200px+ (桌面) | 三列 |

- [ ] **Step 2: hover 效果验证**

卡片 hover 时：
- 上浮 6px
- 阴影加深
- 左侧强调色条显现
- 标题变色

- [ ] **Step 3: 提交代码**

```bash
git add css/main.css jichang/index.html jichang/*/index.html
git commit -m "$(cat <<'EOF'
feat: 统一机场卡片样式为现代简约风格

- 去除卡片边框，改用纯阴影
- 增大圆角至 20px
- 添加 hover 上浮 + 左侧强调色效果
- 统一间距至 28px

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 验证标准

- [ ] 卡片 hover 有上浮效果 (translateY(-6px))
- [ ] 左侧强调色条在 hover 时显现
- [ ] 移动端单列显示正常
- [ ] 平板双列显示正常
- [ ] 桌面三列显示正常
- [ ] 页面加载无布局跳动
- [ ] Git 提交成功