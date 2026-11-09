import { releaseDownloads, releaseDownloadsFromHTML } from '../../src/lib/gui-downloads';
import { snapshotCache } from './latest';

interface Context {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

async function fromPublicRelease() {
  const latest = await fetch('https://github.com/getan/golder/releases/latest', {
    method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(4000),
    headers: { 'user-agent': 'golder-site (+https://golder-cli.pages.dev)' },
  });
  const location = latest.headers.get('location');
  if (latest.status < 300 || latest.status >= 400 || !location) throw new Error('latest release unavailable');
  const url = new URL(location, 'https://github.com');
  const match = url.pathname.match(/^\/getan\/golder\/releases\/tag\/(v\d+\.\d+\.\d+)$/);
  if (url.origin !== 'https://github.com' || url.search || url.hash || !match) throw new Error('invalid release redirect');
  const tag = match[1];
  const res = await fetch(`https://github.com/getan/golder/releases/expanded_assets/${tag}`, {
    redirect: 'manual', signal: AbortSignal.timeout(4000),
    headers: { 'user-agent': 'golder-site (+https://golder-cli.pages.dev)' },
  });
  if (!res.ok) throw new Error(`release assets ${res.status}`);
  const downloads = releaseDownloadsFromHTML(tag, await res.text());
  if (!downloads) throw new Error('invalid release metadata');
  return downloads;
}

// The GitHub release may appear before GUI artifacts are attached. Forward
// only assets actually present, never guessed URLs or an older version.
export const onRequestGet = async (ctx: Context): Promise<Response> => {
  const key = new Request(new URL('/api/gui-downloads', ctx.request.url));
  let cache: ReturnType<typeof snapshotCache> | undefined;
  try {
    cache = snapshotCache();
    const hit = await cache.match(key);
    if (hit) return hit;
  } catch {
    // A cache failure must not prevent a fresh lookup.
    cache = undefined;
  }
  try {
    let downloads;
    let source = 'api';
    try {
      const res = await fetch('https://api.github.com/repos/getan/golder/releases/latest', {
        signal: AbortSignal.timeout(4000),
        headers: { 'user-agent': 'golder-site (+https://golder-cli.pages.dev)', accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      downloads = releaseDownloads(await res.json());
      if (!downloads) throw new Error('invalid release metadata');
    } catch {
      // Cloudflare's shared egress can exhaust GitHub's anonymous API quota.
      source = 'html';
      downloads = await fromPublicRelease();
    }
    const response = new Response(JSON.stringify(downloads), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60', 'x-gui-source': source },
    });
    if (cache) ctx.waitUntil(cache.put(key, response.clone()).catch(() => {}));
    return response;
  } catch {
    return new Response(JSON.stringify({ error: 'release metadata unavailable' }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
};
