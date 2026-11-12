import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const bundle = await esbuild.build({
  entryPoints: [fileURLToPath(new URL('../functions/api/gui-release.ts', import.meta.url))],
  bundle: true, write: false, platform: 'neutral', format: 'esm',
});
const { onRequestGet } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

test('authenticated upstream, bounded cache, stale fallback and fail closed', async () => {
  const oldFetch = globalThis.fetch, oldCaches = globalThis.caches;
  let stored, hits = 0, down = false;
  const digest = 'sha256:' + 'a'.repeat(64);
  globalThis.caches = { default: {
    match: async () => stored?.clone(),
    put: async (_key, value) => { stored = value.clone(); },
  } };
  globalThis.fetch = async (_url, init) => {
    hits++;
    assert.equal(init.headers.authorization, 'Bearer secret');
    assert.equal(init.redirect, 'error');
    if (down) return new Response('', { status: 403 });
    return Response.json({ tag_name: 'v1.2.4', assets: [
      { name: 'golder-gui-1.2.4-arm64.dmg', state: 'uploaded', size: 123, digest },
      { name: 'golder-gui-1.2.4-linux-amd64.tar.gz', state: 'uploaded', size: 123, digest },
      { name: 'golder-gui-bad.dmg', state: 'uploaded', size: 123, digest: null },
      { name: 'other.zip', state: 'uploaded', size: 123, digest },
    ] });
  };
  const ctx = { request: new Request('https://golder-cli.pages.dev/api/gui-release'), env: { GITHUB_TOKEN: 'secret' }, waitUntil() {} };
  try {
    let res = await onRequestGet(ctx);
    let body = await res.json();
    assert.equal(res.headers.get('x-cache-status'), 'miss');
    assert.equal(body.tag_name, 'v1.2.4');
    assert.equal(body.assets.length, 2);
    assert.equal(body.assets[0].digest, digest);
    assert.equal(JSON.stringify(body).includes('secret'), false);
    res = await onRequestGet(ctx);
    assert.equal(res.headers.get('x-cache-status'), 'hit');
    assert.equal(hits, 1);
    body.fetched_at = Date.now() - 61_000;
    stored = Response.json(body);
    down = true;
    res = await onRequestGet(ctx);
    assert.equal(res.headers.get('x-cache-status'), 'stale-error');
    assert.equal((await res.json()).tag_name, 'v1.2.4');
    stored = undefined;
    res = await onRequestGet(ctx);
    assert.equal(res.status, 502);
    assert.equal((await res.text()).includes('secret'), false);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.caches = oldCaches;
  }
});
