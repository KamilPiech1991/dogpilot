import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Dog, PawPrint, Wallet, BarChart3, Settings, Bell, QrCode, Plus, Scale, Syringe, Receipt, AlarmClock, FileText, Search, Moon, Sun, Trophy, ExternalLink, CalendarDays } from 'lucide-react';
import { useStore } from '../app/store';
import { Wordmark } from './ui';
import { collectNotifications, maybeSystemNotify } from '../app/notifications';
import { today, daysBetween } from '../app/format';
import { saveCloud } from '../app/cloud';

export default function Layout() {
  const { state, setProfile } = useStore();
  const nav = useNavigate();
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState('');
  const breeder = state.profile.module === 'breeder';
  const latestLitter = [...state.litters].sort((a, b) => b.birthDate.localeCompare(a.birthDate))[0];
  const main = [
    { to: '/', label: 'Start', ico: <Home size={22} /> },
    { to: '/psy', label: 'Psy', ico: <Dog size={22} /> },
    ...(breeder ? [{ to: '/mioty', label: 'Mioty', ico: <PawPrint size={22} /> }] : [{ to: '/finanse', label: 'Finanse', ico: <Wallet size={22} /> }]),
    { to: '/raporty', label: 'Raporty', ico: <BarChart3 size={22} /> },
  ];
  // dolny pasek (telefon): Start, Mioty, „+” na środku, Raporty, Ustawienia; w trybie „Mam psiaka” zamiast Miotów są Psy
  const bottom = [
    { to: '/', label: 'Start', ico: <Home size={22} /> },
    breeder ? { to: '/mioty', label: 'Mioty', ico: <PawPrint size={22} /> } : { to: '/psy', label: 'Psy', ico: <Dog size={22} /> },
    { to: '/raporty', label: 'Raporty', ico: <BarChart3 size={22} /> },
    { to: '/ustawienia', label: 'Ustawienia', ico: <Settings size={22} /> },
  ];
  const side = [
    main[0], main[1], ...(breeder ? [main[2], { to: '/finanse', label: 'Finanse', ico: <Wallet size={22} /> }] : [main[2]]),
    { to: '/raporty', label: 'Raporty', ico: <BarChart3 size={22} /> },
    { to: '/wystawy', label: 'Kalendarz wystaw', ico: <CalendarDays size={22} /> },
    ...(breeder ? [{ to: '/dokumenty', label: 'Dokumenty', ico: <FileText size={22} /> }] : []),
    { to: '/powiadomienia', label: 'Powiadomienia', ico: <Bell size={22} /> },
    { to: '/skanuj', label: 'Odbierz psa', ico: <QrCode size={22} /> },
    { to: '/ustawienia', label: 'Ustawienia', ico: <Settings size={22} /> },
  ];
  const notifCount = useMemo(() => collectNotifications(state, today()).length, [state]);
  useEffect(() => { maybeSystemNotify(state, today()); }, [state]);
  // automatyczna kopia w chmurze raz w tygodniu (prototyp: w pamięci przeglądarki)
  useEffect(() => {
    const last = state.profile.lastCloudBackup;
    if (!state.profile.autoBackup || (last && daysBetween(last.slice(0, 10), today()) < 7)) return;
    try { const info = saveCloud(state); setProfile({ lastCloudBackup: info.at }); } catch { /* brak miejsca */ }
  }, [state, setProfile]);
  const go = (to: string, external?: boolean) => { setSheet(false); if (external) { window.open(to, '_blank', 'noopener'); return; } nav(to); };
  const actions = [
    ...(breeder && latestLitter ? [{ label: 'Pomiar wagi szczeniąt', sub: latestLitter.name, ico: <Scale size={20} />, to: `/mioty/${latestLitter.id}?weigh=1` }] : []),
    { label: 'Szczepienie lub odrobaczenie', sub: 'wpis zdrowotny', ico: <Syringe size={20} />, to: '/psy?health=1' },
    { label: 'Wydatek', sub: 'hodowla lub wystawa', ico: <Receipt size={20} />, to: '/finanse?add=1' },
    { label: 'Przypomnienie', sub: 'termin, wizyta, wydarzenie', ico: <AlarmClock size={20} />, to: '/przypomnienia?add=1' },
    { label: 'Nowy pies', sub: 'do mojej hodowli', ico: <Dog size={20} />, to: '/psy?add=1' },
    ...(breeder ? [{ label: 'Dodaj nowy miot', sub: 'metryka, szczenięta, plan odchowu', ico: <PawPrint size={20} />, to: '/mioty?add=1' }] : []),
    { label: 'Zarezerwuj wystawę', sub: 'wystawy.net – zgłoszenia na wystawy', ico: <Trophy size={20} />, to: 'https://wystawy.net', external: true },
  ];
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) { nav(`/szukaj?q=${encodeURIComponent(q.trim())}`); } };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="logo"><PawPrint size={22} className="wag" /></div><Wordmark height={24} /></div>
        <form className="search" onSubmit={submitSearch} style={{ marginBottom: 10 }}><Search size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj psa, szczenięcia, wpisu…" aria-label="Szukaj" /></form>
        {side.map(i => <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}><span className="ico">{i.ico}</span>{i.label}{i.to === '/powiadomienia' && notifCount > 0 && <span className="count">{notifCount}</span>}</NavLink>)}
        <div className="spacer" />
        <button className="navlink" style={{ border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }} onClick={() => setProfile({ theme: state.profile.darkMode ? 'light' : 'dark' })}><span className="ico">{state.profile.darkMode ? <Sun size={22} /> : <Moon size={22} />}</span>{state.profile.darkMode ? 'Tryb jasny' : 'Tryb ciemny'}</button>
        <div className="muted" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          {state.profile.logo && <img className="kennel-logo" src={state.profile.logo} alt="" />}
          <div><div><b>{state.profile.kennelName || state.profile.breederName}</b></div>
          <div>Tryb: {breeder ? 'hodowla' : 'mój pies'} · Plan: {state.profile.plan.toUpperCase()}</div></div>
        </div>
      </aside>
      <main className="main"><Outlet /></main>

      <button className={`fab fab-desktop ${sheet ? 'open' : ''}`} aria-label="Dodaj" onClick={() => setSheet(s => !s)}><Plus size={30} /></button>
      {sheet && <>
        <div className="sheet-backdrop" onClick={() => setSheet(false)} />
        <div className="sheet" role="dialog" aria-label="Co chcesz dodać?">
          <div className="handle" />
          <h3 style={{ marginBottom: 10 }}>Co chcesz dodać?</h3>
          {actions.map(a => <button key={a.label} className="action" onClick={() => go(a.to, 'external' in a && a.external)}><span className="ico">{a.ico}</span><span><div>{a.label}{'external' in a && a.external && <ExternalLink size={13} style={{ marginLeft: 6, verticalAlign: -1, opacity: .6 }} />}</div><small className="muted" style={{ fontWeight: 600 }}>{a.sub}</small></span></button>)}
        </div>
      </>}

      <nav className="bottomnav" aria-label="Nawigacja">
        {bottom.slice(0, 2).map(i => <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{i.ico}{i.label}</NavLink>)}
        <button className={`fab ${sheet ? 'open' : ''}`} aria-label="Dodaj" onClick={() => setSheet(s => !s)}><Plus size={30} /></button>
        {bottom.slice(2).map(i => <NavLink key={i.to} to={i.to} className={({ isActive }) => (isActive ? 'active' : '')}>{i.ico}{i.label}{i.to === '/ustawienia' && notifCount > 0 && <span className="nav-dot" aria-hidden />}</NavLink>)}
      </nav>
    </div>
  );
}
