// Zdjęcia w Cloudflare R2: zdjęcie dodane w panelu najpierw trafia do danych jako data URL (działa od razu, także
// bez sieci), a potem w tle jest wysyłane do /api/media (funkcja Cloudflare Pages + R2) i podmieniane na adres URL.
// Tak samo przenoszone są zdjęcia zapisane wcześniej – dane hodowli na koncie robią się wielokrotnie mniejsze.
// Bez logowania (tryb demo) albo bez R2 (np. podgląd na GitHub Pages, lokalny serwer) zdjęcia zostają jak dotąd.
import { supabase, SITE_URL } from './auth';
import type { AppState } from './types';

const ENDPOINT = SITE_URL + 'api/media';
const RETRY_MS = 60_000;

let signedIn = false;
let disabled = false; // serwer bez R2 – nie próbujemy ponownie w tej sesji
let running = false;
let retryAt = 0;
const skip = new Set<string>(); // zdjęcia odrzucone przez serwer (np. za duże) – zostają w danych
let latest: { state: AppState; apply: (map: Map<string, string>) => void } | null = null;

const isDataImage = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:image/');

/** Wszystkie zdjęcia zapisane jako data URL (w dowolnym miejscu danych: psy, galerie, szczenięta, logo…). */
export function collectDataImages(v: unknown, out = new Set<string>()): Set<string> {
  if (isDataImage(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach(x => collectDataImages(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => collectDataImages(x, out));
  return out;
}

/** Podmienia data URL na adresy z R2; nietknięte fragmenty danych zachowują tożsamość (bez zbędnych przerysowań). */
export function swapImages<T>(v: T, map: Map<string, string>): T {
  if (typeof v === 'string') return (map.get(v) ?? v) as T;
  if (Array.isArray(v)) { let ch = false; const n = v.map(x => { const y = swapImages(x, map); if (y !== x) ch = true; return y; }); return (ch ? n : v) as T; }
  if (v && typeof v === 'object') {
    let ch = false; const n: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) { const y = swapImages(x, map); if (y !== x) ch = true; n[k] = y; }
    return (ch ? n : v) as T;
  }
  return v;
}

function toBlob(dataUrl: string): Blob {
  const i = dataUrl.indexOf(',');
  const type = dataUrl.slice(5, i).split(';')[0] || 'image/jpeg';
  const bin = atob(dataUrl.slice(i + 1));
  const bytes = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
  return new Blob([bytes], { type });
}

type Result = { url: string } | 'off' | 'retry' | 'skip';
async function upload(dataUrl: string, token: string): Promise<Result> {
  let r: Response;
  try { r = await fetch(ENDPOINT, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: toBlob(dataUrl) }); }
  catch { return 'retry'; } // brak sieci
  if (r.status === 201) { try { const j = (await r.json()) as { url?: string }; return j.url ? { url: j.url } : 'retry'; } catch { return 'retry'; } }
  if (r.status === 404 || r.status === 405 || r.status === 503) return 'off'; // brak funkcji lub R2 na tym serwerze
  if (r.status === 413 || r.status === 415 || r.status === 400) return 'skip';
  return 'retry'; // 401 (sesja się odświeża), 5xx
}

async function run() {
  if (!latest || !supabase) return;
  const { state, apply } = latest;
  const imgs = [...collectDataImages(state)].filter(d => !skip.has(d));
  if (!imgs.length) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  const map = new Map<string, string>();
  for (const d of imgs) {
    const res = await upload(d, token);
    if (res === 'off') { disabled = true; break; }
    if (res === 'retry') { retryAt = Date.now() + RETRY_MS; break; }
    if (res === 'skip') { skip.add(d); continue; }
    map.set(d, res.url);
  }
  if (map.size) apply(map);
}

/** Wołane przez magazyn stanu po każdej zmianie; wysyła nowe zdjęcia w tle (jedno przebieganie naraz). */
export function scheduleOffload(state: AppState, apply: (map: Map<string, string>) => void) {
  latest = { state, apply };
  if (!signedIn || disabled || running || Date.now() < retryAt || !supabase) return;
  running = true;
  run().catch(() => { retryAt = Date.now() + RETRY_MS; }).finally(() => { running = false; });
}

/** Włącza/wyłącza przenoszenie zdjęć (po wczytaniu danych konta / po wylogowaniu). */
export function setMediaUser(on: boolean, kick = true) {
  signedIn = on;
  if (on && kick && latest) scheduleOffload(latest.state, latest.apply);
}
