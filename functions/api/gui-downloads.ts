import { releaseDownloads } from '../../src/lib/gui-downloads';
import { snapshotCache } from './latest';

interface Context {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
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
    const res = await fetch('https://api.github.com/repos/getan/golder/releases/latest', {
      headers: { 'user-agent': 'golder-site (+https://golder-cli.pages.dev)', accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const downloads = releaseDownloads(await res.json());
    if (!downloads) throw new Error('invalid release metadata');
    const response = new Response(JSON.stringify(downloads), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' },
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
