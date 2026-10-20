import { useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Dog, PawPrint, Baby, Syringe, Bug, Stethoscope, Microscope, Trophy, Wallet, Printer } from 'lucide-react';
import { useStore } from '../app/store';
import { Card, Empty, PageHeader } from '../components/ui';
import { Wordmark } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { BarChart3 as ArtIcon } from 'lucide-react';
import { ageText, fmtDate, fmtDateTime, fmtMoney, today } from '../app/format';
import { HEALTH_LABEL, type HealthKind } from '../app/types';

interface ReportDef { kind: string; title: string; desc: string; group: string; ico: ReactNode; breederOnly?: boolean }
const REPORTS: ReportDef[] = [
  { kind: 'dogs', title: 'Rejestr psów', desc: 'Raport z bazy psów', group: 'Hodowla', ico: <Dog size={24} /> },
  { kind: 'litters', title: 'Rejestr miotów', desc: 'Wszystkie mioty hodowli', group: 'Hodowla', ico: <PawPrint size={24} />, breederOnly: true },
  { kind: 'puppies', title: 'Szczenięta', desc: 'Lista szczeniąt w hodowli (raport szczeniąt)', group: 'Hodowla', ico: <Baby size={24} />, breederOnly: true },
  { kind: 'vacc-male', title: 'Szczepienia – reproduktory', desc: 'Historia szczepień psów', group: 'Zdrowie', ico: <Syringe size={24} /> },
  { kind: 'vacc-female', title: 'Szczepienia – suki', desc: 'Historia szczepień suk', group: 'Zdrowie', ico: <Syringe size={24} /> },
  { kind: 'vacc-all', title: 'Szczepienia – całe stado', desc: 'Psy i suki', group: 'Zdrowie', ico: <Syringe size={24} /> },
  { kind: 'parasite-male', title: 'Pasożyty – reproduktory', desc: 'Odrobaczenia i ochrona przed pasożytami', group: 'Zdrowie', ico: <Bug size={24} /> },
  { kind: 'parasite-female', title: 'Pasożyty – suki', desc: 'Odrobaczenia i ochrona przed pasożytami', group: 'Zdrowie', ico: <Bug size={24} /> },
  { kind: 'parasite-all', title: 'Pasożyty – całe stado', desc: 'Psy i suki', group: 'Zdrowie', ico: <Bug size={24} /> },
  { kind: 'procedures', title: 'Leczenie i zabiegi', desc: 'Wizyty u weterynarza i zabiegi', group: 'Zdrowie', ico: <Stethoscope size={24} /> },
  { kind: 'exams', title: 'Badania', desc: 'Wykonane badania i ich wyniki', group: 'Zdrowie', ico: <Microscope size={24} /> },
  { kind: 'shows', title: 'Wyniki wystaw', desc: 'Wyniki wystaw wszystkich psów', group: 'Osiągnięcia i finanse', ico: <Trophy size={24} /> },
  { kind: 'expenses', title: 'Wydatki', desc: 'Zestawienie wydatków w bieżącym roku', group: 'Osiągnięcia i finanse', ico: <Wallet size={24} /> },
];

export default function Reports() {
  const { kind } = useParams();
  const nav = useNavigate();
  const { state } = useStore();
  const breeder = state.profile.module === 'breeder';
  const defs = REPORTS.filter(r => breeder || !r.breederOnly);
  if (!kind) {
    const groups = Array.from(new Set(defs.map(r => r.group)));
    return (
      <div className="stack">
        <ArtHeader compact tone="teal" icon={<ArtIcon size={24} />} title="Raporty" sub="Zbiorcze zestawienia gotowe do zapisu jako PDF (drukuj → zapisz jako PDF)" />
        {groups.map(g => <div key={g}><h3 style={{ textAlign: 'center', color: 'var(--muted)' }}>— {g} —</h3><div className="grid cols-2">{defs.filter(r => r.group === g).map(r => <Card key={r.kind} onClick={() => nav(`/raporty/${r.kind}`)}><div className="row" style={{ alignItems: 'flex-start' }}><div className="avatar" style={{ width: 44, height: 44, borderRadius: 14 }}>{r.ico}</div><div><b>{r.title}</b><div className="muted">{r.desc}</div></div></div></Card>)}</div></div>)}
      </div>
    );
  }
  const def = REPORTS.find(r => r.kind === kind);
  if (!def) return <Card><Empty>Nieznany raport.</Empty></Card>;
  return (
    <div>
      <PageHeader back={() => nav('/raporty')} title={def.title} sub={def.desc} actions={<button className="btn" onClick={() => window.print()}><Printer size={16} /> Drukuj / zapisz PDF</button>} />
      <Card>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 12 }}>{state.profile.logo && <img className="kennel-logo lg" src={state.profile.logo} alt="" />}<div><b style={{ fontSize: 18 }}>{def.title.toUpperCase()}</b><div className="muted">{state.profile.kennelName || state.profile.breederName}{state.profile.kennelNo ? ` · Nr hodowli: ${state.profile.kennelNo}` : ''}</div></div></div>
          <div className="muted" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><span>Data wygenerowania: {fmtDate(today())}</span><Wordmark height={18} /></div>
        </div>
        <ReportBody kind={kind} />
      </Card>
    </div>
  );
}

