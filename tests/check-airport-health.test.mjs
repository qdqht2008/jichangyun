import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateWebsiteHealth,
  checkWebsite,
  median,
} from '../scripts/check-airport-health.mjs';

test('website health uses three attempts and the median response instead of one lucky request', async () => {
  const responses = [
    { reachable: true, finalUrl: 'https://example.com/', httpStatus: 200, responseMs: 900, tlsValidUntil: '2026-12-31T00:00:00.000Z' },
    { reachable: true, finalUrl: 'https://example.com/', httpStatus: 200, responseMs: 200, tlsValidUntil: '2026-12-31T00:00:00.000Z' },
    { reachable: true, finalUrl: 'https://example.com/', httpStatus: 200, responseMs: 500, tlsValidUntil: '2026-12-31T00:00:00.000Z' },
  ];
  let calls = 0;
  const result = await checkWebsite('https://example.com/', {
    request: async () => responses[calls++],
    now: new Date('2026-07-15T00:00:00.000Z'),
    runner: 'test-runner',
  });

  assert.equal(calls, 3);
  assert.equal(result.reachable, true);
  assert.equal(result.successfulAttempts, 3);
  assert.equal(result.medianResponseMs, 500);
  assert.equal(result.score, 100);
  assert.equal(result.runner, 'test-runner');
});

test('website health requires a two-of-three reachability quorum', async () => {
  const responses = [
    { reachable: true, finalUrl: 'https://example.com/', httpStatus: 200, responseMs: 500, tlsValidUntil: '2026-12-31T00:00:00.000Z' },
    new Error('timeout'),
    new Error('timeout'),
  ];
  let calls = 0;
  const result = await checkWebsite('https://example.com/', {
    request: async () => {
      const response = responses[calls++];
      if (response instanceof Error) throw response;
      return response;
    },
    now: new Date('2026-07-15T00:00:00.000Z'),
  });

  assert.equal(result.reachable, false);
  assert.equal(result.successfulAttempts, 1);
  assert.equal(result.score, 0);
  assert.match(result.error, /2 of 3/);
});

test('website health scoring publishes reachable, TLS, and response-time contributions', () => {
  const now = new Date('2026-07-15T00:00:00.000Z');
  assert.equal(calculateWebsiteHealth({ reachable: false }, now), 0);
  assert.equal(calculateWebsiteHealth({ reachable: true, tlsValidUntil: null, medianResponseMs: 900 }, now), 70);
  assert.equal(calculateWebsiteHealth({ reachable: true, tlsValidUntil: '2026-12-31T00:00:00.000Z', medianResponseMs: 1500 }, now), 95);
  assert.equal(calculateWebsiteHealth({ reachable: true, tlsValidUntil: '2026-12-31T00:00:00.000Z', medianResponseMs: 3500 }, now), 90);
  assert.equal(calculateWebsiteHealth({ reachable: true, tlsValidUntil: '2026-12-31T00:00:00.000Z', medianResponseMs: 5000 }, now), 85);
});

test('median is deterministic for odd and even samples', () => {
  assert.equal(median([900, 200, 500]), 500);
  assert.equal(median([10, 30, 20, 40]), 25);
  assert.equal(median([]), null);
});
