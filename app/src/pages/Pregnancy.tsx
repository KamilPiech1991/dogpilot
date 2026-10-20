import { useState } from 'react';
import { Calendar, Heart, Check, Baby, Dog, Lightbulb } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../app/store';
import { Card, Empty } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { pregnancyInfo, PREGNANCY_WEEKS } from '../app/pregnancy';
import { fmtDate, fmtDateLong, today } from '../app/format';

export default function Pregnancy() {
  const { id } = useParams();
  const { state, upsert, toast } = useStore();
  const nav = useNavigate();
  const b = state.breedings.find(x => x.id === id);
  const female = state.dogs.find(d => d.id === b?.femaleId);
  const [selWeek, setSelWeek] = useState<number | null>(null);
  if (!b || !female) return <Card><Empty>Nie znaleziono skojarzenia.</Empty></Card>;
  const first = [...b.matings].sort((x, y) => x.date.localeCompare(y.date))[0];
  const info = pregnancyInfo(first.date);
  const week = selWeek ?? info.week;
  const w = PREGNANCY_WEEKS[week - 1];
  const t = today();
  const done = (key: 'usg' | 'rtg') => b[key].length > 0;
  const markDone = (key: 'usg' | 'rtg') => { if (done(key)) return; upsert('breedings', { ...b, [key]: [...b[key], { date: t, value: key === 'usg' ? 'wykonano' : 'wykonano' }] }); toast(key === 'usg' ? 'USG oznaczone jako wykonane' : 'RTG oznaczone jako wykonane'); };
  return (
    <div className="stack">
      <ArtHeader tone="rose" icon={<Heart size={24} />} photo={female.photo ?? null} back={() => nav(`/psy/${female.id}?tab=breeding`)} title="Monitor ciąży" sub={<>{female.name} ({female.pedigreeName})</>} />
      <Card title="Liczymy od">
        <div className="card soft"><small className="muted">Na podstawie planu krycia</small><div><b>Krycie:</b> {fmtDateLong(first.date)}</div><div><b>Reproduktor:</b> {b.maleName}</div></div>
        <Link className="btn secondary sm" to={`/psy/${female.id}?tab=breeding`} style={{ marginTop: 8 }}><Calendar size={14} /> Inna data krycia</Link>
      </Card>
      <div className="hero">
        <div className="row"><div className="avatar" style={{ width: 56, height: 56, background: 'rgba(255,255,255,.18)', color: '#fff' }}><Heart size={28} /></div><div><div style={{ fontSize: 24, fontWeight: 800 }}>{`${info.day}. dzień ciąży`}</div><div className="muted">{`${info.week}. tydzień`}</div></div></div>
        <div className="progress" style={{ margin: '14px 0 6px', background: 'rgba(255,255,255,.25)' }}><div style={{ width: `${info.progress}%`, background: '#fff' }} /></div>
        <div className="row between muted" style={{ fontSize: 12 }}><span>Krycie</span><span>63. dzień</span></div>
        <div style={{ marginTop: 14 }}><div className="muted">Spodziewany poród</div><div style={{ fontSize: 22, fontWeight: 800 }}>{fmtDateLong(info.expected)}</div><div className="muted">{info.remaining > 0 ? `Do porodu zostało około ${info.remaining} dni` : info.remaining === 0 ? 'To dziś!' : `${-info.remaining} dni po przewidywanym terminie`}</div></div>
      </div>
      <Card title="Kluczowe daty">
        <div className="list">
          <div className="list-item"><div><small className="muted">Kiedy zrobić USG</small><div className="title">{fmtDate(info.usgFrom)} – {fmtDate(info.usgTo)}</div><small>około 25.–30. dnia</small></div><button className={`btn sm ${done('usg') ? 'secondary' : ''}`} onClick={() => markDone('usg')}>{done('usg') ? <><Check size={14} /> {fmtDate(b.usg[0].date)}</> : 'Oznacz wykonane'}</button></div>
          <div className="list-item"><div><small className="muted">Kiedy zrobić RTG</small><div className="title">od {fmtDate(info.rtgFrom)}</div><small>zwykle od około 45. dnia; liczba szczeniąt najdokładniej po 55. dniu</small></div><button className={`btn sm ${done('rtg') ? 'secondary' : ''}`} onClick={() => markDone('rtg')}>{done('rtg') ? <><Check size={14} /> {fmtDate(b.rtg[0].date)}</> : 'Oznacz wykonane'}</button></div>
          <div className="list-item"><div><small className="muted">Czas czuwania</small><div className="title">{fmtDate(info.observeFrom)}</div><small>58. dzień ciąży</small></div></div>
          <div className="list-item"><div><small className="muted">Okno porodu</small><div className="title">{fmtDate(info.birthFrom)} – {fmtDate(info.birthTo)}</div><small>58.–68. dzień od krycia</small></div></div>
        </div>
      </Card>
      <div className="tabs">{PREGNANCY_WEEKS.map(x => <button key={x.week} className={x.week === week ? 'active' : ''} onClick={() => setSelWeek(x.week)}>{x.week}. tydz.</button>)}</div>
      <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'var(--primary-soft)' }}><div className="row"><div className="avatar" style={{ width: 48, height: 48, background: 'var(--primary)', color: '#fff', fontSize: 20, fontWeight: 800 }}>{w.week}</div><div><small className="muted" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{`Tydzień ${w.week}`}</small><div style={{ fontSize: 18, fontWeight: 700 }}>{w.title}</div><small className="muted">{w.days}</small></div></div></div>
      <Card title="Co rośnie w brzuchu" icon={<Baby size={18} />}>{w.development}</Card>
      <Card title="Samopoczucie suki" icon={<Dog size={18} />}>{w.female}</Card>
      <Card title="Do zrobienia w tym tygodniu" icon={<Lightbulb size={18} />}>{w.tips}</Card>
      <Card title="Etapy ciąży">
        <div className="timeline">{info.timeline.map(e => <div key={e.title} className={`tl ${e.date > t ? 'future' : ''}`}><div className="row between"><b style={{ color: e.date > t ? 'var(--muted)' : 'var(--primary-600)' }}>{e.title}</b><small className="muted">{fmtDate(e.date)}</small></div><small className="muted">{`${e.desc} · ${e.day}. dzień ciąży`}</small></div>)}</div>
      </Card>
      <p className="muted" style={{ fontSize: 12 }}>Terminy są orientacyjne i liczone od pierwszego krycia. Ciąża liczona od owulacji trwa ok. 62–64 dni. W sprawach zdrowia konsultuj się z lekarzem weterynarii.</p>
    </div>
  );
}
