import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Download, Upload, Moon, Sun, MonitorSmartphone, Shield, Plus, CalendarDays, Bell, QrCode, FileText, Dog, Wallet, Cloud, CloudUpload, CloudDownload, Globe, Coins, BellRing, Mail, Trash2, Send, LayoutDashboard, Unlink, ExternalLink, AlertTriangle } from 'lucide-react';
import { useStore } from '../app/store';
import { Card, Field, ProBadge, Switch, DelBtn, Modal, Tabs } from '../components/ui';
import { PhotoPicker } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { Settings as ArtIcon } from 'lucide-react';
import { emptyState, demoState } from '../app/seed';
import { FREE_LIMITS, NOTIF_LABEL, type AppState, type Currency, type Member, type NotifKind, type NotifySettings } from '../app/types';
import { fmtDate, fmtDateTime, fmtMoney, today, uid } from '../app/format';
import { collectNotifications, notifySettings } from '../app/notifications';
import { cloudInfo, deleteCloud, fmtBytes, loadCloud, saveCloud } from '../app/cloud';
import { ConnectModal, FacebookMark, InstagramMark, ShareComposer, NETWORK_LABEL, type Network } from '../components/Social';
import { NotifIcon } from '../components/NotifIcon';

type Section = 'profil' | 'powiadomienia' | 'aplikacja' | 'social' | 'dane';
const KINDS: NotifKind[] = ['vaccination', 'exam', 'procedure', 'prevention', 'heat', 'pregnancy', 'show', 'general'];

