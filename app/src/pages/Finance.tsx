import { useEffect, useMemo, useState } from 'react';
import { Plus, Receipt, Trophy, History, TrendingUp, Wallet } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useStore } from '../app/store';
import { Card, Empty, Field, Modal, ProBadge, Tabs, confirmDel, EditBtn, DelBtn } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { Wallet as ArtIcon } from 'lucide-react';
import { fmtDate, fmtMoney, monthKey, MONTHS_SHORT, today, uid } from '../app/format';
import { EXPENSE_CATEGORIES, SHOW_EXPENSE_TYPES, INCOME_CATEGORIES, type Expense, type Income } from '../app/types';

type Tab = 'budget' | 'history' | 'income' | 'stats';

export default function Finance() {
  const { state, upsert, remove, toast, limits } = useStore();
  const [params, setParams] = useSearchParams();
  const showId = params.get('show');
  const [tab, setTab] = useState<Tab>(showId ? 'history' : 'budget');
  const [edit, setEdit] = useState<Expense | null>(null);
  const [editInc, setEditInc] = useState<Income | null>(null);
  const [withShows, setWithShows] = useState(true);
  useEffect(() => { if (params.get('add')) { setEdit(newExpense('kennel')); setParams({}); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params]);
  const t = today();
  const cur = monthKey(t);
  const ex = state.expenses;
  const total = ex.reduce((a, e) => a + e.amount, 0);
  const totalInc = state.incomes.reduce((a, i) => a + i.amount, 0);
  const showMonth = ex.filter(e => e.scope === 'show' && monthKey(e.date) === cur).reduce((a, e) => a + e.amount, 0);
  const kennelMonth = ex.filter(e => e.scope === 'kennel' && monthKey(e.date) === cur).reduce((a, e) => a + e.amount, 0);
  const months = useMemo(() => { const arr: { key: string; label: string; total: number; locked: boolean }[] = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const key = d.toISOString().slice(0, 7); const tot = ex.filter(e => monthKey(e.date) === key && (withShows || e.scope === 'kennel')).reduce((a, e) => a + e.amount, 0); arr.push({ key, label: MONTHS_SHORT[d.getMonth()], total: Math.round(tot), locked: i >= limits.chartMonths }); } return arr; }, [ex, withShows, limits.chartMonths]);
  const monthName = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const dogName = (id?: string) => state.dogs.find(d => d.id === id)?.name;
  const newExpense = (scope: 'kennel' | 'show'): Expense => ({ id: uid(), date: t, amount: 0, scope, category: scope === 'show' ? 'Opłaty i składki' : 'Żywienie', type: scope === 'show' ? SHOW_EXPENSE_TYPES[0] : EXPENSE_CATEGORIES['Żywienie'][0], showId: scope === 'show' ? showId ?? undefined : undefined, dogId: scope === 'show' && showId ? state.shows.find(s => s.id === showId)?.dogId : undefined });

  return (
    <div>
      <ArtHeader compact tone="blue" icon={<ArtIcon size={24} />} title="Bilans hodowli" sub="Wydatki, przychody i wynik hodowli" actions={<><button className="btn secondary" onClick={() => setEditInc({ id: uid(), date: t, amount: 0, category: INCOME_CATEGORIES[0] })}><Plus size={16} /> Przychód</button><button className="btn" onClick={() => setEdit(newExpense('kennel'))}><Plus size={18} /> Wydatek</button></>} />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'budget', label: 'Finanse' }, { key: 'history', label: 'Rejestr wydatków' }, { key: 'income', label: 'Przychody' }, { key: 'stats', label: 'Analiza' }]} />

      {tab === 'budget' && <div className="stack">
        <div className="grid cols-3">
          <div className="card"><small className="muted">Wydatki łącznie</small><div style={{ fontSize: 22, fontWeight: 900, color: 'var(--danger)' }}>{fmtMoney(total)}</div><small className="muted">hodowla + wystawy</small></div>
          <div className="card"><small className="muted">Przychody łącznie</small><div style={{ fontSize: 22, fontWeight: 900, color: 'var(--success)' }}>{fmtMoney(totalInc)}</div><small className="muted">szczenięta, krycia</small></div>
          <div className="card" style={{ background: 'var(--soft)', borderColor: 'transparent' }}><small className="muted">Wynik hodowli</small><div style={{ fontSize: 22, fontWeight: 900, color: totalInc - total >= 0 ? 'var(--primary-600)' : 'var(--danger)' }}>{fmtMoney(totalInc - total)}</div><small className="muted">przychody − wydatki</small></div>
        </div>
        <div className="grid cols-2">
          <div className="card clickable" onClick={() => setTab('history')} style={{ borderLeft: '5px solid var(--accent)' }}><small className="muted">Wydatki na wystawy</small><div style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(showMonth)}</div><small style={{ color: 'var(--primary-600)' }}>Bieżący miesiąc: {monthName}</small></div>
          <div className="card clickable" onClick={() => setTab('history')} style={{ borderLeft: '5px solid var(--primary)' }}><small className="muted">Wydatki na hodowlę</small><div style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(kennelMonth)}</div><small style={{ color: 'var(--primary-600)' }}>Bieżący miesiąc: {monthName}</small></div>
        </div>
        <h3>Szybkie akcje</h3>
        <div className="grid cols-3">
          <Card onClick={() => setEdit(newExpense('kennel'))} icon={<Receipt size={18} />} title="Wydatek na hodowlę"><div className="muted">Nowa pozycja</div></Card>
          <Card onClick={() => setEdit(newExpense('show'))} icon={<Trophy size={18} />} title="Koszt wystawy"><div className="muted">Zgłoszenia, dojazd, nocleg</div></Card>
          <Card onClick={() => setTab('history')} icon={<History size={18} />} title="Historia"><div className="muted">Wszystkie wpisy</div></Card>
        </div>
        <Card title="Wydatki w ostatnich 6 miesiącach" right={!limits.isPro && <span className="badge gray">FREE: {limits.chartMonths} z 6 mies.</span>}>
          <div style={{ height: 220 }}><ResponsiveContainer><BarChart data={months.map(m => ({ ...m, total: m.locked ? 0 : m.total }))}><XAxis dataKey="label" fontSize={12} /><YAxis hide /><Tooltip formatter={(v) => fmtMoney(Number(v))} /><Bar isAnimationActive={false} dataKey="total" fill="#32BF46" radius={[10, 10, 4, 4]}><LabelList dataKey="total" position="top" formatter={(v: unknown) => `${v} zł`} fontSize={11} /></Bar></BarChart></ResponsiveContainer></div>
          {!limits.isPro && <div className="muted" style={{ textAlign: 'center' }}>Pełny widok 6 miesięcy dostępny w <ProBadge /></div>}
          <div className="row between" style={{ marginTop: 8 }}><small>Tylko hodowla</small><label className="row"><input type="checkbox" checked={withShows} onChange={e => setWithShows(e.target.checked)} /> Razem z wystawami</label></div>
        </Card>
        <Card title="Ostatnie wpisy">
          {ex.length === 0 ? <Empty>Brak wydatków.</Empty> : <div className="list">{[...ex].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(e => <div key={e.id} className="list-item" style={{ borderLeft: `4px solid ${e.scope === 'show' ? 'var(--accent)' : 'var(--primary)'}` }}><div><div className="title" style={{ color: 'var(--primary-600)' }}>{e.type ?? e.category}</div><small>{e.scope === 'show' ? 'Wystawy' : e.category} · {fmtDate(e.date)}{dogName(e.dogId) ? ` · ${dogName(e.dogId)}` : ''}</small></div><b>{fmtMoney(e.amount)}</b></div>)}</div>}
        </Card>
      </div>}

      {tab === 'history' && <HistoryTab />}
      {tab === 'income' && <IncomeTab />}
      {tab === 'stats' && <Stats />}

      {edit && <ExpenseForm e={edit} onClose={() => setEdit(null)} onSave={e => { upsert('expenses', e); setEdit(null); toast('Wydatek zapisany'); }} />}
      {editInc && <Modal title="Przychód" onClose={() => setEditInc(null)} actions={<><button className="btn secondary" onClick={() => setEditInc(null)}>Anuluj</button><button className="btn" disabled={!editInc.amount || !editInc.date} onClick={() => { upsert('incomes', editInc); setEditInc(null); toast('Przychód zapisany'); }}>Zapisz</button></>}>
        <div className="form-grid">
          <Field label="Kategoria"><select value={editInc.category} onChange={ev => setEditInc({ ...editInc, category: ev.target.value })}>{INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Miot (opcjonalnie)"><select value={editInc.litterId ?? ''} onChange={ev => setEditInc({ ...editInc, litterId: ev.target.value || undefined })}><option value="">—</option>{state.litters.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="Data *"><input type="date" value={editInc.date} onChange={ev => setEditInc({ ...editInc, date: ev.target.value })} /></Field>
          <Field label="Kwota (PLN) *"><input type="number" step="0.01" value={editInc.amount || ''} onChange={ev => setEditInc({ ...editInc, amount: Number(ev.target.value) })} /></Field>
          <Field label="Pies (opcjonalnie)"><select value={editInc.dogId ?? ''} onChange={ev => setEditInc({ ...editInc, dogId: ev.target.value || undefined })}><option value="">—</option>{state.dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        </div>
        <Field label="Opis"><input value={editInc.description ?? ''} onChange={ev => setEditInc({ ...editInc, description: ev.target.value })} placeholder="np. zaliczka za Red Boya" /></Field>
      </Modal>}
    </div>
  );

  function HistoryTab() {
    const [year, setYear] = useState('all');
    const [month, setMonth] = useState('all');
    const years = Array.from(new Set(ex.map(e => e.date.slice(0, 4)))).sort().reverse();
    const filt = ex.filter(e => (year === 'all' || e.date.startsWith(year)) && (month === 'all' || e.date.slice(5, 7) === month) && (!showId || e.showId === showId));
    const showGroups = useMemo(() => { const m = new Map<string, Expense[]>(); filt.filter(e => e.scope === 'show').forEach(e => { const k = e.showId ?? `${e.date}`; m.set(k, [...(m.get(k) ?? []), e]); }); return Array.from(m.entries()).sort((a, b) => b[1][0].date.localeCompare(a[1][0].date)); }, [filt]);
    const kennelByYear = useMemo(() => { const m = new Map<string, Map<string, Expense[]>>(); filt.filter(e => e.scope === 'kennel').forEach(e => { const y = e.date.slice(0, 4), mo = e.date.slice(0, 7); if (!m.has(y)) m.set(y, new Map()); const mm = m.get(y)!; mm.set(mo, [...(mm.get(mo) ?? []), e]); }); return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0])); }, [filt]);
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const tog = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }));
    const sum = (arr: Expense[]) => arr.reduce((a, e) => a + e.amount, 0);
    return (
      <div className="stack">
        <div className="row no-print">
          <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}><option value="all">Rok: wszystko</option>{years.map(y => <option key={y} value={y}>Rok: {y}</option>)}</select>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}><option value="all">Miesiąc: wszystko</option>{MONTHS_SHORT.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}</select>
          <button className="btn sm secondary" onClick={() => setEdit(newExpense('show'))}>+ Koszt wystawy</button>
        </div>
        <Card title="Koszty wystaw">
          {showGroups.length === 0 ? <Empty>Brak wydatków wystawowych.</Empty> : showGroups.map(([k, arr]) => { const show = state.shows.find(s => s.id === k); const o = open[k] ?? !!showId; return (
            <div key={k} className="card soft" style={{ marginBottom: 8 }}>
              <div className="row between" style={{ cursor: 'pointer' }} onClick={() => tog(k)}><div><b style={{ color: 'var(--primary-600)' }}>{show ? `${show.country} • ${show.city}` : 'Wystawa (bez przypisania)'}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDate(arr[0].date)} • Suma: {fmtMoney(sum(arr))} • Pozycji: {arr.length}{dogName(arr[0].dogId) ? ` • ${dogName(arr[0].dogId)}` : ''}</div></div><span>{o ? '▲' : '▼'}</span></div>
              {o && <div className="list" style={{ marginTop: 8 }}>{arr.map(e => <div key={e.id} className="list-item"><div className="title" style={{ color: 'var(--primary-600)' }}>{e.type}{e.description ? <small className="muted"> · {e.description}</small> : ''}</div><div className="row"><b>{fmtMoney(e.amount)}</b><EditBtn onClick={() => setEdit(e)} /><DelBtn onClick={() => confirmDel() && remove('expenses', e.id)} /></div></div>)}</div>}
            </div>); })}
        </Card>
        <Card title="Koszty hodowli">
          {kennelByYear.length === 0 ? <Empty>Brak wydatków hodowlanych.</Empty> : kennelByYear.map(([y, mm]) => { const all = Array.from(mm.values()).flat(); const oy = open[y] ?? true; return (
            <div key={y} className="card soft" style={{ marginBottom: 8 }}>
              <div className="row between" style={{ cursor: 'pointer' }} onClick={() => tog(y)}><b style={{ fontSize: 16, color: 'var(--primary-600)' }}>{y}</b><b>{fmtMoney(sum(all))} {oy ? '▲' : '▼'}</b></div>
              {oy && Array.from(mm.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([mo, arr]) => { const om = open[mo] ?? mo === cur; return (
                <div key={mo} style={{ marginTop: 8, paddingLeft: 8, borderLeft: '3px solid var(--border)' }}>
                  <div className="row between" style={{ cursor: 'pointer' }} onClick={() => tog(mo)}><b>{new Date(mo + '-01').toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</b><span style={{ color: 'var(--primary-600)', fontWeight: 700 }}>{fmtMoney(sum(arr))} {om ? '▲' : '▼'}</span></div>
                  {om && <div className="list" style={{ marginTop: 6 }}>{arr.sort((a, b) => b.date.localeCompare(a.date)).map(e => <div key={e.id} className="list-item"><div><div className="title">{e.type ?? e.category}</div><small>{e.category} · {fmtDate(e.date)}{dogName(e.dogId) ? ` · ${dogName(e.dogId)}` : ''}{e.description ? ` · ${e.description}` : ''}</small></div><div className="row"><b>{fmtMoney(e.amount)}</b><EditBtn onClick={() => setEdit(e)} /><DelBtn onClick={() => confirmDel() && remove('expenses', e.id)} /></div></div>)}</div>}
                </div>); })}
            </div>); })}
        </Card>
      </div>
    );
  }

  function IncomeTab() {
    const list = [...state.incomes].sort((a, b) => b.date.localeCompare(a.date));
    const byCat = new Map<string, number>(); list.forEach(i => byCat.set(i.category, (byCat.get(i.category) ?? 0) + i.amount));
    return (
      <div className="stack">
        <Card title="Przychody" icon={<TrendingUp size={18} />} right={<b style={{ color: 'var(--success)' }}>{fmtMoney(totalInc)}</b>}>
          {list.length === 0 ? <Empty icon={<Wallet size={28} />}>Brak przychodów. Zapisuj sprzedaż szczeniąt, zaliczki i opłaty za krycia – zobaczysz prawdziwy wynik hodowli.</Empty> : <div className="list">{list.map(i => <div key={i.id} className="list-item"><div><div className="title">{i.category}</div><small>{fmtDate(i.date)}{i.description ? ` · ${i.description}` : ''}{i.litterId ? ` · ${state.litters.find(l => l.id === i.litterId)?.name ?? ''}` : ''}{dogName(i.dogId) ? ` · ${dogName(i.dogId)}` : ''}</small></div><div className="row"><b style={{ color: 'var(--success)' }}>+{fmtMoney(i.amount)}</b><EditBtn onClick={() => setEditInc(i)} /><DelBtn onClick={() => confirmDel() && remove('incomes', i.id)} /></div></div>)}</div>}
        </Card>
        {byCat.size > 0 && <Card title="Źródła przychodów"><div className="list">{Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).map(([c, v]) => <div key={c}><div className="row between"><span>{c}</span><b>{fmtMoney(v)}</b></div><div className="progress"><div style={{ width: `${(v / (totalInc || 1)) * 100}%`, background: 'var(--success)' }} /></div></div>)}</div></Card>}
        <Card title="Rentowność miotów"><div className="list">{state.litters.map(l => { const inc = state.incomes.filter(i => i.litterId === l.id).reduce((a, i) => a + i.amount, 0); const exp = state.expenses.filter(e => e.litterId === l.id).reduce((a, e) => a + e.amount, 0); return <Link key={l.id} to={`/mioty/${l.id}?tab=money`} className="list-item" style={{ color: 'inherit' }}><div><div className="title">{l.name}</div><small>przychody {fmtMoney(inc)} · koszty {fmtMoney(exp)}</small></div><b style={{ color: inc - exp >= 0 ? 'var(--primary-600)' : 'var(--danger)' }}>{fmtMoney(inc - exp)}</b></Link>; })}{state.litters.length === 0 && <div className="muted">Brak miotów.</div>}</div></Card>
      </div>
    );
  }

  function Stats() {
    const [range, setRange] = useState<'prev' | '6m' | 'year'>('prev');
    const d = new Date(); d.setDate(1);
    const prevKey = (() => { const p = new Date(d); p.setMonth(p.getMonth() - 1); return p.toISOString().slice(0, 7); })();
    const sixFrom = (() => { const p = new Date(d); p.setMonth(p.getMonth() - 5); return p.toISOString().slice(0, 10); })();
    const sel = ex.filter(e => range === 'prev' ? monthKey(e.date) === prevKey : range === '6m' ? e.date >= sixFrom : e.date.startsWith(t.slice(0, 4)));
    const sum = sel.reduce((a, e) => a + e.amount, 0);
    const biggest = sel.length ? sel.reduce((a, b) => (b.amount > a.amount ? b : a)) : null;
    const byCat = new Map<string, number>(); sel.forEach(e => byCat.set(e.scope === 'show' ? 'Wystawy' : e.category, (byCat.get(e.scope === 'show' ? 'Wystawy' : e.category) ?? 0) + e.amount));
    const topCat = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0];
    const monthsN = range === 'prev' ? 1 : range === '6m' ? 6 : new Date().getMonth() + 1;
    const byDog = new Map<string, number>(); sel.filter(e => e.dogId).forEach(e => byDog.set(e.dogId!, (byDog.get(e.dogId!) ?? 0) + e.amount));
    return (
      <div className="stack">
        <Card title="Analiza kosztów">
          <Tabs value={range} onChange={setRange} items={[{ key: 'prev', label: 'Poprzedni miesiąc' }, { key: '6m', label: 'Ostatnie 6 miesięcy' }, { key: 'year', label: 'Bieżący rok' }]} />
          <div className="list">
            <div className="list-item"><div><small className="muted">Najwyższy koszt</small><div className="title">{biggest ? (biggest.type ?? biggest.category) : '—'}</div></div><b style={{ color: 'var(--primary-600)' }}>{biggest ? fmtMoney(biggest.amount) : '—'}</b></div>
            <div className="list-item"><div><small className="muted">Liczba wpisów</small><div className="title">Wydatki w wybranym okresie</div></div><b style={{ color: 'var(--primary-600)' }}>{sel.length}</b></div>
            <div className="list-item"><div><small className="muted">Główna kategoria kosztów:</small><div className="title">{topCat ? `${Math.round((topCat[1] / sum) * 100)}% całości wydatków` : '—'}</div></div><b style={{ color: 'var(--primary-600)' }}>{topCat?.[0] ?? '—'}</b></div>
            <div className="list-item"><div><small className="muted">Średni koszt miesięczny</small><div className="title">Średnia z wybranego okresu</div></div><b style={{ color: 'var(--primary-600)' }}>{fmtMoney(sum / monthsN)}</b></div>
          </div>
        </Card>
        <Card title="Podział na kategorie"><div className="list">{Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).map(([c, v]) => <div key={c}><div className="row between"><span>{c}</span><b>{fmtMoney(v)}</b></div><div className="progress"><div style={{ width: `${(v / (sum || 1)) * 100}%` }} /></div></div>)}{byCat.size === 0 && <Empty>Brak danych w tym okresie.</Empty>}</div></Card>
        {byDog.size > 0 && <Card title="Wydatki na psa"><div className="list">{Array.from(byDog.entries()).sort((a, b) => b[1] - a[1]).map(([id, v]) => <div key={id} className="list-item"><span>{dogName(id)}</span><b>{fmtMoney(v)}</b></div>)}</div></Card>}
      </div>
    );
  }
}

