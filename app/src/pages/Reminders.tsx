import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Plus } from 'lucide-react';
import { useStore } from '../app/store';
import { Card, Empty, Field, Modal, confirmDel, EditBtn, DelBtn } from '../components/ui';
import { ArtHeader } from '../components/ui';
import { Bell as ArtIcon } from 'lucide-react';
import { fmtDate, today, uid } from '../app/format';
import type { Reminder } from '../app/types';

export default function Reminders() {
  const { state, upsert, remove, toast } = useStore();
  const [edit, setEdit] = useState<Reminder | null>(null);
  const [params, setParams] = useSearchParams();
  const t = today();
  useEffect(() => { if (params.get('add')) { setEdit({ id: uid(), title: '', date: t, done: false }); setParams({}); } }, [params, setParams, t]);
  const sorted = [...state.reminders].sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date));
  const dogName = (id?: string) => state.dogs.find(d => d.id === id)?.name;
  return (
    <div>
      <ArtHeader compact tone="sun" icon={<ArtIcon size={24} />} title="Przypomnienia" sub="Terminy, wizyty, wydarzenia" actions={<button className="btn" onClick={() => setEdit({ id: uid(), title: '', date: t, done: false })}><Plus size={18} /> Dodaj</button>} />
      <Card>
        {sorted.length === 0 ? <Empty icon={<Bell size={28} />}>Brak przypomnień. Dodaj pierwsze!</Empty> : (
          <div className="list">{sorted.map(r => (
            <div key={r.id} className="list-item" style={{ opacity: r.done ? .55 : 1 }}>
              <label className="row" style={{ flex: 1, cursor: 'pointer' }}>
                <input type="checkbox" checked={r.done} onChange={() => upsert('reminders', { ...r, done: !r.done })} style={{ width: 22, height: 22, accentColor: 'var(--primary)' }} />
                <div><div className="title" style={{ textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</div><small>{fmtDate(r.date)}{dogName(r.dogId) ? ` · ${dogName(r.dogId)}` : ''}{r.notes ? ` · ${r.notes}` : ''}</small></div>
              </label>
              <div className="row">
                {!r.done && r.date < t && <span className="badge danger">Zaległe</span>}
                <EditBtn onClick={() => setEdit(r)} />
                <DelBtn onClick={() => confirmDel() && remove('reminders', r.id)} />
              </div>
            </div>))}</div>
        )}
      </Card>
      {edit && (
        <Modal title={state.reminders.some(r => r.id === edit.id) ? 'Edytuj przypomnienie' : 'Nowe przypomnienie'} onClose={() => setEdit(null)}
          actions={<><button className="btn secondary" onClick={() => setEdit(null)}>Anuluj</button><button className="btn" disabled={!edit.title.trim()} onClick={() => { upsert('reminders', edit); setEdit(null); toast('Zapisano'); }}>Zapisz</button></>}>
          <Field label="Tytuł"><input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} /></Field>
          <div className="form-grid">
            <Field label="Data"><input type="date" value={edit.date} onChange={e => setEdit({ ...edit, date: e.target.value })} /></Field>
            <Field label="Pies (opcjonalnie)"><select value={edit.dogId ?? ''} onChange={e => setEdit({ ...edit, dogId: e.target.value || undefined })}><option value="">—</option>{state.dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          </div>
          <Field label="Notatka"><textarea value={edit.notes ?? ''} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
