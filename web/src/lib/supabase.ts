// Klient Supabase (logowanie Google / e-mail). Bez zmiennych środowiskowych strona działa w trybie demo.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } }) : null;
export const authReady = Boolean(supabase);
