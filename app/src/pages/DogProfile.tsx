import { useMemo, useState, type ReactNode } from 'react';
import { Pencil, Plus, Cake, Syringe, Trophy, Heart, PawPrint, Scale, Receipt, Calendar, Flower2, GitBranch, Award, Medal, CalendarDays } from 'lucide-react';
import { buildPedigree, coefficientOfInbreeding, type PedNode } from '../app/pedigree';
import { heatStats } from '../app/heat';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../app/store';
import { Card, Empty, Field, KV, Modal, ProBadge, Stat, Tabs, confirmDel, EditBtn, DelBtn } from '../components/ui';
import { ArtHeader } from '../components/ui';
import DogForm from '../components/DogForm';
import DogGallery from '../components/DogGallery';
import { ShareComposer, type ShareDraft } from '../components/Social';
import { Share2 } from 'lucide-react';
import { ageText, fmtDate, fmtDateTime, fmtMoney, nowLocal, today, uid } from '../app/format';
import { COUNTRIES, HEALTH_LABEL, SHOW_CERTS, SHOW_CLASSES, SHOW_GRADES, SHOW_RANKS, SHOW_TITLES, type Breeding, type Championship, type HealthKind, type HealthRecord, type Show, type StudMating, type Weight, type Heat } from '../app/types';
import { pregnancyInfo } from '../app/pregnancy';

type Tab = 'card' | 'health' | 'breeding' | 'pedigree' | 'career' | 'weight' | 'timeline';

