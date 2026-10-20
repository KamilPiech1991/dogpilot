import type { AppState, Puppy } from './types';

export interface PawIdPayload {
  v: 1; t: 'puppy'; id: string; name: string; litter: string; breed?: string; sex: 'male' | 'female';
  birth: string; color?: string; bw?: number; father: string; mother: string; pedigreeNo?: string; chip?: string;
  kennel?: string; breeder?: string;
  vacc: { d: string; n: string }[]; deworm: { d: string; n: string }[]; weights: { d: string; g: number }[];
  pack?: { food?: string; portion?: string; meals?: number; hours?: string; supplements?: string; grooming?: string; firstDays?: string; accustomed?: string[]; character?: string[]; about?: string };
}

const PREFIX = 'DGP1:';
const LEGACY_PREFIXES = ['KNL1:'];

function toB64(s: string) { return btoa(unescape(encodeURIComponent(s))); }
function fromB64(s: string) { return decodeURIComponent(escape(atob(s))); }

export function buildPawIdPayload(state: AppState, puppy: Puppy): PawIdPayload {
  const litter = state.litters.find(l => l.id === puppy.litterId);
  const mother = state.dogs.find(d => d.id === litter?.motherId);
  const health = state.health.filter(h => h.puppyId === puppy.id);
  const weights = state.weights.filter(w => w.puppyId === puppy.id).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const p = litter?.pack;
  return {
    v: 1, t: 'puppy', id: puppy.pawId, name: puppy.name, litter: litter?.name ?? '', breed: mother?.breed, sex: puppy.sex,
    birth: puppy.birthDateTime, color: puppy.color, bw: puppy.birthWeightG, father: litter?.fatherName ?? '', mother: litter?.motherName ?? '',
    pedigreeNo: puppy.pedigreeNo, chip: puppy.chip, kennel: state.profile.kennelName, breeder: state.profile.breederName,
    vacc: health.filter(h => h.kind === 'vaccination').map(h => ({ d: h.date, n: h.name })),
    deworm: health.filter(h => h.kind === 'deworming' || h.kind === 'parasite').map(h => ({ d: h.date, n: h.name })),
    weights: weights.map(w => ({ d: w.date, g: w.grams })),
    pack: p ? { food: [p.foodBrand, p.foodName].filter(Boolean).join(' '), portion: p.portion, meals: p.mealsPerDay, hours: p.feedingHours, supplements: p.supplements, grooming: p.grooming, firstDays: p.firstDays, accustomed: p.accustomed, character: puppy.character, about: puppy.aboutText } : undefined,
  };
}

export function encodePawId(payload: PawIdPayload): string { return PREFIX + toB64(JSON.stringify(payload)); }

export function decodePawId(text: string): PawIdPayload | null {
  try {
    const t = text.trim();
    const pre = [PREFIX, ...LEGACY_PREFIXES].find(x => t.startsWith(x));
    if (!pre) return null;
    const obj = JSON.parse(fromB64(t.slice(pre.length)));
    if (obj?.v !== 1 || obj?.t !== 'puppy') return null;
    return obj as PawIdPayload;
  } catch { return null; }
}
