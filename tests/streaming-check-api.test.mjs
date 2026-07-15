import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function loadHandler() {
  const path = require.resolve('../api/streaming-check.js');
  delete require.cache[path];
  return require(path);
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('streaming check returns request-scoped network context without cacheable history', () => {
  const handler = loadHandler();
  const response = mockResponse();
  handler({
    method: 'POST',
    headers: {
      'x-vercel-ip-country': 'US',
      'x-forwarded-for': '203.0.113.8, 10.0.0.1',
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.body.network.ip, '203.0.113.8');
  assert.equal(response.body.network.country_code, 'US');
  assert.equal(response.body.network.country_name, '美国');
  assert.equal(response.body.services.chatgpt.region_support, 'supported');
  assert.match(response.body.checked_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('streaming check rejects non-POST requests explicitly', () => {
  const handler = loadHandler();
  const response = mockResponse();
  handler({ method: 'GET', headers: {} }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, 'POST');
  assert.match(response.body.message, /POST/);
});

test('missing edge headers stay unknown instead of inventing an IP or region', () => {
  const handler = loadHandler();
  const response = mockResponse();
  handler({ method: 'POST', headers: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.network.ip, null);
  assert.equal(response.body.network.country_code, 'XX');
  assert.equal(response.body.network.country_name, '未知');
  assert.ok(Object.values(response.body.services).every((service) => service.region_support === 'unknown'));
});

test('streaming page requires user action and explains that reachability is not playback proof', () => {
  const html = readFileSync(join(root, 'tools/streaming-check/index.html'), 'utf8');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.jichangyun\.top\/tools\/streaming-check\/">/);
  assert.match(html, /id="streaming-start"/);
  assert.match(html, /id="network-result"/);
  assert.match(html, /id="streaming-results"/);
  for (const service of ['ChatGPT', 'Netflix', 'Claude', 'TikTok', 'Disney\+', 'HBO Max']) {
    assert.match(html, new RegExp(service));
  }
  assert.match(html, /不能证明账号登录、完整片库或实际播放成功/);
  assert.match(html, /src="\/js\/streaming-check\.js"/);
});
