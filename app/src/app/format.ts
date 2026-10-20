export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const today = () => new Date().toISOString().slice(0, 10);
export const nowLocal = () => { const d = new Date(); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
let LOCALE = 'pl-PL';
/** Ustawienia regionalne dat i kwot – zależą od języka aplikacji. */
export const setLocale = (lang: 'pl' | 'en') => { LOCALE = lang === 'en' ? 'en-GB' : 'pl-PL'; };
export const fmtDate = (s?: string) => { if (!s) return '—'; const d = new Date(s); if (isNaN(d.getTime())) return s; return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }); };
export const fmtDateTime = (s?: string) => { if (!s) return '—'; const d = new Date(s); if (isNaN(d.getTime())) return s; return d.toLocaleString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
export const fmtDateLong = (s?: string) => { if (!s) return '—'; const d = new Date(s); return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }); };
let CURRENCY = 'PLN';
/** Waluta wyświetlania kwot (ustawienia aplikacji). Kwoty nie są przeliczane. */
export const setCurrency = (c: string) => { CURRENCY = c; };
export const fmtMoney = (n: number) => n.toLocaleString(LOCALE, { style: 'currency', currency: CURRENCY });
export const addDays = (s: string, n: number) => { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(b).setHours(0,0,0,0) - new Date(a).setHours(0,0,0,0)) / 86400000);
export function ageText(birth: string): string {
  if (!birth) return '';
  const b = new Date(birth); const n = new Date();
  let y = n.getFullYear() - b.getFullYear(); let m = n.getMonth() - b.getMonth(); let d = n.getDate() - b.getDate();
  if (d < 0) { m--; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} ${y === 1 ? 'rok' : y < 5 ? 'lata' : 'lat'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'miesiąc' : m < 5 ? 'miesiące' : 'miesięcy'}`);
  if (y === 0) parts.push(`${d} ${d === 1 ? 'dzień' : 'dni'}`);
  return parts.join(', ');
}
export const monthKey = (s: string) => s.slice(0, 7);
export const MONTHS_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
