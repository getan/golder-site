// GET /api/latest —— 返回主仓库最新 release 的版本号（站点版本角标与 install.sh 共用）。
//
// 数据源优先级：
//   1) github.com/<repo>/releases/latest 的 302 Location —— 匿名、无限流（首选）
//   2) GitHub REST API —— 兜底；未认证时每 IP 60 次/小时，仅在第 1 条失败时触发
//
// 响应：{ "tag": "v1.2.2", "url": "https://github.com/getan/golder/releases/tag/v1.2.2" }
// 缓存：Cache API 边缘缓存 1 小时 → 每天回源 GitHub 最多几十次，免费额度无压力。

const REPO = 'getan/golder';
const UA = 'golder-site (+https://golder-cli.pages.dev)';
const CACHE_SECONDS = 3600;
const BROWSER_MAX_AGE = 300;

interface Latest {
  tag: string;
  url: string;
}

interface Ctx {
  request: Request;
  waitUntil: (p: Promise<unknown>) => void;
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

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const cache = caches.default;
  const key = new Request(new URL('/api/latest', ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  let latest: Latest;
  try {
    latest = await fromRedirect();
  } catch (first) {
    try {
      latest = await fromAPI();
    } catch (second) {
      return jsonResponse({ error: 'upstream unavailable', detail: `${first}; ${second}` }, 502, 'no-store');
    }
  }

  const body = JSON.stringify(latest);
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': `public, max-age=${BROWSER_MAX_AGE}, s-maxage=${CACHE_SECONDS}`,
    'access-control-allow-origin': '*',
  };
  // 边缘缓存另存一份长 TTL 的副本（Cache API 的命中不经过浏览器缓存语义）。
  ctx.waitUntil(
    cache.put(key, new Response(body, { headers: { ...headers, 'cache-control': `public, max-age=${CACHE_SECONDS}` } })),
  );
  return new Response(body, { headers });
};
