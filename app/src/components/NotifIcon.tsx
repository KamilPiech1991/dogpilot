import { Bell, Bug, Flower2, Heart, Scissors, Stethoscope, Syringe, Trophy } from 'lucide-react';
import type { NotifKind } from '../app/types';

export const NOTIF_TONE: Record<NotifKind, string> = { vaccination: 'green', exam: 'blue', procedure: 'lilac', prevention: 'teal', heat: 'rose', pregnancy: 'rose', show: 'sun', general: 'slate' };

export function NotifIcon({ kind, size = 18 }: { kind: NotifKind; size?: number }) {
  const I = { vaccination: Syringe, exam: Stethoscope, procedure: Scissors, prevention: Bug, heat: Flower2, pregnancy: Heart, show: Trophy, general: Bell }[kind];
  return <I size={size} />;
}