export default function DogProfile() {
  const { id } = useParams();
  const { state, upsert, remove, toast, limits } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'card';
  const dog = state.dogs.find(d => d.id === id);
  const [editing, setEditing] = useState(false);
  if (!dog) return <Card><Empty>Nie znaleziono psa. <Link to="/psy">Wróć do listy</Link></Empty></Card>;
  const breeder = state.profile.module === 'breeder';
  const tabs: { key: Tab; label: string }[] = [
    { key: 'card', label: 'Dane' }, { key: 'health', label: 'Zdrowie' },
    ...(breeder ? [{ key: 'breeding' as Tab, label: dog.sex === 'female' ? 'Rozród' : 'Krycia' }] : []),
    { key: 'pedigree', label: 'Rodowód' },
    { key: 'career', label: 'Osiągnięcia' }, { key: 'weight', label: 'Waga' }, { key: 'timeline', label: 'Kronika' },
  ];
  return (
    <div>
      <ArtHeader tone={dog.sex === 'female' ? 'rose' : 'blue'} icon={<PawPrint size={24} />} photo={dog.photo ?? null} back={() => nav('/psy')} title={dog.name} sub={<>{dog.pedigreeName} · {dog.breed} · {dog.sex === 'male' ? 'Pies' : 'Suka'}, {ageText(dog.birthDate)}</>}
        actions={<><button className="btn secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edytuj</button><button className="btn danger" onClick={() => { if (confirmDel('Usunąć psa i wszystkie jego wpisy?')) { remove('dogs', dog.id); nav('/psy'); } }}>Usuń</button></>} />
      <Tabs value={tab} onChange={t => setParams({ tab: t })} items={tabs} />
      {tab === 'card' && CardTab()}
      {tab === 'health' && <HealthTab />}
      {tab === 'breeding' && (dog.sex === 'female' ? <BreedingTab /> : <StudTab />)}
      {tab === 'pedigree' && <PedigreeTab />}
      {tab === 'career' && <CareerTab />}
      {tab === 'weight' && <WeightTab />}
      {tab === 'timeline' && <TimelineTab />}
      {editing && <DogForm initial={dog} onClose={() => setEditing(false)} onSave={d => { upsert('dogs', d); setEditing(false); toast('Zapisano'); }} />}
    </div>
  );

  function CardTab() {
    return (
      <div className="stack">
        <Card>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="avatar lg">{dog!.photo ? <img src={dog!.photo} alt="" /> : <PawPrint size={44} />}</div>
            <div style={{ flex: 1 }}>
              <h3>Podstawowe informacje</h3>
              <KV items={[['Rasa', dog!.breed], ['Data urodzenia', fmtDate(dog!.birthDate)], ['Umaszczenie', dog!.color], ['Waga', dog!.weightKg ? `${dog!.weightKg} kg` : '—'], ['Płeć', dog!.sex === 'male' ? 'Pies' : 'Suka'], ['Kastrowany', dog!.neutered ? 'Tak' : 'Nie']]} />
            </div>
          </div>
        </Card>
        <Card title="Rodzice"><KV items={[['Ojciec', dog!.fatherName], ['Matka', dog!.motherName]]} /></Card>
        <Card title="Numery i dokumenty"><KV items={[['Nr rodowodu', dog!.pedigreeNo], ['Nr rejestracji oddziałowej', dog!.regNo], ['Nr chip', dog!.chip], ['Hodowla', dog!.kennelName], ['Nr karty przekazania', dog!.pawId]]} /></Card>
        {dog!.notes && <Card title="Notatki"><div style={{ whiteSpace: 'pre-wrap' }}>{dog!.notes}</div></Card>}
        <DogGallery dog={dog!} />
      </div>
    );
  }

  function HealthTab() {
    const [edit, setEdit] = useState<HealthRecord | null>(null);
    const recs = state.health.filter(h => h.dogId === dog!.id).sort((a, b) => b.date.localeCompare(a.date));
    const groups: HealthKind[] = ['vaccination', 'deworming', 'parasite', 'procedure', 'exam'];
    const t = today();
    return (
      <div className="stack">
        <div className="row no-print"><button className="btn" onClick={() => setEdit({ id: uid(), dogId: dog!.id, kind: 'vaccination', date: t, name: '' })}><Plus size={18} /> Dodaj wpis</button></div>
        {groups.map(g => { const rs = recs.filter(r => r.kind === g); return (
          <Card key={g} title={HEALTH_LABEL[g]} right={<span className="badge gray">{rs.length}</span>}>
            {rs.length === 0 ? <div className="muted">Brak wpisów.</div> : <div className="list">{rs.map(r => (
              <div key={r.id} className="list-item">
                <div><div className="title">{r.name}</div><small>{fmtDate(r.date)}{r.vet ? ` · ${r.vet}` : ''}{r.result ? ` · ${r.result}` : ''}{r.notes ? ` · ${r.notes}` : ''}</small></div>
                <div className="row">{r.nextDate && <span className={`badge ${r.nextDate < t ? 'danger' : 'warn'}`}>Następne: {fmtDate(r.nextDate)}</span>}<EditBtn onClick={() => setEdit(r)} /><DelBtn onClick={() => confirmDel() && remove('health', r.id)} /></div>
              </div>))}</div>}
          </Card>); })}
        {edit && <HealthForm rec={edit} onClose={() => setEdit(null)} onSave={r => { upsert('health', r); setEdit(null); toast('Zapisano'); }} />}
      </div>
    );
  }

  function HeatSection() { return <HeatSectionImpl dogId={dog!.id} />; }

  function BreedingTab() {
    const [edit, setEdit] = useState<Breeding | null>(null);
    const list = state.breedings.filter(b => b.femaleId === dog!.id).sort((a, b) => (b.matings[0]?.date ?? '').localeCompare(a.matings[0]?.date ?? ''));
    return (
      <div className="stack">
        <HeatSection />
        <div className="row between no-print"><h3 style={{ margin: 0 }}>Plany kryć</h3><button className="btn" onClick={() => setEdit({ id: uid(), femaleId: dog!.id, maleName: '', matings: [{ date: today(), type: 'natural', tie: true }], usg: [], progesterone: [], rtg: [] })}><Plus size={18} /> Dodaj skojarzenie</button></div>
        {list.length === 0 && <Card><Empty icon={<Heart size={28} />}>Brak skojarzeń. Dodaj pierwsze, aby uruchomić kalendarz ciąży.</Empty></Card>}
        {list.map(b => { const first = [...b.matings].sort((x, y) => x.date.localeCompare(y.date))[0]; const info = first ? pregnancyInfo(first.date) : null; const litter = state.litters.find(l => l.id === b.litterId); return (
          <Card key={b.id} title={<>Plan z <span style={{ color: 'var(--primary-600)' }}>{b.maleName}</span></>} right={<div className="row"><EditBtn onClick={() => setEdit(b)} /><DelBtn onClick={() => confirmDel() && remove('breedings', b.id)} /></div>}>
            {info && !litter && info.day <= 70 && info.day > 0 && (
              <Link to={`/ciaza/${b.id}`} className="card soft clickable" style={{ display: 'block', marginBottom: 10, background: 'var(--primary)', color: '#fff' }}>
                <div className="row between"><div><b style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> Monitor ciąży</b><div style={{ opacity: .85, fontSize: 13 }}>{`${info.day}. dzień · ${info.week}. tydzień · termin ok. ${fmtDate(info.expected)}`}</div></div><span>→</span></div>
              </Link>
            )}
            <KV items={[['Data rozpoczęcia cieczki', fmtDate(b.heatStartDate)], ['Krycia', b.matings.map(m => `${fmtDate(m.date)} – ${m.type === 'natural' ? 'naturalne' : 'inseminacja'}${m.tie ? ', zakleszczenie' : ''}`).join('; ') || '—'], ['Progesteron', b.progesterone.map(p => `${fmtDate(p.date)}: ${p.value}`).join('; ') || '—'], ['Badania USG', b.usg.map(p => `${fmtDate(p.date)}: ${p.value}`).join('; ') || '—'], ['Badania RTG', b.rtg.map(p => `${fmtDate(p.date)}: ${p.value}`).join('; ') || '—'], ['Miot', litter ? <Link key="litter" to={`/mioty/${litter.id}`}>{litter.name}</Link> : '—'], ['Notatki', b.notes]]} />
          </Card>); })}
        {edit && <BreedingForm b={edit} onClose={() => setEdit(null)} onSave={b => { upsert('breedings', b); setEdit(null); toast('Zapisano'); }} />}
      </div>
    );
  }

  function StudTab() {
    const [edit, setEdit] = useState<StudMating | null>(null);
    const list = state.studMatings.filter(m => m.maleId === dog!.id).sort((a, b) => (b.dates[0] ?? '').localeCompare(a.dates[0] ?? ''));
    return (
      <div className="stack">
        <div className="row no-print"><button className="btn" onClick={() => setEdit({ id: uid(), maleId: dog!.id, femaleName: '', ownerFirst: '', ownerLast: '', place: 'kennel', type: 'natural', tie: true, dates: [today()] })}><Plus size={18} /> Dodaj krycie</button></div>
        <Card title="Rejestr kryć reproduktora">
          {list.length === 0 ? <Empty>Brak zapisanych kryć.</Empty> : <div className="stack">{list.map(m => (
            <div key={m.id} className="card soft">
              <div className="row between"><b style={{ color: 'var(--primary-600)', fontSize: 16 }}>{m.femaleName}</b><div><EditBtn onClick={() => setEdit(m)} /><DelBtn onClick={() => confirmDel() && remove('studMatings', m.id)} /></div></div>
              <KV items={[['Właściciel', `${m.ownerFirst} ${m.ownerLast}`], ['Liczba szczeniąt', m.puppiesCount ?? '—'], ['Rodzaj krycia', m.type === 'natural' ? 'Naturalne' : 'Inseminacja'], ['Zawiązanie (tak/nie)', m.tie ? 'Tak' : 'Nie'], ['Miejsce krycia', m.place === 'kennel' ? 'Krycie w hodowli' : 'Krycie zewnętrzne'], ...m.dates.map((d, i) => [`Data krycia ${m.dates.length > 1 ? i + 1 : ''}`.trim(), fmtDate(d)] as [string, string]), ['Notatki', m.notes]]} />
            </div>))}</div>}
        </Card>
        {edit && <StudForm m={edit} onClose={() => setEdit(null)} onSave={m => { upsert('studMatings', m); setEdit(null); toast('Zapisano'); }} />}
      </div>
    );
  }

  function CareerTab() {
    const [sub, setSub] = useState<'shows' | 'champ'>('shows');
    const [shareShow, setShareShow] = useState<ShareDraft | null>(null);
    const [editShow, setEditShow] = useState<Show | null>(null);
    const [editCh, setEditCh] = useState<Championship | null>(null);
    const [year, setYear] = useState('all');
    const shows = state.shows.filter(s => s.dogId === dog!.id).sort((a, b) => b.date.localeCompare(a.date));
    const years = Array.from(new Set(shows.map(s => s.date.slice(0, 4)))).sort().reverse();
    const visible = shows.filter(s => year === 'all' || s.date.startsWith(year));
    const champs = state.championships.filter(c => c.dogId === dog!.id);
    const certs = shows.filter(s => s.certificates).length, titles = shows.filter(s => s.titles).length;
    const showCost = (s: Show) => state.expenses.filter(e => e.showId === s.id).reduce((a, e) => a + e.amount, 0);
    return (
      <div className="stack">
        <div className="grid cols-3"><Stat icon={<Trophy size={22} />} value={shows.length} label="Wystawy" /><Stat icon={<Award size={22} />} value={certs} label="Certyfikaty" /><Stat icon={<Medal size={22} />} value={titles} label="Tytuły" /></div>
        <Tabs value={sub} onChange={setSub} items={[{ key: 'shows', label: 'Wystawy' }, { key: 'champ', label: 'Championaty' }]} />
        {sub === 'shows' && (
          <>
            <div className="row between no-print">
              <div className="row" style={{ gap: 8 }}><select value={year} onChange={e => setYear(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}><option value="all">Rok: wszystkie</option>{years.map(y => <option key={y} value={y}>Rok: {y}</option>)}</select><Link to="/wystawy" className="btn secondary sm"><CalendarDays size={16} /> Kalendarz wystaw</Link></div>
              <button className="btn" onClick={() => { if (!limits.canAddShow()) { toast('Plan FREE: maks. 5 wystaw. Przejdź na PRO.'); return; } setEditShow({ id: uid(), dogId: dog!.id, country: 'Polska', city: '', rank: SHOW_RANKS[0], date: today(), dogClass: SHOW_CLASSES[4] }); }}><Plus size={18} /> Dodaj wystawę</button>
            </div>
            {!limits.isPro && shows.length >= 5 && <div className="card soft">Limit 5 wystaw w planie FREE. <ProBadge /> znosi limit.</div>}
            {visible.length === 0 ? <Card><Empty>Brak wystaw.</Empty></Card> : visible.map(s => (
              <Card key={s.id}>
                <div className="row between"><div><b style={{ color: 'var(--primary-600)', fontSize: 16 }}>{s.country}, {s.city}</b><div>{s.rank}</div></div><div><EditBtn onClick={() => setEditShow(s)} /><DelBtn onClick={() => confirmDel() && remove('shows', s.id)} /></div></div>
                <KV items={[['Nr katalogowy', s.catalogNo], ['Data wystawy', fmtDate(s.date)], ['Klasa', s.dogClass], ['Lokata', s.place], ['Ocena', s.grade], ['Sędzia', s.judge], ['Tytuły', s.titles], ['Certyfikaty', s.certificates], ['Notatki', s.notes]]} />
                <div className="row between" style={{ marginTop: 8 }}><small className="muted">Łączny koszt: <b>{fmtMoney(showCost(s))}</b></small><div className="row" style={{ gap: 6 }}><button className="btn secondary sm" onClick={() => setShareShow({ kind: 'Wynik z wystawy', title: `${dog!.name} · ${s.city}`, photo: dog!.photo ?? dog!.gallery?.[0], hashtags: ['wystawapsow', 'dogshow', (dog!.breed || 'psy').toLowerCase().replace(/[^a-ząćęłńóśźż]/g, ''), 'zkwp', 'fci', 'championship', 'dogpilot'], text: `🏆 ${dog!.pedigreeName || dog!.name} na wystawie: ${s.rank}, ${s.city} (${fmtDate(s.date)})\n\n${[s.dogClass, s.grade && `ocena ${s.grade.toLowerCase()}`, s.place && `${s.place}. lokata`, s.titles, s.certificates].filter(Boolean).join(' · ')}${s.judge ? `\nSędzia: ${s.judge}` : ''}\n\nDziękujemy za wspaniałą ocenę! 🐾` })}><Share2 size={14} /> Udostępnij</button><Link className="btn secondary sm" to={`/finanse?show=${s.id}`}>Koszty wystawy</Link></div></div>
              </Card>))}
          </>
        )}
        {sub === 'champ' && (
          <>
            <div className="grid cols-2">{champs.map(c => <div key={c.id} className="card row between"><div className="row"><Award size={20} style={{ color: 'var(--accent)' }} /><div><b>{c.country}</b><div className="muted">{c.title}</div></div></div><div><EditBtn onClick={() => setEditCh(c)} /><DelBtn onClick={() => confirmDel() && remove('championships', c.id)} /></div></div>)}</div>
            {champs.length === 0 && <Card><Empty>Brak championatów.</Empty></Card>}
            <div className="row no-print"><button className="btn" onClick={() => { if (!limits.canAddChampionship()) { toast('Plan FREE: maks. 6 championatów. Przejdź na PRO.'); return; } setEditCh({ id: uid(), dogId: dog!.id, country: 'Polska', title: 'Champion' }); }}><Plus size={18} /> Dodaj championat</button></div>
          </>
        )}
        {shareShow && <ShareComposer draft={shareShow} onClose={() => setShareShow(null)} />}
        {editShow && <ShowForm s={editShow} onClose={() => setEditShow(null)} onSave={s => { upsert('shows', s); setEditShow(null); toast('Zapisano'); }} />}
        {editCh && <Modal title="Championat" onClose={() => setEditCh(null)} actions={<><button className="btn secondary" onClick={() => setEditCh(null)}>Anuluj</button><button className="btn" onClick={() => { upsert('championships', editCh); setEditCh(null); }}>Zapisz</button></>}>
          <Field label="Kraj"><select value={editCh.country} onChange={e => setEditCh({ ...editCh, country: e.target.value })}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Tytuł"><select value={editCh.title} onChange={e => setEditCh({ ...editCh, title: e.target.value })}>{['Champion', 'Junior Champion', 'Interchampion', 'Veteran Champion', 'Grand Champion', 'Multi Champion', 'Zwycięzca Klubu', 'Inny'].map(c => <option key={c}>{c}</option>)}</select></Field>
        </Modal>}
      </div>
    );
  }

  function WeightTab() {
    const [edit, setEdit] = useState<Weight | null>(null);
    const ws = state.weights.filter(w => w.dogId === dog!.id).sort((a, b) => a.date.localeCompare(b.date));
    const data = ws.map(w => ({ d: fmtDate(w.date), kg: w.grams / 1000 }));
    return (
      <div className="stack">
        <div className="row no-print"><button className="btn" onClick={() => setEdit({ id: uid(), dogId: dog!.id, date: nowLocal(), grams: dog!.weightKg ? dog!.weightKg * 1000 : 0 })}><Plus size={18} /> Dodaj pomiar</button></div>
        <Card title="Krzywa wagi">
          {ws.length < 2 ? <div className="muted">Dodaj co najmniej dwa pomiary, aby zobaczyć wykres.</div> : (
            <div style={{ height: 220 }}><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} unit=" kg" /><Tooltip /><Line isAnimationActive={false} type="monotone" dataKey="kg" stroke="#32BF46" strokeWidth={2.5} dot={{ r: 4, fill: '#32BF46' }} /></LineChart></ResponsiveContainer></div>
          )}
          <div className="list" style={{ marginTop: 10 }}>{[...ws].reverse().map(w => <div key={w.id} className="list-item"><div><div className="title">{(w.grams / 1000).toFixed(2)} kg</div><small>{fmtDateTime(w.date)}</small></div><div><EditBtn onClick={() => setEdit(w)} /><DelBtn onClick={() => confirmDel() && remove('weights', w.id)} /></div></div>)}</div>
        </Card>
        {edit && <Modal title="Pomiar wagi" onClose={() => setEdit(null)} actions={<><button className="btn secondary" onClick={() => setEdit(null)}>Anuluj</button><button className="btn" disabled={!edit.grams} onClick={() => { upsert('weights', edit); upsert('dogs', { ...dog!, weightKg: edit.grams / 1000 }); setEdit(null); }}>Zapisz</button></>}>
          <Field label="Data i godzina"><input type="datetime-local" value={edit.date} onChange={e => setEdit({ ...edit, date: e.target.value })} /></Field>
          <Field label="Waga (kg)"><input type="number" step="0.01" value={edit.grams ? edit.grams / 1000 : ''} onChange={e => setEdit({ ...edit, grams: Math.round(Number(e.target.value) * 1000) })} /></Field>
        </Modal>}
      </div>
    );
  }

  function PedigreeTab() {
    const tree = buildPedigree(dog!, state.dogs, 3);
    const { coi, common } = coefficientOfInbreeding(dog!, state.dogs);
    const gen = (n: PedNode | undefined, depth: number): (PedNode | undefined)[] => depth === 0 ? [n] : [...gen(n?.father, depth - 1), ...gen(n?.mother, depth - 1)];
    const g1 = gen(tree, 1), g2 = gen(tree, 2), g3 = gen(tree, 3);
    return (
      <div className="stack">
        <Card title="Drzewo rodowodu (3 pokolenia)" icon={<GitBranch size={18} />}>
          <p className="muted">Psy z Twojej bazy są podświetlone i klikalne. Przodków spoza bazy wpisujesz w metryce psa jako nazwy rodowodowe.</p>
          <div className="ped">
            <div className="stack">{g1.map((n, i) => <div key={i} style={{ flex: 1, display: 'flex' }}><div style={{ flex: 1 }}><PedNodeBox n={n} lvl={1} /></div></div>)}</div>
            <div className="stack">{g2.map((n, i) => <PedNodeBox key={i} n={n} lvl={2} />)}</div>
            <div className="stack" style={{ gap: 4 }}>{g3.map((n, i) => <PedNodeBox key={i} n={n} lvl={3} />)}</div>
          </div>
          <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}><small className="muted">← rodzice · dziadkowie · pradziadkowie →</small><button className="btn sm secondary" onClick={() => setEditing(true)}>Uzupełnij rodziców</button></div>
        </Card>
        <Card title="Współczynnik inbredu (COI)" icon={<Heart size={18} />}>
          <div className="row" style={{ alignItems: 'baseline' }}><span style={{ fontSize: 34, fontWeight: 900, color: coi > 0.0625 ? 'var(--danger)' : 'var(--primary-600)' }}>{(coi * 100).toFixed(2)}%</span><span className="muted">liczony po przodkach znanych w bazie (do 5 pokoleń, metoda Wrighta)</span></div>
          {common.length === 0 ? <div className="muted">Brak wspólnych przodków w znanym rodowodzie. Uzupełnij rodowody obojga rodziców, aby wynik był miarodajny.</div> : <div className="list">{common.map(c => <div key={c.name} className="list-item"><span>{c.name}</span><b>+{(c.contribution * 100).toFixed(2)}%</b></div>)}</div>}
          <small className="muted">Orientacyjnie: poniżej 6,25% (kuzyni) uznaje się za niski, powyżej 12,5% (pół-rodzeństwo) za wysoki.</small>
        </Card>
      </div>
    );
  }

  function TimelineTab() {
    const events = useMemo(() => {
      const ev: { date: string; title: string; sub?: string; ico: ReactNode }[] = [];
      const I = (n: ReactNode) => <span style={{ color: 'var(--primary)', display: 'inline-grid', verticalAlign: -3, marginRight: 6 }}>{n}</span>;
      ev.push({ date: dog!.birthDate, title: 'Narodziny', ico: I(<Cake size={16} />) });
      state.health.filter(h => h.dogId === dog!.id).forEach(h => ev.push({ date: h.date, title: `${HEALTH_LABEL[h.kind]}: ${h.name}`, sub: h.vet, ico: I(<Syringe size={16} />) }));
      state.heats.filter(h => h.dogId === dog!.id).forEach(h => ev.push({ date: h.startDate, title: 'Cieczka', sub: h.endDate ? `do ${fmtDate(h.endDate)}` : undefined, ico: I(<Flower2 size={16} />) }));
      state.shows.filter(s => s.dogId === dog!.id).forEach(s => ev.push({ date: s.date, title: `Wystawa: ${s.country}, ${s.city}`, sub: [s.rank, s.grade, s.place ? `lokata ${s.place}` : '', s.titles, s.certificates].filter(Boolean).join(' · '), ico: I(<Trophy size={16} />) }));
      state.breedings.filter(b => b.femaleId === dog!.id).forEach(b => b.matings.forEach(m => ev.push({ date: m.date, title: `Krycie z ${b.maleName}`, sub: m.type === 'natural' ? 'naturalne' : 'inseminacja', ico: I(<Heart size={16} />) })));
      state.studMatings.filter(m => m.maleId === dog!.id).forEach(m => m.dates.forEach(d => ev.push({ date: d, title: `Krycie suki ${m.femaleName}`, ico: I(<Heart size={16} />) })));
      state.litters.filter(l => l.motherId === dog!.id || l.fatherId === dog!.id).forEach(l => ev.push({ date: l.birthDate, title: `Miot: ${l.name}`, sub: `${state.puppies.filter(p => p.litterId === l.id).length} szczeniąt`, ico: I(<PawPrint size={16} />) }));
      state.weights.filter(w => w.dogId === dog!.id).forEach(w => ev.push({ date: w.date.slice(0, 10), title: `Waga: ${(w.grams / 1000).toFixed(2)} kg`, ico: I(<Scale size={16} />) }));
      state.expenses.filter(e => e.dogId === dog!.id).forEach(e => ev.push({ date: e.date, title: `Wydatek: ${e.category}${e.type ? ` / ${e.type}` : ''}`, sub: fmtMoney(e.amount), ico: I(<Receipt size={16} />) }));
      return ev.sort((a, b) => b.date.localeCompare(a.date));
    }, []);
    return <Card title="Pełna historia"><div className="timeline">{events.map((e, i) => <div key={i} className="tl"><div className="row between"><b>{e.ico}{e.title}</b><small className="muted">{fmtDate(e.date)}</small></div>{e.sub && <small className="muted">{e.sub}</small>}</div>)}</div></Card>;
  }
}

