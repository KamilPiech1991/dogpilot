// Podgląd na GitHub Pages żyje pod /dogpilot/. Produkcja (własna domena) jest w katalogu głównym,
// więc kod używa ścieżek od „/”; ten skrypt dopisuje prefiks tylko w zbudowanym katalogu dist.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
if (!base) process.exit(0);
const walk = (d) => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const f of walk('dist')) {
  if (!/\.(html|xml|txt)$/.test(f)) continue;
  let s = readFileSync(f, 'utf8');
  s = s.replace(/(href|src|action|content)="\/(?!\/)/g, `$1="${base}/`).replace(/srcset="([^"]*)"/g, (m, v) => `srcset="${v.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}/`)}"`);
  s = s.replace(/location\.replace\(/g, 'location.replace(');
  writeFileSync(f, s);
}
console.log('base prefix applied:', base);
