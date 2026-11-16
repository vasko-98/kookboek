// Bouwt de site: voegt recepten/*.json samen tot _site/recepten.json en kopieert site/.
// Geen dependencies nodig. Gebruik: node scripts/build.mjs
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, '_site');
const MOEITE = ['makkelijk', 'gemiddeld', 'veel werk'];
const TIJDEN = ['tot 15', '15-30', '30-45', '45-60', '60+'];
const MAALTIJDEN = ['ontbijt', 'lunch', 'diner'];
const DIETEN = ['vega', 'vlees', 'vis'];
const BEREIDINGEN = ['oven', 'één pan', 'meerdere pannen', 'BBQ', 'geen koken'];

function controleer(r, bestand) {
  const fout = m => { throw new Error(`${bestand}: ${m}`); };
  const id = path.basename(bestand, '.json');
  if (r.id !== id) fout(`id "${r.id}" moet gelijk zijn aan de bestandsnaam "${id}"`);
  if (!r.titel) fout('titel ontbreekt');
  if ('status' in r || 'statusNoot' in r) fout('status bestaat niet meer');
  if (!TIJDEN.includes(r.tijd)) fout(`tijd moet een van ${TIJDEN.join(' / ')} zijn (range in minuten)`);
  if (!Number.isFinite(r.personen)) fout('personen ontbreekt');
  if (!MOEITE.includes(r.moeite)) fout(`moeite moet een van ${MOEITE.join(' / ')} zijn`);
  if (r.favoriet != null && typeof r.favoriet !== 'boolean') fout('favoriet moet true of false zijn');
  if ('beoordeling' in r) fout('beoordeling bestaat niet meer, gebruik favoriet: true/false');
  if ('tags' in r) fout('tags bestaan niet meer, gebruik keuken, maaltijd, dieet en bereiding');
  if ('bron' in r) fout('bron bestaat niet meer en wordt niet getoond');
  if (typeof r.keuken !== 'string' || !r.keuken) fout('keuken ontbreekt (bijv. Mexicaans)');
  if (!Array.isArray(r.maaltijd) || !r.maaltijd.length || !r.maaltijd.every(m => MAALTIJDEN.includes(m))) fout(`maaltijd moet een lijst met ${MAALTIJDEN.join(' / ')} zijn`);
  if (!DIETEN.includes(r.dieet)) fout(`dieet moet een van ${DIETEN.join(' / ')} zijn`);
  if (!BEREIDINGEN.includes(r.bereiding)) fout(`bereiding moet een van ${BEREIDINGEN.join(' / ')} zijn`);
  if (r.kleur != null && !['tomaat', 'mosterd', 'salie', 'lila', 'wit'].includes(r.kleur)) fout('kleur moet tomaat, mosterd, salie, lila of wit zijn');
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

const iconen = new Set((await readdir(path.join(root, 'site', 'iconen'))).filter(f => f.endsWith('.svg')));
for (const r of recepten) {
  if (!iconen.has(`${r.id}.svg`)) console.warn(`Let op: geen icoon voor ${r.id}, de site toont _standaard.svg`);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'site'), out, { recursive: true });
await writeFile(path.join(out, 'recepten.json'), JSON.stringify({ versie: 1, recepten }));
console.log(`${recepten.length} recepten gebouwd naar _site/`);
