import type { Heat } from './types';
import { addDays, daysBetween } from './format';
import { HEAT_DEFAULT_INTERVAL_DAYS } from './types';

export function heatStats(heats: Heat[]) {
  const sorted = [...heats].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (sorted.length === 0) return null;
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) intervals.push(daysBetween(sorted[i - 1].startDate, sorted[i].startDate));
  const avg = intervals.length ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : HEAT_DEFAULT_INTERVAL_DAYS;
  const last = sorted[sorted.length - 1];
  const next = addDays(last.startDate, avg);
  const avgLen = sorted.filter(h => h.endDate).length ? Math.round(sorted.filter(h => h.endDate).reduce((a, h) => a + daysBetween(h.startDate, h.endDate!), 0) / sorted.filter(h => h.endDate).length) : 21;
  return { sorted, avgInterval: avg, avgLength: avgLen, last, next, nextFrom: addDays(next, -14), nextTo: addDays(next, 14), fertileFrom: addDays(next, 9), fertileTo: addDays(next, 15), estimated: intervals.length === 0 };
}
