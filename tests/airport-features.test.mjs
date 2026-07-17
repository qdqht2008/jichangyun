import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendHealthHistoryRecords,
  applyHealthHistory,
  calculateScore,
  calculateHealthHistoryStats,
  filterAirports,
  sortAirports,
  validateAirportRecords,
  validateHealthHistory,
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

function historyRecord(slug, checkedAt, websiteHealth, healthOverrides = {}) {
  return {
    slug,
    checkedAt,
    websiteHealth,
    health: {
      reachable: websiteHealth > 0,
      finalUrl: 'https://example.com/',
      httpStatus: websiteHealth > 0 ? 200 : null,
      successfulAttempts: websiteHealth > 0 ? 3 : 0,
      medianResponseMs: websiteHealth > 0 ? 500 : null,
      tlsValidUntil: websiteHealth > 0 ? '2026-12-31T00:00:00.000Z' : null,
      runner: 'test-runner',
      error: websiteHealth > 0 ? null : 'Reachability quorum failed',
      ...healthOverrides,
    },
  };
}

test('airport data covers every active recommendation without reviving retired pages', () => {
  const records = JSON.parse(readFileSync(join(root, 'data/airports.json'), 'utf8'));
  assert.deepEqual(validateAirportRecords(records), []);
  assert.deepEqual(records.map((record) => record.identity.slug).sort(), expectedActiveSlugs);
  assert.ok(!records.some((record) => ['guangnian', 'longmiaoyun'].includes(record.identity.slug)));
});

test('health history starts from real checks for every active recommendation', () => {
  const history = JSON.parse(readFileSync(join(root, 'data/airport-health-history.json'), 'utf8'));
  assert.deepEqual(validateHealthHistory(history, expectedActiveSlugs, {
    now: new Date('2026-07-17T00:00:00.000Z'),
  }), []);
  assert.equal(history.version, 1);
  assert.deepEqual([...new Set(history.records.map((record) => record.slug))].sort(), expectedActiveSlugs);
  assert.ok(history.records.every((record) => record.checkedAt.startsWith('2026-07-15T')));
});

test('an incomplete 90-day history uses every accumulated check, including failures', () => {
  const stats = calculateHealthHistoryStats([
    historyRecord('fixture', '2026-07-10T00:00:00.000Z', 100),
    historyRecord('fixture', '2026-06-20T00:00:00.000Z', 0),
    historyRecord('fixture', '2026-06-01T00:00:00.000Z', 50),
  ]);

  assert.deepEqual(stats, {
    websiteHealth: 50,
    sampleCount: 3,
    periodStart: '2026-06-01T00:00:00.000Z',
    periodEnd: '2026-07-10T00:00:00.000Z',
    mode: 'cumulative',
  });
});

test('a mature history uses the inclusive 90-day window ending at the latest check', () => {
  const stats = calculateHealthHistoryStats([
    historyRecord('fixture', '2026-07-10T00:00:00.000Z', 100),
    historyRecord('fixture', '2026-04-10T00:00:00.000Z', 0),
    historyRecord('fixture', '2026-04-11T00:00:00.000Z', 40),
  ]);

  assert.equal(stats.mode, 'rolling');
  assert.equal(stats.websiteHealth, 70);
  assert.equal(stats.sampleCount, 2);
  assert.equal(stats.periodStart, '2026-04-11T00:00:00.000Z');
  assert.equal(stats.periodEnd, '2026-07-10T00:00:00.000Z');
});

test('history scoring is order-independent and counts separate checks from the same day', () => {
  const records = [
    historyRecord('fixture', '2026-07-10T18:00:00.000Z', 100),
    historyRecord('fixture', '2026-07-09T00:00:00.000Z', 20),
    historyRecord('fixture', '2026-07-10T08:00:00.000Z', 60),
  ];
  const forward = calculateHealthHistoryStats(records);
  const reversed = calculateHealthHistoryStats([...records].reverse());

  assert.deepEqual(forward, reversed);
  assert.equal(forward.sampleCount, 3);
  assert.equal(forward.websiteHealth, 60);
});

test('history averages change the published score while missing history falls back per airport', () => {
  const historical = fixture({
    identity: { ...fixture().identity, slug: 'historical', name: '历史机场' },
    scoreInputs: { ...fixture().scoreInputs, websiteHealth: 100 },
  });
  const fallback = fixture({
    identity: { ...fixture().identity, slug: 'fallback', name: '回退机场' },
    scoreInputs: { ...fixture().scoreInputs, websiteHealth: 80 },
  });
  const merged = applyHealthHistory([historical, fallback], {
    version: 1,
    records: [
      historyRecord('historical', '2026-07-01T00:00:00.000Z', 20),
      historyRecord('historical', '2026-07-02T00:00:00.000Z', 40),
    ],
  });

  assert.equal(merged[0].scoreInputs.websiteHealth, 30);
  assert.equal(calculateScore(merged[0].scoreInputs), 58);
  assert.equal(merged[0].healthHistory.sampleCount, 2);
  assert.equal(merged[1].scoreInputs.websiteHealth, 80);
  assert.equal(merged[1].healthHistory, null);
});

