// Bouwt de site: voegt recepten/*.json samen tot _site/recepten.json en kopieert site/.
// De Engelse versie (recepten/<id>.en.json) komt in _site/recepten.en.json en de pagina in _site/en/.
// Geen dependencies nodig. Gebruik: node scripts/build.mjs
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, '_site');
const MOEITE = ['weinig werk', 'gemiddeld', 'veel werk'];
// Moeite = hoeveel werk je eraan hebt (niet hoe moeilijk het is), opgebouwd uit snijwerk, aan de pan staan en afwas.
const WERK = ['snijwerk', 'pan', 'afwas'];
const NIVEAUS = ['weinig', 'gemiddeld', 'veel'];
const TIJDEN = ['tot 15', '15-30', '30-45', '45-60', '60+'];
const MAALTIJDEN = ['ontbijt', 'lunch', 'diner'];
const DIETEN = ['vega', 'vlees', 'vis'];
const SOORTEN = ['groente & fruit', 'vlees, vis & vega', 'zuivel & eieren', 'brood & deeg', 'pasta, rijst & granen', 'conserven & potten', 'sauzen & olie', 'kruiden & specerijen', 'overig houdbaar'];
const BEREIDINGEN = ['oven', 'één pan', 'meerdere pannen', 'BBQ', 'geen koken'];
// Eenheden die de site kent (en vertaalt); null = stuks of geen hoeveelheid.
const EENHEDEN = ['g', 'ml', 'el', 'tl', 'teentje', 'rol', 'zak', 'pakje', 'handje', 'blokje'];
// Let op: de Engelse namen van deze vaste waarden staan in site/index.html (WAARDEN_EN en EENHEDEN).

function controleer(r, bestand) {
  const fout = m => { throw new Error(`${bestand}: ${m}`); };
  const id = path.basename(bestand, '.json');
  if (r.id !== id) fout(`id "${r.id}" moet gelijk zijn aan de bestandsnaam "${id}"`);
  if (!r.titel) fout('titel ontbreekt');
  if ('status' in r || 'statusNoot' in r) fout('status bestaat niet meer');
  if (!TIJDEN.includes(r.tijd)) fout(`tijd moet een van ${TIJDEN.join(' / ')} zijn (range in minuten)`);
  if (!Number.isFinite(r.personen)) fout('personen ontbreekt');
  if (!MOEITE.includes(r.moeite)) fout(`moeite moet een van ${MOEITE.join(' / ')} zijn`);
  if (r.werk != null) {
    if (typeof r.werk !== 'object' || Object.keys(r.werk).sort().join() !== [...WERK].sort().join() || !WERK.every(k => NIVEAUS.includes(r.werk[k]))) fout(`werk moet { snijwerk, pan, afwas } zijn, elk ${NIVEAUS.join(' / ')}`);
    const som = WERK.reduce((t, k) => t + NIVEAUS.indexOf(r.werk[k]) + 1, 0);
    const verwacht = som <= 4 ? 'weinig werk' : som <= 7 ? 'gemiddeld' : 'veel werk';
    if (r.moeite !== verwacht) fout(`moeite moet "${verwacht}" zijn bij dit werk (weinig = 1, gemiddeld = 2, veel = 3; totaal 3-4 weinig werk, 5-7 gemiddeld, 8-9 veel werk)`);
  }
  if (r.omschrijving != null && (typeof r.omschrijving !== 'string' || r.omschrijving.length > 160)) fout('omschrijving moet een korte tekst zijn (maximaal 160 tekens); laat het veld weg als er geen omschrijving is');
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
      if (it.u != null && !EENHEDEN.includes(it.u)) fout(`ingredienten[${i}].items[${j}].u moet een van ${EENHEDEN.join(' / ')} of null zijn`);
    });
  });
  if (!Array.isArray(r.stappen) || !r.stappen.length) fout('stappen ontbreekt');
}

// Tijden in een stap, zoals site/index.html ze als timer herkent (TIJD_RE daar), omgerekend naar seconden.
const TIJD_RE = /(\d+(?:[.,]\d+)?)(?:\s*(?:–|-|tot|to)\s*(\d+(?:[.,]\d+)?))?\s*(minuten|minuut|minutes|minute|mins|min|uur|hours|hour|hrs|hr|seconden|seconds|secs|sec)\b/gi;
const tijden = t => [...t.matchAll(TIJD_RE)].map(m => {
  const u = m[3].toLowerCase(), sec = /^(uur|hour|hr)/.test(u) ? 3600 : /^sec/.test(u) ? 1 : 60;
  return [m[1], m[2]].filter(Boolean).map(x => Math.round(parseFloat(x.replace(',', '.')) * sec)).join('-') + 's';
});

