import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteSections = ['contactus', 'guide', 'jichang', 'tutorial'];

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
