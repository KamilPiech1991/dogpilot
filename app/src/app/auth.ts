// Logowanie przez Supabase (Google / e-mail). Bez zmiennych VITE_SUPABASE_* aplikacja działa w trybie demo (dane lokalne).
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } }) : null;
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
/** Po powrocie z Google/e-maila: co jest w adresie i czy powstała sesja. Zwraca komunikat do pokazania (lub null, gdy nie było powrotu). */
export async function consumeAuthReturn(): Promise<{ ok: boolean; message: string } | null> {
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(window.location.hash.replace(/^#\/?\??/, '').replace(/^.*\?/, ''));
  const err = q.get('error_description') || h.get('error_description') || q.get('error') || h.get('error');
  if (err) { cleanUrl(); return { ok: false, message: `Logowanie nie powiodło się: ${decodeURIComponent(err.replace(/\+/g, ' '))}` }; }
  if (!q.get('code')) return null;
  if (!supabase) return { ok: false, message: 'Panel zbudowano bez kluczy Supabase – logowanie jest niedostępne.' };
  const { data, error } = await supabase.auth.getSession();
  cleanUrl();
  if (error) return { ok: false, message: `Logowanie nie powiodło się: ${error.message}` };
  if (!data.session) return { ok: false, message: 'Logowanie nie powiodło się: kod z Google nie dał sesji (otwórz logowanie i panel w tej samej przeglądarce, bez trybu prywatnego).' };
  return { ok: true, message: `Zalogowano: ${data.session.user.email ?? 'konto Google'}` };
}
function cleanUrl() { try { const u = new URL(window.location.href); ['code', 'error', 'error_description', 'error_code'].forEach(k => u.searchParams.delete(k)); window.history.replaceState(window.history.state, '', u.toString()); } catch { /* ignoruj */ } }

export async function signOut() { try { await supabase?.auth.signOut(); } catch { /* brak sesji */ } }
