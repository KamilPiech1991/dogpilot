import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { AppState, Dog, Breeding, StudMating, Litter, Puppy, Weight, Show, Championship, Expense, Reminder, HealthRecord, Profile, Heat, Income, Member } from './types';
import { FREE_LIMITS } from './types';
import { emptyState } from './seed';
import { setCurrency, setLocale } from './format';
import { setLanguage, type Lang } from './i18n';

const KEY = 'dogpilot.state.v1';
const LEGACY_KEY = 'kennelo.state.v1';

type Action =
  | { type: 'replace'; state: AppState }
  | { type: 'profile'; patch: Partial<Profile> }
  | { type: 'upsert'; coll: CollKey; item: AnyItem }
  | { type: 'remove'; coll: CollKey; id: string }
  | { type: 'bulk'; fn: (s: AppState) => AppState };

type CollKey = 'dogs' | 'health' | 'breedings' | 'studMatings' | 'litters' | 'puppies' | 'weights' | 'shows' | 'championships' | 'expenses' | 'reminders' | 'heats' | 'incomes' | 'members';
type AnyItem = Dog | HealthRecord | Breeding | StudMating | Litter | Puppy | Weight | Show | Championship | Expense | Reminder | Heat | Income | Member;

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'replace': return a.state;
    case 'profile': return { ...s, profile: { ...s.profile, ...a.patch } };
    case 'upsert': {
      const arr = s[a.coll] as AnyItem[];
      const i = arr.findIndex(x => x.id === a.item.id);
      const next = i >= 0 ? arr.map(x => (x.id === a.item.id ? a.item : x)) : [...arr, a.item];
      return { ...s, [a.coll]: next };
    }
    case 'remove': return { ...s, [a.coll]: (s[a.coll] as AnyItem[]).filter(x => x.id !== a.id) };
    case 'bulk': return a.fn(s);
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) { const st = { ...emptyState(), ...JSON.parse(raw) } as AppState; st.litters = st.litters.map(l => ({ ...l, birthDiary: l.birthDiary ?? [] })); return st; }
  } catch { /* ignore */ }
  return emptyState();
}

interface Ctx {
  state: AppState;
  dispatch: (a: Action) => void;
  upsert: (coll: CollKey, item: AnyItem) => void;
  remove: (coll: CollKey, id: string) => void;
  setProfile: (patch: Partial<Profile>) => void;
  replace: (state: AppState) => void;
  toast: (msg: string) => void;
  limits: { canAddDog: (sex: 'male' | 'female') => boolean; canAddShow: () => boolean; canAddChampionship: () => boolean; chartMonths: number; isPro: boolean };
}

const StoreCtx = createContext<Ctx | null>(null);

const readLang = (): Lang => { try { const v = localStorage.getItem('dogpilot.lang'); if (v === 'en') return 'en'; } catch { /* brak dostępu */ } return 'pl'; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toastMsg, setToast] = useState<string | null>(null);
  setCurrency(state.profile.currency ?? 'PLN'); // przed renderem dzieci, żeby kwoty od razu miały właściwą walutę
  // język: profil, a przed ukończeniem konfiguracji – wybór z ekranu powitalnego
  const lang: Lang = state.profile.language ?? readLang();
  setLocale(lang);
  useEffect(() => { setLanguage(lang); }, [lang]);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ } }, [state]);
  // motyw: jasny / ciemny / systemowy (reaguje na zmianę ustawień systemu)
  const themeMode = state.profile.theme ?? (state.profile.darkMode ? 'dark' : 'light');
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = themeMode === 'dark' || (themeMode === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0F1A15' : '#32BF46');
      if (dark !== !!state.profile.darkMode) dispatch({ type: 'profile', patch: { darkMode: dark } });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themeMode, state.profile.darkMode]);
  useEffect(() => { if (!toastMsg) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }, [toastMsg]);

  const ctx = useMemo<Ctx>(() => {
    const isPro = state.profile.plan === 'pro';
    return {
      state, dispatch,
      upsert: (coll, item) => dispatch({ type: 'upsert', coll, item }),
      remove: (coll, id) => dispatch({ type: 'remove', coll, id }),
      setProfile: patch => dispatch({ type: 'profile', patch }),
      replace: st => dispatch({ type: 'replace', state: st }),
      toast: msg => setToast(msg),
      limits: {
        isPro,
        canAddDog: sex => isPro || state.dogs.filter(d => d.sex === sex).length < (sex === 'female' ? FREE_LIMITS.females : FREE_LIMITS.males),
        canAddShow: () => isPro || state.shows.length < FREE_LIMITS.shows,
        canAddChampionship: () => isPro || state.championships.length < FREE_LIMITS.championships,
        chartMonths: isPro ? 6 : FREE_LIMITS.chartMonths,
      },
    };
  }, [state]);

  return (
    <StoreCtx.Provider value={ctx}>
      {children}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

export const dogLabel = (d?: Dog) => (d ? `${d.name}${d.pedigreeName && d.pedigreeName !== d.name ? ` (${d.pedigreeName})` : ''}` : '—');
