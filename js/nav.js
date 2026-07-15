// 导航栏模块
// 使用方法：
//   1. 顶部导航：在 HTML 中添加 <nav class="top-navbar" id="top-navbar"></nav>
//   2. 侧边栏：在 HTML 中添加 <div class="pagemenus" id="page-sidebar"></div>
//   然后在 body 末尾引入此脚本

// ===========================
// 顶部导航数据
// ===========================
const NAV_ITEMS = [
  { href: '/', label: '首页' },
  { href: '/jichang/', label: '机场推荐' },
  { href: '/rankings/', label: '机场榜' },
  { href: '/tools/streaming-check/', label: '检测工具' },
  { href: '/tutorial/', label: '使用教程' },
  { href: '/guide/', label: '机场百科' },
  { href: '/contactus/', label: '联系我们' }
];

// ===========================
// 侧边栏数据（按分类组织）
// ===========================
const SIDEBAR_SECTIONS = {
  tutorial: {
    label: '教程分类',
    basePath: '/tutorial/',
    items: [
      { href: '/tutorial/line-selection/', label: '线路选择教程' },
      { href: '/tutorial/switchyomega/', label: 'SwitchyOmega 教程' },
      { href: '/tutorial/clash-verge/', label: 'Clash Verge 教程' },
      { href: '/tutorial/clash-for-windows/', label: 'Clash for Windows 教程' },
      { href: '/tutorial/flclash/', label: 'FlClash 教程' },
      { href: '/tutorial/clash-meta-for-android/', label: 'Clash Meta for Android 教程' },
      { href: '/tutorial/clash-for-android/', label: 'Clash for Android 教程' },
      { href: '/tutorial/clashx/', label: 'ClashX Pro 教程' },
      { href: '/tutorial/potatso/', label: 'Potatso 教程' },
      { href: '/tutorial/us-apple-id/', label: '美区 Apple ID 注册' }
    ]
  },
  guide: {
    label: '百科分类',
    basePath: '/guide/',
    items: [
      { href: '/guide/avoid-traps/', label: '购买前核对清单' },
      { href: '/guide/node-speed-differences/', label: '节点速度差异' },
      { href: '/guide/device-limit/', label: '限制设备数' },
      { href: '/guide/frequent-disconnections/', label: '机场频繁断线' },
      { href: '/guide/runway-warning/', label: '机场跑路预警' }
    ]
  },
  jichang: {
    label: '机场推荐',
    basePath: '/jichang/',
    items: [
      { href: '/jichang/yangfanyun/', label: '扬帆云' },
      { href: '/jichang/yuzhouyun/', label: '宇宙云' },
      { href: '/jichang/hongxing/', label: '红杏云' },
      { href: '/jichang/quickcloud/', label: 'Quick Cloud' },
      { href: '/jichang/feiniaoyun/', label: '飞鸟云' },
      { href: '/jichang/dageyun/', label: '大哥云' },
      { href: '/jichang/feimiaoyun/', label: '肥猫云' },
      { href: '/jichang/jinglingxueyuan/', label: '精灵学院' },
      { href: '/jichang/sy/', label: '瞬云' },
      { href: '/jichang/wanxiang/', label: '万象加速' }
    ]
  }
};

// ===========================
// 通用工具函数
// ===========================
function getCurrentPath() {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function isActive(href, currentPath) {
  if (href === '/') {
    return currentPath === '/' || currentPath === '';
  }
  return currentPath.startsWith(href.replace(/\/$/, ''));
}

// 侧边栏专用：精确匹配当前页
function isActiveSidebar(href, currentPath) {
  return currentPath === href.replace(/\/$/, '') || currentPath === href;
}

function detectSection(currentPath) {
  for (const key of Object.keys(SIDEBAR_SECTIONS)) {
    const basePath = SIDEBAR_SECTIONS[key].basePath;
    if (currentPath === basePath.replace(/\/$/, '') || currentPath.startsWith(basePath)) {
      return key;
    }
  }
  return null;
}

// ===========================
// 渲染函数
// ===========================
function renderNavbar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentPath = getCurrentPath();
  const navHtml = `<div class="top-navbar-inner">${NAV_ITEMS.map(item => {
    const activeClass = isActive(item.href, currentPath) ? ' active' : '';
    return `<a href="${item.href}" class="nav-item${activeClass}">${item.label}</a>`;
  }).join('')}</div>`;

  container.innerHTML = navHtml;
}

function renderSidebar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentPath = getCurrentPath();
  const sectionKey = detectSection(currentPath);
  if (!sectionKey) return;

  const section = SIDEBAR_SECTIONS[sectionKey];

  const itemsHtml = section.items.map(item => {
    const activeClass = isActiveSidebar(item.href, currentPath) ? ' class="active"' : '';
    return `<li${activeClass}><a href="${item.href}">${item.label}</a></li>`;
  }).join('');

  container.innerHTML = `
    <h4 style="font-size: 12px; color: var(--text-muted); padding: 10px 28px; margin: 0;">${section.label}</h4>
    <ul class="site-nav site-navbar">
      ${itemsHtml}
    </ul>
  `;
}

// ===========================
// 外链点击统计
// ===========================
const INTERNAL_HOSTNAMES = new Set([
  'jichangyun.top',
]);

const OFFICIAL_LINK_SELECTOR = '.official-download, .tutorial-sources, .troubleshooting-sources';

function trackOutboundClick(event) {
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor || typeof window.gtag !== 'function') return;

  let destination;
  try {
    destination = new URL(anchor.getAttribute('href'), window.location.href);
  } catch {
    return;
  }

  if (!['http:', 'https:'].includes(destination.protocol)) return;

  const linkDomain = destination.hostname.toLowerCase().replace(/^www\./, '');
  const currentDomain = window.location.hostname.toLowerCase().replace(/^www\./, '');
  if (linkDomain === currentDomain || INTERNAL_HOSTNAMES.has(linkDomain)) return;

  let linkType = 'external';
  if (anchor.relList?.contains?.('sponsored')) {
    linkType = 'sponsored';
  } else if (anchor.closest?.(OFFICIAL_LINK_SELECTOR)) {
    linkType = 'official';
  }

  window.gtag('event', 'outbound_link', {
    link_domain: linkDomain,
    link_type: linkType,
    page_path: window.location.pathname,
  });
}

// ===========================
// 初始化
// ===========================
document.addEventListener('DOMContentLoaded', function() {
  renderNavbar('top-navbar');
  renderSidebar('page-sidebar');
  document.addEventListener('click', trackOutboundClick);
});