export default function Settings() {
  const { state, setProfile, replace, toast, upsert, remove } = useStore();
  const p = state.profile;
  const [params, setParams] = useSearchParams();
  const sec = (params.get('sekcja') as Section) || 'profil';
  const setSec = (s: Section) => setParams(s === 'profil' ? {} : { sekcja: s }, { replace: true });
  const [form, setForm] = useState({ breederName: p.breederName, kennelName: p.kennelName, kennelNo: p.kennelNo ?? '', email: p.email ?? '' });
  const [invite, setInvite] = useState<Member | null>(null);
  const [connectFor, setConnectFor] = useState<Network | null>(null);
  const [composer, setComposer] = useState(false);
  const [cloud, setCloud] = useState(cloudInfo());
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const cfg = notifySettings(p);
  const setNotify = (patch: Partial<NotifySettings>) => setProfile({ notify: { ...cfg, ...patch } });
  const social = p.social ?? {};
  const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `dogpilot-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast('Kopia zapasowa pobrana');
  };
  const importJson = async (f: File) => {
    try { const data = JSON.parse(await f.text()) as AppState; if (!data.profile || !Array.isArray(data.dogs)) throw new Error('bad'); replace({ ...emptyState(), ...data }); toast('Dane przywrócone z kopii'); }
    catch { toast('Nieprawidłowy plik kopii zapasowej'); }
  };
  const backupNow = () => { const info = saveCloud(state); setProfile({ lastCloudBackup: info.at }); setCloud(info); toast('Kopia zapisana w chmurze'); };
  const restore = () => { const data = loadCloud(); if (!data) { toast('Brak kopii w chmurze'); return; } if (confirm('Zastąpić dane na tym urządzeniu ostatnią kopią z chmury?')) { replace({ ...emptyState(), ...data }); toast('Przywrócono kopię z chmury'); } };
  const togglePush = async (on: boolean) => {
    if (!on) { setNotify({ push: false }); return; }
    if (permission === 'unsupported') { toast('Ta przeglądarka nie obsługuje powiadomień'); return; }
    const res = permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (res === 'granted') { setNotify({ push: true }); toast('Powiadomienia na tym urządzeniu włączone'); } else toast('Brak zgody na powiadomienia w przeglądarce');
  };
  const testPush = () => {
    const items = collectNotifications(state, today());
    if (permission !== 'granted') { toast('Najpierw włącz powiadomienia na tym urządzeniu'); return; }
    new Notification('Dogpilot · test', { body: items.length ? items.slice(0, 3).map(i => `• ${i.title}`).join('\n') : 'Wszystko gra – brak terminów do zrobienia.', icon: `${import.meta.env.BASE_URL}brand/icon-512.png` });
  };
  const disconnect = (n: Network) => { setProfile({ social: { ...social, [n]: undefined } }); toast(`Odłączono ${NETWORK_LABEL[n]}`); };
  const roleLabel = { owner: 'Właściciel hodowli', editor: 'Współpracownik (edycja)', viewer: 'Podgląd (np. weterynarz)' };
  const homePreview = collectNotifications(state, today()).slice(0, cfg.homeCount);

  return (
    <div className="stack settings">
      <ArtHeader compact tone="slate" icon={<ArtIcon size={24} />} title="Ustawienia" sub="Profil, powiadomienia, aplikacja, media społecznościowe i dane" />
      <div className="chips-row only-mobile" aria-label="Na skróty">
        <Link to="/psy" className="chip"><Dog size={14} /> Psy</Link>
        <Link to="/finanse" className="chip"><Wallet size={14} /> Finanse</Link>
        <Link to="/wystawy" className="chip"><CalendarDays size={14} /> Kalendarz wystaw</Link>
        <Link to="/powiadomienia" className="chip"><Bell size={14} /> Powiadomienia</Link>
        {p.module === 'breeder' && <Link to="/dokumenty" className="chip"><FileText size={14} /> Dokumenty</Link>}
        <Link to="/skanuj" className="chip"><QrCode size={14} /> Odbierz psa</Link>
      </div>
      <Tabs value={sec} onChange={setSec} items={[{ key: 'profil', label: 'Profil' }, { key: 'powiadomienia', label: 'Powiadomienia' }, { key: 'aplikacja', label: 'Aplikacja' }, { key: 'social', label: 'Facebook i Instagram' }, { key: 'dane', label: 'Dane i konto' }]} />

      {sec === 'profil' && <>
        <Card title="Profil i hodowla">
          {p.module === 'breeder' && <><div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Logo hodowli</div><PhotoPicker value={p.logo} onChange={v => { setProfile({ logo: v }); toast(v ? 'Logo zapisane' : 'Logo usunięte'); }} label="Dodaj logo hodowli" /><small className="muted" style={{ display: 'block', marginTop: -6, marginBottom: 12 }}>Logo pojawia się na Starcie, w pasku bocznym, na dokumentach, raportach, karcie przekazania i stronie dla nabywcy.</small></>}
          <div className="form-grid">
            <Field label="Imię"><input value={form.breederName} onChange={e => setForm({ ...form, breederName: e.target.value })} /></Field>
            <Field label="E-mail"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            {p.module === 'breeder' && <>
              <Field label="Nazwa hodowli"><input value={form.kennelName} onChange={e => setForm({ ...form, kennelName: e.target.value })} /></Field>
              <Field label="Numer hodowli"><input value={form.kennelNo} onChange={e => setForm({ ...form, kennelNo: e.target.value })} /></Field>
            </>}
          </div>
          <button className="btn" onClick={() => { setProfile(form); toast('Zapisano profil'); }}>Zapisz</button>
        </Card>

        {p.module === 'breeder' && (
          <Card title="Zespół hodowli" icon={<Users size={18} />} right={<button className="btn sm" onClick={() => setInvite({ id: uid(), name: '', email: '', role: 'editor', status: 'invited' })}><Plus size={14} /> Zaproś</button>}>
            <p className="muted">Współwłaściciele, rodzina i lekarz weterynarii mogą pracować na tej samej hodowli z własnymi kontami.</p>
            <div className="list">{state.members.map(m => <div key={m.id} className="list-item"><div><div className="title">{m.name || m.email}</div><small>{m.email} · {roleLabel[m.role]}</small></div><div className="row"><span className={`badge ${m.status === 'active' ? 'success' : 'warn'}`}>{m.status === 'active' ? 'aktywny' : 'zaproszony'}</span>{m.role !== 'owner' && <DelBtn onClick={() => remove('members', m.id)} />}</div></div>)}</div>
            <small className="muted">Prototyp: zaproszenia są zapisywane lokalnie. W wersji produkcyjnej zaproszenie trafia e-mailem, a uprawnienia egzekwuje backend.</small>
          </Card>
        )}

        <Card title="Tryb pracy">
          <p className="muted">Mam psiaka: zdrowie, wydatki, przypomnienia. Prowadzę hodowlę: dodatkowo rozród, mioty, szczenięta, karty przekazania, dokumenty i raporty hodowlane.</p>
          <div className="row">
            <button className={`btn ${p.module === 'owner' ? '' : 'secondary'}`} onClick={() => setProfile({ module: 'owner' })}>Mam psiaka</button>
            <button className={`btn ${p.module === 'breeder' ? '' : 'secondary'}`} onClick={() => setProfile({ module: 'breeder' })}>Prowadzę hodowlę</button>
          </div>
        </Card>

        <Card title="Plan" right={p.plan === 'pro' ? <ProBadge /> : <span className="badge gray">FREE</span>}>
          <div className="grid cols-2 stack-m">
            <div className="card soft"><b>FREE – 0 zł</b><ul className="muted" style={{ paddingLeft: 18 }}><li>{`do ${FREE_LIMITS.females} suk i ${FREE_LIMITS.males} psów`}</li><li>do {FREE_LIMITS.shows} wystaw, {FREE_LIMITS.championships} championatów</li><li>wykres wydatków: {FREE_LIMITS.chartMonths} z 6 miesięcy</li></ul></div>
            <div className="card soft"><b>PRO – 89 zł/rok lub 12,99 zł/mies.</b><ul className="muted" style={{ paddingLeft: 18 }}><li>bez limitów psów, wystaw i championatów</li><li>pełne wykresy, raporty i dokumenty PDF</li><li>zespół hodowli, strona nabywcy, synchronizacja (w przygotowaniu)</li></ul></div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => { setProfile({ plan: p.plan === 'pro' ? 'free' : 'pro' }); toast(p.plan === 'pro' ? 'Przełączono na FREE' : 'Aktywowano PRO (tryb demo)'); }}>{p.plan === 'pro' ? 'Przełącz na FREE (demo)' : 'Aktywuj PRO (demo)'}</button>
            <small className="muted">W wersji produkcyjnej płatność przez Google Play / App Store / Stripe.</small>
          </div>
        </Card>

      </>}

      {sec === 'powiadomienia' && <>
        <Card title="Na ekranie Start" icon={<LayoutDashboard size={18} />}>
          <div className="row between set-row"><div><b>Widżet powiadomień</b><div className="muted">Karta z najbliższymi terminami na Starcie.</div></div><Switch on={cfg.widget} onChange={v => setNotify({ widget: v })} label="Widżet powiadomień" /></div>
          <div className={`set-row ${cfg.widget ? '' : 'disabled'}`}>
            <div className="row between"><b>Ile pozycji pokazywać</b><span className="badge">{cfg.homeCount}</span></div>
            <input type="range" min={1} max={8} value={cfg.homeCount} disabled={!cfg.widget} onChange={e => setNotify({ homeCount: Number(e.target.value) })} className="range" style={{ ['--v' as string]: `${((cfg.homeCount - 1) / 7) * 100}%` }} aria-label="Liczba pozycji na Starcie" />
            <div className="home-preview">{homePreview.length ? homePreview.map(n => <div key={n.id}><NotifIcon kind={n.kind} size={14} /><span>{n.title}</span><small>{fmtDate(n.date)}</small></div>) : <small className="muted">Teraz nie ma terminów do pokazania.</small>}</div>
          </div>
        </Card>
        <Card title="Z jakim wyprzedzeniem" icon={<Bell size={18} />}>
          <p className="muted" style={{ marginTop: -4 }}>Termin pojawi się w powiadomieniach tyle dni przed datą. Zaległe widać zawsze. Wyłączony typ nie pojawia się wcale.</p>
          <div className="lead-list">
            {KINDS.map(k => { const off = cfg.off.includes(k); return (
              <div key={k} className={`lead-row ${off ? 'off' : ''}`}>
                <span className="lr-ico"><NotifIcon kind={k} /></span>
                <div className="lr-name"><b>{NOTIF_LABEL[k]}</b><small>{off ? 'wyłączone' : cfg.lead[k] === 0 ? 'w dniu terminu' : `${cfg.lead[k]} ${cfg.lead[k] === 1 ? 'dzień' : 'dni'} wcześniej`}</small></div>
                <div className="stepper sm">
                  <button type="button" disabled={off} aria-label={`Mniej dni: ${NOTIF_LABEL[k]}`} onClick={() => setNotify({ lead: { ...cfg.lead, [k]: Math.max(0, cfg.lead[k] - 1) } })}>−</button>
                  <b>{cfg.lead[k]}</b>
                  <button type="button" disabled={off} aria-label={`Więcej dni: ${NOTIF_LABEL[k]}`} onClick={() => setNotify({ lead: { ...cfg.lead, [k]: Math.min(60, cfg.lead[k] + 1) } })}>+</button>
                </div>
                <Switch on={!off} onChange={v => setNotify({ off: v ? cfg.off.filter(x => x !== k) : [...cfg.off, k] })} label={`Włącz: ${NOTIF_LABEL[k]}`} />
              </div>); })}
          </div>
        </Card>
        <Card title="Gdzie dostawać powiadomienia" icon={<BellRing size={18} />}>
          <div className="row between set-row"><div><b>Na tym urządzeniu</b><div className="muted">Codzienne podsumowanie terminów. {permission === 'denied' ? 'Przeglądarka zablokowała powiadomienia – zmień to w ustawieniach strony.' : permission === 'unsupported' ? 'Ta przeglądarka nie obsługuje powiadomień.' : ''}</div></div><Switch on={cfg.push && permission === 'granted'} onChange={togglePush} label="Powiadomienia na urządzeniu" /></div>
          <div className={`row between set-row ${cfg.push ? '' : 'disabled'}`}><b>Godzina podsumowania</b><select value={cfg.pushHour} disabled={!cfg.push} onChange={e => setNotify({ pushHour: Number(e.target.value) })} className="sel">{[6, 7, 8, 9, 10, 12, 18, 20].map(h => <option key={h} value={h}>{h}:00</option>)}</select></div>
          <div className="row between set-row"><div><b><Mail size={14} style={{ verticalAlign: -2 }} /> E-mail z podsumowaniem</b><div className="muted">Na adres {p.email || 'z profilu'}. Wysyłka ruszy razem z serwerem.</div></div>
            <div className="seg2 small">{(['off', 'daily', 'weekly'] as const).map(v => <button key={v} type="button" className={cfg.emailDigest === v ? 'on' : ''} onClick={() => setNotify({ emailDigest: v })}>{v === 'off' ? 'Wył.' : v === 'daily' ? 'Codziennie' : 'Co tydzień'}</button>)}</div></div>
          <div className="row" style={{ gap: 8, marginTop: 6 }}><button className="btn secondary sm" onClick={testPush}><Send size={14} /> Wyślij testowe</button><Link className="btn ghost sm" to="/powiadomienia">Otwórz centrum powiadomień</Link></div>
        </Card>
      </>}

      {sec === 'aplikacja' && <>
        <Card title="Wygląd" icon={p.darkMode ? <Moon size={18} /> : <Sun size={18} />}>
          <p className="muted" style={{ marginTop: -4 }}>Ciemny motyw oszczędza wzrok wieczorem przy porodzie i mniej świeci w nocy przy szczeniętach. „Systemowy” podąża za ustawieniem telefonu.</p>
          <div className="theme-pick" role="radiogroup" aria-label="Motyw">
            {([['light', 'Jasny', <Sun size={16} key="s" />], ['dark', 'Ciemny', <Moon size={16} key="m" />], ['system', 'Systemowy', <MonitorSmartphone size={16} key="d" />]] as const).map(([k, label, ico]) => (
              <button key={k} type="button" role="radio" aria-checked={(p.theme ?? (p.darkMode ? 'dark' : 'light')) === k} className={`theme-opt ${k} ${(p.theme ?? (p.darkMode ? 'dark' : 'light')) === k ? 'on' : ''}`} onClick={() => setProfile({ theme: k })}>
                <span className="tp-preview" aria-hidden><span className="tp-bar" /><span className="tp-card" /><span className="tp-card short" /><span className="tp-fab" /></span>
                <span className="tp-label">{ico} {label}</span>
              </button>
            ))}
          </div>
          <div className="row between set-row"><div><b>Szybkie przełączanie</b><div className="muted">Ikona księżyca w pasku bocznym na komputerze.</div></div><Switch on={!!p.darkMode} onChange={v => setProfile({ theme: v ? 'dark' : 'light' })} label="Tryb ciemny" /></div>
        </Card>
        <Card title="Język aplikacji" icon={<Globe size={18} />}>
          <div className="seg2 big">{(['pl', 'en'] as const).map(l => <button key={l} type="button" className={(p.language ?? 'pl') === l ? 'on' : ''} onClick={() => { setProfile({ language: l }); try { localStorage.setItem('dogpilot.lang', l); } catch { /* ignore */ } toast(l === 'en' ? 'Saved: English' : 'Zapisano: polski'); }}>{l === 'pl' ? '🇵🇱 Polski' : '🇬🇧 English'}</button>)}</div>
          <small className="muted">Interfejs, daty i kwoty przełączają się od razu. Twoje dane (imiona, notatki) zostają bez zmian.</small>
        </Card>
        <Card title="Waluta" icon={<Coins size={18} />}>
          <div className="seg2 big">{(['PLN', 'EUR', 'USD'] as Currency[]).map(c => <button key={c} type="button" className={(p.currency ?? 'PLN') === c ? 'on' : ''} onClick={() => setProfile({ currency: c })}>{c}</button>)}</div>
          <div className="muted" style={{ marginTop: 8 }}>Przykład: <b>{fmtMoney(1234.5)}</b>. Waluta dotyczy wyświetlania kwot w finansach, dokumentach i raportach; zapisane kwoty nie są przeliczane.</div>
        </Card>
      </>}

      {sec === 'social' && <>
        <Card title="Połączone konta">
          <p className="muted" style={{ marginTop: -4 }}>Publikuj ogłoszenia miotów, szczenięta szukające domu i wyniki z wystaw prosto z Dogpilota.</p>
          <div className="stack" style={{ gap: 8 }}>
            {(['facebook', 'instagram'] as Network[]).map(n => { const a = social[n]; return (
              <div key={n} className="social-card">
                {n === 'facebook' ? <FacebookMark size={40} /> : <InstagramMark size={40} />}
                <div className="sc-main"><b>{NETWORK_LABEL[n]}</b><small>{a?.connected ? <>{a.name} · połączono {fmtDate(a.connectedAt)}</> : n === 'facebook' ? 'Strona hodowli (fanpage)' : 'Konto firmowe lub twórcy'}</small></div>
                {a?.connected ? <>
                  {a.url && <a className="icon-btn" href={a.url} target="_blank" rel="noopener noreferrer" aria-label={`Otwórz ${NETWORK_LABEL[n]}`}><ExternalLink size={18} /></a>}
                  <button className="btn secondary sm" onClick={() => disconnect(n)}><Unlink size={14} /> Odłącz</button>
                </> : <button className={`btn sm ${n}`} onClick={() => setConnectFor(n)}>Połącz</button>}
              </div>); })}
          </div>
          <div className="row between set-row" style={{ marginTop: 10 }}><div><b>Pokaż profile na stronie dla nabywcy</b><div className="muted">Linki do Facebooka i Instagrama pod kartą szczenięcia.</div></div><Switch on={!!social.showOnPortal} onChange={v => setProfile({ social: { ...social, showOnPortal: v } })} label="Profile na stronie nabywcy" /></div>
        </Card>
        <Card title="Publikacje" right={<button className="btn sm" onClick={() => setComposer(true)}><Plus size={14} /> Nowy post</button>}>
          {(social.posts ?? []).length ? <div className="list">{social.posts!.map(x => <div key={x.id} className="list-item"><div style={{ minWidth: 0 }}><div className="title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.text.split('\n')[0]}</div><small className="muted">{fmtDate(x.date)} · {x.kind}</small></div><div className="row" style={{ gap: 4 }}>{x.networks.map(n => n === 'facebook' ? <FacebookMark key={n} size={18} /> : <InstagramMark key={n} size={18} />)}</div></div>)}</div>
            : <p className="muted">Brak publikacji. Post utworzysz tu albo z karty miotu („Ogłoś miot”) i z wyników wystaw psa.</p>}
          <small className="muted">Prototyp: publikacja jest symulowana. W wersji produkcyjnej posty wysyła serwer przez Meta Graph API (wymaga konta firmowego i weryfikacji aplikacji przez Meta).</small>
        </Card>
      </>}

      {sec === 'dane' && <>
        <Card title="Kopia w chmurze" icon={<Cloud size={18} />}>
          <div className={`cloud-state ${cloud ? 'ok' : 'none'}`}>
            <span className="cs-ico">{cloud ? <Cloud size={30} /> : <AlertTriangle size={28} />}</span>
            <div><b>{cloud ? 'Kopia zapisana' : 'Nie masz jeszcze kopii w chmurze'}</b><div className="muted">{cloud ? `${fmtDateTime(cloud.at)} · ${fmtBytes(cloud.bytes)} · ${cloud.dogs} psów, ${cloud.litters} miotów, ${cloud.puppies} szczeniąt` : 'Zapisz kopię, żeby nie stracić danych przy zmianie telefonu.'}</div></div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" onClick={backupNow}><CloudUpload size={16} /> Zapisz kopię w chmurze</button>
            <button className="btn secondary" onClick={restore} disabled={!cloud}><CloudDownload size={16} /> Przywróć kopię z chmury</button>
          </div>
          <div className="row between set-row" style={{ marginTop: 10 }}><div><b>Automatyczna kopia co tydzień</b><div className="muted">Przy otwarciu aplikacji, jeśli ostatnia kopia ma ponad 7 dni.</div></div><Switch on={!!p.autoBackup} onChange={v => setProfile({ autoBackup: v })} label="Automatyczna kopia" /></div>
          <small className="muted">Prototyp: kopia jest trzymana w osobnym miejscu tej przeglądarki. Po dodaniu serwera trafi na konto i będzie dostępna na każdym urządzeniu.</small>
        </Card>
        <Card title="Plik z danymi" icon={<Shield size={18} />}>
          <p className="muted" style={{ marginTop: -4 }}>Pobierz wszystkie dane jako plik JSON, żeby przenieść je lub zabezpieczyć.</p>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="btn secondary" onClick={exportJson}><Download size={16} /> Pobierz kopię (JSON)</button>
            <button className="btn secondary" onClick={() => file.current?.click()}><Upload size={16} /> Przywróć z pliku</button>
            <input ref={file} type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} />
            <button className="btn secondary" onClick={() => { if (confirm('Załadować dane demonstracyjne? Obecne dane zostaną nadpisane.')) { replace(demoState()); toast('Załadowano dane demo'); } }}>Dane demo</button>
          </div>
        </Card>
        <Card title="Usuń konto" className="danger-zone">
          <p>Usunięcie konta trwale kasuje wszystkie dane: psy, mioty, szczenięta, finanse, kopie w chmurze i połączenia z Facebookiem i Instagramem. Tej operacji nie można cofnąć.</p>
          <button className="btn danger" onClick={() => setDelOpen(true)}><Trash2 size={16} /> Usuń konto i wszystkie dane</button>
        </Card>
        <Card title="O aplikacji">
          <p className="muted">Wersja prototypowa 0.3 (web). Ta sama baza kodu zostanie opakowana w aplikację Android/iOS. Dane zdrowotne mają charakter ewidencyjny – w sprawach zdrowia konsultuj się z lekarzem weterynarii.</p>
        </Card>
      </>}

      {invite && <Modal title="Zaproś do hodowli" onClose={() => setInvite(null)} actions={<><button className="btn secondary" onClick={() => setInvite(null)}>Anuluj</button><button className="btn" disabled={!invite.email.trim()} onClick={() => { upsert('members', invite); setInvite(null); toast('Zaproszenie zapisane'); }}>Wyślij zaproszenie</button></>}>
        <Field label="Imię i nazwisko"><input value={invite.name} onChange={e => setInvite({ ...invite, name: e.target.value })} /></Field>
        <Field label="E-mail *"><input type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} /></Field>
        <Field label="Rola"><select value={invite.role} onChange={e => setInvite({ ...invite, role: e.target.value as Member['role'] })}><option value="editor">Współpracownik (edycja)</option><option value="viewer">Podgląd (np. weterynarz)</option></select></Field>
      </Modal>}
      {connectFor && <ConnectModal network={connectFor} onClose={() => setConnectFor(null)} />}
      {composer && <ShareComposer draft={{ kind: 'post', title: p.kennelName || 'Hodowla', text: `Pozdrowienia z hodowli ${p.kennelName || ''}! 🐾`, photo: p.logo, hashtags: ['hodowla', 'psy', 'dogpilot', 'szczeniaki', 'zkwp'] }} onClose={() => setComposer(false)} />}
      {delOpen && <Modal title="Usunąć konto?" onClose={() => { setDelOpen(false); setDelText(''); }} actions={<><button className="btn secondary" onClick={() => { setDelOpen(false); setDelText(''); }}>Anuluj</button><button className="btn danger" disabled={delText.trim().toUpperCase() !== 'USUŃ'} onClick={() => { deleteCloud(); replace(emptyState()); }}><Trash2 size={16} /> Usuń na zawsze</button></>}>
        <p>{`Stracisz ${state.dogs.length} psów, ${state.litters.length} miotów i ${state.puppies.length} szczeniąt.`} Zanim usuniesz, możesz <button className="btn ghost sm" onClick={exportJson}><Download size={14} /> pobrać kopię</button>.</p>
        <Field label='Wpisz „USUŃ”, aby potwierdzić'><input value={delText} onChange={e => setDelText(e.target.value)} autoFocus /></Field>
      </Modal>}
    </div>
  );
}