function ReportBody({ kind }: { kind: string }) {
  const { state } = useStore();
  const dogName = (id?: string) => { const d = state.dogs.find(x => x.id === id); return d ? `${d.name} (${d.pedigreeName})` : '—'; };
  const healthTable = (kinds: HealthKind[], sex?: 'male' | 'female') => {
    const dogs = state.dogs.filter(d => !sex || d.sex === sex);
    const rows = state.health.filter(h => h.dogId && kinds.includes(h.kind) && dogs.some(d => d.id === h.dogId)).sort((a, b) => dogName(a.dogId).localeCompare(dogName(b.dogId)) || b.date.localeCompare(a.date));
    if (!rows.length) return <Empty>Brak wpisów.</Empty>;
    return <table className="tbl"><thead><tr><th>Pies</th><th>Rodzaj</th><th>Nazwa / preparat</th><th>Data</th><th>Następny termin</th><th>Lekarz</th><th>Wynik / notatki</th></tr></thead><tbody>{rows.map(h => <tr key={h.id}><td>{dogName(h.dogId)}</td><td>{HEALTH_LABEL[h.kind]}</td><td>{h.name}</td><td>{fmtDate(h.date)}</td><td>{fmtDate(h.nextDate)}</td><td>{h.vet ?? ''}</td><td>{[h.result, h.notes].filter(Boolean).join(' · ')}</td></tr>)}</tbody></table>;
  };
  switch (kind) {
    case 'dogs': return <table className="tbl"><thead><tr><th>Imię</th><th>Nazwa rodowodowa</th><th>Rasa</th><th>Płeć</th><th>Data ur.</th><th>Wiek</th><th>Umaszczenie</th><th>Nr rodowodu</th><th>Chip</th><th>Rodzice</th></tr></thead><tbody>{state.dogs.map(d => <tr key={d.id}><td>{d.name}</td><td>{d.pedigreeName}</td><td>{d.breed}</td><td>{d.sex === 'male' ? 'Pies' : 'Suka'}</td><td>{fmtDate(d.birthDate)}</td><td>{ageText(d.birthDate)}</td><td>{d.color ?? ''}</td><td>{d.pedigreeNo ?? ''}</td><td>{d.chip ?? ''}</td><td>{[d.fatherName, d.motherName].filter(Boolean).join(' × ')}</td></tr>)}</tbody></table>;
    case 'litters': return <table className="tbl"><thead><tr><th>Miot</th><th>Data ur.</th><th>Matka</th><th>Ojciec</th><th>Szczenięta</th><th>Psy</th><th>Suki</th><th>Przekazane</th></tr></thead><tbody>{state.litters.map(l => { const ps = state.puppies.filter(p => p.litterId === l.id); return <tr key={l.id}><td>{l.name}</td><td>{fmtDate(l.birthDate)}</td><td>{l.motherName}</td><td>{l.fatherName}</td><td>{ps.length}</td><td>{ps.filter(p => p.sex === 'male').length}</td><td>{ps.filter(p => p.sex === 'female').length}</td><td>{ps.filter(p => p.handoverDate).length}</td></tr>; })}</tbody></table>;
    case 'puppies': return <div className="stack">{state.litters.map(l => { const ps = state.puppies.filter(p => p.litterId === l.id); return <div key={l.id}><div className="row between" style={{ background: 'var(--surface-2)', padding: 8, borderRadius: 8 }}><b>{l.name}</b><span className="muted">Ur. {fmtDate(l.birthDate)} · Matka: {l.motherName} · Ojciec: {l.fatherName} · Liczba szczeniąt: {ps.length}</span></div>{ps.map((p, i) => { const ws = state.weights.filter(w => w.puppyId === p.id).sort((a, b) => a.date.localeCompare(b.date)); const hs = state.health.filter(h => h.puppyId === p.id); return <div key={p.id} className="grid cols-2" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><div><b>{i + 1}. {p.name}</b><div className="muted" style={{ fontSize: 12 }}>Płeć: {p.sex === 'male' ? 'Pies' : 'Suka'} · Ur.: {fmtDateTime(p.birthDateTime)} · Umaszczenie: {p.color ?? '—'} · Waga ur.: {p.birthWeightG ?? '—'} g<br />Rodowód: {p.pedigreeNo ?? '—'} · Chip: {p.chip ?? '—'} · Nr karty: {p.pawId}<br />Właściciel: {p.owners.map(o => o.name).join(', ') || '—'}{p.handoverDate ? ` · przekazany ${fmtDate(p.handoverDate)}` : ''}<br />Profilaktyka: {hs.map(h => `${HEALTH_LABEL[h.kind]} ${h.name} (${fmtDate(h.date)})`).join('; ') || '—'}</div></div><div><table className="tbl"><thead><tr><th>Data</th><th>Waga</th></tr></thead><tbody>{ws.slice(-8).map(w => <tr key={w.id}><td>{fmtDateTime(w.date)}</td><td>{w.grams} g</td></tr>)}</tbody></table></div></div>; })}</div>; })}{state.litters.length === 0 && <Empty>Brak miotów.</Empty>}</div>;
    case 'vacc-male': return healthTable(['vaccination'], 'male');
    case 'vacc-female': return healthTable(['vaccination'], 'female');
    case 'vacc-all': return healthTable(['vaccination']);
    case 'parasite-male': return healthTable(['deworming', 'parasite'], 'male');
    case 'parasite-female': return healthTable(['deworming', 'parasite'], 'female');
    case 'parasite-all': return healthTable(['deworming', 'parasite']);
    case 'procedures': return healthTable(['procedure']);
    case 'exams': return healthTable(['exam']);
    case 'shows': return <table className="tbl"><thead><tr><th>Pies</th><th>Data</th><th>Wystawa</th><th>Ranga</th><th>Klasa</th><th>Ocena</th><th>Lokata</th><th>Sędzia</th><th>Tytuły</th><th>Certyfikaty</th></tr></thead><tbody>{[...state.shows].sort((a, b) => b.date.localeCompare(a.date)).map(s => <tr key={s.id}><td>{dogName(s.dogId)}</td><td>{fmtDate(s.date)}</td><td>{s.country}, {s.city}</td><td>{s.rank}</td><td>{s.dogClass}</td><td>{s.grade ?? ''}</td><td>{s.place ?? ''}</td><td>{s.judge ?? ''}</td><td>{s.titles ?? ''}</td><td>{s.certificates ?? ''}</td></tr>)}</tbody></table>;
    case 'expenses': { const y = today().slice(0, 4); const rows = state.expenses.filter(e => e.date.startsWith(y)).sort((a, b) => b.date.localeCompare(a.date)); return <><table className="tbl"><thead><tr><th>Data</th><th>Rodzaj</th><th>Kategoria</th><th>Typ</th><th>Pies</th><th>Opis</th><th style={{ textAlign: 'right' }}>Kwota</th></tr></thead><tbody>{rows.map(e => <tr key={e.id}><td>{fmtDate(e.date)}</td><td>{e.scope === 'show' ? 'Wystawa' : 'Hodowla'}</td><td>{e.category}</td><td>{e.type ?? ''}</td><td>{e.dogId ? dogName(e.dogId) : ''}</td><td>{e.description ?? ''}</td><td style={{ textAlign: 'right' }}>{fmtMoney(e.amount)}</td></tr>)}</tbody></table><div className="row between" style={{ marginTop: 10 }}><b>Razem {y}</b><b>{fmtMoney(rows.reduce((a, e) => a + e.amount, 0))}</b></div></>; }
    default: return null;
  }
}
