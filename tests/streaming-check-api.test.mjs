import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function loadFunction() {
  const source = readFileSync(join(root, 'functions/api/streaming-check.js'), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

function request(method, { country, ip } = {}) {
  return {
    method: 'POST',
    headers: new Headers(ip ? { 'CF-Connecting-IP': ip } : {}),
    cf: country ? { country } : {},
    ...(method ? { method } : {}),
  };
}

test('streaming check returns Cloudflare request context without cacheable history', async () => {
  const { onRequestPost } = await loadFunction();
  const response = await onRequestPost({ request: request('POST', { country: 'US', ip: '203.0.113.8' }) });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(body.network.ip, '203.0.113.8');
  assert.equal(body.network.country_code, 'US');
  assert.equal(body.network.country_name, '美国');
  assert.equal(body.services.chatgpt.region_support, 'supported');
  assert.match(body.checked_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('streaming check rejects non-POST requests explicitly', async () => {
  const { onRequest } = await loadFunction();
  const response = await onRequest({ request: request('GET') });
  const body = await response.json();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  assert.match(body.message, /POST/);
});

test('missing Cloudflare metadata stays unknown instead of inventing an IP or region', async () => {
  const { onRequestPost } = await loadFunction();
  const response = await onRequestPost({ request: request('POST') });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.network.ip, null);
  assert.equal(body.network.country_code, 'XX');
  assert.equal(body.network.country_name, '未知');
  assert.ok(Object.values(body.services).every((service) => service.region_support === 'unknown'));
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
