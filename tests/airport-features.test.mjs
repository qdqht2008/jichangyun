import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateScore,
  filterAirports,
  sortAirports,
  validateAirportRecords,
} from '../js/airport-data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expectedActiveSlugs = [
  'dageyun',
  'feimiaoyun',
  'feiniaoyun',
  'hongxing',
  'jinglingxueyuan',
  'jisuyun',
  'quickcloud',
  'sy',
  'wanxiang',
  'yangfanyun',
  'yuzhouyun',
];

function read(file) {
  return readFileSync(join(root, file), 'utf8');
}

function fixture(overrides = {}) {
  return {
    identity: {
      slug: 'fixture',
      name: '测试机场',
      detailUrl: '/jichang/fixture/',
      website: 'https://example.com/',
    },
    pricing: {
      monthlyFrom: 20,
      hasTrial: false,
      billingCycles: ['monthly'],
    },
    capabilities: {
      clients: ['Clash'],
      streaming: ['ChatGPT'],
      payments: ['支付宝'],
      regions: ['香港'],
    },
    scoreInputs: {
      websiteHealth: 80,
      value: 70,
      usability: 60,
      riskSafety: 90,
    },
    scoreEvidence: {
      websiteHealth: '三次公开官网请求',
      value: '按最低月付与流量门槛整理',
      usability: '按客户端、教程与限制信息整理',
      riskSafety: '按公开风险事实与购买限制整理',
    },
    health: {
      reachable: true,
      finalUrl: 'https://example.com/',
      httpStatus: 200,
      medianResponseMs: 500,
      tlsValidUntil: '2026-12-31T00:00:00.000Z',
      checkedAt: '2026-07-15T00:00:00.000Z',
      runner: 'editorial-check',
    },
    risk: {
      level: 'normal',
      summary: '当前未记录可核验异常',
      evidence: [],
      reviewedAt: '2026-07-15',
    },
    metadata: {
      sources: ['现有详情页'],
      reviewedAt: '2026-07-15',
    },
    ...overrides,
  };
}

test('airport data covers every active recommendation without reviving retired pages', () => {
  const records = JSON.parse(readFileSync(join(root, 'data/airports.json'), 'utf8'));
  assert.deepEqual(validateAirportRecords(records), []);
  assert.deepEqual(records.map((record) => record.identity.slug).sort(), expectedActiveSlugs);
  assert.ok(!records.some((record) => ['guangnian', 'longmiaoyun'].includes(record.identity.slug)));
});

test('editorial score uses the published website-health formula', () => {
  assert.equal(calculateScore({
    websiteHealth: 80,
    value: 60,
    usability: 90,
    riskSafety: 100,
  }), 81);
});

test('missing evidence produces an unknown score instead of a misleading zero', () => {
  assert.equal(calculateScore({
    websiteHealth: null,
    value: 60,
    usability: 90,
    riskSafety: 100,
  }), null);
});

test('high-risk airports cannot outrank normal airports through a higher score', () => {
  const normal = fixture({
    identity: { ...fixture().identity, slug: 'normal', name: '正常机场' },
    scoreInputs: { websiteHealth: 10, value: 10, usability: 10, riskSafety: 10 },
  });
  const high = fixture({
    identity: { ...fixture().identity, slug: 'high', name: '高风险机场' },
    risk: { ...fixture().risk, level: 'high' },
    scoreInputs: { websiteHealth: 100, value: 100, usability: 100, riskSafety: 100 },
  });
  assert.deepEqual(sortAirports([high, normal]).map((record) => record.identity.slug), ['normal', 'high']);
});

test('equal scores use a deterministic Chinese-name tie breaker', () => {
  const alpha = fixture({ identity: { ...fixture().identity, slug: 'alpha', name: '安云' } });
  const beta = fixture({ identity: { ...fixture().identity, slug: 'beta', name: '白云' } });
  assert.deepEqual(sortAirports([beta, alpha]).map((record) => record.identity.slug), ['alpha', 'beta']);
});

test('combined filters narrow by query, risk, price, trial, client, and streaming capability', () => {
  const matching = fixture({
    identity: { ...fixture().identity, slug: 'matching', name: '暖云机场' },
    pricing: { ...fixture().pricing, monthlyFrom: 12, hasTrial: true },
    capabilities: {
      ...fixture().capabilities,
      clients: ['Clash Verge'],
      streaming: ['Netflix', 'ChatGPT'],
    },
  });
  const other = fixture({
    identity: { ...fixture().identity, slug: 'other', name: '其他服务' },
    pricing: { ...fixture().pricing, monthlyFrom: 40 },
  });
  const result = filterAirports([matching, other], {
    query: '暖云',
    risk: 'normal',
    maxPrice: 20,
    trial: 'yes',
    client: 'Clash Verge',
    streaming: 'Netflix',
  });
  assert.deepEqual(result.map((record) => record.identity.slug), ['matching']);
});

test('ranking page exposes transparent scoring and every agreed filter', () => {
  const html = read('rankings/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.jichangyun\.top\/rankings\/">/);
  assert.match(html, /id="ranking-results"/);
  for (const id of ['ranking-query', 'ranking-risk', 'ranking-price', 'ranking-trial', 'ranking-client', 'ranking-streaming', 'ranking-clear']) {
    assert.match(html, new RegExp(`id="${id}"`), `ranking page: missing ${id}`);
  }
  assert.match(html, /官网健康度只评价公开入口/);
  assert.match(html, /src="\/js\/rankings\.js"/);
});

test('risk monitor separates evidence-led status from promises of absolute safety', () => {
  const html = read('risk-monitor/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.jichangyun\.top\/risk-monitor\/">/);
  assert.match(html, /id="risk-groups"/);
  assert.match(html, /当前未记录可核验异常/);
  assert.match(html, /不等于绝对安全/);
  assert.doesNotMatch(html, /保证绝对安全|永不跑路|保证稳定/);
  assert.match(html, /src="\/js\/risk-monitor\.js"/);
});

test('every active airport detail keeps its article and gains one data-report mount', () => {
  for (const slug of expectedActiveSlugs) {
    const html = read(`jichang/${slug}/index.html`);
    assert.match(html, new RegExp(`<section id="airport-data-report" data-airport-slug="${slug}"`), `${slug}: missing report mount`);
    assert.match(html, /<script type="module" src="\/js\/airport-report\.js"><\/script>/, `${slug}: missing report module`);
    assert.match(html, /class="article-(?:content|header)"/, `${slug}: original article structure missing`);
  }
});

test('global navigation exposes the ranking and detector without replacing airport recommendations', () => {
  const nav = read('js/nav.js');
  assert.match(nav, /href: '\/jichang\/', label: '机场推荐'/);
  assert.match(nav, /href: '\/rankings\/', label: '机场榜'/);
  assert.match(nav, /href: '\/tools\/streaming-check\/', label: '检测工具'/);
});
