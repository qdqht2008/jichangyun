const RISK_ORDER = Object.freeze({ normal: 0, watch: 1, high: 2 });
const SCORE_WEIGHTS = Object.freeze({
  websiteHealth: 0.35,
  value: 0.25,
  usability: 0.2,
  riskSafety: 0.2,
});
const HEALTH_HISTORY_VERSION = 1;
const HEALTH_HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const FUTURE_CLOCK_TOLERANCE_MS = 5 * 60 * 1000;

export {
  HEALTH_HISTORY_VERSION,
  HEALTH_HISTORY_WINDOW_MS,
  RISK_ORDER,
  SCORE_WEIGHTS,
};

export function calculateScore(inputs) {
  const entries = Object.entries(SCORE_WEIGHTS);
  if (!inputs || entries.some(([key]) => typeof inputs[key] !== 'number' || !Number.isFinite(inputs[key]))) {
    return null;
  }
  const score = entries.reduce((total, [key, weight]) => total + inputs[key] * weight, 0);
  return Math.round(score * 10) / 10;
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.+Z)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function validHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validTimestamp(value) {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export function validateAirportRecords(records) {
  const failures = [];
  if (!Array.isArray(records)) return ['airport data must be an array'];
  const slugs = new Set();

  records.forEach((record, index) => {
    const prefix = `record ${index}`;
    const slug = record?.identity?.slug;
    if (!/^[a-z0-9-]+$/.test(slug ?? '')) failures.push(`${prefix}: invalid slug`);
    if (slugs.has(slug)) failures.push(`${prefix}: duplicate slug ${slug}`);
    slugs.add(slug);
    if (!record?.identity?.name) failures.push(`${prefix}: missing name`);
    if (record?.identity?.detailUrl !== `/jichang/${slug}/`) failures.push(`${prefix}: detailUrl does not match slug`);
    if (!validHttpUrl(record?.identity?.website)) failures.push(`${prefix}: invalid website`);

    const price = record?.pricing?.monthlyFrom;
    if (price !== null && (typeof price !== 'number' || price < 0)) failures.push(`${prefix}: invalid monthlyFrom`);
    if (![true, false, null].includes(record?.pricing?.hasTrial)) failures.push(`${prefix}: invalid hasTrial`);
    if (!Array.isArray(record?.pricing?.billingCycles)) failures.push(`${prefix}: invalid billingCycles`);

    for (const key of ['clients', 'streaming', 'payments', 'regions']) {
      if (!Array.isArray(record?.capabilities?.[key])) failures.push(`${prefix}: invalid capabilities.${key}`);
    }

    for (const key of Object.keys(SCORE_WEIGHTS)) {
      const value = record?.scoreInputs?.[key];
      if (value !== null && (typeof value !== 'number' || value < 0 || value > 100)) {
        failures.push(`${prefix}: invalid scoreInputs.${key}`);
      }
      if (!record?.scoreEvidence?.[key]) failures.push(`${prefix}: missing scoreEvidence.${key}`);
    }

    if (![true, false, null].includes(record?.health?.reachable)) failures.push(`${prefix}: invalid health.reachable`);
    if (record?.health?.checkedAt !== null && !validDate(record?.health?.checkedAt)) failures.push(`${prefix}: invalid health.checkedAt`);
    if (!(record?.risk?.level in RISK_ORDER)) failures.push(`${prefix}: invalid risk level`);
    if (!validDate(record?.risk?.reviewedAt)) failures.push(`${prefix}: invalid risk reviewedAt`);
    if (!Array.isArray(record?.risk?.evidence)) failures.push(`${prefix}: invalid risk evidence`);
    if (!Array.isArray(record?.metadata?.sources) || !record.metadata.sources.length) failures.push(`${prefix}: missing sources`);
    if (!validDate(record?.metadata?.reviewedAt)) failures.push(`${prefix}: invalid metadata reviewedAt`);
  });

  return failures;
}

export function validateHealthHistory(history, knownSlugs = [], { now = null } = {}) {
  const failures = [];
  if (!history || typeof history !== 'object' || Array.isArray(history)) return ['health history must be an object'];
  if (history.version !== HEALTH_HISTORY_VERSION) failures.push(`health history version must be ${HEALTH_HISTORY_VERSION}`);
  if (!Array.isArray(history.records)) return [...failures, 'health history records must be an array'];

  const allowedSlugs = new Set(knownSlugs);
  const identities = new Set();
  const futureLimit = now instanceof Date ? now.getTime() + FUTURE_CLOCK_TOLERANCE_MS : null;

  history.records.forEach((record, index) => {
    const prefix = `history record ${index}`;
    if (!allowedSlugs.has(record?.slug)) failures.push(`${prefix}: unknown slug ${record?.slug ?? ''}`);
    if (!validTimestamp(record?.checkedAt)) {
      failures.push(`${prefix}: invalid checkedAt`);
    } else if (futureLimit !== null && Date.parse(record.checkedAt) > futureLimit) {
      failures.push(`${prefix}: checkedAt is in the future`);
    }

    const identity = `${record?.slug}\u0000${record?.checkedAt}`;
    if (identities.has(identity)) failures.push(`${prefix}: duplicate slug and checkedAt`);
    identities.add(identity);

    if (typeof record?.websiteHealth !== 'number'
      || !Number.isFinite(record.websiteHealth)
      || record.websiteHealth < 0
      || record.websiteHealth > 100) {
      failures.push(`${prefix}: invalid websiteHealth`);
    }

    const health = record?.health;
    if (!health || typeof health !== 'object' || Array.isArray(health)) {
      failures.push(`${prefix}: invalid health`);
      return;
    }
    if (typeof health.reachable !== 'boolean') failures.push(`${prefix}: invalid health.reachable`);
    if (!validHttpUrl(health.finalUrl)) failures.push(`${prefix}: invalid health.finalUrl`);
    if (health.httpStatus !== null && (!Number.isInteger(health.httpStatus) || health.httpStatus < 100 || health.httpStatus > 599)) {
      failures.push(`${prefix}: invalid health.httpStatus`);
    }
    if (!Number.isInteger(health.successfulAttempts) || health.successfulAttempts < 0 || health.successfulAttempts > 3) {
      failures.push(`${prefix}: invalid health.successfulAttempts`);
    }
    if (health.medianResponseMs !== null
      && (typeof health.medianResponseMs !== 'number' || !Number.isFinite(health.medianResponseMs) || health.medianResponseMs < 0)) {
      failures.push(`${prefix}: invalid health.medianResponseMs`);
    }
    if (health.tlsValidUntil !== null && !validTimestamp(health.tlsValidUntil)) {
      failures.push(`${prefix}: invalid health.tlsValidUntil`);
    }
    if (typeof health.runner !== 'string' || !health.runner) failures.push(`${prefix}: invalid health.runner`);
    if (health.error !== null && typeof health.error !== 'string') failures.push(`${prefix}: invalid health.error`);
  });

  return failures;
}

export function calculateHealthHistoryStats(records) {
  if (!Array.isArray(records) || records.length === 0) return null;
  const sorted = [...records].sort((left, right) => Date.parse(left.checkedAt) - Date.parse(right.checkedAt));
  const firstTime = Date.parse(sorted[0].checkedAt);
  const latestTime = Date.parse(sorted.at(-1).checkedAt);
  const mode = latestTime - firstTime < HEALTH_HISTORY_WINDOW_MS ? 'cumulative' : 'rolling';
  const selected = mode === 'cumulative'
    ? sorted
    : sorted.filter((record) => Date.parse(record.checkedAt) >= latestTime - HEALTH_HISTORY_WINDOW_MS);
  const average = selected.reduce((total, record) => total + record.websiteHealth, 0) / selected.length;

  return {
    websiteHealth: Math.round(average * 10) / 10,
    sampleCount: selected.length,
    periodStart: selected[0].checkedAt,
    periodEnd: selected.at(-1).checkedAt,
    mode,
  };
}

export function appendHealthHistoryRecords(history, samples, airportRecords, options = {}) {
  const candidate = {
    version: HEALTH_HISTORY_VERSION,
    records: [...history.records, ...samples],
  };
  const failures = validateHealthHistory(
    candidate,
    airportRecords.map((record) => record.identity.slug),
    options,
  );
  if (failures.length) throw new Error(`历史数据校验失败：${failures.join('；')}`);
  return candidate;
}

export function applyHealthHistory(records, history) {
  const recordsBySlug = new Map();
  for (const record of history.records) {
    const entries = recordsBySlug.get(record.slug) ?? [];
    entries.push(record);
    recordsBySlug.set(record.slug, entries);
  }

  return records.map((record) => {
    const historicalRecords = recordsBySlug.get(record.identity.slug) ?? [];
    const stats = calculateHealthHistoryStats(historicalRecords);
    if (!stats) return { ...record, healthHistory: null };

    const latest = [...historicalRecords]
      .sort((left, right) => Date.parse(left.checkedAt) - Date.parse(right.checkedAt))
      .at(-1);
    const modeLabel = stats.mode === 'rolling' ? '近 90 天平均' : '累计平均';

    return {
      ...record,
      scoreInputs: {
        ...record.scoreInputs,
        websiteHealth: stats.websiteHealth,
      },
      scoreEvidence: {
        ...record.scoreEvidence,
        websiteHealth: `${modeLabel} ${stats.websiteHealth} 分，共 ${stats.sampleCount} 次监测`,
      },
      health: {
        ...latest.health,
        checkedAt: latest.checkedAt,
      },
      healthHistory: stats,
    };
  });
}

export function sortAirports(records) {
  return [...records].sort((left, right) => {
    const riskDifference = RISK_ORDER[left.risk.level] - RISK_ORDER[right.risk.level];
    if (riskDifference) return riskDifference;
    const leftScore = calculateScore(left.scoreInputs);
    const rightScore = calculateScore(right.scoreInputs);
    if (leftScore === null && rightScore !== null) return 1;
    if (leftScore !== null && rightScore === null) return -1;
    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.identity.name.localeCompare(right.identity.name, 'zh-CN');
  });
}

export function filterAirports(records, filters = {}) {
  const query = String(filters.query ?? '').trim().toLocaleLowerCase('zh-CN');
  const maxPrice = filters.maxPrice === '' || filters.maxPrice == null ? null : Number(filters.maxPrice);

  return records.filter((record) => {
    const searchable = `${record.identity.name} ${record.identity.slug}`.toLocaleLowerCase('zh-CN');
    if (query && !searchable.includes(query)) return false;
    if (filters.risk && filters.risk !== 'all' && record.risk.level !== filters.risk) return false;
    if (Number.isFinite(maxPrice) && (record.pricing.monthlyFrom === null || record.pricing.monthlyFrom > maxPrice)) return false;
    if (filters.trial === 'yes' && record.pricing.hasTrial !== true) return false;
    if (filters.trial === 'no' && record.pricing.hasTrial !== false) return false;
    if (filters.trial === 'unknown' && record.pricing.hasTrial !== null) return false;
    if (filters.client && filters.client !== 'all' && !record.capabilities.clients.includes(filters.client)) return false;
    if (filters.streaming && filters.streaming !== 'all' && !record.capabilities.streaming.includes(filters.streaming)) return false;
    return true;
  });
}

export async function loadAirportRecords(
  url = '/data/airports.json',
  historyUrl = '/data/airport-health-history.json',
) {
  const [response, historyResponse] = await Promise.all([
    fetch(url, { cache: 'no-store' }),
    fetch(historyUrl, { cache: 'no-store' }),
  ]);
  if (!response.ok) throw new Error(`机场数据加载失败：HTTP ${response.status}`);
  if (!historyResponse.ok) throw new Error(`历史数据载入失败：HTTP ${historyResponse.status}`);
  const [records, history] = await Promise.all([response.json(), historyResponse.json()]);
  const failures = validateAirportRecords(records);
  if (failures.length) throw new Error(`机场数据校验失败：${failures.join('；')}`);
  const historyFailures = validateHealthHistory(history, records.map((record) => record.identity.slug));
  if (historyFailures.length) throw new Error(`历史数据校验失败：${historyFailures.join('；')}`);
  return applyHealthHistory(records, history);
}

export function uniqueCapabilities(records, key) {
  return [...new Set(records.flatMap((record) => record.capabilities[key] ?? []))]
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

export function formatPrice(value) {
  if (value === null) return '未核对';
  return `¥${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}/月起`;
}

export function riskLabel(level) {
  return { normal: '正常', watch: '观察', high: '高风险' }[level] ?? '未知';
}
