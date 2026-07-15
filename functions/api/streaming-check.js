const COMMON_SUPPORT = Object.freeze({
  chatgpt: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU']),
  netflix: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU', 'HK']),
  claude: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU']),
  tiktok: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU']),
  disney_plus: new Set(['US', 'JP', 'SG', 'TW', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU', 'HK']),
  hbo_max: new Set(['US']),
});

function validIp(value) {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  const octets = candidate.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return candidate;
  if (candidate.includes(':') && /^[0-9a-f:]+$/i.test(candidate)) return candidate;
  return null;
}

function countryCode(request) {
  const raw = typeof request.cf?.country === 'string' ? request.cf.country.toUpperCase() : '';
  return /^[A-Z]{2}$/.test(raw) && raw !== 'T1' ? raw : 'XX';
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

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

export function onRequestPost({ request }) {
  const code = countryCode(request);
  return json({
    checked_at: new Date().toISOString(),
    network: {
      ip: validIp(request.headers.get('CF-Connecting-IP')),
      country_code: code,
      country_name: countryName(code),
    },
    services: servicesFor(code),
  });
}

export function onRequest() {
  return json({ message: '请使用 POST 发起本次网络检测。' }, 405, { Allow: 'POST' });
}