export function HealthForm({ rec, onClose, onSave, pickDog }: { rec: HealthRecord; onClose: () => void; onSave: (r: HealthRecord) => void; pickDog?: boolean }) {
  const { state } = useStore();
  const [r, setR] = useState(rec);
  return (
    <Modal title="Wpis zdrowotny" onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!r.name.trim() || !r.date} onClick={() => onSave(r)}>Zapisz</button></>}>
      {pickDog && <Field label="Pies *"><select value={r.dogId ?? ''} onChange={e => setR({ ...r, dogId: e.target.value || undefined })}><option value="">— wybierz —</option>{state.dogs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.pedigreeName})</option>)}</select></Field>}
      <div className="form-grid">
        <Field label="Rodzaj"><select value={r.kind} onChange={e => setR({ ...r, kind: e.target.value as HealthKind })}>{(Object.keys(HEALTH_LABEL) as HealthKind[]).map(k => <option key={k} value={k}>{HEALTH_LABEL[k]}</option>)}</select></Field>
        <Field label="Nazwa / preparat *"><input value={r.name} onChange={e => setR({ ...r, name: e.target.value })} placeholder="np. Nobivac DHPPi" /></Field>
        <Field label="Data *"><input type="date" value={r.date} onChange={e => setR({ ...r, date: e.target.value })} /></Field>
        <Field label="Następny termin (przypomnienie)"><input type="date" value={r.nextDate ?? ''} onChange={e => setR({ ...r, nextDate: e.target.value || undefined })} /></Field>
        <Field label="Lekarz / lecznica"><input value={r.vet ?? ''} onChange={e => setR({ ...r, vet: e.target.value })} /></Field>
        <Field label="Wynik"><input value={r.result ?? ''} onChange={e => setR({ ...r, result: e.target.value })} /></Field>
      </div>
      <Field label="Notatki"><textarea value={r.notes ?? ''} onChange={e => setR({ ...r, notes: e.target.value })} /></Field>
    </Modal>
  );
}

