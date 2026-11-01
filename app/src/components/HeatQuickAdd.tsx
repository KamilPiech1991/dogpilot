import { useMemo, useState } from 'react';
import { useStore } from '../app/store';
import { Field, Modal } from './ui';
import { fmtDate, today, uid } from '../app/format';
import type { Heat } from '../app/types';

/** Szybkie dodanie cieczki z menu „+”: wybór konkretnej suczki, daty i notatki. */
export default function HeatQuickAdd({ onClose, onSaved }: { onClose: () => void; onSaved?: (dogId: string) => void }) {
  const { state, upsert, toast } = useStore();
  const females = useMemo(() => state.dogs.filter(d => d.sex === 'female').sort((a, b) => a.name.localeCompare(b.name)), [state.dogs]);
  const [dogId, setDogId] = useState(females.length === 1 ? females[0].id : '');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const last = dogId ? state.heats.filter(h => h.dogId === dogId).sort((a, b) => b.startDate.localeCompare(a.startDate))[0] : undefined;
  const save = () => {
    const h: Heat = { id: uid(), dogId, startDate, endDate: endDate || undefined, notes: notes.trim() || undefined };
    upsert('heats', h);
    toast('Cieczka dodana');
    onSaved?.(dogId);
    onClose();
  };
  return (
    <Modal title="Nowa cieczka" onClose={onClose} actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!dogId || !startDate} onClick={save}>Zapisz</button></>}>
      <Field label="Suczka *">
        <select value={dogId} onChange={e => setDogId(e.target.value)} autoFocus={females.length > 1}>
          {females.length !== 1 && <option value="">— wybierz suczkę —</option>}
          {females.map(d => <option key={d.id} value={d.id}>{d.name}{d.breed ? ` (${d.breed})` : ''}</option>)}
        </select>
      </Field>
      {last && <div className="muted" style={{ marginTop: -4, marginBottom: 10, fontSize: 13 }}>Poprzednia cieczka: {fmtDate(last.startDate)}{last.endDate ? ` – ${fmtDate(last.endDate)}` : ''}</div>}
      <div className="form-grid">
        <Field label="Początek *"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></Field>
        <Field label="Koniec"><input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} /></Field>
      </div>
      <Field label="Notatki"><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="np. progesteron, krycie, objawy" /></Field>
    </Modal>
  );
}
