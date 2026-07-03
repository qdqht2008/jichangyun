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

test('airport hub and sitemap mark only 飞鸟云 as the completed second-batch review', () => {
  const hub = read('jichang/index.html');
  const card = hub.match(/<div class="airport-card"[^>]*>[\s\S]*?<h3 class="airport-card-title">飞鸟云<\/h3>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.match(card, /data-review-date="2026-07-03"/);
  assert.match(card, /¥12\/年起/);
  assert.match(card, /Hysteria2（商家标注）/);
  assert.match(card, /购买后不退款/);
  assert.equal((hub.match(/data-review-date="2026-07-03"/g) ?? []).length, 1);

  const sitemap = read('sitemap.xml');
  for (const path of ['jichang/', 'jichang/feiniaoyun/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-07-03<\\/lastmod>`));
  }
  for (const path of ['jichang/sy/', 'jichang/hongxing/']) {
    const url = `https://www.jichangyun.top/${path}`;
    assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc>\\s*<lastmod>2026-06-23<\\/lastmod>`));
  }
});
