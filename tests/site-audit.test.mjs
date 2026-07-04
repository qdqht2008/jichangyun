import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  assert.match(homepage, /<time datetime="2026-06-30">/);
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
  const expectedUrls = publicHtmlFiles().map(publicUrlFor).sort();
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
  for (const path of ['jichang/', 'jichang/hongxing/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-04<\\/lastmod>`));
  }
  for (const path of ['jichang/feiniaoyun/', 'jichang/sy/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-03<\\/lastmod>`));
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
