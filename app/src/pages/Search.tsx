import { Link, useSearchParams } from 'react-router-dom';
import { Dog, PawPrint, Trophy, Receipt, Bell, Search as SearchIcon } from 'lucide-react';
import { useStore } from '../app/store';
import { Card, Empty, PageHeader } from '../components/ui';
import { fmtDate, fmtMoney } from '../app/format';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').toLowerCase().trim();
  const { state } = useStore();
  const has = (...xs: (string | undefined)[]) => xs.some(x => x && x.toLowerCase().includes(q));
  const results = q ? [
    ...state.dogs.filter(d => has(d.name, d.pedigreeName, d.breed, d.chip, d.pedigreeNo)).map(d => ({ ico: <Dog size={18} />, title: `${d.name} (${d.pedigreeName})`, sub: `Pies · ${d.breed}`, to: `/psy/${d.id}` })),
    ...state.puppies.filter(p => has(p.name, p.chip, p.pawId, ...p.owners.map(o => o.name))).map(p => ({ ico: <PawPrint size={18} />, title: p.name, sub: `Szczenię · ${state.litters.find(l => l.id === p.litterId)?.name ?? ''}${p.owners[0] ? ` · ${p.owners[0].name}` : ''}`, to: `/szczenieta/${p.id}` })),
    ...state.litters.filter(l => has(l.name, l.motherName, l.fatherName)).map(l => ({ ico: <PawPrint size={18} />, title: l.name, sub: `Miot · ${fmtDate(l.birthDate)} · ${l.motherName} × ${l.fatherName}`, to: `/mioty/${l.id}` })),
    ...state.shows.filter(s => has(s.city, s.country, s.judge, s.titles, s.certificates)).map(s => ({ ico: <Trophy size={18} />, title: `${s.country}, ${s.city}`, sub: `Wystawa · ${fmtDate(s.date)} · ${state.dogs.find(d => d.id === s.dogId)?.name ?? ''}`, to: `/psy/${s.dogId}?tab=career` })),
    ...state.health.filter(h => h.dogId && has(h.name, h.vet, h.notes)).map(h => ({ ico: <Dog size={18} />, title: h.name, sub: `Zdrowie · ${fmtDate(h.date)} · ${state.dogs.find(d => d.id === h.dogId)?.name ?? ''}`, to: `/psy/${h.dogId}?tab=health` })),
    ...state.expenses.filter(e => has(e.category, e.type, e.description)).map(e => ({ ico: <Receipt size={18} />, title: `${e.type ?? e.category} · ${fmtMoney(e.amount)}`, sub: `Wydatek · ${fmtDate(e.date)}`, to: '/finanse' })),
    ...state.reminders.filter(r => has(r.title, r.notes)).map(r => ({ ico: <Bell size={18} />, title: r.title, sub: `Przypomnienie · ${fmtDate(r.date)}`, to: '/przypomnienia' })),
  ] : [];
  return (
    <div>
      <PageHeader title="Szukaj" sub={q ? `Wyniki dla „${params.get('q')}”` : 'Wpisz frazę w polu wyszukiwania'} />
      <Card>
        {results.length === 0 ? <Empty icon={<SearchIcon size={28} />}>{q ? 'Brak wyników.' : 'Szukaj psów, szczeniąt, miotów, wystaw, wpisów zdrowotnych, wydatków i przypomnień.'}</Empty> : (
          <div className="list">{results.map((r, i) => <Link key={i} to={r.to} className="list-item" style={{ color: 'inherit' }}><div className="row"><span style={{ color: 'var(--primary)', display: 'grid' }}>{r.ico}</span><div><div className="title">{r.title}</div><small>{r.sub}</small></div></div><span className="muted">→</span></Link>)}</div>
        )}
      </Card>
    </div>
  );
}
