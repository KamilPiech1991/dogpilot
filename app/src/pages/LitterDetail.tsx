import { useEffect, useState } from 'react';
import { Pencil, Plus, Scale, Syringe, Baby, ClipboardList, Utensils, Pill, Bath, Home, QrCode, PiggyBank, BookOpen, PawPrint, Heart, FileText } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useStore } from '../app/store';
import { Card, Chips, Empty, Field, Modal, Tabs, confirmDel, sexIcon, DelBtn, EditBtn } from '../components/ui';
import { PhotoPicker, ArtHeader, KV } from '../components/ui';
import { litterStats } from '../app/litters';
import { LitterForm } from './Litters';
import { daysBetween, fmtDate, fmtDateTime, nowLocal, today, uid } from '../app/format';
import { ACCUSTOMED_ITEMS, LITTER_CHECKLIST, MARKER_COLORS, INCOME_CATEGORIES, type HealthKind, type LitterPack, type Puppy, type BirthEvent, type Income, type Expense } from '../app/types';
import { fmtMoney } from '../app/format';
import { ShareComposer, type ShareDraft } from '../components/Social';
import { Megaphone } from 'lucide-react';
import { HealthForm } from './DogProfile';

type Tab = 'card' | 'puppies' | 'analysis' | 'care' | 'pack' | 'birth' | 'money';

export function PuppyForm({ initial, litterId, index, onClose, onSave }: { initial?: Puppy; litterId: string; index: number; onClose: () => void; onSave: (p: Puppy) => void }) {
  const [p, setP] = useState<Puppy>(initial ?? { id: uid(), litterId, name: '', sex: 'male', birthDateTime: nowLocal(), birthStatus: 'alive', markerColor: MARKER_COLORS[index % MARKER_COLORS.length], pawId: `DP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`, owners: [], character: [] });
  return (
    <Modal title={initial ? 'Edytuj szczenię' : 'Dodaj szczenię'} onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!p.name.trim()} onClick={() => onSave(p)}>Zapisz</button></>}>
      <PhotoPicker value={p.photo} onChange={v => setP({ ...p, photo: v })} />
      <div className="form-grid">
        <Field label="Imię / oznaczenie *"><input value={p.name} onChange={e => setP({ ...p, name: e.target.value })} placeholder="np. Blue Boy" /></Field>
        <Field label="Płeć"><select value={p.sex} onChange={e => setP({ ...p, sex: e.target.value as 'male' | 'female' })}><option value="male">Pies</option><option value="female">Suka</option></select></Field>
        <Field label="Data i godzina urodzenia"><input type="datetime-local" value={p.birthDateTime} onChange={e => setP({ ...p, birthDateTime: e.target.value })} /></Field>
        <Field label="Umaszczenie"><input value={p.color ?? ''} onChange={e => setP({ ...p, color: e.target.value })} /></Field>
        <Field label="Waga urodzeniowa (g)"><input type="number" value={p.birthWeightG ?? ''} onChange={e => setP({ ...p, birthWeightG: e.target.value ? Number(e.target.value) : undefined })} /></Field>
        <Field label="Status urodzenia"><select value={p.birthStatus} onChange={e => setP({ ...p, birthStatus: e.target.value as Puppy['birthStatus'] })}><option value="alive">Żywy</option><option value="stillborn">Martwo urodzony</option><option value="died">Padł po urodzeniu</option></select></Field>
        <Field label="Nr rodowodu / metryki"><input value={p.pedigreeNo ?? ''} onChange={e => setP({ ...p, pedigreeNo: e.target.value })} /></Field>
        <Field label="Nr chipa"><input value={p.chip ?? ''} onChange={e => setP({ ...p, chip: e.target.value })} /></Field>
      </div>
      <Field label="Kolor obróżki"><div className="chips">{MARKER_COLORS.map(c => <button type="button" key={c} className="chip" style={{ background: c, borderColor: p.markerColor === c ? '#000' : c, width: 34, height: 34, padding: 0, outline: p.markerColor === c ? '3px solid var(--primary-soft)' : 'none' }} onClick={() => setP({ ...p, markerColor: c })} aria-label={c} />)}</div></Field>
    </Modal>
  );
}

