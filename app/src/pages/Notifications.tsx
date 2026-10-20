import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, EyeOff, Settings2, Plus, ArrowRight, RotateCcw } from 'lucide-react';
import { useStore } from '../app/store';
import { collectNotifications, notifySettings, whenLabel, type NotifItem } from '../app/notifications';
import { NOTIF_LABEL, type NotifKind } from '../app/types';
import { ArtHeader, Empty } from '../components/ui';
import { NotifIcon, NOTIF_TONE } from '../components/NotifIcon';
import { daysBetween, fmtDate, today } from '../app/format';

const SHORT: Record<NotifKind, string> = { vaccination: 'Szczepienia', exam: 'Badania', procedure: 'Zabiegi', prevention: 'Profilaktyka', heat: 'Cieczki', pregnancy: 'Ciąża', show: 'Wystawy', general: 'Ogólne' };

export default function Notifications() {
  const { state, setProfile, upsert, toast } = useStore();
  const nav = useNavigate();
  const t = today();
  const cfg = notifySettings(state.profile);
  const [all, setAll] = useState(false);
  const [kind, setKind] = useState<NotifKind | 'all'>('all');
  const items = useMemo(() => collectNotifications(state, t, { all }), [state, t, all]);
  const shown = items.filter(i => kind === 'all' || i.kind === kind);
  const kinds = [...new Set(items.map(i => i.kind))];
  const dismissedCount = (state.profile.dismissedNotifications ?? []).length;
  const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

  const groups: [string, NotifItem[]][] = [
    ['Zaległe', shown.filter(i => i.overdue)],
    ['Dziś i jutro', shown.filter(i => !i.overdue && daysBetween(t, i.date) <= 1)],
    ['W tym tygodniu', shown.filter(i => !i.overdue && daysBetween(t, i.date) > 1 && daysBetween(t, i.date) <= 7)],
    ['Później', shown.filter(i => !i.overdue && daysBetween(t, i.date) > 7)],
  ];

  const done = (i: NotifItem) => {
    const r = i.reminderId && state.reminders.find(x => x.id === i.reminderId);
    if (r) { upsert('reminders', { ...r, done: true }); toast('Oznaczono jako zrobione'); return; }
    setProfile({ dismissedNotifications: [...(state.profile.dismissedNotifications ?? []), i.id] });
    toast('Ukryto powiadomienie');
  };

  const enablePush = async () => {
    if (permission === 'unsupported') { toast('Ta przeglądarka nie obsługuje powiadomień'); return; }
    const res = await Notification.requestPermission();
    if (res === 'granted') { setProfile({ notify: { ...cfg, push: true } }); new Notification('Dogpilot', { body: 'Powiadomienia włączone. Codziennie rano dostaniesz podsumowanie terminów.', icon: `${import.meta.env.BASE_URL}brand/icon-512.png` }); toast('Powiadomienia włączone'); }
    else toast('Brak zgody na powiadomienia w przeglądarce');
  };

  return (
    <div className="stack">
      <ArtHeader compact tone="sun" icon={<Bell size={24} />} title="Powiadomienia" sub={`${items.length} ${items.length === 1 ? 'termin' : items.length < 5 && items.length > 0 ? 'terminy' : 'terminów'} · zdrowie, cieczki, ciąża, wystawy`}
        actions={<button className="btn secondary" onClick={() => nav('/ustawienia?sekcja=powiadomienia')}><Settings2 size={16} /> Ustawienia</button>} />

      {!cfg.push && (
        <div className="card notif-push">
          <span className="np-ico"><BellRing size={22} /></span>
          <div style={{ flex: 1 }}><b>Powiadomienia na tym urządzeniu</b><div className="muted" style={{ fontSize: 13 }}>Codzienne podsumowanie terminów o {cfg.pushHour}:00, także gdy aplikacja jest zamknięta (w wersji na telefon).</div></div>
          <button className="btn sm" onClick={enablePush} disabled={permission === 'denied'}>{permission === 'denied' ? 'Zablokowane' : 'Włącz'}</button>
        </div>
      )}

      <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="chips-row" style={{ margin: 0, flex: 1 }}>
          <button className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>{`Wszystkie ${items.length}`}</button>
          {kinds.map(k => <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{SHORT[k]} {items.filter(i => i.kind === k).length}</button>)}
        </div>
        <label className="row muted" style={{ gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> Pokaż też dalsze terminy</label>
      </div>

      {!shown.length && <Empty icon={<Check size={28} />}>Nic do zrobienia.<br />Terminy pojawią się tu z wyprzedzeniem ustawionym w ustawieniach.</Empty>}

      {groups.filter(([, l]) => l.length).map(([label, list]) => (
        <section key={label} className="stack" style={{ gap: 8 }}>
          <h3 style={{ margin: '6px 0 0' }} className={label === 'Zaległe' ? 'danger-text' : ''}>{label} <span className="muted" style={{ fontSize: 13 }}>{list.length}</span></h3>
          {list.map(i => (
            <div key={i.id} className={`notif-row t-${NOTIF_TONE[i.kind]} ${i.overdue ? 'overdue' : ''}`}>
              <span className="nr-ico"><NotifIcon kind={i.kind} /></span>
              <Link to={i.to} className="nr-main">
                <b>{i.title}</b>
                <small>{i.sub ? `${i.sub} · ` : ''}{fmtDate(i.date)} · {NOTIF_LABEL[i.kind].split(' (')[0]}</small>
              </Link>
              <span className={`badge ${i.overdue ? 'danger' : daysBetween(t, i.date) <= 1 ? 'warn' : 'gray'}`}>{whenLabel(i.date, t)}</span>
              <button className="icon-btn" title={i.reminderId ? 'Zrobione' : 'Ukryj'} aria-label={i.reminderId ? 'Oznacz jako zrobione' : 'Ukryj powiadomienie'} onClick={() => done(i)}>{i.reminderId ? <Check size={18} /> : <EyeOff size={18} />}</button>
            </div>
          ))}
        </section>
      ))}

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn secondary" onClick={() => nav('/przypomnienia?add=1')}><Plus size={16} /> Dodaj przypomnienie</button>
        <button className="btn ghost" onClick={() => nav('/przypomnienia')}>Wszystkie przypomnienia <ArrowRight size={16} /></button>
        {dismissedCount > 0 && <button className="btn ghost" onClick={() => { setProfile({ dismissedNotifications: [] }); toast('Przywrócono ukryte powiadomienia'); }}><RotateCcw size={16} /> Przywróć ukryte ({dismissedCount})</button>}
      </div>
    </div>
  );
}