function HeatSectionImpl({ dogId }: { dogId: string }) {
  const { state, upsert, remove, toast } = useStore();
  const [edit, setEdit] = useState<Heat | null>(null);
  const heats = state.heats.filter(h => h.dogId === dogId);
  const st = heatStats(heats);
  const t = today();
  return (
    <Card title="Cieczki i prognoza" icon={<Flower2 size={18} />} right={<button className="btn sm" onClick={() => setEdit({ id: uid(), dogId, startDate: t })}><Plus size={14} /> Cieczka</button>}>
      {st ? (
        <div className="stack">
          <div className="card soft" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, textAlign: 'center' }}>
            <div><div className="muted">Następna (ok.)</div><b style={{ fontSize: 17, color: 'var(--primary-600)' }}>{fmtDate(st.next)}</b></div>
            <div><div className="muted">Okno</div><b>{fmtDate(st.nextFrom)} – {fmtDate(st.nextTo)}</b></div>
            <div><div className="muted">Cykl</div><b>{`${st.avgInterval} dni${st.estimated ? ' (szac.)' : ''}`}</b></div>
          </div>
          <div className="muted">Orientacyjne dni płodne przy następnej cieczce: {fmtDate(st.fertileFrom)} – {fmtDate(st.fertileTo)} (9.–15. dzień). Średnia długość cieczki: {st.avgLength} dni. Potwierdzaj progesteronem.</div>
          <div className="list">{[...st.sorted].reverse().map(h => <div key={h.id} className="list-item"><div><div className="title">{fmtDate(h.startDate)}{h.endDate ? ` – ${fmtDate(h.endDate)}` : ' (trwa)'}</div><small>{h.notes}</small></div><div><EditBtn onClick={() => setEdit(h)} /><DelBtn onClick={() => confirmDel() && remove('heats', h.id)} /></div></div>)}</div>
        </div>
      ) : <div className="muted">Zapisz pierwszą cieczkę, a aplikacja zacznie prognozować kolejne i podpowie okno krycia.</div>}
      {edit && <Modal title="Cieczka" onClose={() => setEdit(null)} actions={<><button className="btn secondary" onClick={() => setEdit(null)}>Anuluj</button><button className="btn" disabled={!edit.startDate} onClick={() => { upsert('heats', edit); setEdit(null); toast('Zapisano'); }}>Zapisz</button></>}>
        <div className="form-grid"><Field label="Początek *"><input type="date" value={edit.startDate} onChange={e => setEdit({ ...edit, startDate: e.target.value })} /></Field><Field label="Koniec"><input type="date" value={edit.endDate ?? ''} onChange={e => setEdit({ ...edit, endDate: e.target.value || undefined })} /></Field></div>
        <Field label="Notatki"><textarea value={edit.notes ?? ''} onChange={e => setEdit({ ...edit, notes: e.target.value })} placeholder="np. progesteron, krycie, objawy" /></Field>
      </Modal>}
    </Card>
  );
}

