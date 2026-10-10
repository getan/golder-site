// GET /api/latest —— 返回主仓库最新 release 的版本号（站点版本角标与 install.sh 共用）。
//
// 数据源优先级：
//   1) github.com/<repo>/releases/latest 的 302 Location —— 匿名、无限流（首选）
//   2) GitHub REST API —— 兜底；未认证时每 IP 60 次/小时，仅在第 1 条失败时触发
//
// 响应：{ "tag": "v1.2.2", "url": "https://github.com/getan/golder/releases/tag/v1.2.2" }
//
// 缓存：Cache API 里存一份快照（答案 + fetchedAt + source），手动实现
// stale-while-revalidate：
//
//   age <  SOFT_TTL(60s) → 直接返回快照                x-cache-status: hit
//   age <  HARD_TTL(1h)  → 立刻返回快照 + 后台回源      x-cache-status: stale
//   age >= HARD_TTL      → 同步回源                     x-cache-status: miss
//
// 为什么不是「固定缓存 1 小时」：那样发版后最坏一小时内，站点角标与
// `golder update` 都还报旧版本。2026-10-10 发 v1.2.15 时就撞上了——端点命中
// age 3368 秒的副本、返回还是 v1.2.14，而 GitHub 上早已是 v1.2.15。SWR 把窗口
// 缩到「下一次访问」，且用户从不等待回源；发版方还能 POST /api/purge 立即失效
// （见 ./purge.ts）。
//
// 刻意不发 s-maxage：那会让 CDN 在 Cache API 之外再加一层自动缓存，purge 清不
// 干净。服务端缓存只有 Cache API 这一层，全部由本文件控制。
//
// 响应带 x-cache-status / x-cache-age / x-cache-fetched-at / x-latest-source /
// x-latest-error，下次再遇到「CLI 与网页不一致」时一眼分清是缓存旧还是上游旧。

const REPO = 'getan/golder';
const UA = 'golder-site (+https://golder-cli.pages.dev)';
const SOFT_TTL_SECONDS = 60;
const HARD_TTL_SECONDS = 3600;
// 浏览器侧短缓存：角标最多停留这么久。与软 TTL 取同值，免得 purge 之后还有人
// 拿着浏览器里五分钟前的旧角标来对账。
const BROWSER_MAX_AGE = 60;

interface Latest {
  tag: string;
  url: string;
}

/** 快照 = 上游答案 + 取得时刻（epoch ms）与来源，供 SWR 判定与事后排查。 */
interface Snapshot extends Latest {
  fetchedAt: number;
  source: 'redirect' | 'api';
}

type FetchResult = { snapshot: Snapshot } | { detail: string };

interface Ctx {
  request: Request;
  waitUntil: (p: Promise<unknown>) => void;
}

/** 只用到 Cache API 的三个方法，避免依赖 Workers 的类型声明。 */
interface SnapshotCache {
  match: (key: Request) => Promise<Response | undefined>;
  put: (key: Request, value: Response) => Promise<void>;
  delete: (key: Request) => Promise<boolean>;
}

/**
 * /api/latest 的缓存键。查询串刻意不参与：键只按路径取，所以 `?cachebust=…`
 * 绕不过缓存（2026-10 排查时验证过，命中同一份副本），也不会因为谁加个查询
 * 参数就把缓存放大成 N 份。/api/purge 用同一个函数，两边不会漂移。
 */
export function latestCacheKey(url: string): Request {
  return new Request(new URL('/api/latest', url).toString());
}

export function snapshotCache(): SnapshotCache {
  return (caches as unknown as { default: SnapshotCache }).default;
}

/** 302 法：HEAD 不跟随跳转，从 Location 里抠出 tag。 */
async function fromRedirect(): Promise<Latest> {
  const res = await fetch(`https://github.com/${REPO}/releases/latest`, {
    method: 'HEAD',
    redirect: 'manual',
    headers: { 'user-agent': UA },
  });
  const loc = res.headers.get('location') ?? '';
  const m = loc.match(/\/releases\/tag\/([^/?#]+)$/);
  if (!m) throw new Error(`no tag in location: ${loc || '(empty)'}`);
  return { tag: m[1], url: loc };
}

/** 兜底：REST API（可能触发匿名限流，仅在上一条失败时调用）。 */
async function fromAPI(): Promise<Latest> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { 'user-agent': UA, accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`github api ${res.status}`);
  const data = (await res.json()) as { tag_name?: string; html_url?: string };
  if (!data.tag_name) throw new Error('missing tag_name');
  return {
    tag: data.tag_name,
    url: data.html_url ?? `https://github.com/${REPO}/releases/tag/${data.tag_name}`,
  };
}

function jsonResponse(body: unknown, status: number, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      // 公开只读接口：允许网页端跨域消费
      'access-control-allow-origin': '*',
    },
  });
}