test('history appends preserve old facts and reject duplicate or unknown samples', () => {
  const airports = [fixture()];
  const oldRecord = historyRecord('fixture', '2026-07-15T00:00:00.000Z', 100);
  const newRecord = historyRecord('fixture', '2026-07-17T00:00:00.000Z', 0);
  const history = { version: 1, records: [oldRecord] };
  const options = { now: new Date('2026-07-17T00:01:00.000Z') };

  const appended = appendHealthHistoryRecords(history, [newRecord], airports, options);
  assert.deepEqual(appended.records, [oldRecord, newRecord]);
  assert.throws(
    () => appendHealthHistoryRecords(history, [oldRecord], airports, options),
    /duplicate slug and checkedAt/,
  );
  assert.throws(
    () => appendHealthHistoryRecords(history, [historyRecord('unknown', '2026-07-17T00:00:00.000Z', 50)], airports, options),
    /unknown slug/,
  );
  assert.throws(
    () => appendHealthHistoryRecords(history, [historyRecord('fixture', '2026-07-17T00:07:00.000Z', 50)], airports, options),
    /checkedAt is in the future/,
  );
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
  assert.match(html, /<link rel="canonical" href="https:\/\/vpngate\.shop\/rankings\/">/);
  assert.match(html, /id="ranking-results"/);
  for (const id of ['ranking-query', 'ranking-risk', 'ranking-price', 'ranking-trial', 'ranking-client', 'ranking-streaming', 'ranking-clear']) {
    assert.match(html, new RegExp(`id="${id}"`), `ranking page: missing ${id}`);
  }
  assert.match(html, /官网健康度只评价公开入口/);
  assert.match(html, /历史不足 90 天时使用全部累计样本平均/);
  assert.match(html, /src="\/js\/rankings\.js"/);
  const script = read('js/rankings.js');
  assert.match(script, /累计平均/);
  assert.match(script, /近 90 天平均/);
  assert.match(script, /暂无历史样本/);
  assert.match(script, /sampleCount/);
});

test('risk monitor separates evidence-led status from promises of absolute safety', () => {
  const html = read('risk-monitor/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/vpngate\.shop\/risk-monitor\/">/);
  assert.match(html, /id="risk-groups"/);
  assert.match(html, /当前未记录可核验异常/);
  assert.match(html, /不等于绝对安全/);
  assert.doesNotMatch(html, /保证绝对安全|永不跑路|保证稳定/);
  assert.match(html, /src="\/js\/risk-monitor\.js"/);
});

test('every active airport detail keeps factual data without exposing editorial scores', () => {
  for (const slug of expectedActiveSlugs) {
    const html = read(`jichang/${slug}/index.html`);
    assert.match(html, new RegExp(`<section id="airport-data-report" data-airport-slug="${slug}"`), `${slug}: missing report mount`);
    assert.match(html, /aria-label="[^"]*公开资料快照"/, `${slug}: factual report label missing`);
    assert.doesNotMatch(html, /aria-label="[^"]*公开资料评分"/, `${slug}: score label remains`);
    assert.match(html, /<script type="module" src="\/js\/airport-report\.js"><\/script>/, `${slug}: missing report module`);
    assert.match(html, /class="article-(?:content|header)"/, `${slug}: original article structure missing`);
  }

  const report = read('js/airport-report.js');
  for (const removed of ['calculateScore', '编辑评分', '官网健康度 · 35%', '性价比 · 25%', '易用性 · 20%', '风险安全度 · 20%', '/100', '评分资料载入失败']) {
    assert.doesNotMatch(report, new RegExp(removed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `detail report still contains ${removed}`);
  }
  for (const retained of ['公开资料与风险快照', '风险状态', '月均门槛', '试用资料', '最近核对', '官网检查', '客户端', '流媒体 / AI', '节点地区', '风险结论', '公开资料载入失败']) {
    assert.match(report, new RegExp(retained.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `detail report lost ${retained}`);
  }
});

test('global navigation exposes the ranking and detector without replacing airport recommendations', () => {
  const nav = read('js/nav.js');
  assert.match(nav, /href: '\/jichang\/', label: '机场推荐'/);
  assert.match(nav, /href: '\/rankings\/', label: '机场榜'/);
  assert.match(nav, /href: '\/tools\/streaming-check\/', label: '检测工具'/);
});
