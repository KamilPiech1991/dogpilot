import type { AppState, Litter } from './types';
import { LITTER_CHECKLIST } from './types';

/** Zbiorcze dane miotu do metryki i rejestru. */
export function litterStats(state: AppState, l: Litter) {
  const pups = state.puppies.filter(p => p.litterId === l.id);
  const males = pups.filter(p => p.sex === 'male').length;
  const females = pups.length - males;
  const alive = pups.filter(p => p.birthStatus === 'alive').length;
  const stillborn = pups.filter(p => p.birthStatus === 'stillborn').length;
  const died = pups.length - alive - stillborn;
  const bw = pups.map(p => p.birthWeightG).filter((x): x is number => typeof x === 'number' && x > 0);
  const avgBw = bw.length ? Math.round(bw.reduce((a, b) => a + b, 0) / bw.length) : null;
  const handed = pups.filter(p => p.handoverDate).length;
  const mother = state.dogs.find(d => d.id === l.motherId);
  const father = state.dogs.find(d => d.id === l.fatherId);
  const breed = l.breed || mother?.breed || '';
  const start = l.birthDiary.find(e => e.kind === 'start')?.time;
  const end = l.birthDiary.find(e => e.kind === 'end')?.time;
  const durationMin = start && end ? Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)) : null;
  const keys = LITTER_CHECKLIST.flatMap(g => g.items.map(i => i.key));
  const careDone = keys.filter(k => l.checklist[k]).length;
  const carePct = Math.round((careDone / keys.length) * 100);
  return { pups, males, females, alive, stillborn, died, avgBw, handed, mother, father, breed, start, end, durationMin, careDone, careTotal: keys.length, carePct };
}

/** Rejestr miotów jako CSV (średnik, BOM – otwiera się poprawnie w Excelu PL). */
export function littersCsv(state: AppState, litters: Litter[]): string {
  const head = ['Oznaczenie', 'Litera', 'Data urodzenia', 'Rasa', 'Matka', 'Ojciec', 'Szczenięta', 'Psy', 'Suki', 'Żywo', 'Martwo', 'Padłe', 'Śr. waga ur. (g)', 'Przekazane', 'Nr zgłoszenia', 'Przegląd miotu', 'Plan odchowu (%)'];
  const esc = (v: unknown) => { const s = v === undefined || v === null ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = litters.map(l => { const s = litterStats(state, l); return [l.name, l.letter ?? '', l.birthDate, s.breed, l.motherName, l.fatherName, s.pups.length, s.males, s.females, s.alive, s.stillborn, s.died, s.avgBw ?? '', s.handed, l.regNo ?? '', l.reviewDate ?? '', s.carePct].map(esc).join(';'); });
  return '﻿' + [head.join(';'), ...rows].join('\n');
}
