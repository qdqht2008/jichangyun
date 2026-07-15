const RISK_ORDER = Object.freeze({ normal: 0, watch: 1, high: 2 });
const SCORE_WEIGHTS = Object.freeze({
  websiteHealth: 0.35,
  value: 0.25,
  usability: 0.2,
  riskSafety: 0.2,
});

export { RISK_ORDER, SCORE_WEIGHTS };

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

export async function loadAirportRecords(url = '/data/airports.json') {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`机场数据加载失败：HTTP ${response.status}`);
  const records = await response.json();
  const failures = validateAirportRecords(records);
  if (failures.length) throw new Error(`机场数据校验失败：${failures.join('；')}`);
  return records;
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