function PedNodeBox({ n, lvl }: { n?: PedNode; lvl: number }) {
  if (!n) return <div className="node" style={{ opacity: .5 }}>brak danych</div>;
  const inner = n.dog ? <Link to={`/psy/${n.dog.id}`} style={{ color: 'inherit' }}><b>{n.name}</b><div className="muted" style={{ fontSize: 11 }}>{n.dog.breed} · {n.dog.sex === 'male' ? 'pies' : 'suka'}</div></Link> : <><b>{n.name}</b><div className="muted" style={{ fontSize: 11 }}>{lvl === 1 ? 'spoza bazy' : ''}</div></>;
  return <div className={`node ${n.dog ? 'known' : ''}`}>{inner}</div>;
}

function BreedingForm({ b, onClose, onSave }: { b: Breeding; onClose: () => void; onSave: (b: Breeding) => void }) {
  const { state } = useStore();
  const [x, setX] = useState(b);
  const males = state.dogs.filter(d => d.sex === 'male');
  const listEditor = (label: string, key: 'usg' | 'progesterone' | 'rtg', placeholder: string) => (
    <Card title={label} className="soft" right={<button className="btn sm secondary" onClick={() => setX({ ...x, [key]: [...x[key], { date: today(), value: '' }] })}>+ Dodaj</button>}>
      {x[key].length === 0 && <div className="muted">Brak wpisów.</div>}
      {x[key].map((v, i) => <div key={i} className="row" style={{ marginBottom: 6 }}><input type="date" value={v.date} onChange={e => setX({ ...x, [key]: x[key].map((o, j) => j === i ? { ...o, date: e.target.value } : o) })} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} /><input value={v.value} placeholder={placeholder} onChange={e => setX({ ...x, [key]: x[key].map((o, j) => j === i ? { ...o, value: e.target.value } : o) })} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} /><DelBtn onClick={() => setX({ ...x, [key]: x[key].filter((_, j) => j !== i) })} /></div>)}
    </Card>
  );
  return (
    <Modal title="Plan krycia" onClose={onClose} wide actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!x.maleName.trim() || x.matings.length === 0} onClick={() => onSave(x)}>Zapisz</button></>}>
      <div className="form-grid">
        <Field label="Reproduktor z moich psów"><select value={x.maleId ?? ''} onChange={e => { const m = males.find(d => d.id === e.target.value); setX({ ...x, maleId: m?.id, maleName: m ? `${m.name} (${m.pedigreeName})` : x.maleName }); }}><option value="">— inny / zewnętrzny —</option>{males.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Reproduktor (nazwa) *"><input value={x.maleName} onChange={e => setX({ ...x, maleName: e.target.value })} /></Field>
        <Field label="Hodowla reproduktora"><input value={x.maleKennel ?? ''} onChange={e => setX({ ...x, maleKennel: e.target.value })} /></Field>
        <Field label="Data rozpoczęcia cieczki"><input type="date" value={x.heatStartDate ?? ''} onChange={e => setX({ ...x, heatStartDate: e.target.value || undefined })} /></Field>
      </div>
      <Card title="Krycia" className="soft" right={<button className="btn sm secondary" onClick={() => setX({ ...x, matings: [...x.matings, { date: today(), type: 'natural', tie: true }] })}>+ + Kolejna data krycia</button>}>
        {x.matings.map((m, i) => <div key={i} className="row" style={{ marginBottom: 6 }}>
          <input type="date" value={m.date} onChange={e => setX({ ...x, matings: x.matings.map((o, j) => j === i ? { ...o, date: e.target.value } : o) })} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }} />
          <select value={m.type} onChange={e => setX({ ...x, matings: x.matings.map((o, j) => j === i ? { ...o, type: e.target.value as 'natural' | 'insemination' } : o) })} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}><option value="natural">Naturalne</option><option value="insemination">Inseminacja</option></select>
          <label className="row"><input type="checkbox" checked={!!m.tie} onChange={e => setX({ ...x, matings: x.matings.map((o, j) => j === i ? { ...o, tie: e.target.checked } : o) })} /> zakleszczenie</label>
          <DelBtn onClick={() => setX({ ...x, matings: x.matings.filter((_, j) => j !== i) })} />
        </div>)}
      </Card>
      {listEditor('Progesteron', 'progesterone', 'np. 5,8 ng/ml')}
      {listEditor('Badania USG', 'usg', 'np. ciąża potwierdzona, 5–6 płodów')}
      {listEditor('Badania RTG', 'rtg', 'np. 6 szczeniąt')}
      <Field label="Notatki"><textarea value={x.notes ?? ''} onChange={e => setX({ ...x, notes: e.target.value })} /></Field>
    </Modal>
  );
}