function ExpenseForm({ e, onClose, onSave }: { e: Expense; onClose: () => void; onSave: (e: Expense) => void }) {
  const { state } = useStore();
  const [x, setX] = useState(e);
  const cats = Object.keys(EXPENSE_CATEGORIES);
  const types = x.scope === 'show' ? SHOW_EXPENSE_TYPES : EXPENSE_CATEGORIES[x.category] ?? ['Inne'];
  return (
    <Modal title={x.scope === 'show' ? 'Dodaj koszt wystawy' : 'Dodaj wydatek'} onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!x.amount || !x.date} onClick={() => onSave(x)}>Dodaj</button></>}>
      <Field label="Rodzaj"><div className="tabs" style={{ margin: 0 }}><button className={x.scope === 'kennel' ? 'active' : ''} onClick={() => setX({ ...x, scope: 'kennel', category: cats[0], type: EXPENSE_CATEGORIES[cats[0]][0], showId: undefined })}>Hodowla</button><button className={x.scope === 'show' ? 'active' : ''} onClick={() => setX({ ...x, scope: 'show', category: 'Opłaty i składki', type: SHOW_EXPENSE_TYPES[0] })}>Wystawa</button></div></Field>
      <div className="form-grid">
        {x.scope === 'kennel' ? <Field label="Kategoria"><select value={x.category} onChange={ev => setX({ ...x, category: ev.target.value, type: EXPENSE_CATEGORIES[ev.target.value][0] })}>{cats.map(c => <option key={c}>{c}</option>)}</select></Field>
          : <Field label="Wystawa"><select value={x.showId ?? ''} onChange={ev => { const s = state.shows.find(sh => sh.id === ev.target.value); setX({ ...x, showId: s?.id, dogId: s?.dogId ?? x.dogId, date: s?.date ?? x.date }); }}><option value="">— bez przypisania —</option>{state.shows.map(s => <option key={s.id} value={s.id}>{s.country}, {s.city} ({s.date}) – {state.dogs.find(d => d.id === s.dogId)?.name}</option>)}</select></Field>}
        <Field label="Typ wydatku"><select value={x.type ?? ''} onChange={ev => setX({ ...x, type: ev.target.value })}>{types.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Data wydatku *"><input type="date" value={x.date} onChange={ev => setX({ ...x, date: ev.target.value })} /></Field>
        <Field label="Kwota wydatku (PLN) *"><input type="number" step="0.01" value={x.amount || ''} onChange={ev => setX({ ...x, amount: Number(ev.target.value) })} placeholder="Podaj kwotę" /></Field>
        <Field label="Pies (opcjonalnie)"><select value={x.dogId ?? ''} onChange={ev => setX({ ...x, dogId: ev.target.value || undefined })}><option value="">—</option>{state.dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        {x.scope === 'kennel' && <Field label="Miot (do rentowności)"><select value={x.litterId ?? ''} onChange={ev => setX({ ...x, litterId: ev.target.value || undefined })}><option value="">—</option>{state.litters.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>}
      </div>
      <Field label="Opis (opcjonalnie)"><textarea value={x.description ?? ''} onChange={ev => setX({ ...x, description: ev.target.value })} placeholder="Np. marka, ilość, szczegóły..." /></Field>
    </Modal>
  );
}
