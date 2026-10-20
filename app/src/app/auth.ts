// Logowanie przez Supabase (Google / e-mail). Bez zmiennych VITE_SUPABASE_* aplikacja działa w trybie demo (dane lokalne).
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } }) : null;
export const authReady = Boolean(supabase);

/** Wersje dokumentów, które klient akceptuje przy rejestracji (podbij przy zmianie treści). */
export const TERMS_VERSION = '2026-10-20';
export const PRIVACY_VERSION = '2026-10-20';
const CONSENT_KEY = 'dogpilot.consent';
export type Consent = { terms_version: string; privacy_version: string; terms_accepted_at: string; marketing_consent?: boolean };

/** Zgoda zaznaczona przed rejestracją – zapamiętana lokalnie, bo logowanie Google wraca z zewnątrz. */
export function rememberConsent(marketing = false): Consent {
  const c: Consent = { terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION, terms_accepted_at: new Date().toISOString(), marketing_consent: marketing };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch { /* brak pamięci */ }
  return c;
}
function readConsent(): Consent | null { try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch { return null; } }
function clearConsent() { try { localStorage.removeItem(CONSENT_KEY); } catch { /* ignoruj */ } }

export type AuthUser = { id: string; email: string; name: string; provider: 'email' | 'google' | 'apple'; hasPassword: boolean };
const toUser = (s: Session | null): AuthUser | null => {
  if (!s) return null;
  const u = s.user; const meta = (u.user_metadata ?? {}) as Record<string, string>;
  const p = u.app_metadata?.provider as string | undefined;
  const hasPassword = Boolean(u.identities?.some(i => i.provider === 'email'));
  return { id: u.id, email: u.email ?? '', name: meta.full_name ?? meta.name ?? meta.given_name ?? '', provider: p === 'google' ? 'google' : p === 'apple' ? 'apple' : 'email', hasPassword };
};
export async function currentUser(): Promise<AuthUser | null> { if (!supabase) return null; const { data } = await supabase.auth.getSession(); return toUser(data.session); }
export function onAuth(cb: (u: AuthUser | null) => void) { if (!supabase) return () => {}; const { data } = supabase.auth.onAuthStateChange((_e, s) => cb(toUser(s))); return () => data.subscription.unsubscribe(); }

const here = () => window.location.origin + window.location.pathname;

export async function signInGoogle() { if (!supabase) return { error: 'demo' }; const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } }); return { error: error?.message }; }
export async function signInEmail(email: string, password: string) { if (!supabase) return { error: 'demo' }; const { error } = await supabase.auth.signInWithPassword({ email, password }); return { error: error?.message }; }
/** Rejestracja e-mailem: zgoda i tryb trafiają do metadanych konta (trigger w bazie kopiuje je do customers). */
export async function signUpEmail(email: string, password: string, extra: { name?: string; mode?: 'breeder' | 'owner'; language?: string; consent: Consent }) {
  if (!supabase) return { error: 'demo', confirm: false };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: here(), data: { full_name: extra.name ?? '', mode: extra.mode, language: extra.language ?? 'pl', ...extra.consent } } });
  return { error: error?.message, confirm: !data.session };
}
export async function sendPasswordReset(email: string) { if (!supabase) return { error: 'demo' }; const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: here() + '#/ustaw-haslo' }); return { error: error?.message }; }
export async function setPassword(password: string) { if (!supabase) return { error: 'demo' }; const { error } = await supabase.auth.updateUser({ password }); return { error: error?.message }; }

/** Uzupełnia wiersz klienta (tylko własny – RLS) i metadane konta. Błędy nie blokują aplikacji. */
export async function syncCustomer(patch: { full_name?: string; mode?: 'breeder' | 'owner'; kennel_name?: string; language?: string; marketing_consent?: boolean }) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession(); const u = data.session?.user; if (!u) return;
  const consent = readConsent();
  const row: Record<string, unknown> = { ...patch };
  if (consent) Object.assign(row, consent);
  try {
    await supabase.from('customers').update(row).eq('id', u.id);
    if (consent && !u.user_metadata?.terms_accepted_at) await supabase.auth.updateUser({ data: { ...consent } });
    if (consent) clearConsent();
  } catch { /* baza klientów jeszcze nie utworzona – nie przerywaj */ }
}

/** Po pierwszym zalogowaniu kontem Google (bez hasła): jednorazowy e-mail z podziękowaniem i linkiem „Ustaw hasło”. */
export async function sendWelcomeIfNeeded(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession(); const u = data.session?.user; if (!u?.email) return false;
  if (u.identities?.some(i => i.provider === 'email')) return false; // ma hasło – e-mail potwierdzający poszedł przy rejestracji
  try {
    const { data: row } = await supabase.from('customers').select('welcome_email_at').eq('id', u.id).maybeSingle();
    if (!row || row.welcome_email_at) return false;
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, { redirectTo: here() + '#/ustaw-haslo' });
    if (error) return false;
    await supabase.from('customers').update({ welcome_email_at: new Date().toISOString() }).eq('id', u.id);
    return true;
  } catch { return false; }
}

/** Po powrocie z Google/e-maila: co jest w adresie i czy powstała sesja. Zwraca komunikat do pokazania (lub null, gdy nie było powrotu). */
export async function consumeAuthReturn(): Promise<{ ok: boolean; message: string; recovery?: boolean } | null> {
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
  await syncCustomer({});
  const welcomed = await sendWelcomeIfNeeded();
  const email = data.session.user.email ?? 'konto Google';
  return { ok: true, message: welcomed ? `Zalogowano: ${email}. Wysłaliśmy e-mail z podziękowaniem i linkiem do ustawienia hasła.` : `Zalogowano: ${email}`, recovery: window.location.hash.includes('ustaw-haslo') };
}
function cleanUrl() { try { const u = new URL(window.location.href); ['code', 'error', 'error_description', 'error_code'].forEach(k => u.searchParams.delete(k)); window.history.replaceState(window.history.state, '', u.toString()); } catch { /* ignoruj */ } }

export async function signOut() { try { await supabase?.auth.signOut(); } catch { /* brak sesji */ } }
