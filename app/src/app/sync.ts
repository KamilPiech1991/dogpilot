// Zapis danych hodowli na koncie (Supabase, tabela kennel_data): po zalogowaniu panel pobiera zapisaną hodowlę,
// a każda zmiana jest wysyłana w tle (z opóźnieniem, żeby nie zapisywać przy każdym znaku).
// Bez skonfigurowanego Supabase (tryb demo) nic tu się nie dzieje – dane zostają w przeglądarce.
import { supabase, registerBeforeSignOut } from './auth';
import type { AppState } from './types';

const META_KEY = 'dogpilot.sync.v1';
const TABLE = 'kennel_data';
const DEBOUNCE_MS = 1200;

/** owner – konto, do którego należą dane zapisane w tej przeglądarce; dirtyAt – ostatnia niewysłana zmiana; syncedAt – ostatni udany zapis. */
type Meta = { owner?: string; dirtyAt?: number; syncedAt?: number };
const readMeta = (): Meta => { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch { return {}; } };
const writeMeta = (m: Meta) => { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* brak miejsca */ } };

export type SyncStatus = 'off' | 'loading' | 'saved' | 'saving' | 'pending' | 'error' | 'missing';
let status: SyncStatus = 'off';
let lastSavedAt: number | undefined;
const listeners = new Set<() => void>();
const setStatus = (s: SyncStatus) => { status = s; listeners.forEach(f => f()); };
export const getSyncStatus = () => ({ status, lastSavedAt });
export function onSyncStatus(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }

let uid: string | null = null;
let lastJson = '';
let pendingJson: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<void> | null = null;

const isMissingTable = (e: { code?: string; message?: string } | null) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|could not find the table/i.test(e.message ?? ''));

async function push(json: string) {
  if (!supabase || !uid) return;
  setStatus('saving');
  const { error } = await supabase.from(TABLE).upsert({ user_id: uid, data: JSON.parse(json) }, { onConflict: 'user_id' });
  if (error) { setStatus(isMissingTable(error) ? 'missing' : 'error'); if (!isMissingTable(error)) console.warn('[dogpilot] zapis danych nie powiódł się:', error.message); return; }
  lastJson = json; lastSavedAt = Date.now();
  const m = readMeta();
  writeMeta({ owner: uid, syncedAt: lastSavedAt, dirtyAt: pendingJson && pendingJson !== json ? m.dirtyAt : undefined });
  setStatus(pendingJson && pendingJson !== json ? 'pending' : 'saved');
}

/** Wysyła od razu to, co czeka na zapis (np. przed wylogowaniem lub zamknięciem karty). */
export async function flushSync() {
  if (timer) { clearTimeout(timer); timer = undefined; }
  if (inFlight) await inFlight;
  if (pendingJson && pendingJson !== lastJson) { const j = pendingJson; inFlight = push(j).finally(() => { inFlight = null; }); await inFlight; }
}

/** Wołane przez magazyn stanu po każdej zmianie (z gotowym JSON-em, który i tak trafia do pamięci przeglądarki). */
export function onLocalChange(json: string) {
  if (!uid || json === lastJson) return;
  pendingJson = json;
  const m = readMeta(); writeMeta({ ...m, owner: uid, dirtyAt: Date.now() });
  if (status !== 'missing') setStatus('pending');
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = undefined; inFlight = (inFlight ?? Promise.resolve()).then(() => (pendingJson && pendingJson !== lastJson ? push(pendingJson) : undefined)).finally(() => { inFlight = null; }); }, DEBOUNCE_MS);
}

/**
 * Po zalogowaniu: pobiera dane konta. Zwraca stan do wczytania (dane z konta albo pusty stan dla nowego konta
 * w przeglądarce używanej wcześniej przez kogoś innego) albo null, gdy zostają dane z tej przeglądarki
 * (wtedy zostają wysłane na konto – np. hodowla założona przed włączeniem zapisu na koncie).
 */
export async function pullForUser(userId: string, local: AppState, fresh: () => AppState): Promise<AppState | null> {
  if (!supabase) return null;
  uid = userId;
  setStatus('loading');
  const meta = readMeta();
  const localJson = JSON.stringify(local);
  const { data, error } = await supabase.from(TABLE).select('data, updated_at').eq('user_id', userId).maybeSingle();
  if (error) {
    setStatus(isMissingTable(error) ? 'missing' : 'error');
    if (!isMissingTable(error)) console.warn('[dogpilot] pobranie danych nie powiodło się:', error.message);
    return null; // brak tabeli lub błąd sieci: pracujemy na danych z tej przeglądarki
  }
  if (data?.data) {
    const remoteAt = Date.parse(data.updated_at as string) || 0;
    const localNewer = meta.owner === userId && !!meta.dirtyAt && meta.dirtyAt > (meta.syncedAt ?? 0) && meta.dirtyAt > remoteAt;
    if (localNewer) { pendingJson = localJson; await flushSync(); return null; } // niewysłane zmiany z tego urządzenia są nowsze
    const remote = data.data as AppState;
    lastJson = JSON.stringify(remote); lastSavedAt = remoteAt;
    writeMeta({ owner: userId, syncedAt: remoteAt });
    setStatus('saved');
    return remote;
  }
  // konto nie ma jeszcze zapisanych danych
  const localIsTheirs = meta.owner === userId || (!meta.owner && !!local.profile?.onboarded);
  if (localIsTheirs) { pendingJson = localJson; await flushSync(); return null; }
  const empty = fresh();
  lastJson = ''; writeMeta({ owner: userId });
  setStatus('saved');
  return empty;
}

export function stopSync() { uid = null; pendingJson = null; if (timer) clearTimeout(timer); timer = undefined; setStatus('off'); }

// zapis przed wylogowaniem i przy chowaniu karty (telefon, zamknięcie przeglądarki)
registerBeforeSignOut(async () => { await flushSync(); stopSync(); });
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flushSync(); });
  window.addEventListener('pagehide', () => { void flushSync(); });
}
