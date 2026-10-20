import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronUp, ChevronDown, Pencil, Plus, Copy, Printer, Globe, Syringe, Scale, PawPrint } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../app/store';
import { Card, Chips, Empty, Field, KV, Modal, Tabs, confirmDel, sexLabel, EditBtn, DelBtn } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { fmtDate, fmtDateTime, fmtMoney, nowLocal, today, uid } from '../app/format';
import { CHARACTER_TAGS, HEALTH_LABEL, type HealthRecord, type Puppy, type PuppyOwner, type Weight } from '../app/types';
import { buildPawIdPayload, encodePawId } from '../app/pawid';
import { PuppyForm, useRemovePuppy } from './LitterDetail';
import { HealthForm } from './DogProfile';

type Tab = 'card' | 'weights' | 'health' | 'owner' | 'pawid' | 'pack';

export default function PuppyDetail() {
  const { id } = useParams();
  const { state, upsert, remove, toast } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'card';
  const puppy = state.puppies.find(p => p.id === id);
  const litter = state.litters.find(l => l.id === puppy?.litterId);
  const removePuppy = useRemovePuppy();
  const [editing, setEditing] = useState(false);
  const [editW, setEditW] = useState<Weight | null>(null);
  const [editH, setEditH] = useState<HealthRecord | null>(null);
  const [showQr, setShowQr] = useState(false);
  if (!puppy || !litter) return <Card><Empty>Nie znaleziono szczenięcia. <Link to="/mioty">Wróć</Link></Empty></Card>;
  const weights = state.weights.filter(w => w.puppyId === puppy.id).sort((a, b) => a.date.localeCompare(b.date));
  const health = state.health.filter(h => h.puppyId === puppy.id).sort((a, b) => b.date.localeCompare(a.date));
  const payload = buildPawIdPayload(state, puppy);
  const code = encodePawId(payload);
  const mother = state.dogs.find(d => d.id === litter.motherId);

  return (
    <div>
      <ArtHeader tone="custom" style={{ background: `linear-gradient(135deg, ${puppy.markerColor} 0%, #1B2A22 150%)` }} icon={<PawPrint size={24} />} photo={puppy.photo ?? null} back={() => nav(`/mioty/${litter.id}`)} title={puppy.name} sub={<>{litter.name} · {sexLabel(puppy.sex)} · ur. {fmtDateTime(puppy.birthDateTime)}</>} actions={<><button className="btn secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edytuj</button><button className="btn danger" onClick={() => removePuppy(puppy.id) && nav(`/mioty/${litter.id}`)}>Usuń</button></>} />
      <Tabs value={tab} onChange={t => setParams({ tab: t })} items={[{ key: 'card', label: 'Dane' }, { key: 'weights', label: 'Wagi' }, { key: 'health', label: 'Zdrowie' }, { key: 'owner', label: 'Nabywca i cena' }, { key: 'pawid', label: 'Karta przekazania' }, { key: 'pack', label: 'Nowy dom' }]} />

      {tab === 'card' && <div className="stack">
        <Card title="Podstawowe informacje"><KV items={[['Imię', puppy.name], ['Data urodzenia', fmtDateTime(puppy.birthDateTime)], ['Płeć', sexLabel(puppy.sex)], ['Umaszczenie', puppy.color], ['Waga ur. (g)', puppy.birthWeightG], ['Status urodzenia', puppy.birthStatus === 'alive' ? 'Żywy' : puppy.birthStatus === 'stillborn' ? 'Martwo urodzony' : 'Padł']]} /></Card>
        <Card title="Rodzice"><KV items={[['Ojciec', litter.fatherName], ['Matka', litter.motherName], ['Rasa', mother?.breed]]} /></Card>
        <Card title="Dane identyfikacyjne"><KV items={[['Numer rodowodu', puppy.pedigreeNo], ['Numer chip', puppy.chip], ['Nr karty', puppy.pawId], ['Kolor obróżki', <span key="tag" style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 9, background: puppy.markerColor, verticalAlign: 'middle' }} />]]} /></Card>
      </div>}

      {tab === 'weights' && <div className="stack">
        <div className="row no-print"><button className="btn" onClick={() => setEditW({ id: uid(), puppyId: puppy.id, date: nowLocal(), grams: weights[weights.length - 1]?.grams ?? puppy.birthWeightG ?? 0 })}><Plus size={18} /> Dodaj pomiar</button></div>
        <Card title="Krzywa wagi">
          {weights.length >= 2 && <div style={{ height: 220 }}><ResponsiveContainer><LineChart data={weights.map(w => ({ d: fmtDate(w.date), g: w.grams }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} unit=" g" domain={['auto', 'auto']} /><Tooltip /><Line isAnimationActive={false} type="monotone" dataKey="g" stroke={puppy.markerColor} strokeWidth={2} /></LineChart></ResponsiveContainer></div>}
          <div className="list" style={{ marginTop: 10 }}>{[...weights].reverse().map((w, i, arr) => { const prev = arr[i + 1]; return <div key={w.id} className="list-item" style={{ borderLeft: `4px solid ${puppy.markerColor}` }}><div><div className="title">{w.grams} g {prev && <small style={{ color: w.grams - prev.grams >= 0 ? 'var(--success)' : 'var(--danger)' }}>({w.grams - prev.grams >= 0 ? '+' : ''}{w.grams - prev.grams} g)</small>}</div><small>{fmtDateTime(w.date)}</small></div><div><EditBtn onClick={() => setEditW(w)} /><DelBtn onClick={() => confirmDel() && remove('weights', w.id)} /></div></div>; })}</div>
          {weights.length === 0 && <Empty icon={<Scale size={28} />}>Brak pomiarów.</Empty>}
        </Card>
      </div>}

      {tab === 'health' && <div className="stack">
        <div className="row no-print"><button className="btn" onClick={() => setEditH({ id: uid(), puppyId: puppy.id, kind: 'deworming', date: today(), name: '' })}><Plus size={18} /> Dodaj wpis</button></div>
        <Card title="Profilaktyka szczeniąt">
          {health.length === 0 ? <Empty icon={<Syringe size={28} />}>Brak wpisów. Dodaj odrobaczenie lub szczepienie.</Empty> : <div className="list">{health.map(h => <div key={h.id} className="list-item"><div><div className="title">{HEALTH_LABEL[h.kind]}: {h.name}</div><small>{fmtDate(h.date)}{h.nextDate ? ` · następne: ${fmtDate(h.nextDate)}` : ''}{h.vet ? ` · ${h.vet}` : ''}</small></div><div><EditBtn onClick={() => setEditH(h)} /><DelBtn onClick={() => confirmDel() && remove('health', h.id)} /></div></div>)}</div>}
        </Card>
      </div>}

      {tab === 'owner' && <OwnerTab />}

      {tab === 'pawid' && <div className="stack">
        <div className="pawid" onClick={() => setShowQr(s => !s)} style={{ cursor: 'pointer' }}>
          {!showQr ? (<>
            <div className="row between"><div><small style={{ opacity: .8, display: 'flex', alignItems: 'center', gap: 6 }}>{state.profile.logo && <img className="kennel-logo" src={state.profile.logo} alt="" style={{ width: 22, height: 22, background: '#fff' }} />}Szczenię z hodowli{state.profile.kennelName ? ` ${state.profile.kennelName}` : ''}</small><h2 style={{ color: '#fff', fontSize: 26 }}>{puppy.name}</h2></div>{puppy.photo ? <div className="art-photo" style={{ width: 64, height: 64, borderRadius: 20 }}><img src={puppy.photo} alt="" /></div> : <PawPrint size={44} style={{ opacity: .4 }} />}</div>
            <KV items={[['Nazwa miotu', litter.name], ['Rasa', mother?.breed], ['Data i godzina ur.', fmtDateTime(puppy.birthDateTime)], ['Płeć', sexLabel(puppy.sex)], ['Umaszczenie', puppy.color], ['Waga ur. (g)', puppy.birthWeightG], ['Ojciec', litter.fatherName], ['Matka', litter.motherName], ['Numer rodowodu', puppy.pedigreeNo], ['Numer chipa', puppy.chip], ['Szczepienia', payload.vacc.map(v => `${v.n} ${fmtDate(v.d)}`).join(', ') || '—'], ['Odrobaczenia', payload.deworm.map(v => `${v.n} ${fmtDate(v.d)}`).join(', ') || '—']]} />
            <div className="row between" style={{ marginTop: 14 }}><div><small style={{ opacity: .8 }}>NR KARTY</small><div style={{ fontWeight: 800, fontSize: 18 }}>{puppy.pawId}</div></div><div style={{ textAlign: 'right' }}><small style={{ opacity: .8 }}>OBRÓŻKA</small><div style={{ width: 24, height: 24, borderRadius: 12, background: puppy.markerColor, marginLeft: 'auto', border: '2px solid #fff' }} /></div></div>
          </>) : (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, textAlign: 'center', color: 'var(--text)' }}>
              <h3 style={{ color: 'var(--primary-600)' }}>{puppy.name}</h3><small className="muted">Nowy opiekun skanuje ten kod w Dogpilot</small>
              <div style={{ margin: '12px auto' }}><QRCodeSVG value={code} size={240} level="L" includeMargin /></div>
              <small className="muted">Po zeskanowaniu nowy opiekun dostaje gotowy profil: wagi, profilaktykę i pakiet na nowy dom.</small>
              {puppy.chip && <div className="muted" style={{ marginTop: 6 }}>Chip: {puppy.chip}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, color: 'var(--primary-600)', fontWeight: 700 }}><img src={`${import.meta.env.BASE_URL}brand/wordmark.png`} alt="dogpilot" style={{ height: 18 }} /> · karta przekazania</div>
            </div>
          )}
        </div>
        <div className="muted" style={{ textAlign: 'center' }}>Kliknij kartę, żeby ją odwrócić i {showQr ? 'wrócić do danych' : 'pokazać kod QR'}.</div>
        <div className="row no-print" style={{ justifyContent: 'center' }}><button className="btn secondary" onClick={() => { navigator.clipboard?.writeText(code); toast('Kod przekazania skopiowany do schowka'); }}><Copy size={16} /> Kopiuj kod</button><button className="btn secondary" onClick={() => window.print()}><Printer size={16} /> Drukuj kartę</button><a className="btn" href={`#/portal/${puppy.id}`} target="_blank" rel="noreferrer"><Globe size={16} /> Strona dla nabywcy</a></div>
        <Card title="Strona dla nabywcy" icon={<Globe size={18} />}><p className="muted">Link, który wysyłasz przyszłemu właścicielowi: widzi zdjęcie, aktualną wagę, postępy i odliczanie do odbioru. Buduje zaufanie i oszczędza pytania.</p><div className="row"><code style={{ background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 8, fontSize: 12, wordBreak: 'break-all' }}>{window.location.origin}{window.location.pathname}#/portal/{puppy.id}</code><button className="btn sm secondary" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#/portal/${puppy.id}`); toast('Link skopiowany'); }}><Copy size={14} /> Kopiuj link</button></div></Card>
        <small className="muted">Cena sprzedaży, prywatne notatki i dane właścicieli NIE trafiają na kartę przekazania.</small>
      </div>}

      {tab === 'pack' && <PackTab />}

      {editing && <PuppyForm initial={puppy} litterId={litter.id} index={0} onClose={() => setEditing(false)} onSave={p => { upsert('puppies', p); setEditing(false); toast('Zapisano'); }} />}
      {editW && <Modal title="Pomiar wagi" onClose={() => setEditW(null)} actions={<><button className="btn secondary" onClick={() => setEditW(null)}>Anuluj</button><button className="btn" disabled={!editW.grams} onClick={() => { upsert('weights', editW); setEditW(null); }}>Zapisz</button></>}><Field label="Data i godzina"><input type="datetime-local" value={editW.date} onChange={e => setEditW({ ...editW, date: e.target.value })} /></Field><Field label="Waga (g)"><input type="number" value={editW.grams || ''} onChange={e => setEditW({ ...editW, grams: Number(e.target.value) })} /></Field></Modal>}
      {editH && <HealthForm rec={editH} onClose={() => setEditH(null)} onSave={r => { upsert('health', r); setEditH(null); toast('Zapisano'); }} />}
    </div>
  );

  function OwnerTab() {
    const [p, setP] = useState<Puppy>(puppy!);
    const [showPriv, setShowPriv] = useState(true);
    const setOwner = (i: number, patch: Partial<PuppyOwner>) => setP({ ...p, owners: p.owners.map((o, j) => j === i ? { ...o, ...patch } : o) });
    return (
      <div className="stack">
        <Card title="Sprzedaż i notatki prywatne" right={<button className="icon-btn" onClick={() => setShowPriv(s => !s)}>{showPriv ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>}>
          <small className="muted">Cena sprzedaży i prywatne informacje – tylko dla hodowcy.</small>
          {showPriv && <div className="form-grid" style={{ marginTop: 8 }}>
            <Field label="Cena sprzedaży (PLN)"><input type="number" value={p.price ?? ''} onChange={e => setP({ ...p, price: e.target.value ? Number(e.target.value) : undefined })} /></Field>
            <Field label="Data przekazania szczenięcia"><input type="date" value={p.handoverDate ?? ''} onChange={e => setP({ ...p, handoverDate: e.target.value || undefined })} /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Prywatne notatki"><textarea value={p.privateNotes ?? ''} onChange={e => setP({ ...p, privateNotes: e.target.value })} /></Field></div>
          </div>}
          {p.price && <div className="badge">Cena: {fmtMoney(p.price)}</div>}
        </Card>
        <Card title="Nabywca" right={<span className="badge gray">{p.owners.length === 0 ? 'brak' : `${p.owners.length} ${p.owners.length === 1 ? 'właściciel' : 'właścicieli'}`}</span>}>
          {p.owners.map((o, i) => <div key={i} className="card soft" style={{ marginBottom: 8 }}>
            <div className="row between"><b>Właściciel {i + 1}</b><DelBtn onClick={() => setP({ ...p, owners: p.owners.filter((_, j) => j !== i) })} /></div>
            <div className="form-grid">
              <Field label="Imię i nazwisko"><input value={o.name} onChange={e => setOwner(i, { name: e.target.value })} /></Field>
              <Field label="Adres"><input value={o.address ?? ''} onChange={e => setOwner(i, { address: e.target.value })} /></Field>
              <Field label="Adres e-mail"><input value={o.email ?? ''} onChange={e => setOwner(i, { email: e.target.value })} /></Field>
              <Field label="Numer telefonu"><input value={o.phone ?? ''} onChange={e => setOwner(i, { phone: e.target.value })} /></Field>
            </div>
          </div>)}
          {p.owners.length < 2 && <button className="btn secondary sm" onClick={() => setP({ ...p, owners: [...p.owners, { name: '' }] })}>+ Właściciel {p.owners.length + 1}</button>}
        </Card>
        <button className="btn" onClick={() => { upsert('puppies', p); toast('Zapisano'); }}>Zapisz</button>
      </div>
    );
  }

  function PackTab() {
    const [p, setP] = useState<Puppy>(puppy!);
    return (
      <div className="stack">
        <Card title={`O szczenięciu: ${puppy!.name}`}>
          <h3>Charakter</h3><Chips options={CHARACTER_TAGS} value={p.character} onChange={v => setP({ ...p, character: v })} />
          <Field label="Opis od hodowcy"><textarea value={p.aboutText ?? ''} onChange={e => setP({ ...p, aboutText: e.target.value })} placeholder="np. Wulkan energii :) Zalecam co najmniej 1 dłuższy spacer dziennie." /></Field>
          <button className="btn" onClick={() => { upsert('puppies', p); toast('Zapisano'); }}>Zapisz</button>
        </Card>
        <Card title="Dla całego miotu"><p className="muted">Żywienie, suplementacja, pielęgnacja i pierwsze dni – edytujesz je w metryce miotu.</p><KV items={[['Karma', [litter!.pack.foodBrand, litter!.pack.foodName].filter(Boolean).join(' ') || '—'], ['Porcja', litter!.pack.portion], ['Posiłki', litter!.pack.mealsPerDay ? `${litter!.pack.mealsPerDay}× dziennie (${litter!.pack.feedingHours ?? ''})` : '—'], ['Oswojone z', litter!.pack.accustomed.join(', ') || '—']]} /><Link className="btn secondary sm" to={`/mioty/${litter!.id}`} style={{ marginTop: 8 }}>Edytuj w metryce miotu</Link></Card>
      </div>
    );
  }
}
