import { Link, useNavigate } from 'react-router-dom';
import { Bell, Dog, PawPrint, Trophy, Wallet, QrCode, Heart, FileText, Flower2, ArrowRight, Scale, Stethoscope, Globe, Sparkles, ChevronRight, Baby, CalendarDays } from 'lucide-react';
import { useStore } from '../app/store';
import { addDays, daysBetween, fmtDate, fmtMoney, today } from '../app/format';
import { heatStats } from '../app/heat';
import { SHOWS_2026 } from '../app/shows2026';
import { collectNotifications, notifySettings } from '../app/notifications';

const TAGLINES = ['Co dziś w hodowli?', 'Wszystkie ogony policzone?', 'Miski pełne, plan gotowy?', 'Dobry dzień na spacer i ważenie.', 'Łapy w górę, zaczynamy!'];
const MONTHS = ['styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu', 'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu'];

export default function Dashboard() {
  const { state } = useStore();
  const nav = useNavigate();
  const p = state.profile;
  const breeder = p.module === 'breeder';
  const t = today();
  const females = state.dogs.filter(d => d.sex === 'female');
  const heatSoon = females.map(d => ({ d, s: heatStats(state.heats.filter(h => h.dogId === d.id)) })).filter(x => x.s && x.s.nextFrom <= addDays(t, 45) && x.s.nextTo >= t);
  const ncfg = notifySettings(p);
  const upcoming = collectNotifications(state, t);
  const activePreg = state.breedings.filter(b => !b.litterId && b.matings.length && daysBetween(b.matings[0].date, t) < 70);
  const month = t.slice(0, 7);
  const monthExp = state.expenses.filter(e => e.date.slice(0, 7) === month).reduce((a, e) => a + e.amount, 0);
  const monthInc = state.incomes.filter(i => i.date.slice(0, 7) === month).reduce((a, i) => a + i.amount, 0);
  const latestLitter = [...state.litters].sort((a, b) => b.birthDate.localeCompare(a.birthDate))[0];
  const litterPups = latestLitter ? state.puppies.filter(x => x.litterId === latestLitter.id) : [];
  const lastWeight = (puppyId: string) => state.weights.filter(w => w.puppyId === puppyId).sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastWeighDate = litterPups.map(x => lastWeight(x.id)?.date).filter(Boolean).sort().reverse()[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Cześć' : 'Dobry wieczór';
  const initials = (p.breederName || p.kennelName || 'D').trim().slice(0, 1).toUpperCase();

  const whenLabel = (d: string) => d < t ? 'zaległe' : daysBetween(t, d) === 0 ? 'dziś' : daysBetween(t, d) === 1 ? 'jutro' : `za ${daysBetween(t, d)} dni`;
  const summary: string[] = [];
  if (upcoming.length) summary.push(`${upcoming.length === 1 ? 'masz 1 termin' : `masz ${upcoming.length} ${upcoming.length < 5 ? 'terminy' : 'terminów'}`} do ogarnięcia`);
  activePreg.forEach(b => { const f = state.dogs.find(d => d.id === b.femaleId); summary.push(`${f?.name ?? 'suka'} jest na ${daysBetween(b.matings[0].date, t) + 1}. dniu ciąży`); });
  if (breeder && latestLitter && daysBetween(latestLitter.birthDate, t) <= 84) summary.push(`${latestLitter.name} ma ${daysBetween(latestLitter.birthDate, t)} dni`);
  const bubble = summary.length ? `${TAGLINES[0]} ${summary.join(', ').replace(/^./, c => c.toUpperCase())}.` : `${TAGLINES[new Date().getDate() % TAGLINES.length]} Na dziś nie ma nic pilnego.`;

  return (
    <div className="stack dash">
      <div className="dash-top">
        <div className="who">
          <div className="avatar-lg">{p.logo ? <img src={p.logo} alt="" /> : initials}</div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>{greet}{p.breederName ? `, ${p.breederName}` : ''}</div>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{breeder && p.kennelName ? p.kennelName : 'Dogpilot'}</div>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className={`badge ${p.plan === 'pro' ? 'pro' : ''}`}>{p.plan.toUpperCase()}</span>
          <button className="icon-btn bell-btn" aria-label={`Powiadomienia: ${upcoming.length}`} title="Powiadomienia" onClick={() => nav('/powiadomienia')}><Bell size={20} />{upcoming.length > 0 && <span className="dot">{upcoming.length > 9 ? '9+' : upcoming.length}</span>}</button>
          <button className="icon-btn" aria-label="Odbierz psa" title="Odbierz psa" onClick={() => nav('/skanuj')}><QrCode size={20} /></button>
        </div>
      </div>

      <div className="chips-row">
        <Link to="/psy" className="chip"><Dog size={14} /> {state.dogs.length} {state.dogs.length === 1 ? 'pies' : state.dogs.length < 5 ? 'psy' : 'psów'}</Link>
        {breeder && <Link to="/mioty" className="chip"><Baby size={14} /> {state.puppies.length} {state.puppies.length === 1 ? 'szczenię' : state.puppies.length < 5 ? 'szczenięta' : 'szczeniąt'}</Link>}
        {activePreg.length > 0 && <Link to={`/ciaza/${activePreg[0].id}`} className="chip warm"><Heart size={14} /> {`${activePreg.length === 1 ? 'ciąża' : `${activePreg.length} ciąże`} · ${daysBetween(activePreg[0].matings[0].date, t) + 1}. dzień`}</Link>}
        <Link to="/finanse" className="chip"><Wallet size={14} /> {`${fmtMoney(monthExp)} w ${MONTHS[new Date().getMonth()]}`}</Link>
        <Link to="/powiadomienia" className="chip"><Bell size={14} /> {upcoming.length} do zrobienia</Link>
      </div>

      <div className="bubble-wrap">
        <div className="bubble-ava"><PawPrint size={20} /></div>
        <div className="bubble">{bubble}</div>
      </div>

      <div>
        <h3 style={{ marginBottom: 10 }}>Czego dziś potrzebujesz?</h3>
        <div className="quick">
          {breeder && latestLitter && <a onClick={() => nav(`/mioty/${latestLitter.id}?weigh=1`)}><div className="ico"><Scale size={22} /></div>Zważ miot</a>}
          <a onClick={() => nav('/psy?health=1')}><div className="ico"><Stethoscope size={22} /></div>Wpis zdrowotny</a>
          <a onClick={() => nav('/finanse?add=1')}><div className="ico"><Wallet size={22} /></div>Wydatek</a>
          <a onClick={() => nav('/przypomnienia?add=1')}><div className="ico"><Bell size={22} /></div>Nowy termin</a>
          <a onClick={() => nav('/wystawy')}><div className="ico"><CalendarDays size={22} /></div>Wystawy</a>
          {!(breeder && latestLitter) && <a onClick={() => nav('/skanuj')}><div className="ico"><QrCode size={22} /></div>Odbierz psa</a>}
        </div>
      </div>

      <div className="feed">
        {breeder && activePreg.map(b => { const f = state.dogs.find(d => d.id === b.femaleId); const day = daysBetween(b.matings[0].date, t) + 1; const expected = addDays(b.matings[0].date, 62); return (
          <div key={b.id} className="fc dark span2" onClick={() => nav(`/ciaza/${b.id}`)}>
            <Heart className="art" size={190} />
            {f?.photo && <img className="fc-photo" src={f.photo} alt="" />}
            <div className="kicker">Ciąża · {f?.name} × {b.maleName}</div>
            <h2>{`${day}. dzień, ${Math.ceil(day / 7)}. tydzień`}</h2>
            <div className="progress"><div style={{ width: `${Math.min(100, (day / 63) * 100)}%` }} /></div>
            <p>{`Poród spodziewany ok. ${fmtDate(expected)}. Zostało ${Math.max(0, 63 - day)} dni.`}</p>
            <span className="cta">Otwórz monitor ciąży <ArrowRight size={16} /></span>
          </div>); })}

        {ncfg.widget && <div className={`fc sun ${upcoming.length ? '' : 'calm'}`} onClick={() => nav(upcoming[0]?.to ?? '/powiadomienia')}>
          <Bell className="art" size={190} />
          <div className="kicker">Powiadomienia{upcoming.length ? ` · ${upcoming.length}` : ''}</div>
          {upcoming.length ? (<>
            <h2>{upcoming[0].title}</h2>
            <p>{upcoming[0].sub ? `${upcoming[0].sub} · ` : ''}{whenLabel(upcoming[0].date)}, {fmtDate(upcoming[0].date)}</p>
            {ncfg.homeCount > 1 && upcoming.length > 1 && <div className="nlist">{upcoming.slice(1, ncfg.homeCount).map(u => <div key={u.id} className={u.overdue ? 'od' : ''} onClick={e => { e.stopPropagation(); nav(u.to); }}><span>{u.title}</span><b>{whenLabel(u.date)}</b></div>)}</div>}
          </>) : (<><h2>Spokojnie, nic pilnego</h2><p>Terminy pojawią się tu z wyprzedzeniem, które ustawisz w ustawieniach powiadomień.</p></>)}
          <span className="cta" onClick={e => { e.stopPropagation(); nav('/powiadomienia'); }}>Przegląd <ArrowRight size={16} /></span>
        </div>}

        {breeder && latestLitter && (
          <div className="fc green" onClick={() => nav(`/mioty/${latestLitter.id}`)}>
            <PawPrint className="art" size={190} />
            <div className="kicker">{`${latestLitter.name} · ${daysBetween(latestLitter.birthDate, t)}. dzień`}</div>
            <h2>{litterPups.length} {litterPups.length === 1 ? 'szczenię' : litterPups.length < 5 ? 'szczenięta' : 'szczeniąt'}</h2>
            <p>{lastWeighDate ? `Ostatnie ważenie ${whenLabel(lastWeighDate.slice(0, 10)) === 'zaległe' ? daysBetween(lastWeighDate.slice(0, 10), t) + ' dni temu' : whenLabel(lastWeighDate.slice(0, 10))}.` : 'Jeszcze bez pomiarów wagi.'} {latestLitter.motherName} × {latestLitter.fatherName}</p>
            <div className="pups">{litterPups.slice(0, 6).map(x => { const w = lastWeight(x.id); return <span key={x.id} className="pup">{x.photo ? <img src={x.photo} alt="" style={{ boxShadow: `0 0 0 2px ${x.markerColor}` }} /> : <i style={{ background: x.markerColor }} />}{x.name}{w ? ` · ${w.grams} g` : ''}</span>; })}</div>
            <span className="cta" onClick={e => { e.stopPropagation(); nav(`/mioty/${latestLitter.id}?weigh=1`); }}><Scale size={16} /> Zważ miot</span>
          </div>)}

        <div className="fc blue" onClick={() => nav('/finanse')}>
          <Wallet className="art" size={190} />
          <div className="kicker">Finanse w {MONTHS[new Date().getMonth()]}</div>
          <h2>{fmtMoney(monthInc - monthExp)}</h2>
          <p>Przychody {fmtMoney(monthInc)} · koszty {fmtMoney(monthExp)}{breeder ? '. Rentowność każdego miotu liczy się sama.' : '.'}</p>
          <span className="cta">Finanse <ArrowRight size={16} /></span>
        </div>

        {breeder && (heatSoon.length ? (
          <div className="fc rose" onClick={() => nav(`/psy/${heatSoon[0].d.id}?tab=breeding`)}>
            <Flower2 className="art" size={190} />
            <div className="kicker">Prognoza cieczki</div>
            <h2>{heatSoon[0].d.name} ok. {fmtDate(heatSoon[0].s!.next)}</h2>
            <p>Okno {fmtDate(heatSoon[0].s!.nextFrom)} – {fmtDate(heatSoon[0].s!.nextTo)}. Dni płodne prognozujemy od 9. do 15. dnia cieczki.</p>
            <span className="cta">Kalendarz cieczek <ArrowRight size={16} /></span>
          </div>) : (
          <div className="fc rose" onClick={() => nav('/psy?sex=female')}>
            <Flower2 className="art" size={190} />
            <div className="kicker">Cieczki</div>
            <h2>Zapisz cieczkę, a resztę policzymy</h2>
            <p>Po dwóch wpisach Dogpilot prognozuje następną cieczkę i okno płodne każdej suki.</p>
            <span className="cta">Moje suki <ArrowRight size={16} /></span>
          </div>))}

        {(() => { const plannedIds = state.profile.plannedShows ?? []; const mine = SHOWS_2026.find(s => plannedIds.includes(s.id) && s.dateTo >= t); const next = mine ?? SHOWS_2026.find(s => s.dateTo >= t && !s.cancelled); if (!next) return null; const left = daysBetween(t, next.dateFrom); return (
          <div className="fc sun" onClick={() => nav(mine ? '/wystawy?view=mine' : '/wystawy')}>
            <CalendarDays className="art" size={190} />
            <div className="kicker">{mine ? 'Twój najbliższy start' : 'Najbliższa wystawa ZKwP'}</div>
            <h2>{next.city}, {fmtDate(next.dateFrom)}</h2>
            <p>{`${next.kindLabel}${next.extra ? ` · ${next.extra}` : ''}. ${left > 0 ? `Zostało ${left} dni.` : 'Trwa teraz.'}`}</p>
            <span className="cta">Kalendarz wystaw <ArrowRight size={16} /></span>
          </div>); })()}

        <div className="fc lilac" onClick={() => nav('/psy')}>
          <Trophy className="art" size={190} />
          <div className="kicker">Osiągnięcia</div>
          <h2>{state.shows.length} {state.shows.length === 1 ? 'wystawa' : state.shows.length < 5 ? 'wystawy' : 'wystaw'}, {state.championships.length} {state.championships.length === 1 ? 'championat' : state.championships.length < 5 ? 'championaty' : 'championatów'}</h2>
          <p>Wyniki, certyfikaty i koszty wystaw w profilu każdego psa.</p>
          <span className="cta">Profile psów <ArrowRight size={16} /></span>
        </div>

        {breeder && (
          <div className="fc green" onClick={() => nav('/dokumenty')}>
            <FileText className="art" size={190} />
            <div className="kicker">Dokumenty</div>
            <h2>Umowa gotowa w minutę</h2>
            <p>Umowa sprzedaży, protokół przekazania, karta miotu i karta zdrowia wypełniają się Twoimi danymi.</p>
            <span className="cta">Przygotuj dokument <ArrowRight size={16} /></span>
          </div>)}

        {breeder && litterPups.length > 0 && (
          <div className="fc sun" onClick={() => nav(`/szczenieta/${litterPups[0].id}?tab=pawid`)}>
            <Globe className="art" size={190} />
            <div className="kicker">Dla nabywców</div>
            <h2>Strona szczenięcia jednym linkiem</h2>
            <p>Nowy opiekun widzi wagę, profilaktykę i odliczanie do odbioru. Mniej pytań, więcej zaufania.</p>
            <span className="cta">Zobacz przykład <ArrowRight size={16} /></span>
          </div>)}

        {!breeder && (
          <div className="fc green" onClick={() => nav('/skanuj')}>
            <QrCode className="art" size={190} />
            <div className="kicker">Odbiór psa</div>
            <h2>Zeskanuj kartę przekazania</h2>
            <p>Historia wag, szczepienia i zalecenia od hodowcy trafią do profilu Twojego psa.</p>
            <span className="cta">Odbierz psa <ArrowRight size={16} /></span>
          </div>)}
      </div>

      <div className="feed-end">
        <Sparkles size={22} />
        <div><b>To na razie tyle.</b><div className="muted">Zaglądaj tu codziennie. Nowe terminy i ważenia pojawią się same.</div></div>
        <Link to="/szukaj" className="muted" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>Szukaj <ChevronRight size={16} /></Link>
      </div>
    </div>
  );
}
