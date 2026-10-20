import type { AppState, HealthKind, NotifKind, NotifySettings, Profile } from './types';
import { DEFAULT_NOTIFY, HEALTH_LABEL } from './types';
import { addDays, daysBetween, fmtDate } from './format';
import { heatStats } from './heat';
import { pregnancyInfo } from './pregnancy';
import { SHOWS_2026 } from './shows2026';

export interface NotifItem { id: string; kind: NotifKind; date: string; title: string; sub: string; to: string; overdue: boolean; reminderId?: string }

const HEALTH_TO_NOTIF: Record<HealthKind, NotifKind> = { vaccination: 'vaccination', exam: 'exam', procedure: 'procedure', deworming: 'prevention', parasite: 'prevention' };

export const notifySettings = (p: Profile): NotifySettings => ({ ...DEFAULT_NOTIFY, ...p.notify, lead: { ...DEFAULT_NOTIFY.lead, ...p.notify?.lead } });

/**
 * Wszystkie terminy z aplikacji w jednym miejscu: zdrowie (z datą następnego zabiegu), cieczki (prognoza),
 * ciąża (USG, RTG, poród), zaplanowane wystawy i przypomnienia. Pozycja pojawia się, gdy do terminu
 * zostało nie więcej dni niż wyprzedzenie ustawione dla jej typu. Zaległe są zawsze widoczne.
 */
export function collectNotifications(state: AppState, t: string, opts: { all?: boolean; withDismissed?: boolean } = {}): NotifItem[] {
  const cfg = notifySettings(state.profile);
  const dismissed = new Set(state.profile.dismissedNotifications ?? []);
  const name = (dogId?: string, puppyId?: string) => state.dogs.find(d => d.id === dogId)?.name ?? state.puppies.find(p => p.id === puppyId)?.name ?? '';
  const out: NotifItem[] = [];

  // zdrowie: tylko najnowszy wpis danego zabiegu u danego psa
  state.health.forEach(h => {
    if (!h.nextDate) return;
    const newer = state.health.some(o => o !== h && o.kind === h.kind && o.name === h.name && (o.dogId ?? o.puppyId) === (h.dogId ?? h.puppyId) && o.date > h.date);
    if (newer || daysBetween(h.nextDate, t) > 60) return;
    out.push({ id: `h-${h.id}`, kind: HEALTH_TO_NOTIF[h.kind], date: h.nextDate, title: `${HEALTH_LABEL[h.kind]}: ${h.name}`, sub: name(h.dogId, h.puppyId), to: h.dogId ? `/psy/${h.dogId}?tab=health` : h.puppyId ? `/szczenieta/${h.puppyId}` : '/psy', overdue: h.nextDate < t });
  });

  // cieczki
  state.dogs.filter(d => d.sex === 'female' && !d.neutered).forEach(d => {
    const s = heatStats(state.heats.filter(h => h.dogId === d.id));
    if (!s || s.nextTo < t) return;
    out.push({ id: `heat-${d.id}-${s.next}`, kind: 'heat', date: s.nextFrom, title: `Okno cieczki: ${d.name}`, sub: `spodziewana ok. ${fmtDate(s.next)}${s.estimated ? ' (szacunek)' : ''}`, to: `/psy/${d.id}?tab=breeding`, overdue: false });
  });

  // ciąża
  state.breedings.filter(b => !b.litterId && b.matings.length).forEach(b => {
    const p = pregnancyInfo(b.matings[0].date, t);
    if (p.day > 70) return;
    const f = state.dogs.find(d => d.id === b.femaleId)?.name ?? 'suka';
    const ev: [string, string, string, string | null][] = [
      ['usg', p.usgFrom, `USG ciąży: ${f}`, b.usg.length ? null : p.usgTo],
      ['rtg', p.rtgFrom, `RTG – liczenie szczeniąt: ${f}`, b.rtg.length ? null : addDays(p.rtgFrom, 10)],
      ['watch', p.observeFrom, `Czas czuwania przed porodem: ${f}`, p.birthTo],
      ['birth', p.expected, `Spodziewany poród: ${f}`, p.birthTo],
    ];
    ev.forEach(([k, date, title, until]) => {
      if (date < t && (!until || until < t)) return;
      out.push({ id: `preg-${b.id}-${k}`, kind: 'pregnancy', date, title, sub: `${p.day}. dzień ciąży`, to: `/ciaza/${b.id}`, overdue: false });
    });
  });

  // wystawy zaplanowane w kalendarzu
  (state.profile.plannedShows ?? []).forEach(id => {
    const s = SHOWS_2026.find(x => x.id === id);
    if (!s || s.dateTo < t || s.cancelled) return;
    out.push({ id: `show-${id}`, kind: 'show', date: s.dateFrom, title: `Wystawa: ${s.city}`, sub: s.kindLabel, to: '/wystawy?view=mine', overdue: false });
  });

  // przypomnienia
  state.reminders.filter(r => !r.done).forEach(r => {
    out.push({ id: `rem-${r.id}`, kind: 'general', date: r.date, title: r.title, sub: name(r.dogId) || (r.notes ?? '').replace(/\s*\[[^\]]*\]\s*$/, ''), to: '/przypomnienia', overdue: r.date < t, reminderId: r.id });
  });

  return out
    .filter(n => !cfg.off.includes(n.kind))
    .filter(n => opts.withDismissed || !dismissed.has(n.id))
    .filter(n => opts.all || n.overdue || daysBetween(t, n.date) <= cfg.lead[n.kind])
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const whenLabel = (d: string, t: string) => { const n = daysBetween(t, d); return n < 0 ? (n === -1 ? 'wczoraj' : `${-n} dni temu`) : n === 0 ? 'dziś' : n === 1 ? 'jutro' : `za ${n} dni`; };

/** Dzienne podsumowanie jako powiadomienie systemowe (przeglądarka lub aplikacja w telefonie). Raz dziennie. */
export function maybeSystemNotify(state: AppState, t: string) {
  const cfg = notifySettings(state.profile);
  if (!cfg.push || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if (new Date().getHours() < cfg.pushHour) return;
  const KEY = 'dogpilot.lastPush';
  try { if (localStorage.getItem(KEY) === t) return; localStorage.setItem(KEY, t); } catch { return; }
  const items = collectNotifications(state, t).filter(n => n.overdue || n.date <= addDays(t, 1));
  if (!items.length) return;
  new Notification(`Dogpilot: ${items.length === 1 ? '1 termin' : `${items.length} ${items.length < 5 ? 'terminy' : 'terminów'}`} na dziś`, { body: items.slice(0, 4).map(i => `• ${i.title}${i.overdue ? ' (zaległe)' : ''}`).join('\n'), icon: `${import.meta.env.BASE_URL}brand/icon-512.png`, tag: 'dogpilot-daily' });
}
