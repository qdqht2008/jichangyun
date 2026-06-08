# 侧边栏公共模块设计

## 目标

将教程和机场详情页的侧边栏抽取为公共 JS 模块，统一菜单顺序，消除重复代码。

## 现状

- 每个教程详情页（如 `clash-verge`、`clash-for-windows`）的侧边栏 HTML 直接写在页面内
- 顺序不统一：详情页以自身教程优先，index 页以线路选择优先
- 机场详情页同理
- 修改时需同时修改多个文件

## 设计方案

### 文件结构

```
js/
├── nav.js                  # 现有顶部导航
├── sidebar-tutorial.js     # 新增：教程侧边栏模块
└── sidebar-jichang.js      # 新增：机场侧边栏模块
```

### 实现方式

参考 `nav.js` 的模式：
1. 菜单数据硬编码在 JS 中（`SIDEBAR_ITEMS` 数组）
2. 根据 `window.location.pathname` 自动标记当前页面对应的 `li` 为 `active`
3. 渲染后的 HTML 注入到 `<div class="pagemenus">` 容器

### 教程侧边栏顺序

```javascript
[
  { href: '/tutorial/line-selection/', label: '线路选择教程' },
  { href: '/tutorial/switchyomega/', label: 'SwitchyOmega 教程' },
  { href: '/tutorial/clash-verge/', label: 'Clash Verge 教程' },
  { href: '/tutorial/clash-for-windows/', label: 'Clash for Windows 教程' },
  { href: '/tutorial/flclash/', label: 'FlClash 教程' },
  { href: '/tutorial/clash-meta-for-android/', label: 'Clash Meta for Android 教程' },
  { href: '/tutorial/clash-for-android/', label: 'Clash for Android 教程' },
  { href: '/tutorial/clashx/', label: 'ClashX Pro 教程' },
  { href: '/tutorial/potatso/', label: 'Potatso 教程' }
]
```

### 机场侧边栏顺序

保持现有顺序不变。

### HTML 引用方式

每个详情页需要：
1. 删除原有的侧边栏 HTML
2. 添加容器：`<div class="pagemenus" style="margin-top: 20px;"></div>`
3. 在 `</body>` 前引入：`<script src="/js/sidebar-tutorial.js" data-section="tutorial"></script>`

`data-section` 属性用于区分加载哪个模块（`tutorial` 或 `jichang`）。

### 页面修改清单

**教程部分（11 个文件）**：
- `tutorial/index.html`
- `tutorial/clash-verge/index.html`
- `tutorial/clash-for-windows/index.html`
- `tutorial/flclash/index.html`
- `tutorial/clash-meta-for-android/index.html`
- `tutorial/clash-for-android/index.html`
- `tutorial/clashx/index.html`
- `tutorial/potatso/index.html`
- `tutorial/line-selection/index.html`
- `tutorial/switchyomega/index.html`

**机场部分（14 个文件）**：
- `jichang/index.html`
- `jichang/dageyun/index.html`
- `jichang/feimiaoyun/index.html`
- `jichang/feiniaoyun/index.html`
- `jichang/guangnian/index.html`
- `jichang/jilianyun/index.html`
- `jichang/jinglingxueyuan/index.html`
- `jichang/longmiaoyun/index.html`
- `jichang/ny/index.html`
- `jichang/sy/index.html`
- `jichang/tnt/index.html`
- `jichang/wanxiang/index.html`
- `jichang/yangfanyun/index.html`
- `jichang/yuzhouyun/index.html`
- `jichang/youxinyun/index.html`

## 验收条件

1. 所有教程详情页侧边栏显示相同菜单，顺序一致
2. 当前页面对应的菜单项显示 `active` 状态
3. 所有机场详情页侧边栏显示相同菜单
4. 修改菜单时只需改一个 JS 文件