export default function LitterDetail() {
  const { id } = useParams();
  const { state, upsert, remove, dispatch, toast } = useStore();
  const nav = useNavigate();
  const litter = state.litters.find(l => l.id === id);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'card');
  const [editLitter, setEditLitter] = useState(false);
  const [addPup, setAddPup] = useState(false);
  const [bulkWeight, setBulkWeight] = useState(false);
  const [bulkHealth, setBulkHealth] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => { const t = params.get('tab') as Tab | null; if (t) setTab(t); if (params.get('weigh')) { setBulkWeight(true); setParams({}); } }, [params, setParams]);
  if (!litter) return <Card><Empty>Nie znaleziono miotu. <Link to="/mioty">Wróć</Link></Empty></Card>;
  const pups = state.puppies.filter(p => p.litterId === litter.id).sort((a, b) => a.birthDateTime.localeCompare(b.birthDateTime));
  const lastWeights = (pid: string) => state.weights.filter(w => w.puppyId === pid).sort((a, b) => a.date.localeCompare(b.date));
  const allKeys = LITTER_CHECKLIST.flatMap(g => g.items.map(i => i.key));
  const doneCount = allKeys.filter(k => litter.checklist[k]).length;
  const pct = Math.round((doneCount / allKeys.length) * 100);
  const age = daysBetween(litter.birthDate, today());
  const [share, setShare] = useState<ShareDraft | null>(null);
  const announce = () => {
    const free = pups.filter(x => !x.handoverDate);
    const m = pups.filter(x => x.sex === 'male').length, f = pups.length - m;
    const breed = litterStats(state, litter).breed;
    setShare({ kind: 'Ogłoszenie miotu', title: litter.name, photo: pups.find(x => x.photo)?.photo ?? state.dogs.find(d => d.id === litter.motherId)?.photo, hashtags: ['szczeniaki', (breed || 'psy').toLowerCase().replace(/[^a-ząćęłńóśźż]/g, ''), 'hodowla', 'zkwp', 'fci', 'szczeniakidosprzedania', 'dogpilot'].filter(Boolean),
      text: `🐾 ${litter.name} w hodowli ${state.profile.kennelName || ''} jest już na świecie!\n\nUrodzone ${fmtDate(litter.birthDate)}${breed ? ` · ${breed}` : ''}\nMama: ${litter.motherName}${litter.fatherName ? ` · Tata: ${litter.fatherName}` : ''}\n${pups.length ? `${pups.length} szczeniąt (${m} ♂, ${f} ♀)${free.length ? `, ${free.length} szuka domu` : ''}.` : ''}\n\nRodowody ZKwP/FCI, szczepienia i karta przekazania z historią zdrowia w aplikacji. Zapraszamy do kontaktu!` });
  };

  return (
    <div>
      {share && <ShareComposer draft={share} onClose={() => setShare(null)} />}
      <ArtHeader tone="green" icon={<PawPrint size={24} />} back={() => nav('/mioty')} title={litter.name} sub={`Ur. ${fmtDate(litter.birthDate)} (${age} dni) · Matka: ${litter.motherName} · Ojciec: ${litter.fatherName || '—'}`} actions={<><button className="btn secondary" onClick={announce}><Megaphone size={16} /> Ogłoś miot</button><button className="btn secondary" onClick={() => setEditLitter(true)}><Pencil size={16} /> Edytuj miot</button></>}>
        {pups.length > 0 && <div className="avatar-stack">{pups.slice(0, 8).map(x => <span key={x.id} title={x.name} style={{ borderColor: x.markerColor }}>{x.photo ? <img src={x.photo} alt="" /> : <PawPrint size={16} />}</span>)}<small>{pups.length} {pups.length === 1 ? 'szczenię' : pups.length < 5 ? 'szczenięta' : 'szczeniąt'}</small></div>}
      </ArtHeader>
      <Tabs value={tab} onChange={setTab} items={[{ key: 'card', label: 'Metryka miotu' }, { key: 'puppies', label: `Szczenięta (${pups.length})` }, { key: 'analysis', label: 'Rozwój' }, { key: 'care', label: `Plan odchowu (${pct}%)` }, { key: 'birth', label: 'Dziennik porodu' }, { key: 'money', label: 'Rentowność' }, { key: 'pack', label: 'Nowy dom' }]} />

      {tab === 'card' && (() => { const s = litterStats(state, litter); const b = state.breedings.find(x => x.id === litter.breedingId); const weeks = Math.floor(age / 7); return (
        <div className="stack">
          <Card title="Dane miotu" icon={<ClipboardList size={18} />} right={<button className="btn secondary sm no-print" onClick={() => setEditLitter(true)}><Pencil size={14} /> Edytuj</button>}>
            <div className="grid cols-2 stack-m">
              <KV items={[['Oznaczenie', litter.name], ['Litera miotu', litter.letter], ['Rasa', s.breed || undefined], ['Data urodzenia', `${fmtDate(litter.birthDate)} · ${age} dni (${weeks}. tydzień)`], ['Nr zgłoszenia / rejestracji', litter.regNo], ['Data przeglądu miotu', litter.reviewDate ? fmtDate(litter.reviewDate) : undefined]]} />
              <KV items={[['Szczenięta', `${pups.length} (${s.males} ${sexIcon('male')} / ${s.females} ${sexIcon('female')})`], ['Urodzone żywo', s.alive], ['Martwo urodzone', s.stillborn], ['Padłe', s.died], ['Średnia waga urodzeniowa', s.avgBw ? `${s.avgBw} g` : undefined], ['Przekazane nabywcom', `${s.handed} z ${pups.length}`]]} />
            </div>
          </Card>
          <div className="grid cols-2 stack-m">
            <Card title="Rodzice" icon={<Heart size={18} />}>
              <KV items={[['Matka', s.mother ? <Link to={`/psy/${s.mother.id}`}>{litter.motherName}</Link> : litter.motherName], ['Ojciec', s.father ? <Link to={`/psy/${s.father.id}`}>{litter.fatherName}</Link> : (litter.fatherName || undefined)], ['Plan krycia', b ? <Link to={`/psy/${b.femaleId}?tab=breeding`}>{b.maleName} · krycie {b.matings.map(m => fmtDate(m.date)).join(', ')}</Link> : undefined], ['Ciąża', b?.matings[0] ? `${daysBetween(b.matings[0].date, litter.birthDate)} dni od pierwszego krycia` : undefined]]} />
            </Card>
            <Card title="Poród" icon={<Baby size={18} />} right={<button className="btn ghost sm no-print" onClick={() => setTab('birth')}>Dziennik</button>}>
              <KV items={[['Początek', s.start ? fmtDateTime(s.start) : undefined], ['Koniec', s.end ? fmtDateTime(s.end) : undefined], ['Czas trwania', s.durationMin !== null ? `${Math.floor(s.durationMin / 60)} h ${s.durationMin % 60} min` : undefined], ['Wpisów w dzienniku', litter.birthDiary.length]]} />
            </Card>
          </div>
          <Card title="Hodowla i postęp odchowu" icon={<Home size={18} />}>
            <div className="grid cols-2 stack-m">
              <KV items={[['Hodowla', state.profile.kennelName || undefined], ['Nr hodowli', state.profile.kennelNo], ['Hodowca', state.profile.breederName || undefined]]} />
              <KV items={[['Plan odchowu', `${s.careDone} z ${s.careTotal} etapów (${s.carePct}%)`], ['Notatki', litter.notes.length], ['Pakiet na nowy dom', litter.pack.foodName || litter.pack.firstDays ? 'uzupełniony' : 'do uzupełnienia']]} />
            </div>
            <div className="row no-print" style={{ marginTop: 12, gap: 6 }}>
              <Link className="btn secondary sm" to="/dokumenty/karta-miotu"><FileText size={14} /> Karta miotu (PDF)</Link>
              <button className="btn secondary sm" onClick={() => setTab('puppies')}><PawPrint size={14} /> Szczenięta</button>
              <Link className="btn secondary sm" to="/mioty?view=table"><BookOpen size={14} /> Rejestr miotów</Link>
            </div>
          </Card>
        </div>); })()}

      {tab === 'puppies' && (
        <div className="stack">
          <div className="row no-print">
            <button className="btn" onClick={() => setAddPup(true)}><Plus size={18} /> Dodaj szczenię</button>
            {pups.length > 0 && <><button className="btn secondary" onClick={() => setBulkWeight(true)}><Scale size={16} /> Ważenie całego miotu</button><button className="btn secondary" onClick={() => setBulkHealth(true)}><Syringe size={16} /> Wpis dla wszystkich</button></>}
          </div>
          {pups.length === 0 && <Card><Empty icon={<Baby size={28} />}>Brak szczeniąt. Dodaj pierwsze szczenię z miotu.</Empty></Card>}
          {pups.map(p => { const ws = lastWeights(p.id); const last = ws[ws.length - 1]; const prev = ws[ws.length - 2]; const diff = last && prev ? last.grams - prev.grams : null; return (
            <Card key={p.id} className="" >
              <div style={{ borderLeft: `5px solid ${p.markerColor}`, paddingLeft: 12 }}>
                <div className="row between">
                  <div className="row" style={{ gap: 10 }}><div className="pup-ava" style={{ boxShadow: `0 0 0 3px ${p.markerColor}` }}>{p.photo ? <img src={p.photo} alt="" /> : <PawPrint size={22} />}</div><div><b style={{ fontSize: 17, color: 'var(--primary-600)' }}>{p.name}</b><div className="muted">{sexIcon(p.sex)} {p.sex === 'male' ? 'Pies' : 'Suka'} · Ur. {fmtDateTime(p.birthDateTime)}{p.birthStatus !== 'alive' ? ' · ' + (p.birthStatus === 'stillborn' ? 'martwo urodzony' : 'padł') : ''}</div></div></div>
                  {last ? <div className="card soft" style={{ padding: '6px 10px', textAlign: 'right' }}><b style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Scale size={14} /> {last.grams} g</b>{diff !== null && <div style={{ fontSize: 12, color: diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>{diff >= 0 ? '↑ +' : '↓ '}{diff} g</div>}</div> : <span className="badge gray">brak pomiaru</span>}
                </div>
                <div className="row" style={{ marginTop: 10, gap: 6 }}>
                  <Link className="btn secondary sm" to={`/szczenieta/${p.id}`}><ClipboardList size={14} /> Profil</Link>
                  <Link className="btn secondary sm" to={`/szczenieta/${p.id}?tab=weights`}><Scale size={14} /> Wagi</Link>
                  <Link className="btn sm" to={`/szczenieta/${p.id}?tab=pawid`}><QrCode size={14} /> Karta przekazania</Link>
                  {p.owners.length > 0 && <span className="badge">Właściciel: {p.owners[0].name}</span>}
                  {p.handoverDate && <span className="badge gray">Przekazany {fmtDate(p.handoverDate)}</span>}
                </div>
              </div>
            </Card>); })}
        </div>
      )}

      {tab === 'analysis' && <Analysis />}

      {tab === 'care' && (
        <div className="stack">
          <Card title="Plan odchowu" right={<span className="badge">{doneCount} z {allKeys.length} etapów · {pct}%</span>}>
            <div className="progress" style={{ marginBottom: 12 }}><div style={{ width: `${pct}%` }} /></div>
            {LITTER_CHECKLIST.map(g => <div key={g.group} style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, borderLeft: '3px solid var(--primary)', paddingLeft: 8, marginBottom: 4 }}>{g.group}</div>{g.items.map(i => <label key={i.key} className="check"><input type="checkbox" checked={!!litter.checklist[i.key]} onChange={e => upsert('litters', { ...litter, checklist: { ...litter.checklist, [i.key]: e.target.checked } })} /><div><div className="t" style={{ color: litter.checklist[i.key] ? 'var(--primary-600)' : undefined }}>{i.title}</div><div className="d">{i.desc}</div></div></label>)}</div>)}
          </Card>
          <Card title="Notatnik miotu" right={<span className="badge gray">{litter.notes.length}</span>}>
            {litter.notes.map((n, i) => <div key={i} className="list-item" style={{ marginBottom: 6 }}><div>{n}</div><DelBtn onClick={() => upsert('litters', { ...litter, notes: litter.notes.filter((_, j) => j !== i) })} /></div>)}
            <div className="row"><input value={note} onChange={e => setNote(e.target.value)} placeholder="Nowa notatka..." style={{ flex: 1, padding: 9, borderRadius: 10, border: '1px solid var(--border)' }} /><button className="btn" disabled={!note.trim()} onClick={() => { upsert('litters', { ...litter, notes: [...litter.notes, note.trim()] }); setNote(''); }}>Dodaj</button></div>
          </Card>
        </div>
      )}

      {tab === 'pack' && <PackEditor />}
      {tab === 'birth' && <BirthDiary />}
      {tab === 'money' && <Profitability />}

      {editLitter && <LitterForm initial={litter} onClose={() => setEditLitter(false)} onSave={l => { upsert('litters', l); setEditLitter(false); toast('Zapisano'); }} />}
      {addPup && <PuppyForm litterId={litter.id} index={pups.length} onClose={() => setAddPup(false)} onSave={p => { upsert('puppies', p); if (p.birthWeightG) upsert('weights', { id: uid(), puppyId: p.id, date: p.birthDateTime, grams: p.birthWeightG }); setAddPup(false); toast('Szczenię dodane'); }} />}
      {bulkWeight && <BulkWeight />}
      {bulkHealth && <HealthForm rec={{ id: uid(), kind: 'deworming', date: today(), name: '' }} onClose={() => setBulkHealth(false)} onSave={r => { dispatch({ type: 'bulk', fn: s => ({ ...s, health: [...s.health, ...pups.map(p => ({ ...r, id: uid(), puppyId: p.id }))] }) }); setBulkHealth(false); toast(`Wpis dodany dla ${pups.length} szczeniąt`); }} />}
    </div>
  );

  function Analysis() {
    const rows = pups.map(p => { const ws = lastWeights(p.id); const last = ws[ws.length - 1]; const prev = ws[ws.length - 2]; return { p, last, diff: last && prev ? last.grams - prev.grams : null }; });
    const withW = rows.filter(r => r.last);
    const heaviest = withW.length ? withW.reduce((a, b) => (b.last!.grams > a.last!.grams ? b : a)) : null;
    const lightest = withW.length ? withW.reduce((a, b) => (b.last!.grams < a.last!.grams ? b : a)) : null;
    const withD = rows.filter(r => r.diff !== null);
    const bestGain = withD.length ? withD.reduce((a, b) => (b.diff! > a.diff! ? b : a)) : null;
    const worstGain = withD.length ? withD.reduce((a, b) => (b.diff! < a.diff! ? b : a)) : null;
    const [hidden, setHidden] = useState<string[]>([]);
    const dates = Array.from(new Set(state.weights.filter(w => pups.some(p => p.id === w.puppyId)).map(w => w.date.slice(0, 10)))).sort();
    const data = dates.map(d => { const row: Record<string, string | number> = { d: fmtDate(d) }; pups.forEach(p => { const w = state.weights.filter(x => x.puppyId === p.id && x.date.startsWith(d)).pop(); if (w) row[p.name] = w.grams; }); return row; });
    return (
      <div className="stack">
        <Card title="Miot w skrócie">
          <div className="grid cols-3"><div className="card soft stat"><div className="value">{pups.length}</div><div className="label">Szczenięta</div></div><div className="card soft stat"><div className="value">{pups.filter(p => p.sex === 'male').length}</div><div className="label">Psy</div></div><div className="card soft stat"><div className="value">{pups.filter(p => p.sex === 'female').length}</div><div className="label">Suki</div></div></div>
        </Card>
        <Card title="Rekordy wagi">
          {heaviest && <Link to={`/szczenieta/${heaviest.p.id}`} className="list-item" style={{ color: 'inherit', marginBottom: 6, borderLeft: `4px solid ${heaviest.p.markerColor}` }}><div><small className="muted">NAJCIĘŻSZE SZCZENIĘ</small><div className="title">{heaviest.p.name}</div><small>Ostatni pomiar: {fmtDateTime(heaviest.last!.date)}</small></div><b style={{ fontSize: 18 }}>{heaviest.last!.grams} g</b></Link>}
          {lightest && <Link to={`/szczenieta/${lightest.p.id}`} className="list-item" style={{ color: 'inherit', borderLeft: `4px solid ${lightest.p.markerColor}` }}><div><small className="muted">NAJLŻEJSZE SZCZENIĘ</small><div className="title">{lightest.p.name}</div><small>Ostatni pomiar: {fmtDateTime(lightest.last!.date)}</small></div><b style={{ fontSize: 18 }}>{lightest.last!.grams} g</b></Link>}
          {rows.length - withW.length > 0 && <div className="badge gray" style={{ marginTop: 8 }}>ℹ️ Do zważenia: {rows.length - withW.length}</div>}
        </Card>
        <Card title="Ostatni przyrost">
          <p className="muted">Porównanie dwóch ostatnich pomiarów każdego szczenięcia.</p>
          {bestGain && <div className="list-item" style={{ marginBottom: 6 }}><div><small className="muted">NAJWIĘKSZY WZROST</small><div className="title">{bestGain.p.name}</div></div><b style={{ color: 'var(--success)' }}>+{bestGain.diff} g</b></div>}
          {worstGain && <div className="list-item"><div><small className="muted">NAJMNIEJSZY WZROST</small><div className="title">{worstGain.p.name}</div></div><b style={{ color: worstGain.diff! < 0 ? 'var(--danger)' : undefined }}>{worstGain.diff! >= 0 ? '+' : ''}{worstGain.diff} g</b></div>}
          {!withD.length && <div className="muted">Potrzebne co najmniej dwa pomiary.</div>}
        </Card>
        <Card title="Krzywe wzrostu">
          <p className="muted">Porównaj rozwój wszystkich szczeniąt. Dotknij nazwy, aby ukryć lub pokazać linię.</p>
          {data.length < 2 ? <div className="muted">Za mało pomiarów.</div> : <div style={{ height: 260 }}><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} unit=" g" domain={['auto', 'auto']} /><Tooltip /><Legend onClick={e => { const k = String(e.value); setHidden(h => h.includes(k) ? h.filter(x => x !== k) : [...h, k]); }} />{pups.map(p => <Line key={p.id} type="monotone" dataKey={p.name} stroke={p.markerColor} strokeWidth={2} hide={hidden.includes(p.name)} connectNulls />)}</LineChart></ResponsiveContainer></div>}
        </Card>
      </div>
    );
  }

  function PackEditor() {
    const [pack, setPack] = useState<LitterPack>(litter!.pack);
    const set = <K extends keyof LitterPack>(k: K, v: LitterPack[K]) => setPack({ ...pack, [k]: v });
    return (
      <div className="stack">
        <Card title="Dla całego miotu"><p className="muted">Żywienie, pielęgnacja i zalecenia dotyczące wszystkich szczeniąt. Trafią na kartę przekazania każdego szczenięcia.</p>
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Utensils size={18} style={{ color: 'var(--primary)' }} /> Żywienie</h3>
          <div className="form-grid">
            <Field label="Producent karmy"><input value={pack.foodBrand ?? ''} onChange={e => set('foodBrand', e.target.value)} /></Field>
            <Field label="Nazwa karmy"><input value={pack.foodName ?? ''} onChange={e => set('foodName', e.target.value)} /></Field>
            <Field label="Porcja"><input value={pack.portion ?? ''} onChange={e => set('portion', e.target.value)} placeholder="np. 75 g" /></Field>
            <Field label="Liczba posiłków dziennie"><div className="chips">{[2, 3, 4, 5].map(n => <button type="button" key={n} className={`chip ${pack.mealsPerDay === n ? 'on' : ''}`} onClick={() => set('mealsPerDay', n)}>{n}</button>)}</div></Field>
            <Field label="Godziny karmienia"><input value={pack.feedingHours ?? ''} onChange={e => set('feedingHours', e.target.value)} placeholder="np. 7, 11, 15, 19" /></Field>
          </div>
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Pill size={18} style={{ color: 'var(--primary)' }} /> Suplementy</h3><Field label="Co i w jakiej dawce"><textarea value={pack.supplements ?? ''} onChange={e => set('supplements', e.target.value)} /></Field>
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Bath size={18} style={{ color: 'var(--primary)' }} /> Pielęgnacja</h3><Field label="Jak dbać na co dzień"><textarea value={pack.grooming ?? ''} onChange={e => set('grooming', e.target.value)} /></Field>
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Home size={18} style={{ color: 'var(--primary)' }} /> Start w nowym domu</h3><Field label="Rady na pierwsze dni"><textarea value={pack.firstDays ?? ''} onChange={e => set('firstDays', e.target.value)} /></Field>
          <Field label="Co szczenięta już znają?"><Chips options={ACCUSTOMED_ITEMS} value={pack.accustomed} onChange={v => set('accustomed', v)} /></Field>
          <button className="btn" onClick={() => { upsert('litters', { ...litter!, pack }); toast('Pakiet zapisany'); }}>Zapisz pakiet</button>
        </Card>
        <Card title="Każde szczenię osobno"><p className="muted">Charakter, socjalizacja i indywidualne przyzwyczajenia każdego szczenięcia uzupełnisz w profilu szczenięcia.</p><div className="list">{pups.map(p => <Link key={p.id} to={`/szczenieta/${p.id}?tab=pack`} className="list-item" style={{ color: 'inherit' }}><div className="row"><PawPrint size={20} style={{ color: p.markerColor }} /><div><div className="title">{p.name}</div><small>{p.character.length ? p.character.join(', ') : 'Brak opisu – dodaj'}</small></div></div><span>→</span></Link>)}</div></Card>
      </div>
    );
  }

  function BirthDiary() {
    const [ev, setEv] = useState<BirthEvent | null>(null);
    const diary = [...litter!.birthDiary].sort((a, b) => a.time.localeCompare(b.time));
    const kindLabel: Record<BirthEvent['kind'], string> = { start: 'Początek porodu', puppy: 'Szczenię', note: 'Notatka', vet: 'Kontakt z lekarzem', end: 'Koniec porodu' };
    const save = (e: BirthEvent) => { upsert('litters', { ...litter!, birthDiary: [...litter!.birthDiary.filter(x => x.id !== e.id), e] }); setEv(null); toast('Zapisano'); };
    const del = (id: string) => upsert('litters', { ...litter!, birthDiary: litter!.birthDiary.filter(x => x.id !== id) });
    const first = diary[0], lastE = diary[diary.length - 1];
    const durationMin = first && lastE ? Math.round((new Date(lastE.time).getTime() - new Date(first.time).getTime()) / 60000) : 0;
    return (
      <div className="stack">
        <div className="row between no-print"><div className="muted">Zapisuj przebieg porodu na bieżąco: godziny, kolejność szczeniąt, komplikacje. Przyda się przy kolejnych miotach i dla lekarza.</div><button className="btn" onClick={() => setEv({ id: uid(), time: nowLocal(), kind: diary.length ? 'puppy' : 'start' })}><Plus size={18} /> Dodaj wpis</button></div>
        {diary.length > 0 && <div className="grid cols-3"><div className="card stat"><div className="value">{diary.filter(e => e.kind === 'puppy').length}</div><div className="label">urodzonych</div></div><div className="card stat"><div className="value">{Math.floor(durationMin / 60)}h {durationMin % 60}m</div><div className="label">czas porodu</div></div><div className="card stat"><div className="value">{diary.filter(e => e.kind === 'puppy').length > 1 ? Math.round(durationMin / Math.max(1, diary.filter(e => e.kind === 'puppy').length - 1)) + ' min' : '—'}</div><div className="label">śr. odstęp</div></div></div>}
        <Card title="Dziennik porodu" icon={<BookOpen size={18} />}>
          {diary.length === 0 ? <Empty icon={<BookOpen size={28} />}>Brak wpisów. Dodaj „Początek porodu”, gdy zaczną się skurcze.</Empty> : <div className="timeline">{diary.map(e => <div key={e.id} className="tl"><div className="row between"><b>{kindLabel[e.kind]}{e.puppyName ? `: ${e.puppyName}` : ''}</b><div className="row"><small className="muted">{fmtDateTime(e.time)}</small><EditBtn onClick={() => setEv(e)} /><DelBtn onClick={() => confirmDel() && del(e.id)} /></div></div>{e.note && <small className="muted">{e.note}</small>}</div>)}</div>}
        </Card>
        {ev && <Modal title="Wpis w dzienniku porodu" onClose={() => setEv(null)} actions={<><button className="btn secondary" onClick={() => setEv(null)}>Anuluj</button><button className="btn" onClick={() => save(ev)}>Zapisz</button></>}>
          <div className="form-grid">
            <Field label="Rodzaj"><select value={ev.kind} onChange={e => setEv({ ...ev, kind: e.target.value as BirthEvent['kind'] })}>{(Object.keys(kindLabel) as BirthEvent['kind'][]).map(k => <option key={k} value={k}>{kindLabel[k]}</option>)}</select></Field>
            <Field label="Godzina"><input type="datetime-local" value={ev.time} onChange={e => setEv({ ...ev, time: e.target.value })} /></Field>
            {ev.kind === 'puppy' && <Field label="Szczenię (imię / oznaczenie)"><input value={ev.puppyName ?? ''} onChange={e => setEv({ ...ev, puppyName: e.target.value })} list="pupnames" /><datalist id="pupnames">{pups.map(p => <option key={p.id} value={p.name} />)}</datalist></Field>}
          </div>
          <Field label="Notatka"><textarea value={ev.note ?? ''} onChange={e => setEv({ ...ev, note: e.target.value })} placeholder="np. waga, łożysko, pozycja, interwencja" /></Field>
        </Modal>}
      </div>
    );
  }

  function Profitability() {
    const [inc, setInc] = useState<Income | null>(null);
    const [exp, setExp] = useState<Expense | null>(null);
    const incomes = state.incomes.filter(i => i.litterId === litter!.id);
    const expenses = state.expenses.filter(e => e.litterId === litter!.id);
    const expected = pups.reduce((a, p) => a + (p.price ?? 0), 0);
    const received = incomes.reduce((a, i) => a + i.amount, 0);
    const spent = expenses.reduce((a, e) => a + e.amount, 0);
    const soldCount = pups.filter(p => p.price).length;
    return (
      <div className="stack">
        <div className="grid cols-3">
          <div className="card stat"><div className="value" style={{ color: 'var(--success)' }}>{fmtMoney(received)}</div><div className="label">przychody</div></div>
          <div className="card stat"><div className="value" style={{ color: 'var(--danger)' }}>{fmtMoney(spent)}</div><div className="label">koszty miotu</div></div>
          <div className="card stat"><div className="value" style={{ color: received - spent >= 0 ? 'var(--primary-600)' : 'var(--danger)' }}>{fmtMoney(received - spent)}</div><div className="label">wynik</div></div>
        </div>
        <Card title="Prognoza" icon={<PiggyBank size={18} />}>
          <div className="muted">{`Ceny ustalone dla ${soldCount} z ${pups.length} szczeniąt.`} Planowany przychód ze sprzedaży: <b>{fmtMoney(expected)}</b>. Prognozowany wynik po sprzedaży wszystkich: <b>{fmtMoney(expected - spent)}</b>{pups.length ? <> · koszt odchowu na szczenię: <b>{fmtMoney(spent / pups.length)}</b></> : null}.</div>
          <div className="progress" style={{ marginTop: 10 }}><div style={{ width: `${expected ? Math.min(100, (received / expected) * 100) : 0}%`, background: 'var(--success)' }} /></div>
          <small className="muted">Otrzymano {expected ? Math.round((received / expected) * 100) : 0}% planowanych wpływów.</small>
        </Card>
        <Card title="Przychody" right={<button className="btn sm" onClick={() => setInc({ id: uid(), date: today(), amount: 0, category: INCOME_CATEGORIES[0], litterId: litter!.id })}><Plus size={14} /> Przychód</button>}>
          {incomes.length === 0 ? <div className="muted">Brak przychodów. Dodaj zaliczkę lub sprzedaż.</div> : <div className="list">{incomes.sort((a, b) => b.date.localeCompare(a.date)).map(i => <div key={i.id} className="list-item"><div><div className="title">{i.category}{i.puppyId ? ` · ${pups.find(p => p.id === i.puppyId)?.name ?? ''}` : ''}</div><small>{fmtDate(i.date)}{i.description ? ` · ${i.description}` : ''}</small></div><div className="row"><b style={{ color: 'var(--success)' }}>+{fmtMoney(i.amount)}</b><EditBtn onClick={() => setInc(i)} /><DelBtn onClick={() => confirmDel() && remove('incomes', i.id)} /></div></div>)}</div>}
        </Card>
        <Card title="Koszty przypisane do miotu" right={<button className="btn sm secondary" onClick={() => setExp({ id: uid(), date: today(), amount: 0, scope: 'kennel', category: 'Rozród i miot', type: 'Inne', litterId: litter!.id })}><Plus size={14} /> Koszt</button>}>
          {expenses.length === 0 ? <div className="muted">Brak kosztów przypisanych do miotu. Przy dodawaniu wydatku wybierz miot.</div> : <div className="list">{expenses.sort((a, b) => b.date.localeCompare(a.date)).map(e => <div key={e.id} className="list-item"><div><div className="title">{e.type ?? e.category}</div><small>{e.category} · {fmtDate(e.date)}{e.description ? ` · ${e.description}` : ''}</small></div><div className="row"><b style={{ color: 'var(--danger)' }}>−{fmtMoney(e.amount)}</b><DelBtn onClick={() => confirmDel() && remove('expenses', e.id)} /></div></div>)}</div>}
        </Card>
        {inc && <Modal title="Przychód" onClose={() => setInc(null)} actions={<><button className="btn secondary" onClick={() => setInc(null)}>Anuluj</button><button className="btn" disabled={!inc.amount} onClick={() => { upsert('incomes', inc); setInc(null); toast('Zapisano'); }}>Zapisz</button></>}>
          <div className="form-grid">
            <Field label="Kategoria"><select value={inc.category} onChange={e => setInc({ ...inc, category: e.target.value })}>{INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Szczenię"><select value={inc.puppyId ?? ''} onChange={e => setInc({ ...inc, puppyId: e.target.value || undefined })}><option value="">—</option>{pups.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Data"><input type="date" value={inc.date} onChange={e => setInc({ ...inc, date: e.target.value })} /></Field>
            <Field label="Kwota (PLN)"><input type="number" value={inc.amount || ''} onChange={e => setInc({ ...inc, amount: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Opis"><input value={inc.description ?? ''} onChange={e => setInc({ ...inc, description: e.target.value })} /></Field>
        </Modal>}
        {exp && <Modal title="Koszt miotu" onClose={() => setExp(null)} actions={<><button className="btn secondary" onClick={() => setExp(null)}>Anuluj</button><button className="btn" disabled={!exp.amount} onClick={() => { upsert('expenses', exp); setExp(null); toast('Zapisano'); }}>Zapisz</button></>}>
          <div className="form-grid">
            <Field label="Typ"><select value={exp.type} onChange={e => setExp({ ...exp, type: e.target.value })}>{['Krycie', 'Inseminacja', 'USG/RTG', 'Akcesoria dla szczeniąt', 'Chipowanie', 'Szczepienia', 'Odrobaczanie', 'Karma', 'Weterynarz', 'Inne'].map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Data"><input type="date" value={exp.date} onChange={e => setExp({ ...exp, date: e.target.value })} /></Field>
            <Field label="Kwota (PLN)"><input type="number" value={exp.amount || ''} onChange={e => setExp({ ...exp, amount: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Opis"><input value={exp.description ?? ''} onChange={e => setExp({ ...exp, description: e.target.value })} /></Field>
        </Modal>}
      </div>
    );
  }

  function BulkWeight() {
    const [date, setDate] = useState(nowLocal());
    const [vals, setVals] = useState<Record<string, string>>({});
    return (
      <Modal title="Ważenie całego miotu" onClose={() => setBulkWeight(false)} actions={<><button className="btn secondary" onClick={() => setBulkWeight(false)}>Anuluj</button><button className="btn" onClick={() => { const items = pups.filter(p => vals[p.id]).map(p => ({ id: uid(), puppyId: p.id, date, grams: Number(vals[p.id]) })); dispatch({ type: 'bulk', fn: s => ({ ...s, weights: [...s.weights, ...items] }) }); setBulkWeight(false); toast(`Zapisano ${items.length} pomiarów`); }}>Zapisz</button></>}>
        <Field label="Data i godzina"><input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} /></Field>
        {pups.map(p => <Field key={p.id} label={`${p.name} (g)`}><input type="number" value={vals[p.id] ?? ''} onChange={e => setVals({ ...vals, [p.id]: e.target.value })} placeholder={`ostatnio: ${lastWeights(p.id).pop()?.grams ?? '—'} g`} /></Field>)}
      </Modal>
    );
  }
}

export function useRemovePuppy() {
  const { dispatch } = useStore();
  return (id: string) => { if (!confirmDel('Usunąć szczenię i jego historię?')) return false; dispatch({ type: 'bulk', fn: s => ({ ...s, puppies: s.puppies.filter(p => p.id !== id), weights: s.weights.filter(w => w.puppyId !== id), health: s.health.filter(h => h.puppyId !== id) }) }); return true; };
}

export type { HealthKind };
