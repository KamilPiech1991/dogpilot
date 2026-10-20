import type { AppState } from './types';

/**
 * Kopia zapasowa „w chmurze”. W prototypie zapisujemy ją w osobnym miejscu pamięci przeglądarki,
 * żeby pokazać przepływ (zapis, stan, przywracanie). W wersji z backendem ta sama funkcja wyśle dane na serwer.
 */
const KEY = 'dogpilot.cloud.v1';
export interface CloudInfo { at: string; bytes: number; dogs: number; litters: number; puppies: number }

export function saveCloud(state: AppState): CloudInfo {
  const at = new Date().toISOString();
  const data = JSON.stringify({ ...state, profile: { ...state.profile, lastCloudBackup: at } });
  const info: CloudInfo = { at, bytes: data.length, dogs: state.dogs.length, litters: state.litters.length, puppies: state.puppies.length };
  localStorage.setItem(KEY, JSON.stringify({ info, data }));
  return info;
}
export function cloudInfo(): CloudInfo | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw).info as CloudInfo) : null; } catch { return null; }
}
export function loadCloud(): AppState | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(JSON.parse(raw).data) as AppState) : null; } catch { return null; }
}
export function deleteCloud() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
export const fmtBytes = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
