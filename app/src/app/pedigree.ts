import type { Dog } from './types';

export interface PedNode { name: string; dog?: Dog; father?: PedNode; mother?: PedNode }

export function buildPedigree(dog: Dog, dogs: Dog[], depth = 3): PedNode {
  const byId = new Map(dogs.map(d => [d.id, d]));
  const byName = new Map(dogs.map(d => [d.pedigreeName.toLowerCase(), d]));
  const resolve = (id?: string, name?: string): Dog | undefined => (id && byId.get(id)) || (name ? byName.get(name.toLowerCase()) : undefined);
  const walk = (d: Dog | undefined, name: string, lvl: number): PedNode => {
    const node: PedNode = { name: d ? d.pedigreeName || d.name : name, dog: d };
    if (lvl >= depth || !d) return node;
    const f = resolve(d.fatherId, d.fatherName), m = resolve(d.motherId, d.motherName);
    if (f || d.fatherName) node.father = walk(f, d.fatherName ?? '', lvl + 1);
    if (m || d.motherName) node.mother = walk(m, d.motherName ?? '', lvl + 1);
    return node;
  };
  return walk(dog, dog.pedigreeName, 0);
}

/** Współczynnik inbredu (Wright) liczony po wspólnych przodkach znanych w bazie (do 5 pokoleń). */
export function coefficientOfInbreeding(dog: Dog, dogs: Dog[], maxGen = 5): { coi: number; common: { name: string; contribution: number }[] } {
  const byId = new Map(dogs.map(d => [d.id, d]));
  const byName = new Map(dogs.map(d => [d.pedigreeName.toLowerCase(), d]));
  const resolve = (id?: string, name?: string): Dog | undefined => (id && byId.get(id)) || (name ? byName.get(name.toLowerCase()) : undefined);
  const paths = (d: Dog | undefined, gen: number, acc: Map<string, number[]>, trail: string[]) => {
    if (!d || gen > maxGen) return;
    if (trail.includes(d.id)) return;
    const arr = acc.get(d.id) ?? []; arr.push(gen); acc.set(d.id, arr);
    paths(resolve(d.fatherId, d.fatherName), gen + 1, acc, [...trail, d.id]);
    paths(resolve(d.motherId, d.motherName), gen + 1, acc, [...trail, d.id]);
  };
  const sire = resolve(dog.fatherId, dog.fatherName), dam = resolve(dog.motherId, dog.motherName);
  if (!sire || !dam) return { coi: 0, common: [] };
  const a = new Map<string, number[]>(), b = new Map<string, number[]>();
  paths(sire, 1, a, []); paths(dam, 1, b, []);
  let coi = 0; const common: { name: string; contribution: number }[] = [];
  for (const [id, ga] of a) { const gb = b.get(id); if (!gb) continue; let c = 0; for (const x of ga) for (const y of gb) c += Math.pow(0.5, x + y + 1); coi += c; common.push({ name: byId.get(id)?.pedigreeName ?? id, contribution: c }); }
  return { coi, common: common.sort((x, y) => y.contribution - x.contribution) };
}
