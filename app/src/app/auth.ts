// Logowanie przez Supabase (Google / e-mail). Bez zmiennych VITE_SUPABASE_* aplikacja działa w trybie demo (dane lokalne).
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const authReady = Boolean(supabase);

export type AuthUser = { id: string; email: string; name: string; provider: 'email' | 'google' | 'apple' };
const toUser = (s: Session | null): AuthUser | null => {
  if (!s) return null;
  const u = s.user; const meta = (u.user_metadata ?? {}) as Record<string, string>;
  const p = u.app_metadata?.provider as string | undefined;
  return { id: u.id, email: u.email ?? '', name: meta.full_name ?? meta.name ?? meta.given_name ?? '', provider: p === 'google' ? 'google' : p === 'apple' ? 'apple' : 'email' };
};
export async function currentUser(): Promise<AuthUser | null> { if (!supabase) return null; const { data } = await supabase.auth.getSession(); return toUser(data.session); }
export function onAuth(cb: (u: AuthUser | null) => void) { if (!supabase) return () => {}; const { data } = supabase.auth.onAuthStateChange((_e, s) => cb(toUser(s))); return () => data.subscription.unsubscribe(); }
export async function signInGoogle() { if (!supabase) return { error: 'demo' }; const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } }); return { error: error?.message }; }
export async function signInEmail(email: string, password: string) { if (!supabase) return { error: 'demo' }; const { error } = await supabase.auth.signInWithPassword({ email, password }); return { error: error?.message }; }
export async function signUpEmail(email: string, password: string, name: string) { if (!supabase) return { error: 'demo', confirm: false }; const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } }); return { error: error?.message, confirm: !data.session }; }
export async function signOut() { await supabase?.auth.signOut(); }