/** 取上游：302 法优先，REST API 兜底，两个都失败时把两条原因一起带出去。 */
export async function fetchLatest(): Promise<FetchResult> {
  try {
    const latest = await fromRedirect();
    return { snapshot: { ...latest, fetchedAt: Date.now(), source: 'redirect' } };
  } catch (first) {
    try {
      const latest = await fromAPI();
      return { snapshot: { ...latest, fetchedAt: Date.now(), source: 'api' } };
    } catch (second) {
      return { detail: `${first}; ${second}` };
    }
  }
}

async function readSnapshot(hit: Response): Promise<Snapshot | null> {
  try {
    const snap = (await hit.json()) as Snapshot;
    if (!snap || typeof snap.tag !== 'string' || !snap.tag || typeof snap.fetchedAt !== 'number') {
      return null;
    }
    return snap;
  } catch {
    return null;
  }
}

export async function store(cache: SnapshotCache, key: Request, snapshot: Snapshot): Promise<void> {
  await cache.put(
    key,
    new Response(JSON.stringify(snapshot), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // 快照在 Cache API 里最多留这么久。软 TTL 由 fetchedAt 自己算，所以这个
        // max-age 只是「最久留多久」，不代表「期间不回源」。
        'cache-control': `public, max-age=${HARD_TTL_SECONDS}`,
      },
    }),
  );
}

// 同一 isolate 内合并并发回源：SWR 窗口里来一串请求时只向上游打一次。
let inFlight: Promise<FetchResult> | null = null;

export function refresh(cache: SnapshotCache, key: Request): Promise<FetchResult> {
  if (inFlight) return inFlight;
  const run = (async (): Promise<FetchResult> => {
    const result = await fetchLatest();
    if ('snapshot' in result) {
      await store(cache, key, result.snapshot);
    }
    return result;
  })();
  inFlight = run;
  const settle = (): void => {
    if (inFlight === run) inFlight = null;
  };
  run.then(settle, settle);
  return run;
}

function latestResponse(snapshot: Snapshot, cacheStatus: string, upstreamError?: string): Response {
  const age = Math.max(0, Math.round((Date.now() - snapshot.fetchedAt) / 1000));
  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    // 只给浏览器。绝不带 s-maxage：否则 CDN 会在 Cache API 之外再加一层缓存。
    'cache-control': `public, max-age=${BROWSER_MAX_AGE}`,
    'access-control-allow-origin': '*',
    'x-cache-status': cacheStatus,
    'x-cache-age': String(age),
    'x-cache-fetched-at': new Date(snapshot.fetchedAt).toISOString(),
    'x-latest-source': snapshot.source,
  };
  if (upstreamError) headers['x-latest-error'] = upstreamError.slice(0, 300);
  return new Response(JSON.stringify({ tag: snapshot.tag, url: snapshot.url }), {
    status: 200,
    headers,
  });
}

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const cache = snapshotCache();
  const key = latestCacheKey(ctx.request.url);

  const hit = await cache.match(key);
  const snapshot = hit ? await readSnapshot(hit) : null;
  if (snapshot) {
    const age = (Date.now() - snapshot.fetchedAt) / 1000;
    if (age < SOFT_TTL_SECONDS) {
      return latestResponse(snapshot, 'hit');
    }
    if (age < HARD_TTL_SECONDS) {
      // 立刻返回旧值，回源放后台：用户不等待，下一次访问就是新的。
      ctx.waitUntil(refresh(cache, key));
      return latestResponse(snapshot, 'stale');
    }
  }

  const result = await refresh(cache, key);
  if ('snapshot' in result) {
    return latestResponse(result.snapshot, 'miss');
  }
  // 上游挂了：手里还有过期快照就继续发（版本号通常仍可用），并留下 x-latest-error
  // 说明这次没拿到新的；一份都没有才 502。
  if (snapshot) {
    return latestResponse(snapshot, 'stale-error', result.detail);
  }
  return jsonResponse({ error: 'upstream unavailable', detail: result.detail }, 502, 'no-store');
};
