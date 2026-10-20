import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Download, Printer, Table2 } from 'lucide-react';
import { litterStats, littersCsv } from '../app/litters';
import { PawPrint, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../app/store';
import { Card, Empty, Field, Modal, confirmDel, DelBtn, Tabs, sexIcon } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { PawPrint as ArtIcon } from 'lucide-react';
import { fmtDate, today, uid } from '../app/format';
import type { Litter } from '../app/types';

export function LitterForm({ initial, onClose, onSave }: { initial?: Litter; onClose: () => void; onSave: (l: Litter) => void }) {
  const { state } = useStore();
  const [l, setL] = useState<Litter>(initial ?? { id: uid(), name: '', motherName: '', fatherName: '', birthDate: today(), notes: [], checklist: {}, pack: { accustomed: [] }, birthDiary: [], createdAt: today() });
  const females = state.dogs.filter(d => d.sex === 'female'), males = state.dogs.filter(d => d.sex === 'male');
  const breedings = state.breedings.filter(b => b.femaleId === l.motherId);
  return (
    <Modal title={initial ? 'Edytuj miot' : 'Nowy miot'} onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!l.name.trim() || !l.motherName.trim() || !l.birthDate} onClick={() => onSave(l)}>Zapisz</button></>}>
      <div className="form-grid">
        <Field label="Nazwa / oznaczenie miotu *"><input value={l.name} onChange={e => setL({ ...l, name: e.target.value })} placeholder="np. Miot D" /></Field>
        <Field label="Data urodzenia *"><input type="date" value={l.birthDate} onChange={e => setL({ ...l, birthDate: e.target.value })} /></Field>
        <Field label="Litera miotu"><input value={l.letter ?? ''} onChange={e => setL({ ...l, letter: e.target.value.toUpperCase().slice(0, 2) })} placeholder="np. D" /></Field>
        <Field label="Rasa"><input value={l.breed ?? ''} onChange={e => setL({ ...l, breed: e.target.value })} placeholder="domyślnie rasa matki" /></Field>
        <Field label="Matka (z moich suk)"><select value={l.motherId ?? ''} onChange={e => { const d = females.find(f => f.id === e.target.value); setL({ ...l, motherId: d?.id, motherName: d ? d.pedigreeName : l.motherName }); }}><option value="">— wpisz ręcznie —</option>{females.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
        <Field label="Matka (nazwa) *"><input value={l.motherName} onChange={e => setL({ ...l, motherName: e.target.value })} /></Field>
        <Field label="Ojciec (z moich psów)"><select value={l.fatherId ?? ''} onChange={e => { const d = males.find(f => f.id === e.target.value); setL({ ...l, fatherId: d?.id, fatherName: d ? d.pedigreeName : l.fatherName }); }}><option value="">— wpisz ręcznie —</option>{males.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
        <Field label="Ojciec (nazwa)"><input value={l.fatherName} onChange={e => setL({ ...l, fatherName: e.target.value })} /></Field>
        <Field label="Nr zgłoszenia / rejestracji miotu"><input value={l.regNo ?? ''} onChange={e => setL({ ...l, regNo: e.target.value })} /></Field>
        <Field label="Data przeglądu miotu"><input type="date" value={l.reviewDate ?? ''} onChange={e => setL({ ...l, reviewDate: e.target.value || undefined })} /></Field>
        {breedings.length > 0 && <Field label="Powiązane skojarzenie"><select value={l.breedingId ?? ''} onChange={e => setL({ ...l, breedingId: e.target.value || undefined })}><option value="">—</option>{breedings.map(b => <option key={b.id} value={b.id}>{b.maleName} – {fmtDate(b.matings[0]?.date)}</option>)}</select></Field>}
      </div>
    </Modal>
  );
}

export default function Litters() {
  const { state, upsert, dispatch, toast } = useStore();
  const nav = useNavigate();
  const [adding, setAdding] = useState(false);
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'table' ? 'table' : 'cards';
  useEffect(() => { if (params.get('add')) { setAdding(true); setParams({}); } }, [params, setParams]);
  const [year, setYear] = useState('');
  const [motherF, setMotherF] = useState('');
  const [q, setQ] = useState('');
  const all = [...state.litters].sort((a, b) => b.birthDate.localeCompare(a.birthDate));
  const years = [...new Set(all.map(l => l.birthDate.slice(0, 4)))].sort().reverse();
  const mothers = [...new Set(all.map(l => l.motherName).filter(Boolean))].sort();
  const litters = all.filter(l => (!year || l.birthDate.startsWith(year)) && (!motherF || l.motherName === motherF) && (!q || [l.name, l.letter, l.motherName, l.fatherName, l.regNo, l.breed].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase())));
  const stats = litters.map(l => litterStats(state, l));
  const totals = { pups: stats.reduce((a, s) => a + s.pups.length, 0), males: stats.reduce((a, s) => a + s.males, 0), females: stats.reduce((a, s) => a + s.females, 0), handed: stats.reduce((a, s) => a + s.handed, 0), alive: stats.reduce((a, s) => a + s.alive, 0) };
  const exportCsv = () => { const blob = new Blob([littersCsv(state, litters)], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `rejestr-miotow-${today()}.csv`; a.click(); toast('Rejestr pobrany jako CSV'); };
  const del = (id: string) => { if (!confirmDel('Usunąć miot wraz ze szczeniętami?')) return; dispatch({ type: 'bulk', fn: s => { const pids = s.puppies.filter(p => p.litterId === id).map(p => p.id); return { ...s, litters: s.litters.filter(l => l.id !== id), puppies: s.puppies.filter(p => p.litterId !== id), weights: s.weights.filter(w => !w.puppyId || !pids.includes(w.puppyId)), health: s.health.filter(h => !h.puppyId || !pids.includes(h.puppyId)), breedings: s.breedings.map(b => b.litterId === id ? { ...b, litterId: undefined } : b) }; } }); };
  return (
    <div>
      <ArtHeader compact tone="green" icon={<ArtIcon size={24} />} title="Mioty" sub="Baza wszystkich miotów hodowli" actions={<button className="btn" onClick={() => setAdding(true)}><Plus size={18} /> Nowy miot</button>} />
      <div className="row between no-print" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Tabs value={view} onChange={v => setParams(v === 'table' ? { view: 'table' } : {})} items={[{ key: 'cards', label: 'Karty' }, { key: 'table', label: 'Rejestr miotów' }]} />
        {view === 'table' && <div className="row" style={{ gap: 6 }}><button className="btn secondary sm" onClick={exportCsv}><Download size={14} /> CSV</button><button className="btn secondary sm" onClick={() => window.print()}><Printer size={14} /> Drukuj</button></div>}
      </div>
      {all.length === 0 ? <Card><Empty icon={<PawPrint size={28} />}>Brak miotów. Dodaj pierwszy miot, aby prowadzić metrykę szczeniąt.</Empty></Card> : view === 'cards' ? (
        <div className="stack">{litters.map(l => { const pups = state.puppies.filter(p => p.litterId === l.id); return (
          <Card key={l.id} onClick={() => nav(`/mioty/${l.id}`)}>
            <div className="row between">
              <div><b style={{ fontSize: 18, color: 'var(--primary-600)' }}>{l.name}</b><div className="muted">Ur. {fmtDate(l.birthDate)}</div><div><span className="muted">Ojciec:</span> {l.fatherName || '—'}</div><div><span className="muted">Matka:</span> {l.motherName}</div><div><span className="muted">Liczba szczeniąt:</span> <b>{pups.length}</b> ({pups.filter(p => p.sex === 'male').length} {sexIcon('male')} / {pups.filter(p => p.sex === 'female').length} {sexIcon('female')})</div></div>
              <DelBtn onClick={() => del(l.id)} />
            </div>
          </Card>); })}</div>
      ) : (
        <div className="stack">
          <Card className="no-print">
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <Field label="Szukaj"><input value={q} onChange={e => setQ(e.target.value)} placeholder="oznaczenie, rodzic, nr zgłoszenia…" /></Field>
              <Field label="Rok"><select value={year} onChange={e => setYear(e.target.value)}><option value="">wszystkie</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></Field>
              <Field label="Matka"><select value={motherF} onChange={e => setMotherF(e.target.value)}><option value="">wszystkie</option>{mothers.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
            </div>
          </Card>
          <div className="grid cols-4">
            <Card className="stat"><div className="value">{litters.length}</div><div className="label">{litters.length === 1 ? 'miot' : litters.length < 5 ? 'mioty' : 'miotów'}</div></Card>
            <Card className="stat"><div className="value">{totals.pups}</div><div className="label">szczeniąt · {totals.males} {sexIcon('male')} / {totals.females} {sexIcon('female')}</div></Card>
            <Card className="stat"><div className="value">{litters.length ? (totals.pups / litters.length).toFixed(1) : '—'}</div><div className="label">średnio w miocie</div></Card>
            <Card className="stat"><div className="value">{totals.handed}</div><div className="label">przekazanych nabywcom</div></Card>
          </div>
          <Card title="Rejestr miotów" icon={<Table2 size={18} />}>
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Oznaczenie</th><th>Litera</th><th>Data ur.</th><th>Rasa</th><th>Matka</th><th>Ojciec</th><th>Szczenięta</th><th>Żywo / martwo</th><th>Śr. waga ur.</th><th>Przekazane</th><th>Nr zgłoszenia</th><th>Przegląd</th><th>Odchów</th></tr></thead>
                <tbody>{litters.map((l, i) => { const s = stats[i]; return (
                  <tr key={l.id}>
                    <td><Link to={`/mioty/${l.id}`}><b>{l.name}</b></Link></td><td>{l.letter ?? '—'}</td><td>{fmtDate(l.birthDate)}</td><td>{s.breed || '—'}</td><td>{s.mother ? <Link to={`/psy/${s.mother.id}`}>{l.motherName}</Link> : l.motherName}</td><td>{s.father ? <Link to={`/psy/${s.father.id}`}>{l.fatherName}</Link> : (l.fatherName || '—')}</td>
                    <td><b>{s.pups.length}</b> <span className="muted">({s.males} {sexIcon('male')} / {s.females} {sexIcon('female')})</span></td><td>{s.alive} / {s.stillborn}{s.died ? ` (+${s.died} padłe)` : ''}</td><td>{s.avgBw ? `${s.avgBw} g` : '—'}</td><td>{s.handed} / {s.pups.length}</td><td>{l.regNo ?? '—'}</td><td>{l.reviewDate ? fmtDate(l.reviewDate) : '—'}</td><td><span className={`badge ${s.carePct === 100 ? 'success' : s.carePct ? '' : 'gray'}`}>{s.carePct}%</span></td>
                  </tr>); })}</tbody>
                {litters.length > 1 && <tfoot><tr><th colSpan={6}>{`Razem: ${litters.length} ${litters.length < 5 ? 'mioty' : 'miotów'}`}</th><th>{totals.pups} ({totals.males} / {totals.females})</th><th>{totals.alive} żywo</th><th></th><th>{totals.handed} / {totals.pups}</th><th colSpan={3}></th></tr></tfoot>}
              </table>
            </div>
            {litters.length === 0 && <div className="muted" style={{ marginTop: 8 }}>Żaden miot nie pasuje do filtrów.</div>}
          </Card>
          <Card title="Mioty w latach">
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>{years.map(y => { const ls = all.filter(l => l.birthDate.startsWith(y)); const n = ls.reduce((a, l) => a + state.puppies.filter(p => p.litterId === l.id).length, 0); return <button key={y} className={`chip ${year === y ? 'warm' : ''}`} onClick={() => setYear(year === y ? '' : y)}>{y}: {`${ls.length} ${ls.length === 1 ? 'miot' : ls.length < 5 ? 'mioty' : 'miotów'} · ${n} szczeniąt`}</button>; })}</div>
          </Card>
        </div>
      )}
      {adding && <LitterForm onClose={() => setAdding(false)} onSave={l => { upsert('litters', l); if (l.breedingId) { const b = state.breedings.find(x => x.id === l.breedingId); if (b) upsert('breedings', { ...b, litterId: l.id }); } setAdding(false); toast('Miot dodany'); nav(`/mioty/${l.id}`); }} />}
    </div>
  );
}
