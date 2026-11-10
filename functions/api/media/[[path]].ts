// Cloudflare Pages Function: zdjęcia z panelu w Cloudflare R2 (powiązanie MEDIA).
//   POST   /api/media                 – wysyła zdjęcie (zalogowany użytkownik), zwraca { url }
//   GET    /api/media/u/<uid>/<plik>  – zwraca zdjęcie (adresy są losowe i niezgadywalne)
//   DELETE /api/media/u/<uid>/<plik>  – usuwa zdjęcie (tylko właściciel)
// Bez powiązania MEDIA odpowiada 503 – panel zostawia wtedy zdjęcia w danych hodowli (jak dotąd).

interface R2Object { body: ReadableStream; httpEtag: string; httpMetadata?: { contentType?: string } }
interface R2Bucket {
  put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}
interface Env {
  MEDIA?: R2Bucket;
  MEDIA_PUBLIC_URL?: string; // np. https://media.dogpilot.pl (domena podpięta do bucketu); bez niej zdjęcia idą przez /api/media
  SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string;
  PUBLIC_SUPABASE_URL?: string; PUBLIC_SUPABASE_ANON_KEY?: string;
}
type Ctx = { request: Request; env: Env; params: { path?: string[] }; waitUntil(p: Promise<unknown>): void };

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const KEY_RE = /^u\/[0-9a-f-]{36}\/[0-9a-f]{32}\.(jpg|png|webp)$/;
const IMMUTABLE = 'public, max-age=31536000, immutable';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/** Sprawdza token sesji Supabase i zwraca id użytkownika. */
async function userId(req: Request, env: Env): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = env.SUPABASE_URL || env.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = (await r.json()) as { id?: string };
  return u.id ?? null;
}

export async function onRequest(ctx: Ctx): Promise<Response> {
  const { request: req, env } = ctx;
  const key = (ctx.params.path ?? []).join('/');
  if (!env.MEDIA) return json({ error: 'not_configured' }, 503);

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (!KEY_RE.test(key)) return new Response('Not found', { status: 404 });
    const obj = await env.MEDIA.get(key);
    if (!obj) return new Response('Not found', { status: 404 });
    return new Response(req.method === 'HEAD' ? null : obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType ?? 'image/jpeg', 'cache-control': IMMUTABLE, etag: obj.httpEtag, 'access-control-allow-origin': '*' } });
  }

  if (req.method === 'POST' && !key) {
    const uid = await userId(req, env);
    if (!uid) return json({ error: 'unauthorized' }, 401);
    const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const ext = TYPES[type];
    if (!ext) return json({ error: 'unsupported_type' }, 415);
    const body = await req.arrayBuffer();
    if (!body.byteLength) return json({ error: 'empty' }, 400);
    if (body.byteLength > MAX_BYTES) return json({ error: 'too_large' }, 413);
    const rand = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
    const k = `u/${uid}/${rand}.${ext}`;
    await env.MEDIA.put(k, body, { httpMetadata: { contentType: type, cacheControl: IMMUTABLE }, customMetadata: { owner: uid } });
    const base = env.MEDIA_PUBLIC_URL ? env.MEDIA_PUBLIC_URL.replace(/\/$/, '') : `${new URL(req.url).origin}/api/media`;
    return json({ url: `${base}/${k}`, key: k }, 201);
  }

  if (req.method === 'DELETE' && KEY_RE.test(key)) {
    const uid = await userId(req, env);
    if (!uid) return json({ error: 'unauthorized' }, 401);
    if (!key.startsWith(`u/${uid}/`)) return json({ error: 'forbidden' }, 403);
    await env.MEDIA.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'method_not_allowed' }, 405);
}
