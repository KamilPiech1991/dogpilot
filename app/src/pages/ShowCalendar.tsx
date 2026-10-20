import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Star, BellPlus, BellRing, ExternalLink, Search, MapPin, Info, CalendarDays, X } from 'lucide-react';
import { useStore } from '../app/store';
import { SHOWS_2026, SHOW_CALENDAR_SOURCE, type ShowEvent, type ShowKind } from '../app/shows2026';
import { ArtHeader, Empty, Tabs } from '../components/ui';
import { fmtDate, today, uid } from '../app/format';

type View = 'upcoming' | 'year' | 'mine';
type KindFilter = 'all' | ShowKind | 'hunting';

const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const WEEKDAYS = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
const KINDS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'cacib', label: 'Międzynarodowe CACIB' },
  { key: 'krajowa', label: 'Krajowe' },
  { key: 'klubowa', label: 'Klubowe' },
  { key: 'specjalistyczna', label: 'Specjalistyczne' },
  { key: 'hunting', label: 'Psy myśliwskie' },
];
const REGIONS = [...new Set(SHOWS_2026.map(s => s.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pl'));
const ENTRY_URL = 'https://www.wystawy.net';

const dayMs = 86400000;
const daysTo = (iso: string, from: string) => Math.round((new Date(iso).getTime() - new Date(from).getTime()) / dayMs);
const wd = (iso: string) => WEEKDAYS[new Date(iso + 'T12:00:00').getDay()];
const addDaysIso = (iso: string, n: number) => new Date(new Date(iso + 'T12:00:00').getTime() + n * dayMs).toISOString().slice(0, 10);

function when(s: ShowEvent, t: string) {
  if (s.dateTo < t) return 'odbyła się';
  const d = daysTo(s.dateFrom, t);
  if (d <= 0) return 'trwa teraz';
  if (d === 1) return 'jutro';
  if (d < 7) return `za ${d} dni`;
  if (d < 35) return `za ${Math.round(d / 7)} tyg.`;
  return `za ${Math.round(d / 30)} mies.`;
}

export default function ShowCalendar() {
  const { state, setProfile, upsert, toast } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const t = today();
  const planned = state.profile.plannedShows ?? [];
  const view = (params.get('view') as View) || 'upcoming';
  const [kind, setKind] = useState<KindFilter>('all');
  const [region, setRegion] = useState('');
  const [q, setQ] = useState('');
  const [month, setMonth] = useState<number | null>(null);

  const reminderFor = (s: ShowEvent) => state.reminders.find(r => r.notes?.includes(s.id));
  const nextShow = SHOWS_2026.find(s => s.dateTo >= t && !s.cancelled);
  const nextPlanned = SHOWS_2026.find(s => planned.includes(s.id) && s.dateTo >= t);
  const upcomingCount = SHOWS_2026.filter(s => s.dateTo >= t && !s.cancelled).length;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SHOWS_2026.filter(s => {
      if (view === 'upcoming' && s.dateTo < t) return false;
      if (view === 'mine' && !planned.includes(s.id)) return false;
      if (kind === 'hunting' ? !s.hunting : kind !== 'all' && s.kind !== kind) return false;
      if (region && s.region !== region) return false;
      if (month && Number(s.dateFrom.slice(5, 7)) !== month) return false;
      if (needle && !`${s.city} ${s.branch} ${s.kindLabel} ${s.extra} ${s.region}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [view, kind, region, month, q, t, planned]);

  // liczba wystaw w miesiącach dla paska miesięcy (bez filtra miesiąca)
  const perMonth = useMemo(() => {
    const c = Array(12).fill(0) as number[];
    SHOWS_2026.forEach(s => {
      if (view === 'upcoming' && s.dateTo < t) return;
      if (view === 'mine' && !planned.includes(s.id)) return;
      if (kind === 'hunting' ? !s.hunting : kind !== 'all' && s.kind !== kind) return;
      if (region && s.region !== region) return;
      c[Number(s.dateFrom.slice(5, 7)) - 1]++;
    });
    return c;
  }, [view, kind, region, t, planned]);
  const maxMonth = Math.max(1, ...perMonth);

  const groups = useMemo(() => {
    const g = new Map<number, ShowEvent[]>();
    list.forEach(s => { const m = Number(s.dateFrom.slice(5, 7)); g.set(m, [...(g.get(m) ?? []), s]); });
    return [...g.entries()];
  }, [list]);

  const togglePlan = (s: ShowEvent) => {
    const on = planned.includes(s.id);
    setProfile({ plannedShows: on ? planned.filter(id => id !== s.id) : [...planned, s.id] });
    toast(on ? 'Usunięto z planu startów' : `Dodano do planu: ${s.city}, ${fmtDate(s.dateFrom)}`);
  };

  const remind = (s: ShowEvent) => {
    if (reminderFor(s)) { nav('/przypomnienia'); return; }
    const date = addDaysIso(s.dateFrom, -30) < t ? t : addDaysIso(s.dateFrom, -30);
    upsert('reminders', { id: uid(), title: `Zgłoś psa: ${s.city}, ${s.kindLabel}`, date, done: false, notes: `Wystawa ${fmtDate(s.dateFrom)}${s.dateTo !== s.dateFrom ? ` – ${fmtDate(s.dateTo)}` : ''}. Termin zgłoszeń sprawdź na wystawy.net lub u organizatora. [${s.id}]` });
    toast(`Przypomnienie na ${fmtDate(date)} dodane`);
  };

  const setView = (v: View) => { setMonth(null); setParams(v === 'upcoming' ? {} : { view: v }); };
  const filtersOn = kind !== 'all' || region || q || month;

  return (
    <div className="stack show-cal">
      <ArtHeader compact tone="sun" icon={<Trophy size={24} />} title={`Kalendarz wystaw ${SHOW_CALENDAR_SOURCE.year}`} sub="Terminarz wystaw psów rasowych ZKwP w całej Polsce"
        actions={<a className="btn" href={ENTRY_URL} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> wystawy.net</a>}>
        <div className="hero-chips">
          <span className="badge">{`${SHOWS_2026.length} wystaw w roku`}</span>
          <span className="badge">{upcomingCount} jeszcze przed nami</span>
          {nextShow && <span className="badge">najbliższa: {nextShow.city}, {fmtDate(nextShow.dateFrom)}</span>}
          <span className="badge"><Star size={12} /> {planned.length} w planie</span>
        </div>
      </ArtHeader>

      {nextPlanned && view !== 'mine' && (
        <div className="card next-plan" onClick={() => setView('mine')}>
          <div className="date-tile sun"><b>{Number(nextPlanned.dateFrom.slice(8))}</b><small>{MONTHS_SHORT[Number(nextPlanned.dateFrom.slice(5, 7)) - 1]}</small></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, letterSpacing: .4 }}>TWÓJ NAJBLIŻSZY START · {when(nextPlanned, t).toUpperCase()}</div>
            <div style={{ fontWeight: 900, fontSize: 17 }}>{nextPlanned.city}</div>
            <div className="muted" style={{ fontSize: 13 }}>{nextPlanned.kindLabel}</div>
          </div>
          <a className="btn sm" href={ENTRY_URL} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Zgłoś psa</a>
        </div>
      )}

      <Tabs value={view} onChange={setView} items={[{ key: 'upcoming', label: 'Nadchodzące' }, { key: 'year', label: `Cały rok ${SHOW_CALENDAR_SOURCE.year}` }, { key: 'mine', label: `Moje plany (${planned.length})` }]} />

      <div className="month-strip no-print" role="group" aria-label="Miesiące">
        {perMonth.map((n, i) => (
          <button key={i} className={`${month === i + 1 ? 'on' : ''} ${n ? '' : 'none'}`} disabled={!n} onClick={() => setMonth(month === i + 1 ? null : i + 1)} aria-pressed={month === i + 1} title={`${MONTHS[i]}: ${n}`}>
            <span className="bar"><span style={{ height: `${Math.max(n ? 12 : 0, (n / maxMonth) * 100)}%` }} /></span>
            <span className="m">{MONTHS_SHORT[i]}</span>
            <span className="n">{n || '·'}</span>
          </button>
        ))}
      </div>

      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div className="search" style={{ flex: '1 1 220px' }}><Search size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Miasto, oddział, rasa, np. jamniki" aria-label="Szukaj wystawy" /></div>
        <select className="region-select" value={region} onChange={e => setRegion(e.target.value)} aria-label="Województwo">
          <option value="">Cała Polska</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="chips-row no-print">
        {KINDS.map(k => <button key={k.key} className={`chip ${kind === k.key ? 'on' : ''}`} onClick={() => setKind(k.key)}>{k.label}</button>)}
      </div>

      <div className="row between" style={{ fontSize: 13 }}>
        <span className="muted"><b>{list.length}</b> {list.length === 1 ? 'wystawa' : list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? 'wystawy' : 'wystaw'}{month ? ` · ${MONTHS[month - 1].toLowerCase()}` : ''}</span>
        {filtersOn && <button className="btn ghost sm" onClick={() => { setKind('all'); setRegion(''); setQ(''); setMonth(null); }}><X size={14} /> Wyczyść filtry</button>}
      </div>

      {!list.length && (
        <Empty icon={<CalendarDays size={28} />}>
          {view === 'mine' && !planned.length ? <>Nie masz jeszcze zaplanowanych startów.<br />Kliknij gwiazdkę przy wystawie, żeby dodać ją do planu.</> : 'Brak wystaw dla wybranych filtrów.'}
        </Empty>
      )}

      {groups.map(([m, items]) => (
        <section key={m} className="stack" style={{ gap: 8 }}>
          <h3 className="month-h">{MONTHS[m - 1]} <span className="muted">{items.length}</span></h3>
          {items.map(s => {
            const on = planned.includes(s.id);
            const rem = reminderFor(s);
            const past = s.dateTo < t;
            const d1 = Number(s.dateFrom.slice(8)), d2 = Number(s.dateTo.slice(8));
            return (
              <div key={s.id} className={`show-row k-${s.kind} ${past ? 'past' : ''} ${s.cancelled ? 'cancelled' : ''} ${on ? 'planned' : ''}`}>
                <div className="date-tile">
                  <b>{d1 === d2 ? d1 : `${d1}–${d2}`}</b>
                  <small>{d1 === d2 ? wd(s.dateFrom) : `${wd(s.dateFrom)}–${wd(s.dateTo)}`}</small>
                </div>
                <div className="info">
                  <div className="city">{s.city}{s.cancelled && <span className="badge danger" style={{ marginLeft: 6 }}>odwołana</span>}</div>
                  <div className="kind">{s.kindLabel}</div>
                  <div className="meta">
                    <span><MapPin size={12} /> {s.branch ? `oddział ${s.branch}` : 'organizator: oddział ZKwP'}{s.region ? ` · ${s.region}` : ''}</span>
                    {s.extra && !s.cancelled && <span className="badge warn">{s.extra}</span>}
                    {s.note && <span className="badge gray">{s.note}</span>}
                    {!past && !s.cancelled && <span className="badge gray">{when(s, t)}</span>}
                  </div>
                </div>
                <div className="acts no-print">
                  <button className={`icon-btn ${on ? 'star-on' : ''}`} aria-pressed={on} aria-label={on ? 'Usuń z planu' : 'Planuję start'} title={on ? 'Usuń z planu' : 'Planuję start'} onClick={() => togglePlan(s)}><Star size={18} fill={on ? 'currentColor' : 'none'} /></button>
                  {!past && !s.cancelled && <button className={`icon-btn ${rem ? 'star-on' : ''}`} aria-label={rem ? 'Przypomnienie ustawione' : 'Przypomnij o zgłoszeniu'} title={rem ? `Przypomnienie: ${fmtDate(rem.date)}` : 'Przypomnij o zgłoszeniu (30 dni przed)'} onClick={() => remind(s)}>{rem ? <BellRing size={18} /> : <BellPlus size={18} />}</button>}
                  {s.link ? <a className="icon-btn" href={s.link} target="_blank" rel="noopener noreferrer" aria-label="Strona organizatora" title="Strona organizatora"><Info size={18} /></a> : <span className="icon-btn" aria-hidden style={{ visibility: 'hidden' }} />}
                  {!past && !s.cancelled && <a className="btn sm" href={ENTRY_URL} target="_blank" rel="noopener noreferrer">Zgłoś</a>}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
        Źródło: terminarz {SHOW_CALENDAR_SOURCE.name} (<a href={SHOW_CALENDAR_SOURCE.url} target="_blank" rel="noopener noreferrer">zkwp.pl</a>){`, stan na ${fmtDate(SHOW_CALENDAR_SOURCE.fetchedAt)}. W prototypie lista jest zapisana w aplikacji; w wersji z serwerem będzie odświeżana codziennie. Terminy zgłoszeń, sędziów i opłat podaje organizator i system wystawy.net. Województwo ustaliliśmy na podstawie miejscowości lub oddziału.`}
      </p>
    </div>
  );
}
