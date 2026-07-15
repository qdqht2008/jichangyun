const { isIP } = require('node:net');

const COMMON_SUPPORT = Object.freeze({
  chatgpt: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU']),
  netflix: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU', 'HK']),
  claude: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU']),
  tiktok: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU']),
  disney_plus: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU', 'HK']),
  hbo_max: new Set(['US']),
});

function firstHeader(headers, names) {
  for (const name of names) {
    const value = headers?.[name];
    if (Array.isArray(value) && value[0]) return value[0];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function requestIp(headers) {
  const raw = firstHeader(headers, ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip']);
  const candidate = raw.split(',')[0]?.trim();
  return isIP(candidate) ? candidate : null;
}

function countryCode(headers) {
  const raw = firstHeader(headers, ['x-vercel-ip-country', 'x-country-code', 'cf-ipcountry']).toUpperCase();
  return /^[A-Z]{2}$/.test(raw) && !['T1'].includes(raw) ? raw : 'XX';
}

function countryName(code) {
  if (code === 'XX') return '未知';
  try {
    return new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function servicesFor(code) {
  return Object.fromEntries(Object.entries(COMMON_SUPPORT).map(([key, supportedCountries]) => [key, {
    region_support: code === 'XX' ? 'unknown' : supportedCountries.has(code) ? 'supported' : 'unknown',
    policy_scope: '常用出口地区参考；未收录地区保持未知',
  }]));
}

function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: '请使用 POST 发起本次网络检测。' });
  }

  const code = countryCode(request.headers);
  return response.status(200).json({
    checked_at: new Date().toISOString(),
    network: {
      ip: requestIp(request.headers),
      country_code: code,
      country_name: countryName(code),
    },
    services: servicesFor(code),
  });
}

module.exports = handler;
module.exports.countryCode = countryCode;
module.exports.requestIp = requestIp;
module.exports.servicesFor = servicesFor;
