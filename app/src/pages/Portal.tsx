import { useParams } from 'react-router-dom';
import { PawPrint, Scale, Syringe, CalendarHeart, Utensils, Heart } from 'lucide-react';
import { useStore } from '../app/store';
import { daysBetween, fmtDate, fmtDateTime, today } from '../app/format';
import { HEALTH_LABEL } from '../app/types';
import { Wordmark } from '../components/ui';
import { FacebookMark, InstagramMark } from '../components/Social';

export default function Portal() {
  const { id } = useParams();
  const { state } = useStore();
  const puppy = state.puppies.find(p => p.id === id);
  const litter = state.litters.find(l => l.id === puppy?.litterId);
  const mother = state.dogs.find(d => d.id === litter?.motherId);
  if (!puppy || !litter) return <div className="module-pick"><div className="card">Nie znaleziono strony szczenięcia.</div></div>;
  const ws = state.weights.filter(w => w.puppyId === puppy.id).sort((a, b) => a.date.localeCompare(b.date));
  const last = ws[ws.length - 1];
  const health = state.health.filter(h => h.puppyId === puppy.id).sort((a, b) => b.date.localeCompare(a.date));
  const age = daysBetween(litter.birthDate, today());
  const handover = puppy.handoverDate;
  const left = handover ? daysBetween(today(), handover) : null;
  const pack = litter.pack;
  const max = Math.max(...ws.map(w => w.grams), 1);
  return (
    <div className="module-pick" style={{ alignItems: 'start' }}>
      <div className="box stack" style={{ maxWidth: 560 }}>
        <div className="hero" style={{ textAlign: 'center' }}>
          <div className="avatar lg" style={{ margin: '0 auto 10px', background: 'rgba(255,255,255,.18)', color: '#fff' }}>{puppy.photo ? <img src={puppy.photo} alt="" /> : <PawPrint size={44} className="wag" />}</div>
          <div className="muted" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{state.profile.logo && <img className="kennel-logo" src={state.profile.logo} alt="" style={{ background: '#fff' }} />}{state.profile.kennelName || 'Hodowla'}</div>
          <h1 style={{ fontSize: 30 }}>{puppy.name}</h1>
          <div className="muted">{`${mother?.breed} · ${puppy.sex === 'male' ? 'piesek' : 'suczka'} · ${age} dni`}</div>
          {left !== null && <div style={{ marginTop: 14, background: 'rgba(255,255,255,.15)', borderRadius: 16, padding: 12 }}><div className="muted" style={{ fontSize: 12, fontWeight: 800 }}><CalendarHeart size={14} style={{ verticalAlign: -2 }} /> DO ODBIORU</div><div style={{ fontSize: 30, fontWeight: 900 }}>{left > 0 ? `${left} dni` : left === 0 ? 'Dziś!' : 'Już w domu'}</div><div className="muted">{fmtDate(handover)}</div></div>}
        </div>
        <div className="card">
          <div className="row between"><h3 style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><Scale size={18} style={{ color: 'var(--primary)' }} /> Waga</h3>{last && <b style={{ fontSize: 22, color: 'var(--primary-600)' }}>{last.grams} g</b>}</div>
          {ws.length > 1 ? <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, marginTop: 10 }}>{ws.slice(-14).map(w => <div key={w.id} title={`${fmtDateTime(w.date)}: ${w.grams} g`} style={{ flex: 1, height: `${(w.grams / max) * 100}%`, background: puppy.markerColor, borderRadius: '6px 6px 2px 2px', opacity: .85 }} />)}</div> : <div className="muted">Pierwsze pomiary wkrótce.</div>}
          <small className="muted">Ostatni pomiar: {last ? fmtDateTime(last.date) : '—'} · waga urodzeniowa {puppy.birthWeightG ?? '—'} g</small>
        </div>
        <div className="card">
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Syringe size={18} style={{ color: 'var(--primary)' }} /> Profilaktyka</h3>
          {health.length === 0 ? <div className="muted">Jeszcze nic – pierwsze odrobaczenie ok. 2. tygodnia.</div> : <div className="list">{health.map(h => <div key={h.id} className="list-item"><div><div className="title">{HEALTH_LABEL[h.kind]}: {h.name}</div><small>{fmtDate(h.date)}</small></div><span className="badge success">✓</span></div>)}</div>}
        </div>
        <div className="card">
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Utensils size={18} style={{ color: 'var(--primary)' }} /> Co jem i jak żyję</h3>
          <div className="muted">Karma: <b>{[pack.foodBrand, pack.foodName].filter(Boolean).join(' ') || 'wkrótce'}</b>{pack.portion ? `, ${pack.portion}` : ''}{pack.mealsPerDay ? `, ${pack.mealsPerDay}× dziennie (${pack.feedingHours ?? ''})` : ''}</div>
          {pack.accustomed.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{pack.accustomed.map(a => <span key={a} className="chip on" style={{ cursor: 'default', transform: 'none' }}>{a}</span>)}</div>}
          {puppy.character.length > 0 && <div style={{ marginTop: 8 }}><b><Heart size={14} style={{ verticalAlign: -2 }} /> Charakter:</b> {puppy.character.join(', ')}</div>}
          {puppy.aboutText && <div className="card soft" style={{ marginTop: 8 }}>{puppy.aboutText}</div>}
        </div>
        {state.profile.social?.showOnPortal && (state.profile.social.facebook?.connected || state.profile.social.instagram?.connected) && (
          <div className="card" style={{ textAlign: 'center' }}>
            <b>Śledź hodowlę</b>
            <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              {state.profile.social.facebook?.connected && <a className="btn secondary" href={state.profile.social.facebook.url} target="_blank" rel="noopener noreferrer"><FacebookMark size={18} /> {state.profile.social.facebook.name}</a>}
              {state.profile.social.instagram?.connected && <a className="btn secondary" href={state.profile.social.instagram.url} target="_blank" rel="noopener noreferrer"><InstagramMark size={18} /> {state.profile.social.instagram.name}</a>}
            </div>
          </div>
        )}
        <div className="muted" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}><span>Strona przygotowana przez hodowcę w</span><Wordmark height={22} /><span>Dane sprzedaży i kontakty pozostają prywatne.</span></div>
      </div>
    </div>
  );
}
