import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dog as DogIcon, Syringe, Heart, Trophy, Scale, Clock, Plus, Flower2, QrCode } from 'lucide-react';
import { useStore } from '../app/store';
import { Card, Empty, ProBadge, sexIcon } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { Dog as ArtIcon } from 'lucide-react';
import { ageText } from '../app/format';
import { FREE_LIMITS } from '../app/types';
import { HealthForm } from './DogProfile';
import { uid, today } from '../app/format';

export default function Dogs() {
  const { state, upsert, limits, toast } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const sexFilter = params.get('sex');
  const [compact, setCompact] = useState(false);
  const [healthFor, setHealthFor] = useState<string | null>(null);
  useEffect(() => { if (params.get('add')) { nav(`/psy/nowy${sexFilter ? `?sex=${sexFilter}` : ''}`, { replace: true }); return; } if (params.get('health')) { setHealthFor(state.dogs[0]?.id ?? ''); setParams({}); } }, [params, setParams, state.dogs, nav, sexFilter]);
  const dogs = state.dogs.filter(d => !sexFilter || d.sex === sexFilter).sort((a, b) => a.name.localeCompare(b.name));
  const breeder = state.profile.module === 'breeder';
  const females = state.dogs.filter(d => d.sex === 'female').length, males = state.dogs.filter(d => d.sex === 'male').length;
  const nearLimit = !limits.isPro && (females >= FREE_LIMITS.females || males >= FREE_LIMITS.males);

  return (
    <div>
      <ArtHeader compact tone="green" icon={<ArtIcon size={24} />} title="Psy" sub={`${females} ${females === 1 ? 'suka' : 'suk'} · ${males} ${males === 1 ? 'pies' : 'psów'}`} actions={<button className="btn" onClick={() => nav(`/psy/nowy${sexFilter ? `?sex=${sexFilter}` : ''}`)}><Plus size={18} /> Dodaj psa</button>} />
      <div className="row between no-print" style={{ marginBottom: 12 }}>
        <div className="tabs" style={{ margin: 0, padding: 0 }}>
          <button className={!sexFilter ? 'active' : ''} onClick={() => setParams({})}>Wszystkie</button>
          <button className={sexFilter === 'female' ? 'active' : ''} onClick={() => setParams({ sex: 'female' })}>Suki</button>
          <button className={sexFilter === 'male' ? 'active' : ''} onClick={() => setParams({ sex: 'male' })}>Psy</button>
        </div>
        <div className="tabs" style={{ margin: 0, padding: 0 }}>
          <button className={!compact ? 'active' : ''} onClick={() => setCompact(false)}>Pełny</button>
          <button className={compact ? 'active' : ''} onClick={() => setCompact(true)}>Kompaktowy</button>
        </div>
      </div>
      {nearLimit && <div className="card soft" style={{ marginBottom: 12 }}><div className="row between"><span>{`Plan FREE: do ${FREE_LIMITS.females} suk i ${FREE_LIMITS.males} psów.`} <ProBadge /> znosi limity.</span><Link to="/ustawienia" className="btn sm">Zobacz PRO</Link></div></div>}
      {dogs.length === 0 ? <Card><Empty icon={<DogIcon size={28} />}>
          {sexFilter === 'female' ? 'Nie masz jeszcze suk.' : sexFilter === 'male' ? 'Nie masz jeszcze psów.' : 'Nie masz jeszcze psów ani suk.'}
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {sexFilter !== 'male' && <button className="btn" onClick={() => nav('/psy/nowy?sex=female')}><Plus size={16} /> Dodaj pierwszą sukę</button>}
            {sexFilter !== 'female' && <button className="btn" onClick={() => nav('/psy/nowy?sex=male')}><Plus size={16} /> Dodaj pierwszego psa</button>}
            <button className="btn secondary" onClick={() => nav('/skanuj')}><QrCode size={16} /> Odbierz psa kodem QR</button>
          </div>
        </Empty></Card> : (
        <div className="stack">
          {dogs.map(d => (
            <Card key={d.id} onClick={() => nav(`/psy/${d.id}`)}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="avatar">{d.photo ? <img src={d.photo} alt="" /> : <DogIcon size={30} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row between"><div><b style={{ fontSize: 17 }}>{d.name}</b> <span className="muted">({d.pedigreeName})</span></div><span className="badge gray">{sexIcon(d.sex)} {d.sex === 'male' ? 'Pies' : 'Suka'}</span></div>
                  <div className="muted">{d.breed}</div>
                  <div className="muted">Wiek: {ageText(d.birthDate)}</div>
                </div>
              </div>
              {!compact && (
                <div className="row" style={{ marginTop: 12, gap: 6 }} onClick={e => e.stopPropagation()}>
                  <Link className="btn secondary sm" to={`/psy/${d.id}?tab=health`}><Syringe size={14} /> Zdrowie</Link>
                  {breeder && <Link className="btn secondary sm" to={`/psy/${d.id}?tab=breeding`}>{d.sex === 'female' ? <><Flower2 size={14} /> Rozród</> : <><Heart size={14} /> Krycia</>}</Link>}
                  <Link className="btn secondary sm" to={`/psy/${d.id}?tab=career`}><Trophy size={14} /> Osiągnięcia</Link>
                  <Link className="btn secondary sm" to={`/psy/${d.id}?tab=weight`}><Scale size={14} /> Waga</Link>
                  <Link className="btn secondary sm" to={`/psy/${d.id}?tab=timeline`}><Clock size={14} /> Kronika</Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {healthFor !== null && <HealthForm rec={{ id: uid(), dogId: healthFor || undefined, kind: 'vaccination', date: today(), name: '' }} pickDog onClose={() => setHealthFor(null)} onSave={r => { if (!r.dogId) { toast('Wybierz psa'); return; } upsert('health', r); setHealthFor(null); toast('Wpis zapisany'); }} />}
    </div>
  );
}
