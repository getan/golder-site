// POST /api/purge —— 立刻作废 /api/latest 的缓存快照（发版时调用）。
//
// 为什么需要它：/api/latest 用 stale-while-revalidate，把「发版后还报旧版本」的
// 窗口从最坏 1 小时压到「下一次访问」。但发版方可以做得更好——它知道确切的发版
// 时刻，所以 release workflow 在发布成功后调这里，下一次访问就是新版本，没有
// 那一次 stale 返回。
//
// 鉴权：请求头 `x-purge-token` 必须等于环境变量 PURGE_TOKEN（在 Cloudflare
// Pages 项目的 Settings → Environment variables 里配，加密存储）。未配置
// PURGE_TOKEN 时一律 503 —— 宁可让发版方拿到明确的「没配」，也不要留一个无鉴权
// 的写接口在那儿。
//
// 为什么不用 Cloudflare 的 API token 直接 purge：那需要一个有 Pages 权限的
// token，而这里只需要一个自定义字符串；接口的作用域只有「删掉一份缓存快照」，
// 凭据影响面也小得多。

import { latestCacheKey, snapshotCache } from './latest';

interface Ctx {
  request: Request;
  env: { PURGE_TOKEN?: string };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

/** 常量时间比较，避免用响应时间把 token 一个字符一个字符试出来。 */
function tokenMatches(given: string, expected: string): boolean {
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  const expected = (ctx.env.PURGE_TOKEN ?? '').trim();
  if (!expected) {
    return json({ error: 'purge disabled: PURGE_TOKEN is not configured' }, 503);
  }
  const given = (ctx.request.headers.get('x-purge-token') ?? '').trim();
  if (!given || !tokenMatches(given, expected)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const cache = snapshotCache();
  const key = latestCacheKey(ctx.request.url);
  const existed = await cache.match(key);
  const deleted = await cache.delete(key);
  return json(
    {
      ok: true,
      // Cache API 的 delete 对「本来就没有」也返回 true，所以 wasCached 才是
      // 真实信息：发版方据此判断是「清掉了旧快照」还是「本来就没有」。
      wasCached: Boolean(existed),
      deleted,
      purgedAt: new Date().toISOString(),
    },
    200,
  );
};

// GET 只用于自检：确认接口在、鉴权已配好，且不透露 token。
export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  return json({ ok: true, enabled: Boolean((ctx.env.PURGE_TOKEN ?? '').trim()) }, 200);
};
