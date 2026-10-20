import { useState } from 'react';
import { Field, Modal, PhotoPicker } from './ui';
import { useStore } from '../app/store';
import type { Dog } from '../app/types';
import { today, uid } from '../app/format';

export default function DogForm({ initial, onSave, onClose }: { initial?: Dog; onSave: (d: Dog) => void; onClose: () => void }) {
  const { state } = useStore();
  const [d, setD] = useState<Dog>(initial ?? { id: uid(), name: '', pedigreeName: '', breed: '', sex: 'female', birthDate: '', createdAt: today() });
  const males = state.dogs.filter(x => x.sex === 'male' && x.id !== d.id), females = state.dogs.filter(x => x.sex === 'female' && x.id !== d.id);
  const set = <K extends keyof Dog>(k: K, v: Dog[K]) => setD({ ...d, [k]: v });
  const valid = d.name.trim() && d.breed.trim() && d.birthDate;
  return (
    <Modal title={initial ? 'Edytuj psa' : 'Dodaj psa'} onClose={onClose} wide actions={<><button className="btn secondary" onClick={onClose}>Anuluj</button><button className="btn" disabled={!valid} onClick={() => onSave({ ...d, pedigreeName: d.pedigreeName || d.name })}>Zapisz</button></>}>
      <PhotoPicker value={d.photo} onChange={v => set('photo', v)} />
      <h3>Podstawowe informacje</h3>
      <div className="form-grid">
        <Field label="Imię domowe *"><input value={d.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Imię hodowlane (z rodowodu)"><input value={d.pedigreeName} onChange={e => set('pedigreeName', e.target.value)} placeholder="np. Bubi Dolina Krzemowa FCI" /></Field>
        <Field label="Rasa *"><input value={d.breed} onChange={e => set('breed', e.target.value)} /></Field>
        <Field label="Płeć *"><select value={d.sex} onChange={e => set('sex', e.target.value as Dog['sex'])}><option value="female">Suka</option><option value="male">Pies</option></select></Field>
        <Field label="Data urodzenia *"><input type="date" value={d.birthDate} onChange={e => set('birthDate', e.target.value)} /></Field>
        <Field label="Umaszczenie"><input value={d.color ?? ''} onChange={e => set('color', e.target.value)} /></Field>
        <Field label="Waga (kg)"><input type="number" step="0.1" value={d.weightKg ?? ''} onChange={e => set('weightKg', e.target.value ? Number(e.target.value) : undefined)} /></Field>
        <Field label={d.sex === 'female' ? 'Sterylizowana' : 'Kastrowany'}><select value={d.neutered ? '1' : '0'} onChange={e => set('neutered', e.target.value === '1')}><option value="0">Nie</option><option value="1">Tak</option></select></Field>
      </div>
      <h3>Rodzice (do drzewa rodowodu)</h3>
      <div className="form-grid">
        <Field label="Ojciec z moich psów"><select value={d.fatherId ?? ''} onChange={e => { const p = males.find(x => x.id === e.target.value); setD({ ...d, fatherId: p?.id, fatherName: p ? p.pedigreeName : d.fatherName }); }}><option value="">— spoza bazy —</option>{males.map(x => <option key={x.id} value={x.id}>{x.name} ({x.pedigreeName})</option>)}</select></Field>
        <Field label="Ojciec (nazwa rodowodowa)"><input value={d.fatherName ?? ''} onChange={e => set('fatherName', e.target.value)} /></Field>
        <Field label="Matka z moich psów"><select value={d.motherId ?? ''} onChange={e => { const p = females.find(x => x.id === e.target.value); setD({ ...d, motherId: p?.id, motherName: p ? p.pedigreeName : d.motherName }); }}><option value="">— spoza bazy —</option>{females.map(x => <option key={x.id} value={x.id}>{x.name} ({x.pedigreeName})</option>)}</select></Field>
        <Field label="Matka (nazwa rodowodowa)"><input value={d.motherName ?? ''} onChange={e => set('motherName', e.target.value)} /></Field>
      </div>
      <h3>Numery i dokumenty</h3>
      <div className="form-grid">
        <Field label="Nr rodowodu"><input value={d.pedigreeNo ?? ''} onChange={e => set('pedigreeNo', e.target.value)} /></Field>
        <Field label="Nr rejestracji oddziałowej"><input value={d.regNo ?? ''} onChange={e => set('regNo', e.target.value)} /></Field>
        <Field label="Nr chipa"><input value={d.chip ?? ''} onChange={e => set('chip', e.target.value)} /></Field>
        <Field label="Hodowla (pochodzenie)"><input value={d.kennelName ?? ''} onChange={e => set('kennelName', e.target.value)} /></Field>
      </div>
      <Field label="Notatki"><textarea value={d.notes ?? ''} onChange={e => set('notes', e.target.value)} /></Field>
    </Modal>
  );
}