// Engelse versie: alleen de teksten, in precies dezelfde opbouw als het Nederlandse recept.
const EN_VELDEN = ['titel', 'omschrijving', 'keuken', 'ingredienten', 'stappen', 'tips'];
function controleerEngels(r, e, bestand) {
  const fout = m => { throw new Error(`${bestand}: ${m}`); };
  const tekst = v => typeof v === 'string' && v.trim() !== '';
  const alleen = (o, velden, w) => { for (const k of Object.keys(o)) if (!velden.includes(k)) fout(`${w}veld "${k}" hoort niet in de Engelse versie (alleen ${velden.join(', ')}; de rest komt uit het Nederlandse recept)`); };
  const optioneel = (nl, en, w) => { if (/optioneel/i.test(nl || '') !== /optional/i.test(en || '')) fout(`${w}: "optioneel" in het Nederlands moet "optional" zijn in het Engels (en andersom)`); };
  alleen(e, EN_VELDEN, '');
  if (!tekst(e.titel)) fout('titel ontbreekt');
  if (!tekst(e.keuken)) fout('keuken ontbreekt (in het Engels, bijv. Mexican)');
  if ((r.omschrijving != null) !== (e.omschrijving != null)) fout('omschrijving moet in beide talen staan of in geen van beide');
  if (e.omschrijving != null && (!tekst(e.omschrijving) || e.omschrijving.length > 160)) fout('omschrijving moet een korte tekst zijn (maximaal 160 tekens)');
  if (!Array.isArray(e.ingredienten) || e.ingredienten.length !== r.ingredienten.length) fout(`ingredienten moet ${r.ingredienten.length} groepen hebben, net als het Nederlandse recept`);
  r.ingredienten.forEach((g, i) => {
    const eg = e.ingredienten[i], w = `ingredienten[${i}]`;
    if (!eg || typeof eg !== 'object') fout(`${w} ontbreekt`);
    alleen(eg, ['groep', 'keuze', 'items'], w + ': ');
    if ((g.groep == null) !== (eg.groep == null) || (eg.groep != null && !tekst(eg.groep))) fout(`${w}.groep moet ${g.groep == null ? 'null' : 'ingevuld'} zijn, net als in het Nederlands`);
    if ((g.keuze == null) !== (eg.keuze == null) || (eg.keuze != null && !tekst(eg.keuze))) fout(`${w}.keuze moet ${g.keuze == null ? 'leeg' : 'ingevuld'} zijn, net als in het Nederlands`);
    optioneel(g.groep, eg.groep, w + '.groep');
    if (!Array.isArray(eg.items) || eg.items.length !== g.items.length) fout(`${w}.items moet ${g.items.length} ingrediënten hebben, net als in het Nederlands`);
    g.items.forEach((it, j) => {
      const ei = eg.items[j], wi = `${w}.items[${j}]`;
      if (!ei || typeof ei !== 'object') fout(`${wi} ontbreekt`);
      alleen(ei, ['n', 'p'], wi + ': ');
      if (!tekst(ei.n)) fout(`${wi}.n ontbreekt`);
      if (ei.p != null && !tekst(ei.p)) fout(`${wi}.p moet tekst zijn`);
      optioneel(it.n, ei.n, wi + '.n');
    });
  });
  // Dezelfde keuze (bijv. Saus) moet in alle groepen dezelfde Engelse naam hebben.
  const keuzes = new Map();
  r.ingredienten.forEach((g, i) => {
    if (g.keuze == null) return;
    const en = e.ingredienten[i].keuze;
    if (keuzes.has(g.keuze) && keuzes.get(g.keuze) !== en) fout(`keuze "${g.keuze}" heeft twee Engelse namen: "${keuzes.get(g.keuze)}" en "${en}"`);
    keuzes.set(g.keuze, en);
  });
  if (!Array.isArray(e.stappen) || e.stappen.length !== r.stappen.length || !e.stappen.every(tekst)) fout(`stappen moet ${r.stappen.length} stappen hebben, net als in het Nederlands`);
  // Tijden in stappen worden op de site een timer; die moeten in beide talen hetzelfde zijn.
  r.stappen.forEach((st, i) => {
    const nl = tijden(st).join(', '), en = tijden(e.stappen[i]).join(', ');
    if (nl !== en) fout(`stappen[${i}]: tijden voor de timer verschillen (Nederlands: ${nl || 'geen'}, Engels: ${en || 'geen'}). Schrijf ze als "8 min", "20–25 min" of "1 uur" / "1 hour"`);
  });
  const tips = (r.tips || []).length;
  if ((e.tips || []).length !== tips || (e.tips != null && (!Array.isArray(e.tips) || !e.tips.every(tekst)))) fout(`tips moet ${tips} tips hebben, net als in het Nederlands`);
}

