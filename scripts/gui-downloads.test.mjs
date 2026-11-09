import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

async function load(relative) {
  const result = await esbuild.build({
    entryPoints: [fileURLToPath(new URL(relative, import.meta.url))],
    bundle: true, write: false, platform: 'neutral', format: 'esm',
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`);
}

const { detectDesktopOS, assetNames, releaseDownloads } = await load('../src/lib/gui-downloads.ts');
const { onRequestGet } = await load('../functions/api/gui-downloads.ts');

const tag = 'v1.5.69';
const names = assetNames('1.5.69');
const asset = (name, state = 'uploaded', url = `https://github.com/getan/golder/releases/download/${tag}/${name}`) => ({
  name, state, browser_download_url: url,
});

test('detects desktop systems without guessing a Mac architecture', () => {
  assert.equal(detectDesktopOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel'), 'macos');
  assert.equal(detectDesktopOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32'), 'windows');
  assert.equal(detectDesktopOS('Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64'), 'linux');
  assert.equal(detectDesktopOS('Mozilla/5.0 (Linux; Android 14)', 'Linux armv8l'), 'other');
  assert.equal(detectDesktopOS('Mozilla/5.0 (X11; CrOS x86_64 15662.0.0)', 'Linux x86_64'), 'other');
  assert.equal(detectDesktopOS('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 5), 'other');
  assert.equal(detectDesktopOS('', ''), 'other');
});

test('only exposes exact uploaded assets belonging to a stable release', () => {
  const release = { tag_name: tag, assets: [
    asset(names.macArm),
    asset(names.macIntel, 'new'),
    asset(names.windows, 'uploaded', 'https://example.com/malicious.exe'),
    asset(names.linuxDebAmd64),
    asset(`golder_${tag.slice(1)}_Darwin_arm64.tar.gz`),
  ] };
  const result = releaseDownloads(release);
  assert.equal(result.tag, tag);
  assert.deepEqual(Object.keys(result.assets).sort(), ['linuxDebAmd64', 'macArm']);
  assert.equal(result.assets.macArm, `https://github.com/getan/golder/releases/download/${tag}/${names.macArm}`);
  assert.equal(releaseDownloads({ tag_name: 'v1.2.3/../../escape', assets: [] }), null);
  assert.equal(releaseDownloads({ tag_name: 'v1.2.3-rc1', assets: [] }), null);
  assert.equal(releaseDownloads({ tag_name: tag }), null);
});

test('endpoint caches validated release data and fails closed on upstream errors', async () => {
  const oldFetch = globalThis.fetch;
  const oldCaches = globalThis.caches;
  let stored;
  let hits = 0;
  const pending = [];
  globalThis.caches = { default: {
    match: async () => stored?.clone(),
    put: async (_key, response) => { stored = response.clone(); },
    delete: async () => false,
  } };
  const ctx = {
    request: new Request('https://golder-cli.pages.dev/api/gui-downloads'),
    waitUntil: (promise) => pending.push(promise),
  };
  try {
    globalThis.fetch = async () => {
      hits++;
      return new Response(JSON.stringify({ tag_name: tag, assets: [asset(names.macArm)] }), { status: 200 });
    };
    const first = await onRequestGet(ctx);
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { tag, assets: { macArm: asset(names.macArm).browser_download_url } });
    await Promise.all(pending);
    const second = await onRequestGet(ctx);
    assert.equal(second.status, 200);
    assert.equal(hits, 1);

    stored = undefined;
    globalThis.fetch = async () => new Response('rate limited', { status: 403 });
    const failure = await onRequestGet(ctx);
    assert.equal(failure.status, 502);
    assert.equal(failure.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await failure.json(), { error: 'release metadata unavailable' });
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.caches = oldCaches;
  }
});
