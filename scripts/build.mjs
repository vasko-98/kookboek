// Bouwt de site: voegt recepten/*.json samen tot _site/recepten.json en kopieert site/.
// Geen dependencies nodig. Gebruik: node scripts/build.mjs
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, '_site');
const STATUSSEN = ['Gemaakt', 'Wil ik maken'];

function controleer(r, bestand) {
  const fout = m => { throw new Error(`${bestand}: ${m}`); };
  const id = path.basename(bestand, '.json');
  if (r.id !== id) fout(`id "${r.id}" moet gelijk zijn aan de bestandsnaam "${id}"`);
  if (!r.titel) fout('titel ontbreekt');
  if (!STATUSSEN.includes(r.status)) fout(`status moet een van ${STATUSSEN.join(' / ')} zijn`);
  if (!Number.isFinite(r.tijd)) fout('tijd (minuten) ontbreekt');
  if (!Number.isFinite(r.personen)) fout('personen ontbreekt');
  if (r.beoordeling != null && !(r.beoordeling >= 1 && r.beoordeling <= 5)) fout('beoordeling moet 1-5 of null zijn');
  if (!Array.isArray(r.tags)) fout('tags moet een lijst zijn');
  if (!Array.isArray(r.ingredienten) || !r.ingredienten.length) fout('ingredienten ontbreekt');
  r.ingredienten.forEach((g, i) => {
    if (!Array.isArray(g.items)) fout(`ingredienten[${i}].items ontbreekt`);
    g.items.forEach((it, j) => {
      if (!it.n) fout(`ingredienten[${i}].items[${j}].n ontbreekt`);
      if (it.q != null && !Number.isFinite(it.q)) fout(`ingredienten[${i}].items[${j}].q moet een getal of null zijn`);
    });
  });
  if (!Array.isArray(r.stappen) || !r.stappen.length) fout('stappen ontbreekt');
}

const dir = path.join(root, 'recepten');
const bestanden = (await readdir(dir)).filter(f => f.endsWith('.json')).sort();
const recepten = [];
for (const f of bestanden) {
  const r = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
  controleer(r, f);
  recepten.push(r);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'site'), out, { recursive: true });
await writeFile(path.join(out, 'recepten.json'), JSON.stringify({ versie: 1, recepten }));
console.log(`${recepten.length} recepten gebouwd naar _site/`);