function StudForm({ m, onClose, onSave }: { m: StudMating; onClose: () => void; onSave: (m: StudMating) => void }) {
  const [x, setX] = useState(m);
  return (
    <Modal title="Krycie" onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!x.femaleName.trim()} onClick={() => onSave(x)}>Zapisz</button></>}>
      <div className="form-grid">
        <Field label="Miejsce krycia *"><select value={x.place} onChange={e => setX({ ...x, place: e.target.value as 'kennel' | 'external' })}><option value="kennel">Krycie w hodowli</option><option value="external">Krycie zewnętrzne</option></select></Field>
        <Field label="Imię suki *"><input value={x.femaleName} onChange={e => setX({ ...x, femaleName: e.target.value })} /></Field>
        <Field label="Imię właściciela"><input value={x.ownerFirst} onChange={e => setX({ ...x, ownerFirst: e.target.value })} /></Field>
        <Field label="Nazwisko właściciela"><input value={x.ownerLast} onChange={e => setX({ ...x, ownerLast: e.target.value })} /></Field>
        <Field label="Liczba szczeniąt"><input type="number" value={x.puppiesCount ?? ''} onChange={e => setX({ ...x, puppiesCount: e.target.value ? Number(e.target.value) : undefined })} /></Field>
        <Field label="Rodzaj krycia *"><select value={x.type} onChange={e => setX({ ...x, type: e.target.value as 'natural' | 'insemination' })}><option value="natural">Naturalne</option><option value="insemination">Inseminacja</option></select></Field>
        <Field label="Zawiązanie (tak/nie)"><select value={x.tie ? '1' : '0'} onChange={e => setX({ ...x, tie: e.target.value === '1' })}><option value="1">Tak</option><option value="0">Nie</option></select></Field>
      </div>
      <Field label="Daty krycia">{x.dates.map((d, i) => <div key={i} className="row" style={{ marginBottom: 6 }}><input type="date" value={d} onChange={e => setX({ ...x, dates: x.dates.map((o, j) => j === i ? e.target.value : o) })} /><DelBtn onClick={() => setX({ ...x, dates: x.dates.filter((_, j) => j !== i) })} /></div>)}<button className="btn secondary sm" onClick={() => setX({ ...x, dates: [...x.dates, today()] })}>+ Dodaj datę</button></Field>
      <Field label="Notatki"><textarea value={x.notes ?? ''} onChange={e => setX({ ...x, notes: e.target.value })} /></Field>
    </Modal>
  );
}

