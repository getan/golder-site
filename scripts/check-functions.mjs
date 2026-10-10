// Checks the Pages Functions in functions/api/ without Cloudflare: it bundles
// them with esbuild (already present as an Astro dependency) into a temp dir,
// then drives them against a fake Cache API and a fake upstream. Every
// stale-while-revalidate state and the purge endpoint's auth are asserted, so
// the caching behaviour that caused the "site says v1.2.14, GitHub says
// v1.2.15" confusion cannot regress unnoticed.
//
// Run: npm run check:functions

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

let failures = 0;
function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name} ${extra}`);
  }
}

// --- fake Cache API ---------------------------------------------------------
class FakeCache {
  constructor() {
    this.entries = new Map();
    this.puts = 0;
    this.deletes = 0;
  }
  async match(key) {
    const hit = this.entries.get(key.url);
    return hit
      ? new Response(JSON.stringify(hit), { headers: { 'content-type': 'application/json' } })
      : undefined;
  }
  async put(key, value) {
    this.puts++;
    this.entries.set(key.url, await value.json());
  }
  async delete(key) {
    this.deletes++;
    const had = this.entries.has(key.url);
    this.entries.delete(key.url);
    return had;
  }
}

const URL_LATEST = 'https://golder-cli.pages.dev/api/latest';
const URL_PURGE = 'https://golder-cli.pages.dev/api/purge';
const LATEST_TAG = 'v9.9.9';
const STALE_TAG = 'v9.9.8';

// --- fake upstream ----------------------------------------------------------
let upstreamDown = false;
let upstreamHits = 0;
globalThis.fetch = async (url, init) => {
  upstreamHits++;
  if (upstreamDown) throw new Error('network unreachable');
  const release = `https://github.com/getan/golder/releases/tag/${LATEST_TAG}`;
  if (init?.method === 'HEAD') {
    // The 302 trick: the tag lives in the Location header.
    return new Response(null, { status: 301, headers: { location: release } });
  }
  return new Response(JSON.stringify({ tag_name: LATEST_TAG, html_url: release }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

// A request context whose waitUntil collects the background work, so a test can
// await it instead of racing the response.
function reqCtx(url, extra = {}) {
  const pending = [];
  return {
    ctx: { request: new Request(url), waitUntil: (p) => pending.push(p), ...extra },
    settle: async () => {
      await Promise.all(pending);
    },
  };
}

const snapshot = (ageSeconds, tag = STALE_TAG) => ({
  tag,
  url: `https://github.com/getan/golder/releases/tag/${tag}`,
  fetchedAt: Date.now() - ageSeconds * 1000,
  source: 'redirect',
});

async function main() {
  const stage = await mkdtemp(join(tmpdir(), 'golder-site-check-'));
  try {
    const out = await esbuild.build({
      entryPoints: ['functions/api/latest.ts', 'functions/api/purge.ts'],
      bundle: true,
      format: 'esm',
      platform: 'neutral',
      outdir: stage,
      logLevel: 'warning',
      write: true,
    });
    if (out.errors.length > 0) {
      console.log('esbuild failed', out.errors);
      process.exit(1);
    }

    const { onRequestGet } = await import(pathToFileURL(join(stage, 'latest.js')).href);
    const { onRequestPost: purgePost, onRequestGet: purgeGet } = await import(
      pathToFileURL(join(stage, 'purge.js')).href
    );
    const install = (cache) => {
      globalThis.caches = { default: cache };
    };

    console.log('cold start (no snapshot)');
    {
      const cache = new FakeCache();
      install(cache);
      upstreamHits = 0;
      upstreamDown = false;
      const { ctx, settle } = reqCtx(URL_LATEST);
      const res = await onRequestGet(ctx);
      await settle();
      const body = await res.json();
      check('status 200', res.status === 200, String(res.status));
      check('tag from upstream', body.tag === LATEST_TAG, body.tag);
      check('x-cache-status: miss', res.headers.get('x-cache-status') === 'miss');
      check('one upstream call', upstreamHits === 1, String(upstreamHits));
      check('snapshot stored', cache.puts === 1, String(cache.puts));
      check(
        'no s-maxage (so purge is enough)',
        !(res.headers.get('cache-control') || '').includes('s-maxage'),
        res.headers.get('cache-control'),
      );
    }

    console.log('fresh snapshot (hit, no upstream call)');
    {
      const cache = new FakeCache();
      cache.entries.set(URL_LATEST, snapshot(5));
      install(cache);
      upstreamHits = 0;
      const res = await onRequestGet(reqCtx(URL_LATEST).ctx);
      check('served the snapshot', (await res.json()).tag === STALE_TAG);
      check('x-cache-status: hit', res.headers.get('x-cache-status') === 'hit');
      check('no upstream call', upstreamHits === 0, String(upstreamHits));
      check('age reported', res.headers.get('x-cache-age') === '5', res.headers.get('x-cache-age'));
    }

    console.log('stale snapshot (serve old immediately, refresh behind)');
    {
      const cache = new FakeCache();
      cache.entries.set(URL_LATEST, snapshot(300));
      install(cache);
      upstreamHits = 0;
      const { ctx, settle } = reqCtx(URL_LATEST);
      const res = await onRequestGet(ctx);
      check('old tag returned without waiting', (await res.json()).tag === STALE_TAG);
      check('x-cache-status: stale', res.headers.get('x-cache-status') === 'stale');
      await settle();
      check('one background upstream call', upstreamHits === 1, String(upstreamHits));
      check('snapshot refreshed', cache.entries.get(URL_LATEST)?.tag === LATEST_TAG);
      // This is the property the release-window bug needed.
      const again = await onRequestGet(reqCtx(URL_LATEST).ctx);
      check('next request serves the new tag', (await again.json()).tag === LATEST_TAG);
      check('next request is a hit', again.headers.get('x-cache-status') === 'hit');
    }

    console.log('expired snapshot (refresh before answering)');
    {
      const cache = new FakeCache();
      cache.entries.set(URL_LATEST, snapshot(3700));
      install(cache);
      upstreamHits = 0;
      const res = await onRequestGet(reqCtx(URL_LATEST).ctx);
      check('refreshed before answering', (await res.json()).tag === LATEST_TAG);
      check('x-cache-status: miss', res.headers.get('x-cache-status') === 'miss');
      check('one upstream call', upstreamHits === 1, String(upstreamHits));
    }

    console.log('upstream down with a snapshot (degrade, not 502)');
    {
      const cache = new FakeCache();
      cache.entries.set(URL_LATEST, snapshot(3700));
      install(cache);
      upstreamDown = true;
      const res = await onRequestGet(reqCtx(URL_LATEST).ctx);
      check('status 200', res.status === 200, String(res.status));
      check('old tag still served', (await res.json()).tag === STALE_TAG);
      check('x-cache-status: stale-error', res.headers.get('x-cache-status') === 'stale-error');
      check(
        'x-latest-error explains why',
        (res.headers.get('x-latest-error') || '').includes('network unreachable'),
      );
    }

    console.log('upstream down with no snapshot (502)');
    {
      install(new FakeCache());
      const res = await onRequestGet(reqCtx(URL_LATEST).ctx);
      check('status 502', res.status === 502, String(res.status));
      check('error body', (await res.json()).error === 'upstream unavailable');
      upstreamDown = false;
    }

    console.log('purge endpoint');
    {
      const cache = new FakeCache();
      cache.entries.set(URL_LATEST, snapshot(5));
      install(cache);

      const disabled = await purgePost({
        request: new Request(URL_PURGE, { method: 'POST' }),
        env: {},
      });
      check('no PURGE_TOKEN → 503 (fail closed)', disabled.status === 503, String(disabled.status));
      check('cache untouched', cache.deletes === 0, String(cache.deletes));

      const wrong = await purgePost({
        request: new Request(URL_PURGE, { method: 'POST', headers: { 'x-purge-token': 'nope' } }),
        env: { PURGE_TOKEN: 'secret-token' },
      });
      check('wrong token → 401', wrong.status === 401, String(wrong.status));
      check('cache untouched', cache.deletes === 0, String(cache.deletes));

      const right = await purgePost({
        request: new Request(URL_PURGE, {
          method: 'POST',
          headers: { 'x-purge-token': 'secret-token' },
        }),
        env: { PURGE_TOKEN: 'secret-token' },
      });
      check('right token → 200', right.status === 200, String(right.status));
      check('wasCached true', (await right.json()).wasCached === true);
      check('cache emptied', cache.entries.has(URL_LATEST) === false);
      check(
        'purge response is no-store',
        (right.headers.get('cache-control') || '') === 'no-store',
      );

      const status = await purgeGet({ request: new Request(URL_PURGE), env: { PURGE_TOKEN: 'x' } });
      check('GET self-check reports enabled', (await status.json()).enabled === true);
    }
  } finally {
    await rm(stage, { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\nALL FUNCTION CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
