import { snapshotCache } from './latest';

// Separate from /api/latest: the tag-only endpoint remains available even when
// GitHub's API is unavailable. Only GitHub's own metadata authorizes updates.
interface Context {
  request: Request;
  env?: { GITHUB_TOKEN?: string };
  waitUntil: (promise: Promise<unknown>) => void;
}

interface Snapshot {
  tag_name: string;
  assets: { name: string; state: string; size: number; digest: string }[];
  fetched_at: number;
}

const SOFT_TTL = 60_000;
const MAX_STALE = 24 * 60 * 60_000;
let inFlight: Promise<Snapshot> | undefined;

class ReleaseLookupError extends Error {
  constructor(readonly reason: 'http' | 'timeout' | 'network' | 'invalid_json' | 'invalid_metadata', readonly status?: number) {
    super(reason);
  }
}

async function fetchRelease(token?: string): Promise<Snapshot> {
  const headers: Record<string, string> = {
    'user-agent': 'golder-site (+https://golder-cli.pages.dev)',
    accept: 'application/vnd.github+json',
  };
  if (token?.trim()) headers.authorization = `Bearer ${token.trim()}`;
  const signal = AbortSignal.timeout(5000);
  let res: Response;
  try {
    res = await fetch('https://api.github.com/repos/getan/golder/releases/latest', {
      headers, redirect: 'error', signal,
    });
  } catch {
    throw new ReleaseLookupError(signal.aborted ? 'timeout' : 'network');
  }
  if (!res.ok) throw new ReleaseLookupError('http', res.status);
  let data: { tag_name?: unknown; assets?: unknown } | null;
  try {
    data = await res.json() as typeof data;
  } catch {
    throw new ReleaseLookupError('invalid_json');
  }
  if (!data || typeof data.tag_name !== 'string' || !/^v\d+\.\d+\.\d+$/.test(data.tag_name) || !Array.isArray(data.assets)) {
    throw new ReleaseLookupError('invalid_metadata');
  }
  const assets = data.assets.flatMap((value: unknown) => {
    if (!value || typeof value !== 'object') return [];
    const a = value as Record<string, unknown>;
    if (typeof a.name !== 'string' || !/^golder-gui-[a-zA-Z0-9.-]+\.(dmg|exe|tar\.gz)$/.test(a.name) ||
        a.state !== 'uploaded' || !Number.isSafeInteger(a.size) || (a.size as number) <= 0 ||
        typeof a.digest !== 'string' || !/^sha256:[0-9a-f]{64}$/i.test(a.digest)) return [];
    return [{ name: a.name, state: a.state, size: a.size as number, digest: a.digest }];
  });
  return { tag_name: data.tag_name, assets, fetched_at: Date.now() };
}

function refresh(cache: ReturnType<typeof snapshotCache> | undefined, key: Request, token?: string): Promise<Snapshot> {
  if (inFlight) return inFlight;
  const run = (async () => {
    const snapshot = await fetchRelease(token);
    if (cache) {
      try {
        await cache.put(key, new Response(JSON.stringify(snapshot), {
          headers: { 'cache-control': 'public, max-age=86400' },
        }));
      } catch { /* A cache outage must not hide a successful upstream result. */ }
    }
    return snapshot;
  })();
  inFlight = run;
  run.then(() => { if (inFlight === run) inFlight = undefined; }, () => { if (inFlight === run) inFlight = undefined; });
  return run;
}

export const onRequestGet = async (ctx: Context): Promise<Response> => {
  const key = new Request(new URL('/api/gui-release', ctx.request.url));
  let cache: ReturnType<typeof snapshotCache> | undefined;
  let snapshot: Snapshot | undefined;
  try {
    cache = snapshotCache();
    const hit = await cache.match(key);
    if (hit) {
      const value = await hit.json() as Snapshot;
      if (typeof value.tag_name === 'string' && Array.isArray(value.assets) &&
          typeof value.fetched_at === 'number' && Date.now() - value.fetched_at < MAX_STALE) snapshot = value;
    }
  } catch { cache = undefined; }
  let status = 'hit';
  if (!snapshot || Date.now() - snapshot.fetched_at >= SOFT_TTL) {
    try {
      snapshot = await refresh(cache, key, ctx.env?.GITHUB_TOKEN);
      status = 'miss';
    } catch (error) {
      // Never log raw exceptions, response bodies, headers, or the token.
      console.error('gui-release upstream lookup failed', {
        reason: error instanceof ReleaseLookupError ? error.reason : 'unknown',
        status: error instanceof ReleaseLookupError ? error.status : undefined,
        authenticated: Boolean(ctx.env?.GITHUB_TOKEN?.trim()),
        stale_available: Boolean(snapshot),
      });
      if (!snapshot) return new Response(JSON.stringify({ error: 'release metadata unavailable' }), {
        status: 502, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
      status = 'stale-error';
    }
  }
  return new Response(JSON.stringify(snapshot), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-cache-status': status },
  });
};