function ShowForm({ s, onClose, onSave }: { s: Show; onClose: () => void; onSave: (s: Show) => void }) {
  const [x, setX] = useState(s);
  const toggle = (key: 'titles' | 'certificates', v: string) => { const cur = (x[key] ?? '').split(',').map(t => t.trim()).filter(Boolean); setX({ ...x, [key]: (cur.includes(v) ? cur.filter(c => c !== v) : [...cur, v]).join(', ') }); };
  const has = (key: 'titles' | 'certificates', v: string) => (x[key] ?? '').split(',').map(t => t.trim()).includes(v);
  return (
    <Modal title="Wystawa" onClose={onClose} wide actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!x.city.trim() || !x.date} onClick={() => onSave(x)}>Zapisz</button></>}>
      <h3>Podstawowe informacje</h3>
      <div className="form-grid">
        <Field label="Kraj *"><select value={x.country} onChange={e => setX({ ...x, country: e.target.value })}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Miejscowość *"><input value={x.city} onChange={e => setX({ ...x, city: e.target.value })} /></Field>
        <Field label="Ranga wystawy *"><select value={x.rank} onChange={e => setX({ ...x, rank: e.target.value })}>{SHOW_RANKS.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Data wystawy *"><input type="date" value={x.date} onChange={e => setX({ ...x, date: e.target.value })} /></Field>
      </div>
      <h3>Szczegóły</h3>
      <div className="form-grid">
        <Field label="Klasa *"><select value={x.dogClass} onChange={e => setX({ ...x, dogClass: e.target.value })}>{SHOW_CLASSES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Nr katalogowy"><input value={x.catalogNo ?? ''} onChange={e => setX({ ...x, catalogNo: e.target.value })} /></Field>
        <Field label="Ocena"><select value={x.grade ?? ''} onChange={e => setX({ ...x, grade: e.target.value })}><option value="">—</option>{SHOW_GRADES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Lokata"><select value={x.place ?? ''} onChange={e => setX({ ...x, place: e.target.value })}><option value="">—</option>{['1', '2', '3', '4', 'bez lokaty'].map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Sędzia"><input value={x.judge ?? ''} onChange={e => setX({ ...x, judge: e.target.value })} /></Field>
      </div>
      <Field label="Certyfikaty / wnioski"><div className="chips">{SHOW_CERTS.map(c => <button type="button" key={c} className={`chip ${has('certificates', c) ? 'on' : ''}`} onClick={() => toggle('certificates', c)}>{c}</button>)}</div></Field>
      <Field label="Tytuły"><div className="chips">{SHOW_TITLES.map(c => <button type="button" key={c} className={`chip ${has('titles', c) ? 'on' : ''}`} onClick={() => toggle('titles', c)}>{c}</button>)}</div></Field>
      <Field label="Notatki"><textarea value={x.notes ?? ''} onChange={e => setX({ ...x, notes: e.target.value })} /></Field>
    </Modal>
  );
}
