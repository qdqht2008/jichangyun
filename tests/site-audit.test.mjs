import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteSections = ['contactus', 'guide', 'jichang', 'tutorial'];
const p1ReviewPages = [
  'jichang/dageyun/index.html',
  'jichang/feimiaoyun/index.html',
  'jichang/jinglingxueyuan/index.html',
];

function read(file) {
  return readFileSync(join(root, file), 'utf8');
}

function walkHtml(directory) {
  const absolute = join(root, directory);
  return readdirSync(absolute).flatMap((entry) => {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) return walkHtml(relative(root, path));
    return entry === 'index.html' ? [relative(root, path)] : [];
  });
}

function publicHtmlFiles() {
  return ['index.html', ...siteSections.flatMap(walkHtml)].sort();
}

function publicUrlFor(file) {
  if (file === 'index.html') return 'https://www.jichangyun.top/';
  return `https://www.jichangyun.top/${file.replace(/index\.html$/, '')}`;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? '';
}

function structuredData(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

function airportCard(html, name) {
  const title = `<h3 class="airport-card-title">${name}</h3>`;
  const titleIndex = html.indexOf(title);
  if (titleIndex === -1) return '';
  const cardStart = '<div class="airport-card"';
  const start = html.lastIndexOf(cardStart, titleIndex);
  const next = html.indexOf(cardStart, titleIndex + title.length);
  return html.slice(start, next === -1 ? html.length : next);
}

function outboundClickTarget({ href, rel = '', sourceClass = '', text = 'Sensitive link text' }) {
  const relationships = new Set(rel.split(/\s+/).filter(Boolean));
  const anchor = {
    href,
    textContent: text,
    getAttribute(name) {
      if (name === 'href') return href;
      if (name === 'rel') return rel;
      return null;
    },
    relList: {
      contains(value) {
        return relationships.has(value);
      },
    },
    closest(selector) {
      return sourceClass && selector.includes(`.${sourceClass}`) ? { className: sourceClass } : null;
    },
  };

  return {
    closest(selector) {
      return selector === 'a[href]' ? anchor : null;
    },
  };
}

function loadOutboundTracking({
  hostname = 'www.jichangyun.top',
  pathname = '/jichang/example/',
  withGtag = true,
} = {}) {
  const listeners = new Map();
  const calls = [];
  const document = {
    getElementById() {
      return null;
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
  };
  const window = {
    location: {
      href: `https://${hostname}${pathname}`,
      hostname,
      pathname,
    },
  };
  if (withGtag) window.gtag = (...args) => calls.push(args);

  runInNewContext(read('js/nav.js'), { document, window, URL });
  for (const listener of listeners.get('DOMContentLoaded') ?? []) listener();

  return {
    calls,
    click(target) {
      let prevented = 0;
      const event = {
        target,
        preventDefault() {
          prevented += 1;
        },
      };
      for (const listener of listeners.get('click') ?? []) listener(event);
      return prevented;
    },
  };
}

test('category navigation sends crawl authority to all three content hubs', () => {
  const nav = read('js/nav.js');
  for (const href of ['/jichang/', '/tutorial/', '/guide/']) {
    assert.match(nav, new RegExp(`href: '${href.replaceAll('/', '\\/')}'`));
  }
});

test('homepage acts as a crawlable content hub instead of a three-link splash page', () => {
  const homepage = read('index.html');
  for (const href of ['/jichang/', '/tutorial/', '/guide/']) {
    assert.match(homepage, new RegExp(`href="${href}"`));
  }
  assert.match(homepage, /class="home-featured"/);
  assert.match(homepage, /class="resource-grid"/);
  assert.match(homepage, />机场推荐</);
  assert.match(homepage, />客户端教程</);
  assert.match(homepage, />避坑百科</);
  assert.match(homepage, /<time datetime="2026-07-05">/);
});

test('homepage airport routes summarize verified facts instead of detached merchant claims', () => {
  const homepage = read('index.html');
  const airportResources = homepage.match(/<h2 id="airport-resources">[\s\S]*?<\/section>/)?.[0] ?? '';
  const expected = new Map([
    ['/jichang/yangfanyun/', '扬帆云：¥19.99/月起，100GB–1.2TB/周期'],
    ['/jichang/quickcloud/', 'Quick Cloud：¥12.9/月起，含不限时流量包'],
    ['/jichang/feiniaoyun/', '飞鸟云：¥12/年起，含月付与不限时流量包'],
    ['/jichang/dageyun/', '大哥云：¥19.90/月起，新疆地区不可用'],
  ]);
  for (const [href, summary] of expected) {
    assert.match(airportResources, new RegExp(`href="${href.replaceAll('/', '\\/')}"`));
    assert.match(airportResources, new RegExp(summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(airportResources, /V2Ray|IPLC|住宅节点|全球节点|多端支持|老牌|解锁/);
});

test('homepage metadata and hero describe an evidence-led resource hub without performance promises', () => {
  const homepage = read('index.html');
  const head = homepage.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? '';
  const hero = homepage.match(/<div class="hero">[\s\S]*?<div class="hero-accent-bar"><\/div>/)?.[0] ?? '';
  assert.match(head, /Clash机场推荐与使用教程/);
  assert.match(head, /套餐整理、客户端配置与故障排查/);
  assert.match(hero, /整理公开套餐资料、配置教程和避坑指南/);
  assert.match(hero, /套餐价格 · 流量限制 · 购买风险/);
  assert.match(hero, /购买避坑 · 故障排查 · 线路原理/);
  assert.doesNotMatch(`${head}\n${hero}`, /免费节点|安全稳定|高品质|不跑路|稳定性实测|让网络畅通无阻/);
  assert.match(homepage, /首页机场摘要与证据口径同步<\/a><time datetime="2026-07-05">2026-07-05<\/time>/);
});

test('airport hub explains evidence limits and drops the unsupported 优信云 card', () => {
  const hub = read('jichang/index.html');
  assert.match(hub, /按公开套餐资料整理价格、流量与购买限制/);
  for (const risk of ['退款', '设备', '地区', '长期套餐']) assert.match(hub, new RegExp(risk));
  assert.match(hub, /卡片标注各自的资料核验日期/);
  assert.match(hub, /商家对线路和解锁的描述不等于本站测试/);
  assert.match(hub, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
  assert.doesNotMatch(hub, /稳定快速|不跑路|避开90%的坑|优信云|高速IPLC专线/);

  const expectedCards = [
    ['扬帆云', 'yangfanyun', '2026-07-05'],
    ['红杏云', 'hongxing', '2026-07-04'],
    ['Quick Cloud', 'quickcloud', '2026-07-05'],
    ['飞鸟云', 'feiniaoyun', '2026-07-03'],
    ['大哥云', 'dageyun', '2026-07-02'],
    ['肥猫云', 'feimiaoyun', '2026-07-02'],
    ['精灵学院', 'jinglingxueyuan', '2026-07-02'],
    ['瞬云', 'sy', '2026-07-03'],
    ['宇宙云', 'yuzhouyun', '2026-07-05'],
    ['万象加速', 'wanxiang', '2026-07-05'],
  ];
  assert.equal((hub.match(/<div class="airport-card"/g) ?? []).length, expectedCards.length);
  for (const [name, path, date] of expectedCards) {
    const card = airportCard(hub, name);
    assert.match(card, new RegExp(`href="\\/jichang\\/${path}\\/"`), `${name}: route changed`);
    assert.match(card, new RegExp(`data-review-date="${date}"`), `${name}: review date changed`);
  }

  const sitemap = read('sitemap.xml');
  for (const path of ['', 'jichang/']) {
    assert.match(sitemap, new RegExp(`<loc>https:\\/\\/www\\.jichangyun\\.top\\/${path}<\\/loc>\\s*<lastmod>2026-07-05<\\/lastmod>`));
  }
});

test('homepage does not load a third-party comment embed before users reach an article', () => {
  const homepage = read('index.html');
  assert.doesNotMatch(homepage, /class="giscus"/);
  assert.doesNotMatch(homepage, /giscus\.app\/client\.js/);
});

test('commercial registration CTAs disclose their sponsored relationship', () => {
  const failures = [];
  for (const file of walkHtml('jichang')) {
    for (const anchor of tags(read(file), 'a')) {
      const href = attribute(anchor, 'href');
      const className = attribute(anchor, 'class');
      if (!href.startsWith('http') || !className.split(/\s+/).includes('btn-primary')) continue;
      const rel = new Set(attribute(anchor, 'rel').split(/\s+/));
      for (const required of ['sponsored', 'nofollow', 'noopener']) {
        if (!rel.has(required)) failures.push(`${file}: missing ${required} on ${href}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('content images reserve layout space and defer work until readers need them', () => {
  const failures = [];
  for (const file of walkHtml('jichang')) {
    for (const image of tags(read(file), 'img')) {
      if (attribute(image, 'src') === '/img/logo.svg') continue;
      if (attribute(image, 'loading') !== 'lazy') failures.push(`${file}: image is not lazy`);
      if (attribute(image, 'decoding') !== 'async') failures.push(`${file}: image is not async decoded`);
      if (!/^\d+$/.test(attribute(image, 'width'))) failures.push(`${file}: image width is missing`);
      if (!/^\d+$/.test(attribute(image, 'height'))) failures.push(`${file}: image height is missing`);
    }
  }
  assert.deepEqual(failures, []);
});

test('content image styles preserve intrinsic proportions on narrow screens', () => {
  const css = read('css/main.css');
  const rule = css.match(/\.article-content img\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(rule, /max-width:\s*100%/);
  assert.match(rule, /height:\s*auto/);
});

test('mobile article layout releases the desktop sidebar height', () => {
  const css = read('css/main.css');
  assert.match(
    css,
    /@media \(max-width: 768px\) \{[\s\S]*?\.pageside\s*\{[^}]*height:\s*auto;[^}]*max-height:\s*none;/,
  );
});

test('sitemap covers every public page and only publishes trustworthy crawl metadata', () => {
  const sitemap = read('sitemap.xml');
  const actualUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
  const retiredRecommendationUrls = new Set([
    'https://www.jichangyun.top/jichang/guangnian/',
    'https://www.jichangyun.top/jichang/longmiaoyun/',
  ]);
  const expectedUrls = publicHtmlFiles()
    .map(publicUrlFor)
    .filter((url) => !retiredRecommendationUrls.has(url))
    .sort();
  assert.deepEqual(actualUrls, expectedUrls);
  assert.doesNotMatch(sitemap, /<(priority|changefreq)>/);
  const dates = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
  assert.equal(dates.length, expectedUrls.length);
  assert.ok(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)));
  assert.ok(new Set(dates).size > 1, 'lastmod dates must reflect real page changes');
});

test('root-relative links resolve to files so visitors and crawlers avoid dead ends', () => {
  const failures = [];
  for (const file of publicHtmlFiles()) {
    for (const anchor of tags(read(file), 'a')) {
      const href = attribute(anchor, 'href');
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const pathname = href.split(/[?#]/, 1)[0];
      if (pathname === '/') continue;
      const target = pathname.endsWith('/') ? join(root, pathname, 'index.html') : join(root, pathname);
      if (!existsSync(target)) failures.push(`${file}: ${href}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('P1 airport reviews share an editorial structure readers can compare', () => {
  const sections = [
    'review-meta',
    'review-verdict',
    'review-audience',
    'review-pros-cons',
    'plan-table-wrap',
    'review-risk',
    'review-sources',
  ];

  for (const file of p1ReviewPages) {
    const html = read(file);
    for (const section of sections) {
      assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `${file}: missing ${section}`);
    }
    assert.match(html, /<table\b/);
    assert.match(html, /优质机场推荐编辑部/);
    assert.match(html, /官网资料与第三方记录交叉核验/);
    assert.match(html, /<time datetime="2026-07-02">2026-07-02<\/time>/);
    assert.match(html, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
  }
});

test('P1 package tables preserve verified facts and remove stale promotions', () => {
  const dageyun = read('jichang/dageyun/index.html');
  for (const fact of ['¥19.90', '100GB', '¥299', '500GB', 'mcuE8uOq']) assert.match(dageyun, new RegExp(fact));
  assert.doesNotMatch(dageyun, /dgy2026|2026\/2\/23/);

  const feimiaoyun = read('jichang/feimiaoyun/index.html');
  for (const fact of ['¥96', '60GB', '¥100', '700GB', '¥600', '500GB']) assert.match(feimiaoyun, new RegExp(fact));
  assert.doesNotMatch(feimiaoyun, /10月份|750GB/);

  const jingling = read('jichang/jinglingxueyuan/index.html');
  for (const fact of ['Iron', 'Silver', 'Alloy', 'Gold', 'Diamond', 'Master', '不限时流量 Small']) {
    assert.match(jingling, new RegExp(fact));
  }
  assert.doesNotMatch(jingling, /New2025|10月份/);
  assert.doesNotMatch(jingling, /<tr[^>]*>[\s\S]*?买前必看[\s\S]*?<\/tr>/);
});

test('P1 reviews keep commercial link metadata without requiring visible commission copy', () => {
  for (const file of p1ReviewPages) {
    const html = read(file);
    const commercial = tags(html, 'a').find((anchor) => {
      return attribute(anchor, 'class').split(/\s+/).includes('btn-primary')
        && attribute(anchor, 'href').startsWith('http');
    });
    assert.ok(commercial, `${file}: missing commercial CTA`);
    assert.deepEqual(new Set(attribute(commercial, 'rel').split(/\s+/)), new Set(['sponsored', 'nofollow', 'noopener']));
    assert.doesNotMatch(html, /本站未实测|待核验/);
  }
});

test('P1 metadata uses the same cautious editorial standard as the visible review', () => {
  for (const file of p1ReviewPages) {
    const html = read(file);
    const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description') ?? '';
    assert.doesNotMatch(attribute(description, 'content'), /安全稳定|高速稳定|全解锁|全年稳定在线/);

    const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
    assert.ok(article, `${file}: missing Article structured data`);
    assert.equal(article.author?.name, '优质机场推荐编辑部');
    assert.equal(article.dateModified, '2026-07-02');
  }
});

test('airport hub explains its method and marks only the first P1 review batch', () => {
  const hub = read('jichang/index.html');
  assert.match(hub, /class="review-methodology"/);
  assert.match(hub, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
  assert.equal((hub.match(/data-review-date="2026-07-02"/g) ?? []).length, 3);
});

test('sitemap dates reflect only the P1 pages changed in this batch', () => {
  const sitemap = read('sitemap.xml');
  for (const path of ['jichang/dageyun/', 'jichang/feimiaoyun/', 'jichang/jinglingxueyuan/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-02<\\/lastmod>`));
  }
});

test('飞鸟云 review uses the shared editorial structure with a current evidence boundary', () => {
  const html = read('jichang/feiniaoyun/index.html');
  for (const section of [
    'review-meta',
    'review-verdict',
    'review-audience',
    'review-pros-cons',
    'plan-table-wrap',
    'review-risk',
    'review-sources',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `飞鸟云: missing ${section}`);
  }
  assert.match(html, /优质机场推荐编辑部/);
  assert.match(html, /官网资料与第三方记录交叉核验/);
  assert.match(html, /<time datetime="2026-07-03">2026-07-03<\/time>/);
  assert.match(html, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
  assert.match(html, /公开资料存在版本冲突/);
});

test('飞鸟云 package table preserves the current merchant facts instead of stale screenshots', () => {
  const html = read('jichang/feiniaoyun/index.html');
  for (const fact of [
    '传家宝',
    '传家宝加大版',
    '传家宝超大版',
    '¥12/年',
    '¥20/两年',
    '50GB/月',
    '¥10/月',
    '200GB/月',
    '¥20/月',
    '600GB/月',
    '¥15/一次性',
    '400GB 总量',
    '¥300/一次性',
    '10000GB 总量',
    '每月 1 日 13:00',
    '购买后不退款',
    'Hysteria2',
    '重复购买可叠加',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `飞鸟云: missing ${fact}`);
  }
  assert.equal((html.match(/<tbody>[\s\S]*?<tr>/g) ?? []).length, 2, '飞鸟云: expected two package tables');
  assert.doesNotMatch(html, /img\/feiniaoyun|70\+|ISP BGP|IPLC专线|FlyingBird|Netflix|TVB|游戏加速/);
});

test('飞鸟云 metadata and commercial route follow the verified merchant version', () => {
  const html = read('jichang/feiniaoyun/index.html');
  const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description') ?? '';
  assert.doesNotMatch(attribute(description, 'content'), /安全稳定|高速稳定|全解锁|全年稳定在线/);

  const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
  assert.ok(article, '飞鸟云: missing Article structured data');
  assert.equal(article.author?.name, '优质机场推荐编辑部');
  assert.equal(article.dateModified, '2026-07-03');

  const commercial = tags(html, 'a').find((anchor) => attribute(anchor, 'href').includes('321fa405.538951.xyz'));
  assert.ok(commercial, '飞鸟云: missing current merchant CTA');
  assert.deepEqual(new Set(attribute(commercial, 'rel').split(/\s+/)), new Set(['sponsored', 'nofollow', 'noopener']));
});

test('airport hub and sitemap preserve 飞鸟云 evidence while 瞬云 remains isolated', () => {
  const hub = read('jichang/index.html');
  const card = hub.match(/<div class="airport-card"[^>]*>[\s\S]*?<h3 class="airport-card-title">飞鸟云<\/h3>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.match(card, /data-review-date="2026-07-03"/);
  assert.match(card, /¥12\/年起/);
  assert.match(card, /Hysteria2（商家标注）/);
  assert.match(card, /购买后不退款/);
  assert.ok((hub.match(/data-review-date="2026-07-03"/g) ?? []).length >= 1);

  const sitemap = read('sitemap.xml');
  for (const path of ['jichang/feiniaoyun/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-03<\\/lastmod>`));
  }
});

test('瞬云 review uses the shared editorial structure and attributes merchant claims', () => {
  const html = read('jichang/sy/index.html');
  for (const section of [
    'review-meta',
    'review-verdict',
    'review-audience',
    'review-pros-cons',
    'plan-table-wrap',
    'review-risk',
    'review-sources',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `瞬云: missing ${section}`);
  }
  assert.match(html, /优质机场推荐编辑部/);
  assert.match(html, /官网资料与第三方记录交叉核验/);
  assert.match(html, /<time datetime="2026-07-03">2026-07-03<\/time>/);
  assert.match(html, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
  assert.match(html, /商家套餐页标注/);
});

test('瞬云 package tables preserve current official facts and remove stale promotion', () => {
  const html = read('jichang/sy/index.html');
  for (const fact of [
    '限时年付小包',
    '¥99/年',
    '59GB/月',
    '行者',
    '¥20/月',
    '150GB/月',
    '縱橫',
    '¥36/月',
    '300GB/月',
    '凌霄',
    '¥68/月',
    '800GB/月',
    '¥260/一次性',
    '2000GB 总量',
    '¥600/一次性',
    '5000GB 总量',
    '原价的 90%',
    '仅限个人使用',
    '不支持退换',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `瞬云: missing ${fact}`);
  }
  assert.doesNotMatch(html, /20OFF|入门套餐只需16元|<td>600GB\/月<\/td>|img\/sy\//);
  assert.match(html, /第三方资料仍把凌霄写为 600GB\/月，与当前商家页面的 800GB\/月冲突/);
});

test('瞬云 metadata and commercial route stay cautious and current', () => {
  const html = read('jichang/sy/index.html');
  const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description') ?? '';
  assert.doesNotMatch(attribute(description, 'content'), /安全稳定|高速稳定|全解锁|不限速|解锁ChatGPT/);

  const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
  assert.ok(article, '瞬云: missing Article structured data');
  assert.equal(article.author?.name, '优质机场推荐编辑部');
  assert.equal(article.dateModified, '2026-07-03');

  const commercial = tags(html, 'a').find((anchor) => attribute(anchor, 'href').includes('jichang.best'));
  assert.ok(commercial, '瞬云: missing current merchant CTA');
  assert.deepEqual(new Set(attribute(commercial, 'rel').split(/\s+/)), new Set(['sponsored', 'nofollow', 'noopener']));
});

test('airport hub and sitemap mark 飞鸟云 and 瞬云 as completed second-batch reviews', () => {
  const hub = read('jichang/index.html');
  const card = hub.match(/<div class="airport-card"[^>]*>(?:(?!<div class="airport-card")[\s\S])*?<h3 class="airport-card-title">瞬云<\/h3>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.match(card, /data-review-date="2026-07-03"/);
  assert.match(card, /¥99\/年起/);
  assert.match(card, /59GB\/月/);
  assert.match(card, /不限时流量包/);
  assert.equal((hub.match(/data-review-date="2026-07-03"/g) ?? []).length, 2);

  const sitemap = read('sitemap.xml');
  for (const path of ['jichang/feiniaoyun/', 'jichang/sy/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-03<\\/lastmod>`));
  }
});

test('红杏云 review uses the shared editorial structure with current official evidence', () => {
  const html = read('jichang/hongxing/index.html');
  for (const section of [
    'review-meta',
    'review-verdict',
    'review-audience',
    'review-pros-cons',
    'plan-table-wrap',
    'review-risk',
    'review-sources',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `红杏云: missing ${section}`);
  }
  assert.match(html, /优质机场推荐编辑部/);
  assert.match(html, /官网资料与第三方记录交叉核验/);
  assert.match(html, /<time datetime="2026-07-04">2026-07-04<\/time>/);
  assert.match(html, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
});

test('红杏云 package tables preserve the confirmed official package version', () => {
  const html = read('jichang/hongxing/index.html');
  for (const fact of [
    '轻量-包月200G',
    '¥20/月',
    '200GB/月',
    '300Mbps',
    '冲浪-包月500G',
    '¥40/月',
    '500GB/月',
    '500Mbps',
    '豪华-包月800G',
    '¥60/月',
    '800GB/月',
    '800Mbps',
    '大师-包月1200G',
    '¥80/月',
    '1200GB/月',
    '高级-不限时3000G',
    '¥388/一次性',
    '3000GB 总量',
    '豪华-不限时6000G',
    '¥688/一次性',
    '6000GB 总量',
    '最多 20 台设备',
    'IEPL',
    '仅限个人使用',
    '暂不支持退款',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `红杏云: missing ${fact}`);
  }
  assert.doesNotMatch(html, /img\/hongxing\/|hx2025|ABING888|lu88|weizai|AM科技|<td>(?:555|888|1288)GB(?:\/月)?<\/td>/);
  assert.match(html, /第三方页面仍存在 555GB、888GB、1288GB 等旧套餐/);
});

test('红杏云 metadata and merchant performance claims stay cautious', () => {
  const html = read('jichang/hongxing/index.html');
  const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description') ?? '';
  assert.doesNotMatch(attribute(description, 'content'), /极速稳定|全解锁|理想选择|高速节点/);

  const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
  assert.ok(article, '红杏云: missing Article structured data');
  assert.equal(article.author?.name, '优质机场推荐编辑部');
  assert.equal(article.dateModified, '2026-07-04');

  const commercial = tags(html, 'a').find((anchor) => attribute(anchor, 'href').includes('hongxing1s.cc'));
  assert.ok(commercial, '红杏云: missing current merchant CTA');
  assert.deepEqual(new Set(attribute(commercial, 'rel').split(/\s+/)), new Set(['sponsored', 'nofollow', 'noopener']));
  assert.match(html, /商家套餐图标注[^。]*300Mbps/);
  assert.doesNotMatch(html, /本站实测(?:表明|显示|达到)|本站测速(?:表明|显示|达到)|亲测(?:可达|达到|稳定)/);
});

test('airport hub and sitemap mark 红杏云 as the last completed second-batch review', () => {
  const hub = read('jichang/index.html');
  const card = hub.match(/<div class="airport-card"[^>]*>(?:(?!<div class="airport-card")[\s\S])*?<h3 class="airport-card-title">红杏云<\/h3>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.match(card, /data-review-date="2026-07-04"/);
  assert.match(card, /¥20\/月起/);
  assert.match(card, /200–1200GB\/月/);
  assert.match(card, /不限时流量包/);
  assert.equal((hub.match(/data-review-date="2026-07-04"/g) ?? []).length, 1);
  assert.equal((hub.match(/data-review-date="2026-07-03"/g) ?? []).length, 2);

  const sitemap = read('sitemap.xml');
  for (const path of ['jichang/hongxing/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-04<\\/lastmod>`));
  }
  for (const path of ['jichang/feiniaoyun/', 'jichang/sy/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-03<\\/lastmod>`));
  }
});

const thirdBatchReviews = [
  ['扬帆云', 'jichang/yangfanyun/index.html'],
  ['宇宙云', 'jichang/yuzhouyun/index.html'],
  ['万象加速', 'jichang/wanxiang/index.html'],
];

test('third-batch reviews use one comparable structure without presenting merchant claims as tests', () => {
  for (const [name, file] of thirdBatchReviews) {
    const html = read(file);
    for (const section of [
      'review-meta',
      'review-verdict',
      'review-audience',
      'review-pros-cons',
      'plan-table-wrap',
      'review-risk',
      'review-sources',
    ]) {
      assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `${name}: missing ${section}`);
    }
    assert.match(html, /优质机场推荐编辑部/);
    assert.match(html, /官方套餐页核验/);
    assert.match(html, /<time datetime="2026-07-05">2026-07-05<\/time>/);
    assert.match(html, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
    assert.match(html, /商家(?:套餐页|称|标注|页面)/, `${name}: merchant claims need attribution`);
    assert.doesNotMatch(html, /本站实测(?:表明|显示|达到)|本站测速(?:表明|显示|达到)|亲测(?:可达|达到|稳定)/);
  }
});

test('扬帆云 review preserves current plan limits and treats promotions as checkout-dependent', () => {
  const html = read('jichang/yangfanyun/index.html');
  for (const fact of [
    'LV1', '100GB', '200Mbps', '2 台', '¥19.99/月',
    'LV2', '200GB', '300Mbps', '3 台', '¥29.99/月',
    'LV3', '400GB', '500Mbps', '4 台', '¥39.99/月',
    'LV4', '700GB', '1Gbps', '5 台', '¥49.99/月',
    '旗舰版', '1.2TB', '不限速', '8 台', '¥88.99/月',
    '¥2135.76', '独立 IP ¥200/月/个起', '节点另收费', '两年起订',
    'yf6189', '6.9 折', 'yf6185', '6.5 折', 'lucky9', '9 折',
    'LV4 与旗舰版', '买 3 送 1', '结算页',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `扬帆云: missing ${fact}`);
  }
  assert.match(html, /首次购买日[^。]*每月[^。]*重置/);
  assert.doesNotMatch(html, /img\/yangfanyun\/|年费套餐7折优惠码：618|10月份/);
});

test('宇宙云 review preserves plan tiers while keeping the reset rule explicitly unresolved', () => {
  const html = read('jichang/yuzhouyun/index.html');
  for (const fact of [
    '星云年付小包', '¥96/年', '60GB/月',
    '行星基础版', '¥25/月', '120GB/月',
    '恒星标准版', '¥50/月', '240GB/月',
    '星系专业版', '¥100/月', '500GB/月',
    '寰宇旗舰版', '¥200/月', '1TB/月',
    '季付 95 折', '半年 9 折', '年付 85 折', '两年 8 折', '三年 7 折',
    '不限制设备数量', '自研客户端',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `宇宙云: missing ${fact}`);
  }
  assert.match(html, /“重置 9 折”[^。]*(?:含义|条件)[^。]*未(?:说明|确认)/);
  assert.match(html, /购买前[^。]*咨询客服/);
  assert.match(html, /商家(?:套餐页|称)[^。]*全 IEPL/);
  assert.doesNotMatch(html, /YUZHOU553|img\/yuzhouyun\/|永不泄露|7x24 小时极速响应/);
});

test('万象加速 review makes the no-refund rule prominent and attributes coverage claims', () => {
  const html = read('jichang/wanxiang/index.html');
  for (const fact of [
    '季付套餐', '¥28/季度', '1000GB/月', '500Mbps',
    '年付套餐', '¥58/年', '500GB/月',
    '小象年套餐', '¥88/年',
    '小象套餐', '¥12/月', '约 18%', '节省约 ¥26',
    '中象套餐', '¥20/月', '3000GB/月', '1000Mbps', '约 44%', '节省约 ¥320',
    '大象套餐', '¥30/月', '10000GB/月', '2.5Gbps',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `万象加速: missing ${fact}`);
  }
  const verdict = html.match(/<section class="review-verdict">[\s\S]*?<\/section>/)?.[0] ?? '';
  const risk = html.match(/<section class="review-risk">[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(verdict, /不设退款/);
  assert.match(risk, /不设退款/);
  for (const claim of ['CN2', 'CUII', 'CMI', '全部媒体服务器接入', '新疆地区可用']) {
    assert.match(html, new RegExp(`商家[^。]*${claim}`), `万象加速: ${claim} lacks merchant attribution`);
  }
  assert.doesNotMatch(html, /atEIcYT3|img\/wanxiang\/|全场 5折|高速稳定的网络体验/);
});

test('third-batch metadata and commercial routes match the cautious visible reviews', () => {
  for (const [name, file] of thirdBatchReviews) {
    const html = read(file);
    const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description') ?? '';
    assert.doesNotMatch(attribute(description, 'content'), /安全稳定|高速稳定|全解锁|优质机场|保证可用/);

    const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
    assert.ok(article, `${name}: missing Article structured data`);
    assert.equal(article.author?.name, '优质机场推荐编辑部');
    assert.equal(article.dateModified, '2026-07-05');
    assert.ok(structuredData(html).some((entry) => entry['@type'] === 'FAQPage'), `${name}: missing FAQPage`);

    const commercial = tags(html, 'a').find((anchor) => {
      return attribute(anchor, 'class').split(/\s+/).includes('btn-primary')
        && attribute(anchor, 'href').startsWith('http');
    });
    assert.ok(commercial, `${name}: missing commercial CTA`);
    assert.deepEqual(new Set(attribute(commercial, 'rel').split(/\s+/)), new Set(['sponsored', 'nofollow', 'noopener']));
  }
});

test('airport hub and sitemap expose only the completed third-batch evidence', () => {
  const hub = read('jichang/index.html');
  const expectedCards = new Map([
    ['扬帆云', ['data-review-date="2026-07-05"', '¥19.99/月起', '100GB–1.2TB/周期', '2–8 台设备']],
    ['宇宙云', ['data-review-date="2026-07-05"', '¥96/年起', '60GB–1TB/月', '重置 9 折条件待咨询']],
    ['万象加速', ['data-review-date="2026-07-05"', '¥12/月起', '500–10000GB/月', '不设退款']],
  ]);
  for (const [name, facts] of expectedCards) {
    const card = airportCard(hub, name);
    for (const fact of facts) assert.match(card, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${name} card: missing ${fact}`);
  }
  assert.equal((hub.match(/data-review-date="2026-07-05"/g) ?? []).length, 4);

  const sitemap = read('sitemap.xml');
  for (const path of ['jichang/', 'jichang/yangfanyun/', 'jichang/yuzhouyun/', 'jichang/wanxiang/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-05<\\/lastmod>`));
  }
});

test('Quick Cloud review uses the shared editorial structure and attributes merchant claims', () => {
  const html = read('jichang/quickcloud/index.html');
  for (const section of [
    'review-meta',
    'review-verdict',
    'review-audience',
    'review-pros-cons',
    'plan-table-wrap',
    'review-risk',
    'review-sources',
    'related-guides',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `Quick Cloud: missing ${section}`);
  }
  assert.match(html, /优质机场推荐编辑部/);
  assert.match(html, /官方套餐页核验/);
  assert.match(html, /<time datetime="2026-07-05">2026-07-05<\/time>/);
  assert.match(html, /本文仅整理公开资料，实际体验因地区、运营商、设备和时段而异。/);
  for (const claim of ['60+ 节点', '住宅家宽节点', 'GPT', '12 小时']) {
    const escaped = claim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(html, new RegExp(`商家[^。]*${escaped}`), `Quick Cloud: ${claim} lacks merchant attribution`);
  }
  assert.doesNotMatch(html, /本站实测(?:表明|显示|达到)|本站测速(?:表明|显示|达到)|亲测(?:可达|达到|稳定)|永久可用|全解锁/);
});

test('Quick Cloud review preserves current recurring and non-expiring package facts', () => {
  const html = read('jichang/quickcloud/index.html');
  for (const fact of [
    '月付 300G 体验套餐', '¥12.9/月', '300GB/月',
    '月付 500G 套餐', '¥19.9/月', '500GB/月',
    '月付 1000G 套餐', '¥27.9/月', '1000GB/月',
    '800G 无时间限制', '¥69/一次性', '800GB 总量',
    '2000G 无时间限制', '¥119/一次性', '2000GB 总量',
    '5000G 无时间限制', '¥219/一次性', '5000GB 总量',
    '月付、季付、半年付、年付', '不限使用时间、不重置',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Quick Cloud: missing ${fact}`);
  }
  assert.match(html, /商家套餐页[^。]*1000G[^。]*“推荐”/);
  assert.match(html, /普通套餐[^。]*(?:设备数量|设备数)[^。]*未提供/);
  assert.match(html, /普通套餐[^。]*限速[^。]*未提供/);
  assert.match(html, /普通套餐[^。]*退款[^。]*未提供/);
  assert.match(html, /活动[^。]*(?:规则|截止日期)[^。]*未提供/);
  assert.doesNotMatch(html, /img\/quickcloud\//);
});

test('Quick Cloud node customization keeps managed and unmanaged obligations distinct', () => {
  const html = read('jichang/quickcloud/index.html');
  for (const fact of [
    '节点定制', '¥189/月', '流量按月重置', '最高峰值 1000Mbps',
    '托管式', '2500GB', '8 倍率', '不限制同时在线设备',
    '非托管式', '1000GB', '无倍率', 'root', '自行部署',
    '3 个工作日内交付', '7×24 小时技术支持', '下单前确认库存',
  ]) {
    assert.match(html, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Quick Cloud customization: missing ${fact}`);
  }
  assert.match(html, /商家[^。]*独立原生纯净节点/);
  assert.match(html, /特殊需求[^。]*额外付费/);
  assert.match(html, /非托管式[^。]*不提供节点技术服务/);
});

test('Quick Cloud metadata is current while retired airport links leave active discovery surfaces', () => {
  const html = read('jichang/quickcloud/index.html');
  const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description') ?? '';
  assert.doesNotMatch(attribute(description, 'content'), /优质机场|全解锁|高速稳定|保证可用/);
  assert.match(html, /<link rel="icon" href="\/favicon\.ico"/);
  assert.doesNotMatch(html, /href="\/img\/(?:favicon\.svg|apple-touch-icon\.png)"/);

  const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
  assert.equal(article?.author?.name, '优质机场推荐编辑部');
  assert.equal(article?.dateModified, '2026-07-05');
  assert.ok(structuredData(html).some((entry) => entry['@type'] === 'FAQPage'));

  const hub = read('jichang/index.html');
  const card = airportCard(hub, 'Quick Cloud');
  for (const fact of ['data-review-date="2026-07-05"', '¥12.9/月起', '300–1000GB/月', '不限时流量包']) {
    assert.match(card, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Quick Cloud card: missing ${fact}`);
  }
  assert.equal(airportCard(hub, '龙猫云'), '');
  assert.doesNotMatch(hub, /href="\/jichang\/longmiaoyun\/"/);
  const nav = read('js/nav.js');
  assert.doesNotMatch(nav, /href:\s*['"]\/jichang\/(?:guangnian|longmiaoyun)\/['"]/);

  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/www\.jichangyun\.top\/jichang\/quickcloud\/<\/loc>\s*<lastmod>2026-07-05<\/lastmod>/);
  assert.doesNotMatch(sitemap, /\/jichang\/(?:guangnian|longmiaoyun)\//);
  for (const file of ['jichang/guangnian/index.html', 'jichang/longmiaoyun/index.html']) {
    assert.ok(existsSync(join(root, file)), `${file}: retired page must remain available`);
    assert.doesNotMatch(read(file), /<meta name="robots" content="noindex/);
  }
});

test('subscription update troubleshooting separates download, authorization, and parsing failures', () => {
  const file = 'guide/subscription-update-failed/index.html';
  assert.ok(existsSync(join(root, file)), `${file}: page must exist`);
  const html = read(file);

  assert.match(html, /<title>Clash订阅更新失败怎么办/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.jichangyun\.top\/guide\/subscription-update-failed\/">/);
  for (const section of [
    'troubleshooting-meta',
    'symptom-check',
    'quick-check',
    'diagnostic-table-wrap',
    'recovery-steps',
    'troubleshooting-sources',
    'related-guides',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `${file}: missing ${section}`);
  }

  for (const fact of [
    '下载失败',
    '下载后无法解析',
    '401',
    '403',
    'timeout',
    'network error',
    'parse',
    'config validation',
    '订阅 URL',
    '令牌',
    '账号',
    '节点地址',
  ]) {
    assert.match(html, new RegExp(fact, 'i'), `${file}: missing ${fact}`);
  }

  assert.match(html, /wiki\.metacubex\.one/);
  assert.match(html, /github\.com\/clash-verge-rev\/clash-verge-rev/);
  assert.doesNotMatch(html, /订阅转换站|关闭防火墙|关闭杀毒软件|解决\s*99%|直接删除所有配置/);

  const faq = structuredData(html).find((entry) => entry['@type'] === 'FAQPage');
  assert.ok(faq?.mainEntity?.length >= 3, `${file}: missing FAQPage questions`);
});

test('connected but no internet troubleshooting isolates proxy, TUN, DNS, and node failures', () => {
  const file = 'guide/connected-but-no-internet/index.html';
  assert.ok(existsSync(join(root, file)), `${file}: page must exist`);
  const html = read(file);

  assert.match(html, /<title>Clash显示已连接但无法上网怎么办/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.jichangyun\.top\/guide\/connected-but-no-internet\/">/);
  for (const section of [
    'troubleshooting-meta',
    'symptom-check',
    'quick-check',
    'diagnostic-table-wrap',
    'recovery-steps',
    'troubleshooting-sources',
    'related-guides',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `${file}: missing ${section}`);
  }

  for (const fact of [
    '系统代理',
    'TUN',
    'DNS',
    '切换节点',
    '手机热点',
    '浏览器',
    '订阅更新',
    '回退',
  ]) {
    assert.match(html, new RegExp(fact, 'i'), `${file}: missing ${fact}`);
  }

  assert.match(html, /wiki\.metacubex\.one\/config\/general/);
  assert.match(html, /wiki\.metacubex\.one\/config\/inbound\/tun/);
  assert.match(html, /support\.microsoft\.com/);
  assert.match(html, /support\.apple\.com/);
  assert.doesNotMatch(html, /关闭防火墙|关闭杀毒软件|解决\s*99%|直接删除所有配置|万能配置/);

  const faq = structuredData(html).find((entry) => entry['@type'] === 'FAQPage');
  assert.ok(faq?.mainEntity?.length >= 3, `${file}: missing FAQPage questions`);
});

test('frequent disconnections acts as a symptom-first troubleshooting hub', () => {
  const file = 'guide/frequent-disconnections/index.html';
  const html = read(file);

  assert.match(html, /<title>Clash连不上或频繁断线怎么办/);
  for (const section of [
    'troubleshooting-meta',
    'symptom-check',
    'quick-check',
    'diagnostic-table-wrap',
    'recovery-steps',
    'troubleshooting-sources',
    'related-guides',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `${file}: missing ${section}`);
  }

  for (const destination of [
    '/guide/subscription-update-failed/',
    '/guide/connected-but-no-internet/',
  ]) {
    assert.match(html, new RegExp(`href="${destination}"`), `${file}: missing route to ${destination}`);
  }
  for (const symptom of ['无法连接', '频繁断线', '已连接但无法上网', '订阅更新失败', '手机热点', '回退']) {
    assert.match(html, new RegExp(symptom), `${file}: missing ${symptom}`);
  }

  assert.match(html, /wiki\.metacubex\.one/);
  assert.match(html, /github\.com\/clash-verge-rev\/clash-verge-rev/);
  assert.doesNotMatch(html, /关闭防火墙|关闭杀毒软件|解决\s*99%|直接删除所有配置|晚高峰[^。]*(?:多半|一定)/);

  const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
  assert.equal(article?.dateModified, '2026-07-04');
  const faq = structuredData(html).find((entry) => entry['@type'] === 'FAQPage');
  assert.ok(faq?.mainEntity?.length >= 3, `${file}: missing FAQPage questions`);
});

test('guide hub exposes the troubleshooting cluster with self-consistent metadata', () => {
  const html = read('guide/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.jichangyun\.top\/guide\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/www\.jichangyun\.top\/guide\/">/);

  const collection = structuredData(html).find((entry) => entry['@type'] === 'CollectionPage');
  assert.equal(collection?.url, 'https://www.jichangyun.top/guide/');
  const breadcrumb = structuredData(html).find((entry) => entry['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb?.itemListElement?.[1]?.item, 'https://www.jichangyun.top/guide/');

  assert.match(html, /class="[^"]*guide-start[^"]*"/);
  for (const destination of [
    '/guide/frequent-disconnections/',
    '/guide/subscription-update-failed/',
    '/guide/connected-but-no-internet/',
  ]) {
    assert.ok((html.match(new RegExp(`href="${destination}"`, 'g')) ?? []).length >= 2, `guide hub: weak route to ${destination}`);
  }
  for (const label of ['故障排查入口', '订阅更新失败', '已连接但无法上网']) {
    assert.match(html, new RegExp(label), `guide hub: missing ${label}`);
  }

  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/www\.jichangyun\.top\/guide\/<\/loc>\s*<lastmod>2026-07-04<\/lastmod>/);
});

const maintainedTutorials = [
  {
    file: 'tutorial/clash-verge/index.html',
    name: 'Clash Verge Rev',
    version: 'v2.5.1',
    oldVersion: 'v2.4.7',
    official: 'github.com/clash-verge-rev/clash-verge-rev/releases/latest',
    platforms: ['Windows x64', 'Windows ARM64', 'Apple 芯片', 'Intel 芯片', 'Linux', 'Windows 7'],
  },
  {
    file: 'tutorial/flclash/index.html',
    name: 'FlClash',
    version: 'v0.8.93',
    oldVersion: 'v0.8.92',
    official: 'github.com/chen08209/FlClash/releases/latest',
    platforms: ['Windows', 'macOS', 'Linux', 'Android'],
  },
  {
    file: 'tutorial/clash-meta-for-android/index.html',
    name: 'Clash Meta for Android',
    version: 'v2.11.30',
    oldVersion: 'v2.11.24',
    official: 'github.com/MetaCubeX/ClashMetaForAndroid/releases/latest',
    platforms: ['Android', 'APK', 'arm64-v8a', 'VPN 权限', '后台限制'],
  },
];

for (const tutorial of maintainedTutorials) {
  test(`${tutorial.name} tutorial uses current official evidence and a safe setup path`, () => {
    const html = read(tutorial.file);
    for (const section of [
      'tutorial-meta',
      'tutorial-fit',
      'platform-table-wrap',
      'official-download',
      'setup-steps',
      'tutorial-safety',
      'troubleshooting-links',
      'tutorial-sources',
      'related-guides',
    ]) {
      assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `${tutorial.file}: missing ${section}`);
    }
    assert.match(html, new RegExp(tutorial.name, 'i'));
    assert.match(html, new RegExp(`截至 2026-07-04 核验[：:]\\s*${tutorial.version.replaceAll('.', '\\.')}`));
    assert.match(html, new RegExp(tutorial.official.replaceAll('.', '\\.')));
    for (const platform of tutorial.platforms) assert.match(html, new RegExp(platform, 'i'), `${tutorial.file}: missing ${platform}`);
    for (const href of [
      '/guide/subscription-update-failed/',
      '/guide/connected-but-no-internet/',
      '/guide/frequent-disconnections/',
    ]) assert.match(html, new RegExp(`href="${href}"`), `${tutorial.file}: missing ${href}`);

    assert.doesNotMatch(html, /github\.clash\.download/);
    assert.doesNotMatch(html, new RegExp(tutorial.oldVersion.replaceAll('.', '\\.')));
    assert.doesNotMatch(html, /最受欢迎|最好用|完全兼容|安全的！|关闭防火墙|关闭杀毒软件|绕过安全/);

    const article = structuredData(html).find((entry) => entry['@type'] === 'Article');
    assert.equal(article?.author?.name, '优质机场推荐编辑部');
    assert.equal(article?.dateModified, '2026-07-04');
    assert.ok(structuredData(html).some((entry) => entry['@type'] === 'BreadcrumbList'));
    assert.ok(structuredData(html).some((entry) => entry['@type'] === 'FAQPage'));
  });
}

test('tutorial hub separates maintained clients from historical and general guides', () => {
  const html = read('tutorial/index.html');
  for (const section of ['maintained-clients', 'historical-clients', 'general-tutorials']) {
    assert.match(html, new RegExp(`class="[^"]*${section}[^"]*"`), `tutorial hub: missing ${section}`);
  }
  const maintained = html.match(/<section class="[^"]*maintained-clients[^"]*">[\s\S]*?<\/section>/)?.[0] ?? '';
  for (const name of ['Clash Verge Rev', 'FlClash', 'Clash Meta for Android']) assert.match(maintained, new RegExp(name));
  assert.doesNotMatch(maintained, /Clash for Windows|Clash for Android/);
  const historical = html.match(/<section class="[^"]*historical-clients[^"]*">[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(historical, /Clash for Windows/);
  assert.match(historical, /Clash for Android/);
  assert.match(historical, /停止维护|历史客户端/);

  const sitemap = read('sitemap.xml');
  for (const path of ['tutorial/', 'tutorial/clash-verge/', 'tutorial/flclash/', 'tutorial/clash-meta-for-android/']) {
    assert.match(sitemap, new RegExp(`<loc>https:\/\/www\\.jichangyun\\.top\/${path}<\\/loc>\\s*<lastmod>2026-07-04<\\/lastmod>`));
  }
});

test('brand assets provide a real favicon and a 1200 by 630 social image', () => {
  const favicon = join(root, 'favicon.ico');
  const social = join(root, 'img/social-share-1200x630.png');
  assert.ok(existsSync(favicon), 'favicon.ico must exist at the site root');
  assert.ok(existsSync(social), 'social share image must exist');
  const ico = readFileSync(favicon);
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
  const png = readFileSync(social);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.notDeepEqual(png, readFileSync(join(root, 'img/clash-300x300.png')));
});

test('core hubs publish complete favicon and large social card metadata', () => {
  const pages = new Map([
    ['index.html', '优质机场推荐首页'],
    ['jichang/index.html', '机场推荐与评测'],
    ['tutorial/index.html', '客户端使用教程'],
    ['guide/index.html', '机场百科与故障排查'],
  ]);
  for (const [file, alt] of pages) {
    const html = read(file);
    assert.match(html, /<link rel="icon" href="\/favicon\.ico"[^>]*>/, `${file}: missing favicon`);
    assert.match(html, /<meta property="og:image" content="https:\/\/www\.jichangyun\.top\/img\/social-share-1200x630\.png">/);
    assert.match(html, /<meta property="og:image:width" content="1200">/);
    assert.match(html, /<meta property="og:image:height" content="630">/);
    assert.match(html, new RegExp(`<meta property="og:image:alt" content="[^"]*${alt}[^"]*">`));
    assert.match(html, /<meta name="twitter:image" content="https:\/\/www\.jichangyun\.top\/img\/social-share-1200x630\.png">/);
    assert.match(html, new RegExp(`<meta name="twitter:image:alt" content="[^"]*${alt}[^"]*">`));
    assert.doesNotMatch(html, /<meta (?:property="og:image"|name="twitter:image") content="[^"]*clash-300x300\.png">/);
  }
});

test('repository documents one static Cloudflare Pages architecture without Waline or Vercel runtime', () => {
  assert.ok(!existsSync(join(root, 'waline')), 'legacy Waline runtime must be removed');
  assert.ok(!existsSync(join(root, 'vercel.json')), 'legacy Vercel config must be removed');
  assert.doesNotMatch(read('css/main.css'), /#waline\b/);
  assert.doesNotMatch(read('.gitignore'), /^\.vercel\/?$/m);

  const deployment = read('docs/cloudflare-pages-deployment.md');
  for (const fact of ['Cloudflare Pages', '纯静态', 'exit 0', '无需环境变量', 'favicon.ico', 'sitemap.xml', 'robots.txt', '回滚']) {
    assert.match(deployment, new RegExp(fact, 'i'), `deployment docs: missing ${fact}`);
  }
  assert.match(deployment, /developers\.cloudflare\.com\/pages/);
  assert.match(deployment, /撤销并轮换/);

  const instructions = read('CLAUDE.md');
  assert.match(instructions, /Cloudflare Pages/);
  assert.doesNotMatch(instructions, /deployed on Vercel|Vercel Deployment|\.vercel\/|\/download\//i);

  const giscusPages = walkHtml('.').filter((file) => /giscus\.app\/client\.js/.test(read(file)));
  assert.ok(giscusPages.length >= 10, 'Giscus content comments must remain intact');
});

test('outbound tracking sends only privacy-minimized fields with evidence-aware link types', () => {
  const tracking = loadOutboundTracking();
  const cases = [
    {
      target: outboundClickTarget({
        href: 'https://Vendor.Example/register?code=SECRET#checkout',
        rel: 'sponsored nofollow noopener',
        sourceClass: 'tutorial-sources',
      }),
      domain: 'vendor.example',
      type: 'sponsored',
    },
    ...['official-download', 'tutorial-sources', 'troubleshooting-sources'].map((sourceClass) => ({
      target: outboundClickTarget({ href: 'https://GitHub.com/project/releases?token=SECRET', sourceClass }),
      domain: 'github.com',
      type: 'official',
    })),
    {
      target: outboundClickTarget({ href: 'https://Example.org/story?ref=SECRET' }),
      domain: 'example.org',
      type: 'external',
    },
  ];

  for (const item of cases) assert.equal(tracking.click(item.target), 0, 'tracking must not delay navigation');
  assert.equal(tracking.calls.length, cases.length);

  tracking.calls.forEach((call, index) => {
    const [command, eventName, rawPayload] = call;
    const payload = JSON.parse(JSON.stringify(rawPayload));
    assert.equal(command, 'event');
    assert.equal(eventName, 'outbound_link');
    assert.deepEqual(Object.keys(payload).sort(), ['link_domain', 'link_type', 'page_path']);
    assert.deepEqual(payload, {
      link_domain: cases[index].domain,
      link_type: cases[index].type,
      page_path: '/jichang/example/',
    });
  });

  const serialized = JSON.stringify(tracking.calls);
  for (const privateValue of ['SECRET', '/register', 'checkout', 'Sensitive link text']) {
    assert.doesNotMatch(serialized, new RegExp(privateValue), `analytics payload leaked ${privateValue}`);
  }
});

test('outbound tracking ignores internal links and non-HTTP destinations', () => {
  const tracking = loadOutboundTracking();
  for (const href of [
    '/guide/avoid-traps/?from=nav',
    'https://www.jichangyun.top/tutorial/?from=nav',
    'https://jichangyun.top/jichang/?from=nav',
    'mailto:hello@example.com',
    'tel:+861234567890',
    'javascript:void(0)',
    'ftp://downloads.example.com/client.zip',
    'https://[',
  ]) {
    tracking.click(outboundClickTarget({ href }));
  }
  assert.equal(tracking.calls.length, 0);

  tracking.click(outboundClickTarget({ href: 'https://docs.example.com/start' }));
  assert.equal(tracking.calls.length, 1, 'the filter must not disable valid external HTTPS links');
});

test('outbound tracking normalizes the www prefix on external domains', () => {
  const tracking = loadOutboundTracking();
  tracking.click(outboundClickTarget({ href: 'https://WWW.Example.com/path' }));
  const payload = JSON.parse(JSON.stringify(tracking.calls[0]?.[2]));
  assert.equal(payload?.link_domain, 'example.com');
});

test('outbound tracking tolerates non-element targets and partial anchor APIs', () => {
  const tracking = loadOutboundTracking();
  assert.doesNotThrow(() => tracking.click({}));

  const anchor = {
    getAttribute(name) {
      return name === 'href' ? 'https://example.net/path' : null;
    },
  };
  const target = {
    closest(selector) {
      return selector === 'a[href]' ? anchor : null;
    },
  };
  assert.doesNotThrow(() => tracking.click(target));
  assert.equal(tracking.calls.length, 1);
  assert.equal(tracking.calls[0][2].link_type, 'external');
});

test('outbound tracking handles valid clicks but is inert when GA4 is unavailable', () => {
  const tracking = loadOutboundTracking({ withGtag: false });
  const target = outboundClickTarget({ href: 'https://example.com/?code=SECRET' });
  assert.doesNotThrow(() => tracking.click(target));
  assert.equal(tracking.click(target), 0, 'missing analytics must not prevent navigation');
  assert.deepEqual(tracking.calls, []);

  const enabled = loadOutboundTracking();
  enabled.click(target);
  assert.equal(enabled.calls.length, 1, 'the same valid click must be tracked when GA4 is available');
});

test('maintained tutorial pages load the same GA4 initializer as the rest of the site', () => {
  const expected = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-HPYY57ECEX"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-HPYY57ECEX');
</script>`;
  for (const file of [
    'tutorial/index.html',
    'tutorial/clash-verge/index.html',
    'tutorial/flclash/index.html',
    'tutorial/clash-meta-for-android/index.html',
  ]) {
    assert.match(read(file), new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file}: inconsistent GA4 initializer`);
  }
});

test('GA4 outbound tracking docs preserve the privacy boundary and deployment prerequisite', () => {
  const docs = read('docs/ga4-outbound-tracking.md');
  for (const fact of [
    'outbound_link',
    'link_domain',
    'link_type',
    'page_path',
    'Enhanced Measurement',
    'Outbound clicks',
    'link_url',
  ]) {
    assert.match(docs, new RegExp(fact, 'i'), `GA4 docs: missing ${fact}`);
  }
  assert.match(docs, /关闭[^。\n]*Outbound clicks|Outbound clicks[^。\n]*关闭/i);
  assert.match(docs, /不(?:发送|采集)[^。\n]*(?:完整 URL|查询参数|推广码)/);
});

test('GitHub README routes readers to the official site and nine useful deep links', () => {
  assert.ok(existsSync(join(root, 'README.md')), 'README.md must introduce the project on GitHub');
  const readme = read('README.md');
  for (const heading of ['机场资料', '客户端教程', '故障排查']) {
    assert.match(readme, new RegExp(`^## ${heading}$`, 'm'), `README: missing ${heading}`);
  }
  for (const url of [
    'https://www.jichangyun.top/',
    'https://www.jichangyun.top/jichang/',
    'https://www.jichangyun.top/tutorial/line-selection/',
    'https://www.jichangyun.top/guide/avoid-traps/',
    'https://www.jichangyun.top/tutorial/clash-verge/',
    'https://www.jichangyun.top/tutorial/flclash/',
    'https://www.jichangyun.top/tutorial/clash-meta-for-android/',
    'https://www.jichangyun.top/guide/frequent-disconnections/',
    'https://www.jichangyun.top/guide/subscription-update-failed/',
    'https://www.jichangyun.top/guide/connected-but-no-internet/',
  ]) {
    assert.match(readme, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `README: missing ${url}`);
  }
});

test('GitHub README states the evidence and contribution boundary without promotional claims', () => {
  assert.ok(existsSync(join(root, 'README.md')), 'README.md must document evidence boundaries');
  const readme = read('README.md');
  for (const fact of [
    '公开来源',
    '核验日期',
    '商家描述保留商家归因',
    '实际体验可能因地区、运营商、设备和时段变化',
    'Token',
    'Cookie',
    '账号',
    '订阅地址',
  ]) {
    assert.match(readme, new RegExp(fact), `README: missing ${fact}`);
  }
  assert.doesNotMatch(readme, /#\/register|[?&]code=|优惠码|邀请码|最佳机场|稳定性排名|本站实测(?:表明|显示)|自然外链|社区背书|\d+[kK]?\+?\s+Stars|MIT License|Apache License/);
});

test('GitHub README documents the static workflow and only links to repository files that exist', () => {
  assert.ok(existsSync(join(root, 'README.md')), 'README.md must document the project workflow');
  const readme = read('README.md');
  for (const fact of [
    '纯静态',
    'Cloudflare Pages',
    'HTML5',
    'CSS',
    'JavaScript',
    'python3 -m http.server 8080',
    'node --test tests/site-audit.test.mjs',
    'docs/cloudflare-pages-deployment.md',
  ]) {
    assert.match(readme, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `README: missing ${fact}`);
  }

  const missing = [];
  for (const match of readme.matchAll(/\[[^\]]+\]\((?!https?:\/\/|#)([^)]+)\)/g)) {
    const target = match[1].split('#', 1)[0];
    if (target && !existsSync(join(root, target))) missing.push(target);
  }
  assert.deepEqual(missing, []);
});