const dir = path.join(root, 'recepten');
const alleBestanden = (await readdir(dir)).filter(f => f.endsWith('.json')).sort();
const bestanden = alleBestanden.filter(f => !f.endsWith('.en.json'));
const recepten = [], engels = new Map();
for (const f of bestanden) {
  const r = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
  controleer(r, f);
  recepten.push(r);
  const fe = f.replace(/\.json$/, '.en.json');
  if (alleBestanden.includes(fe)) {
    const e = JSON.parse(await readFile(path.join(dir, fe), 'utf8'));
    controleerEngels(r, e, fe);
    engels.set(r.id, e);
  } else console.warn(`Let op: geen Engelse versie voor ${r.id} (${fe}), de Engelse site toont het recept in het Nederlands`);
}
for (const f of alleBestanden) {
  if (f.endsWith('.en.json') && !bestanden.includes(f.replace(/\.en\.json$/, '.json'))) throw new Error(`${f}: er is geen Nederlands recept met dit id`);
}
// Dezelfde keuken heeft overal dezelfde Engelse naam.
const keukenEN = new Map();
for (const r of recepten) {
  const e = engels.get(r.id);
  if (!e) continue;
  if (keukenEN.has(r.keuken) && keukenEN.get(r.keuken) !== e.keuken) throw new Error(`${r.id}.en.json: keuken "${r.keuken}" heet elders "${keukenEN.get(r.keuken)}", niet "${e.keuken}"`);
  keukenEN.set(r.keuken, e.keuken);
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

// Engelse recepten: het Nederlandse recept met de Engelse teksten erin. k = Nederlandse productnaam, zodat het
// boodschappenlijstje in beide talen dezelfde producten optelt en afvinkt. keuze blijft Nederlands (sleutel), keuzeNaam is Engels.
const receptenEN = recepten.map(r => {
  const k = structuredClone(r), e = engels.get(r.id);
  k.ingredienten.forEach(g => g.items.forEach(it => { it.k = productNaam(it); }));
  if (!e) return { ...k, keuken: keukenEN.get(r.keuken) || r.keuken, nl: true };
  k.titel = e.titel;
  if (e.omschrijving != null) k.omschrijving = e.omschrijving;
  k.keuken = e.keuken;
  k.ingredienten.forEach((g, i) => {
    const eg = e.ingredienten[i];
    g.groep = eg.groep;
    if (g.keuze != null) g.keuzeNaam = eg.keuze;
    g.items.forEach((it, j) => { it.n = eg.items[j].n; if (eg.items[j].p != null) it.p = eg.items[j].p; else delete it.p; });
  });
  k.stappen = e.stappen;
  if (e.tips != null) k.tips = e.tips;
  return k;
});
await writeFile(path.join(out, 'recepten.en.json'), JSON.stringify({ versie: 1, recepten: receptenEN }));

// Engelse pagina: dezelfde index.html met lang="en"; vaste bestanden staan een map hoger.
let html = await readFile(path.join(out, 'index.html'), 'utf8');
for (const [a, b] of [['<html lang="nl">', '<html lang="en">'], ['<title>Kookboek</title>', '<title>Cookbook</title>'], ['href="iconen/', 'href="../iconen/'], ['href="app/', 'href="../app/']]) {
  if (!html.includes(a)) throw new Error(`site/index.html: "${a}" niet gevonden, nodig voor de Engelse versie`);
  html = html.replaceAll(a, b);
}
await mkdir(path.join(out, 'en'), { recursive: true });
await writeFile(path.join(out, 'en', 'index.html'), html);
const manifest = JSON.parse(await readFile(path.join(out, 'manifest.webmanifest'), 'utf8'));
const naarBoven = l => l.map(i => ({ ...i, src: '../' + i.src }));
await writeFile(path.join(out, 'en', 'manifest.webmanifest'), JSON.stringify({
  ...manifest, name: 'Cookbook', short_name: 'Cookbook', description: 'My recipes and shopping list', lang: 'en',
  start_url: './', scope: '../', icons: naarBoven(manifest.icons),
  shortcuts: manifest.shortcuts.map(s => ({ ...s, name: 'Shopping list', url: './#boodschappen', icons: naarBoven(s.icons) }))
}, null, 2));

// Service worker: lijst van alle bestanden (voor offline gebruik) en een versie die verandert zodra er iets wijzigt.
const alle = (await readdir(out, { recursive: true, withFileTypes: true }))
  .filter(d => d.isFile()).map(d => path.relative(out, path.join(d.parentPath, d.name)).split(path.sep).join('/'))
  .filter(f => f !== 'sw.js' && f !== 'index.html' && f !== 'en/index.html' && f !== 'app/icoon.svg').sort();
const hash = createHash('sha256');
for (const f of ['index.html', 'en/index.html', 'sw.js', ...alle]) hash.update(f).update(await readFile(path.join(out, f)));
const sw = (await readFile(path.join(out, 'sw.js'), 'utf8'))
  .replace('__VERSIE__', hash.digest('hex').slice(0, 10))
  .replace("['__BESTANDEN__']", JSON.stringify(['./', 'en/', ...alle]));
await writeFile(path.join(out, 'sw.js'), sw);

console.log(`${recepten.length} recepten gebouwd naar _site/ (${engels.size} met Engelse versie, in _site/en/)`);
