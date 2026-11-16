// Bouwt de site: voegt recepten/*.json samen tot _site/recepten.json en kopieert site/.
// Geen dependencies nodig. Gebruik: node scripts/build.mjs
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, '_site');
const MOEITE = ['makkelijk', 'gemiddeld', 'veel werk'];
const TIJDEN = ['tot 15', '15-30', '30-45', '45-60', '60+'];
const MAALTIJDEN = ['ontbijt', 'lunch', 'diner'];
const DIETEN = ['vega', 'vlees', 'vis'];
const SOORTEN = ['groente & fruit', 'vlees, vis & vega', 'zuivel & eieren', 'brood & deeg', 'pasta, rijst & granen', 'conserven & potten', 'sauzen & olie', 'kruiden & specerijen', 'overig houdbaar'];
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
  if ('notities' in r) fout('notities bestaat niet meer, gebruik tips (een lijst met korte tips)');
  if (r.tips != null && (!Array.isArray(r.tips) || r.tips.length > 4 || !r.tips.every(t => typeof t === 'string' && t.trim()))) fout('tips moet een lijst van maximaal 4 korte teksten zijn');
  if (typeof r.keuken !== 'string' || !r.keuken) fout('keuken ontbreekt (bijv. Mexicaans)');
  if (!Array.isArray(r.maaltijd) || !r.maaltijd.length || !r.maaltijd.every(m => MAALTIJDEN.includes(m))) fout(`maaltijd moet een lijst met ${MAALTIJDEN.join(' / ')} zijn`);
  if (!DIETEN.includes(r.dieet)) fout(`dieet moet een van ${DIETEN.join(' / ')} zijn`);
  if (!BEREIDINGEN.includes(r.bereiding)) fout(`bereiding moet een van ${BEREIDINGEN.join(' / ')} zijn`);
  if (r.kleur != null && !['tomaat', 'mosterd', 'salie', 'lila', 'wit'].includes(r.kleur)) fout('kleur moet tomaat, mosterd, salie, lila of wit zijn');
  if (!Array.isArray(r.ingredienten) || !r.ingredienten.length) fout('ingredienten ontbreekt');
  r.ingredienten.forEach((g, i) => {
    if (!Array.isArray(g.items)) fout(`ingredienten[${i}].items ontbreekt`);
    if (g.keuze != null && typeof g.keuze !== 'string') fout(`ingredienten[${i}].keuze moet tekst zijn`);
    g.items.forEach((it, j) => {
      if (!it.n) fout(`ingredienten[${i}].items[${j}].n ontbreekt`);
      if (!('s' in it) || (it.s !== null && !SOORTEN.includes(it.s))) fout(`ingredienten[${i}].items[${j}].s (soort voor de boodschappenlijst) moet een van ${SOORTEN.join(' / ')} of null zijn`);
      if (it.huis != null && typeof it.huis !== 'boolean') fout(`ingredienten[${i}].items[${j}].huis moet true of false zijn`);
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

// Vaste standaardeenheden voor groente & fruit. Grote groenten in hele of halve stuks (eventueel met gewicht in haakjes),
// de rest per gewicht. Producten die hier niet in staan mogen kiezen, maar dan overal hetzelfde (zie hieronder).
const STUKS = /\b(paprika|courgette|prei|ui|sjalot|winterpeen|aubergine|komkommer|venkel|bloemkool|broccoli|spitskool|savooiekool)\b/;
const GEWICHT = /(aardappel|sperziebonen|cherry|champignon|doperwten|bimi|spinazie|wortel)/;
for (const r of recepten) for (const g of r.ingredienten) for (const it of g.items) {
  if (it.s !== 'groente & fruit' || it.q == null || it.u === 'el' || it.u === 'tl') continue;
  const naam = it.n.replace(/\s*\(.*?\)/g, '').split(',')[0].toLowerCase();
  if (STUKS.test(naam) && (it.u === 'g' || it.u === 'ml')) throw new Error(`${r.id}: "${it.n}" moet in hele of halve stuks (eventueel met gewicht in haakjes, bijv. "1 kleine prei (ca. 100 g)")`);
  if (GEWICHT.test(naam) && it.u !== 'g') throw new Error(`${r.id}: "${it.n}" moet per gewicht (g)`);
}

// Eén standaardeenheid per product: hetzelfde product mag niet in het ene recept per stuk en in het andere per gewicht staan.
const productNaam = it => (it.p || it.n.replace(/\s*\(.*?\)/g, '').split(',')[0]).trim().toLowerCase();
const eenheden = new Map();
for (const r of recepten) for (const g of r.ingredienten) for (const it of g.items) {
  if (it.s == null || it.q == null || it.u === 'el' || it.u === 'tl') continue;
  const soort = it.u === 'g' || it.u === 'ml' ? 'gewicht' : 'stuks', naam = productNaam(it), eerder = eenheden.get(naam);
  if (eerder && eerder.soort !== soort) throw new Error(`"${naam}" staat per ${eerder.soort} in ${eerder.id} en per ${soort} in ${r.id}. Kies één standaardeenheid: grote groenten (paprika, courgette, prei, ui) per stuk, de rest per gewicht.`);
  if (!eerder) eenheden.set(naam, { soort, id: r.id });
}

const iconen = new Set((await readdir(path.join(root, 'site', 'iconen'))).filter(f => f.endsWith('.svg')));
for (const r of recepten) {
  if (!iconen.has(`${r.id}.svg`)) console.warn(`Let op: geen icoon voor ${r.id}, de site toont _standaard.svg`);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'site'), out, { recursive: true });
await writeFile(path.join(out, 'recepten.json'), JSON.stringify({ versie: 1, recepten }));

// Service worker: lijst van alle bestanden (voor offline gebruik) en een versie die verandert zodra er iets wijzigt.
const alle = (await readdir(out, { recursive: true, withFileTypes: true }))
  .filter(d => d.isFile()).map(d => path.relative(out, path.join(d.parentPath, d.name)).split(path.sep).join('/'))
  .filter(f => f !== 'sw.js' && f !== 'index.html' && f !== 'app/icoon.svg').sort();
const hash = createHash('sha256');
for (const f of ['index.html', 'sw.js', ...alle]) hash.update(f).update(await readFile(path.join(out, f)));
const sw = (await readFile(path.join(out, 'sw.js'), 'utf8'))
  .replace('__VERSIE__', hash.digest('hex').slice(0, 10))
  .replace("['__BESTANDEN__']", JSON.stringify(['./', ...alle]));
await writeFile(path.join(out, 'sw.js'), sw);

console.log(`${recepten.length} recepten gebouwd naar _site/`);
