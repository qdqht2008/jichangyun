import http from 'node:http';
import https from 'node:https';
import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = resolve(root, 'data/airports.json');

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export function calculateWebsiteHealth(result, now = new Date()) {
  if (!result.reachable) return 0;

  let score = 50;
  const validUntil = result.tlsValidUntil ? new Date(result.tlsValidUntil) : null;
  if (validUntil && !Number.isNaN(validUntil.getTime()) && validUntil > now) score += 30;

  const responseMs = result.medianResponseMs;
  if (typeof responseMs === 'number') {
    if (responseMs <= 1000) score += 20;
    else if (responseMs <= 2000) score += 15;
    else if (responseMs <= 4000) score += 10;
    else score += 5;
  }

  return score;
}

function certificateExpiry(response) {
  if (typeof response.socket?.getPeerCertificate !== 'function') return null;
  const certificate = response.socket.getPeerCertificate();
  if (!certificate?.valid_to) return null;
  const expiry = new Date(certificate.valid_to);
  return Number.isNaN(expiry.getTime()) ? null : expiry.toISOString();
}

export function requestWebsite(target, {
  timeoutMs = 8000,
  maxRedirects = 5,
  startedAt = performance.now(),
} = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    let url;
    try {
      url = new URL(target);
    } catch {
      rejectRequest(new Error(`Invalid URL: ${target}`));
      return;
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      rejectRequest(new Error(`Unsupported protocol: ${url.protocol}`));
      return;
    }

    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'jichangyun-editorial-health-check/1.0',
      },
    }, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;

      if (status >= 300 && status < 400 && location) {
        response.resume();
        if (maxRedirects <= 0) {
          rejectRequest(new Error(`Too many redirects for ${target}`));
          return;
        }
        const nextUrl = new URL(location, url).href;
        requestWebsite(nextUrl, { timeoutMs, maxRedirects: maxRedirects - 1, startedAt })
          .then(resolveRequest, rejectRequest);
        return;
      }

      const responseMs = Math.round(performance.now() - startedAt);
      const result = {
        reachable: status >= 200 && status < 400,
        finalUrl: url.href,
        httpStatus: status,
        responseMs,
        tlsValidUntil: certificateExpiry(response),
      };
      response.resume();
      resolveRequest(result);
    });

    request.setTimeout(timeoutMs, () => request.destroy(new Error(`Request timed out after ${timeoutMs}ms`)));
    request.on('error', rejectRequest);
    request.end();
  });
}

export async function checkWebsite(target, {
  request = requestWebsite,
  attempts = 3,
  timeoutMs = 8000,
  now = new Date(),
  runner = `editorial-check ${process.platform}/${process.arch}`,
} = {}) {
  const samples = [];
  const errors = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const sample = await request(target, { timeoutMs });
      if (sample.reachable) samples.push(sample);
      else errors.push(`HTTP ${sample.httpStatus || 'unknown'}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const requiredAttempts = Math.floor(attempts / 2) + 1;
  const reachable = samples.length >= requiredAttempts;
  const latest = samples.at(-1);
  const result = {
    reachable,
    finalUrl: latest?.finalUrl ?? target,
    httpStatus: latest?.httpStatus ?? null,
    successfulAttempts: samples.length,
    medianResponseMs: median(samples.map((sample) => sample.responseMs)),
    tlsValidUntil: samples.findLast((sample) => sample.tlsValidUntil)?.tlsValidUntil ?? null,
    checkedAt: now.toISOString(),
    runner,
    error: reachable ? null : `Reachability quorum failed: ${samples.length} of ${attempts} successful; requires ${requiredAttempts} of ${attempts}. ${errors.join('; ')}`,
  };

  return {
    ...result,
    score: calculateWebsiteHealth(result, now),
  };
}

export async function runHealthChecks(records, options = {}) {
  const updated = [];
  for (const record of records) {
    const health = await checkWebsite(record.identity.website, options);
    updated.push({
      ...record,
      scoreInputs: {
        ...record.scoreInputs,
        websiteHealth: health.score,
      },
      scoreEvidence: {
        ...record.scoreEvidence,
        websiteHealth: `公开官网三次请求：${health.successfulAttempts}/3 次成功；检查于 ${health.checkedAt}`,
      },
      health: {
        reachable: health.reachable,
        finalUrl: health.finalUrl,
        httpStatus: health.httpStatus,
        successfulAttempts: health.successfulAttempts,
        medianResponseMs: health.medianResponseMs,
        tlsValidUntil: health.tlsValidUntil,
        checkedAt: health.checkedAt,
        runner: health.runner,
        error: health.error,
      },
    });
  }
  return updated;
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const records = JSON.parse(await readFile(dataFile, 'utf8'));
  const updated = await runHealthChecks(records);

  if (shouldWrite) {
    await writeFile(dataFile, `${JSON.stringify(updated, null, 2)}\n`);
    process.stdout.write(`Updated ${updated.length} airport health records in ${dataFile}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(updated.map((record) => ({
    slug: record.identity.slug,
    health: record.health,
    websiteHealth: record.scoreInputs.websiteHealth,
  })), null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  });
}
