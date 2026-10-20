import { useState } from 'react';
import { PawPrint, Dog, Eye, EyeOff, Mail, Lock, ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { useStore } from '../app/store';
import { demoState } from '../app/seed';
import { Field, Wordmark } from '../components/ui';
import type { Module } from '../app/types';
import { setLanguage } from '../app/i18n';

type Step = 'module' | 'auth' | 'details';
type Lang = 'pl' | 'en';
const LANG_KEY = 'dogpilot.lang';
const TXT = {
  pl: {
    tagline: 'Hodowla i psy w jednym miejscu.', how: 'Jak korzystasz z aplikacji?', howSub: 'Wybierz tryb pracy. Zmienisz go w każdej chwili w Ustawieniach.',
    owner: 'Mam psiaka', ownerSub: 'Zdrowie, wydatki, przypomnienia i codzienna opieka nad Twoim psem. Odbierz psa od hodowcy kodem QR.',
    breeder: 'Prowadzę hodowlę', breederSub: 'Psy, rozród, monitor ciąży, mioty, szczenięta, wystawy, finanse, raporty i karty przekazania.',
    demo: 'Załaduj dane demonstracyjne (hodowla)', local: 'Dane są zapisywane lokalnie w Twojej przeglądarce.', lang: 'Język aplikacji',
    register: 'Załóż bezpłatne konto', login: 'Mam już konto', regTitle: 'Zacznij za darmo', loginTitle: 'Witaj ponownie',
    regSub: 'Plan FREE bez karty. Dane synchronizują się między telefonem a komputerem.', loginSub: 'Zaloguj się, a Twoje psy i mioty będą czekać tam, gdzie je zostawiłeś.',
    email: 'Adres e-mail', emailPh: 'np. ania@hodowla.pl', pw: 'Hasło', pwHint: 'Co najmniej 8 znaków.', pwNew: 'Wymyśl hasło', pwCur: 'Twoje hasło', show: 'Pokaż hasło', hide: 'Ukryj hasło',
    forgot: 'Nie pamiętasz hasła?', doRegister: 'Załóż konto', doLogin: 'Zaloguj się', or: 'lub', gReg: 'Zarejestruj się kontem Google', gLogin: 'Zaloguj się kontem Google',
    legalReg: 'Zakładając konto akceptujesz regulamin i politykę prywatności. Dane hodowli nie są udostępniane nikomu bez Twojej zgody.', legalLogin: 'Prototyp: logowanie jest symulowane, konto i synchronizacja pojawią się razem z backendem.',
    errEmail: 'Podaj poprawny adres e-mail.', errPwLogin: 'Wpisz hasło.', errPw: 'Hasło powinno mieć co najmniej 8 znaków.',
    back: 'Logowanie', kennelData: 'Dane hodowli', yourData: 'Twoje dane', gLinked: 'Konto Google połączone.', account: 'Konto:', fewFields: 'Jeszcze tylko kilka pól i zaczynamy.',
    name: 'Twoje imię', namePh: 'np. Ania', kennel: 'Nazwa hodowli', kennelPh: 'np. z Zielonego Wzgórza', kennelNo: 'Numer hodowli (opcjonalnie)', gEmail: 'Adres e-mail konta Google', gEmailPh: 'np. ania@gmail.com', start: 'Zaczynamy',
    enNote: '',
  },
  en: {
    tagline: 'Your kennel and dogs in one place.', how: 'How will you use the app?', howSub: 'Choose a mode. You can change it any time in Settings.',
    owner: 'I have a dog', ownerSub: 'Health, expenses, reminders and everyday care for your dog. Take over a dog from a breeder with a QR code.',
    breeder: 'I run a kennel', breederSub: 'Dogs, breeding, pregnancy monitor, litters, puppies, shows, finances, reports and handover cards.',
    demo: 'Load demo data (kennel)', local: 'Data is stored locally in your browser.', lang: 'App language',
    register: 'Create a free account', login: 'I have an account', regTitle: 'Start for free', loginTitle: 'Welcome back',
    regSub: 'FREE plan, no card needed. Your data syncs between phone and computer.', loginSub: 'Log in and your dogs and litters will be right where you left them.',
    email: 'E-mail address', emailPh: 'e.g. anna@kennel.com', pw: 'Password', pwHint: 'At least 8 characters.', pwNew: 'Create a password', pwCur: 'Your password', show: 'Show password', hide: 'Hide password',
    forgot: 'Forgot your password?', doRegister: 'Create account', doLogin: 'Log in', or: 'or', gReg: 'Sign up with Google', gLogin: 'Log in with Google',
    legalReg: 'By creating an account you accept the terms and privacy policy. Kennel data is never shared without your consent.', legalLogin: 'Prototype: login is simulated; accounts and sync arrive with the backend.',
    errEmail: 'Enter a valid e-mail address.', errPwLogin: 'Enter your password.', errPw: 'Password must be at least 8 characters.',
    back: 'Log in', kennelData: 'Kennel details', yourData: 'Your details', gLinked: 'Google account connected.', account: 'Account:', fewFields: 'Just a few fields and we are ready.',
    name: 'Your first name', namePh: 'e.g. Anna', kennel: 'Kennel name', kennelPh: 'e.g. Green Hill', kennelNo: 'Kennel number (optional)', gEmail: 'Google account e-mail', gEmailPh: 'e.g. anna@gmail.com', start: "Let's start",
    enNote: 'The whole app switches to English, including dates and amounts.',
  },
};
const initialLang = (): Lang => { try { const v = localStorage.getItem(LANG_KEY); if (v === 'pl' || v === 'en') return v; } catch { /* brak dostępu */ } return typeof navigator !== 'undefined' && navigator.language && !navigator.language.toLowerCase().startsWith('pl') ? 'en' : 'pl'; };

function LangSwitch({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  return (
    <div className="lang-switch" role="radiogroup" aria-label={label}>
      <Globe size={16} aria-hidden />
      {(['pl', 'en'] as Lang[]).map(l => <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => onChange(l)}><span aria-hidden>{l === 'pl' ? '🇵🇱' : '🇬🇧'}</span> {l === 'pl' ? 'Polski' : 'English'}</button>)}
    </div>
  );
}
type AuthMode = 'register' | 'login';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4-13.6-9.7l-7.8 6C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function Onboarding() {
  const { setProfile, replace } = useStore();
  const [step, setStep] = useState<Step>('module');
  const [module, setModule] = useState<Module>('breeder');
  const [mode, setMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [provider, setProvider] = useState<'email' | 'google'>('email');
  const [name, setName] = useState('');
  const [kennel, setKennel] = useState('');
  const [kennelNo, setKennelNo] = useState('');
  const [lang, setLangState] = useState<Lang>(initialLang);
  const L = TXT[lang];
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } setLanguage(l); };

  const loadDemo = () => { const s = demoState(); replace({ ...s, profile: { ...s.profile, language: lang } }); };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pwOk = mode === 'login' ? password.length > 0 : password.length >= 8;

  const submitAuth = () => {
    if (!emailOk) { setAuthErr(L.errEmail); return; }
    if (!pwOk) { setAuthErr(mode === 'login' ? L.errPwLogin : L.errPw); return; }
    setAuthErr(''); setProvider('email'); setStep('details');
  };
  const google = () => { setAuthErr(''); setProvider('google'); if (!email) setEmail(''); setStep('details'); };
  const finish = () => setProfile({ module, breederName: name.trim(), kennelName: kennel.trim(), kennelNo: kennelNo.trim(), email: email.trim(), authProvider: provider, language: lang, onboarded: true });

  return (
    <div className="module-pick">
      <div className="box">
        {step === 'module' ? (
          <picture>
            <source media="(max-width: 640px)" srcSet={`${import.meta.env.BASE_URL}brand/header-mobile.webp`} />
            <img className="brand-hero" src={`${import.meta.env.BASE_URL}brand/header-1600.webp`} srcSet={`${import.meta.env.BASE_URL}brand/header-800.webp 800w, ${import.meta.env.BASE_URL}brand/header-1600.webp 1600w`} sizes="(max-width: 800px) 100vw, 760px" alt="dogpilot – hodowla i psy w jednym miejscu" />
          </picture>
        ) : (
          <picture>
            <source media="(max-width: 640px)" srcSet={`${import.meta.env.BASE_URL}brand/header2-mobile.webp`} />
            <img className="brand-hero short" src={`${import.meta.env.BASE_URL}brand/header2-1600.webp`} srcSet={`${import.meta.env.BASE_URL}brand/header2-800.webp 800w, ${import.meta.env.BASE_URL}brand/header2-1600.webp 1600w`} sizes="(max-width: 800px) 100vw, 760px" alt="dogpilot – hodowla i psy w jednym miejscu" />
          </picture>
        )}
        <div className="row only-mobile" style={{ marginBottom: 16, gap: 10 }}><div className="avatar" style={{ width: 44, height: 44, background: 'var(--primary)', color: '#fff' }}><PawPrint size={24} className="wag" /></div><Wordmark height={30} /></div>

        {step === 'module' && (
          <>
            <div className="muted" style={{ marginBottom: 18, fontWeight: 700 }}>{L.tagline}</div>
            <h2>{L.how}</h2>
            <p className="muted">{L.howSub}</p>
            <div className="grid cols-2 stack-m" style={{ marginTop: 16 }}>
              <div className="module-card" onClick={() => { setModule('owner'); setStep('auth'); }}>
                <div className="avatar" style={{ width: 52, height: 52, marginBottom: 8 }}><Dog size={28} /></div><h3>{L.owner}</h3>
                <p className="muted">{L.ownerSub}</p>
              </div>
              <div className="module-card dark" onClick={() => { setModule('breeder'); setStep('auth'); }}>
                <div className="avatar" style={{ width: 52, height: 52, marginBottom: 8, background: 'rgba(255,255,255,.2)', color: '#fff' }}><PawPrint size={28} /></div><h3>{L.breeder}</h3>
                <p style={{ opacity: .85 }}>{L.breederSub}</p>
              </div>
            </div>
            <div style={{ marginTop: 22, textAlign: 'center' }}>
              <button className="btn secondary" onClick={loadDemo}>{L.demo}</button>
              <div className="muted" style={{ marginTop: 8 }}>{L.local}</div>
              <LangSwitch lang={lang} onChange={setLang} label={L.lang} />
              {L.enNote && <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{L.enNote}</div>}
            </div>
          </>
        )}

        {step === 'auth' && (
          <div className="auth card">
            <button className="btn ghost sm" onClick={() => setStep('module')} style={{ alignSelf: 'flex-start', marginLeft: -8 }}><ArrowLeft size={16} /> {module === 'breeder' ? L.breeder : L.owner}</button>
            <div className="auth-tabs" role="tablist">
              <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setAuthErr(''); }}>{L.register}</button>
              <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setAuthErr(''); }}>{L.login}</button>
            </div>
            <h2 style={{ marginTop: 4 }}>{mode === 'register' ? L.regTitle : L.loginTitle}</h2>
            <p className="muted" style={{ marginTop: -4 }}>{mode === 'register' ? L.regSub : L.loginSub}</p>
            <form onSubmit={e => { e.preventDefault(); submitAuth(); }} noValidate>
              <Field label={L.email}>
                <div className="input-ico"><Mail size={18} /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={L.emailPh} /></div>
              </Field>
              <Field label={L.pw} hint={mode === 'register' ? L.pwHint : undefined}>
                <div className="input-ico"><Lock size={18} /><input type={showPw ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? L.pwNew : L.pwCur} /><button type="button" className="icon-btn" aria-label={showPw ? L.hide : L.show} onClick={() => setShowPw(s => !s)}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </Field>
              {mode === 'login' && <div style={{ textAlign: 'right', marginTop: -4 }}><a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 13, fontWeight: 700 }}>{L.forgot}</a></div>}
              {authErr && <div className="badge danger" style={{ marginTop: 8 }}>{authErr}</div>}
              <button type="submit" className="btn" style={{ width: '100%', marginTop: 12, height: 48 }}>{mode === 'register' ? L.doRegister : L.doLogin}</button>
            </form>
            <div className="auth-or"><span>{L.or}</span></div>
            <button className="btn google" onClick={google}><GoogleMark /> {mode === 'register' ? L.gReg : L.gLogin}</button>
            <div className="muted" style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 12 }}><ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>{mode === 'register' ? L.legalReg : L.legalLogin}</span></div>
          </div>
        )}

        {step === 'details' && (
          <div className="auth card">
            <button className="btn ghost sm" onClick={() => setStep('auth')} style={{ alignSelf: 'flex-start', marginLeft: -8 }}><ArrowLeft size={16} /> {L.back}</button>
            <h2>{module === 'breeder' ? L.kennelData : L.yourData}</h2>
            <p className="muted" style={{ marginTop: -4 }}>{provider === 'google' ? L.gLinked : `${L.account} ${email.trim()}`} {L.fewFields}</p>
            <Field label={L.name}><input value={name} onChange={e => setName(e.target.value)} placeholder={L.namePh} autoFocus /></Field>
            {module === 'breeder' && <>
              <Field label={L.kennel}><input value={kennel} onChange={e => setKennel(e.target.value)} placeholder={L.kennelPh} /></Field>
              <Field label={L.kennelNo}><input value={kennelNo} onChange={e => setKennelNo(e.target.value)} /></Field>
            </>}
            {provider === 'google' && <Field label={L.gEmail}><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={L.gEmailPh} /></Field>}
            <button className="btn" style={{ width: '100%', height: 48 }} disabled={!name.trim()} onClick={finish}>{L.start}</button>
          </div>
        )}
      </div>
    </div>
  );
}
