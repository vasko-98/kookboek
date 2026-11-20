# Kookboek

Mijn persoonlijke receptenverzameling als kleine website, gehost op GitHub Pages.

## Opbouw

- `recepten/` – één JSON-bestand per recept. De bestandsnaam is het `id` en het anker in de URL (`#plaattaart-rode-pesto`). Daarnaast `<id>.en.json` met de Engelse tekst (zie Engelse versie).
- `site/` – de website zelf (`index.html`) en `site/iconen/` met één icoon per recept (zie ICONEN.md).
- `site/manifest.webmanifest`, `site/sw.js` en `site/app/` – maken de site installeerbaar als app en offline bruikbaar (zie hieronder).
- `scripts/build.mjs` – controleert de recepten en voegt ze samen tot `_site/recepten.json`, en voor de Engelse site tot `_site/recepten.en.json` en `_site/en/`.
- `.github/workflows/pages.yml` – bouwt en publiceert bij elke push naar `main`.

## Lokaal bekijken

```
node scripts/build.mjs
npx serve _site
```

## Receptformaat

```json
{
  "id": "naam-van-recept",
  "titel": "Naam van recept",
  "omschrijving": "Korte omschrijving",  // optioneel, 1-2 zinnen, maximaal 160 tekens
  "tijd": "30-45",                  // range in minuten: tot 15, 15-30, 30-45, 45-60 of 60+
  "personen": 2,
  "moeite": "gemiddeld",           // weinig werk, gemiddeld of veel werk (los van de tijd)
  "werk": { "snijwerk": "gemiddeld", "pan": "weinig", "afwas": "gemiddeld" },  // optioneel, zie Moeite
  "favoriet": true,                 // optioneel, standaard false
  "hoeveelhedenGeschat": true,      // optioneel
  "keuken": "Mexicaans",
  "maaltijd": ["diner"],            // ontbijt, lunch en/of diner
  "dieet": "vega",                  // vega, vlees of vis
  "bereiding": "oven",              // oven, één pan, meerdere pannen, BBQ of geen koken
  "kleur": "salie",                 // tomaat, mosterd, salie, lila of wit
  "ingredienten": [
    { "groep": null, "items": [
      { "q": 200, "u": "g", "n": "penne" },
      { "q": null, "u": null, "n": "peper en zout" }
    ]},
    { "groep": "Topping", "items": [ … ] }
  ],
  "stappen": ["Stap 1", "Stap 2"],
  "tips": ["Korte tip 1", "Korte tip 2"]   // optioneel, maximaal 4
}
```

`omschrijving` is optioneel: 1–2 zinnen over het gerecht en wanneer het past. Op de receptpagina staat hij onder de titel, bij "Favoriet van vandaag" als één regel, en het zoekveld zoekt erin. Is hij leeg of ontbreekt hij, dan wordt niets getoond.

**Tijden in stappen** worden op de site een timerknop. Schrijf ze als getal plus eenheid: "8 min", "20–25 min", "1 uur" (Engels: "8 min", "1 hour"). Bij een range loopt de timer tot de kortste tijd. De build controleert dat elke Nederlandse stap dezelfde tijden heeft als de Engelse.

**Hoeveelheden in stappen en tips** staan tussen accolades, zodat de site ze meerekent met het aantal personen: "Breng de kokosmelk met {200 ml} water aan de kook", "Bak in {1 el} olie", "{¾ tl} uienpoeder", "{2}" (stuks). Eenheden: `g`, `ml`, `el`, `tl` (Engels: `g`, `ml`, `tbsp`, `tsp`). De afronding is dezelfde als bij de ingrediënten. Noem geen vast aantal borden of personen ("verdeel over de borden", niet "over twee borden"). De build stopt bij een hoeveelheid zonder accolades en controleert dat Nederlands en Engels dezelfde hoeveelheden hebben (el = tbsp, tl = tsp). Maten die niet meeschalen, zoals "20 x 15 cm" of "180 °C", krijgen geen accolades.

Eén hoeveelheid per regel: `q` is een getal (of `null`), `u` de eenheid, `n` de omschrijving. Zo kan de site omrekenen naar meer of minder personen.

`u` is een van `g`, `ml`, `el`, `tl`, `teentje`, `rol`, `zak`, `pakje`, `handje`, `blokje`, of `null` (stuks of geen hoeveelheid). De site vertaalt deze eenheden; een nieuwe eenheid moet ook in `EENHEDEN` in `site/index.html` en `scripts/build.mjs`.

## Engelse versie

De site is ook in het Engels: `/en/` (bijv. `/en/#plaattaart-rode-pesto`). Bovenaan het overzicht wisselt de knop EN/NL van taal. Het boodschappenlijstje, de vinkjes en de voortgang zijn in beide talen hetzelfde.

Per recept staat naast `<id>.json` een bestand `<id>.en.json` met alleen de Engelse tekst, in precies dezelfde opbouw (zelfde groepen, ingrediënten in dezelfde volgorde, zelfde aantal stappen en tips). Hoeveelheden, eenheden, categorieën, kleur en `s` komen uit het Nederlandse bestand.

```json
{
  "titel": "Puff pastry tart with red pesto, roasted vegetables and feta",
  "omschrijving": "…",               // alleen als het Nederlandse recept er een heeft
  "keuken": "Italian",               // dezelfde Nederlandse keuken heeft overal dezelfde Engelse naam
  "ingredienten": [
    { "groep": "Base", "items": [ { "n": "puff pastry (approx. 275 g)" } ] },
    { "groep": "Sauce A (homemade)", "keuze": "Sauce", "items": [ { "n": "small onion", "p": "onion" } ] }
  ],
  "stappen": ["Preheat the oven to 200 °C (fan oven 180 °C).", "…"],
  "tips": ["…"]
}
```

- Brits Engels, metrische eenheden. Eenheden staan niet in de tekst van `n` (die komen uit `u`); in stappen en tips gebruik je tbsp en tsp.
- `groep` is `null` waar de Nederlandse groep `null` is; `keuze` alleen waar het Nederlandse recept er een heeft.
- `p` (optioneel) is de naam op het boodschappenlijstje, zoals in het Nederlands.
- Staat er "optioneel" in de Nederlandse groep of omschrijving, dan moet er "optional" in de Engelse staan (en andersom).
- `node scripts/build.mjs` controleert dit. Ontbreekt `<id>.en.json`, dan geeft de build een waarschuwing en toont de Engelse site het recept in het Nederlands.
- De Engelse namen van de vaste categorieën (maaltijd, dieet, bereiding, moeite, tijd, soort) staan in `WAARDEN_EN` in `site/index.html`.

## Categorieën

Elk recept kiest precies één waarde per categorie (maaltijd mag meer dan één zijn). `node scripts/build.mjs` controleert dit.

| Veld | Waarden |
|---|---|
| `keuken` | vrij, bijv. Mexicaans, Italiaans, Thais, Nederlands |
| `maaltijd` | ontbijt, lunch, diner |
| `dieet` | vega, vlees, vis |
| `bereiding` | oven, één pan, meerdere pannen, BBQ, geen koken |
| `moeite` | weinig werk, gemiddeld, veel werk (los van de tijd, zie hieronder) |
| `tijd` | tot 15, 15-30, 30-45, 45-60, 60+ (minuten, een range omdat het afhangt van hoe snel je kookt) |

Er zijn geen losse tags en geen bron meer.

## Moeite

Moeite gaat over hoeveel werk je aan een recept hebt, niet over hoe moeilijk het is. Het optionele veld `werk` geeft drie onderdelen, elk `weinig`, `gemiddeld` of `veel`:

| Onderdeel | weinig | gemiddeld | veel |
|---|---|---|---|
| `snijwerk` | 1–2 dingen grof snijden | een paar groenten snijden of fijnhakken | veel groenten, fijn snijden of raspen |
| `pan` | vooral wachten (koken, oven) | af en toe omscheppen | steeds erbij staan, meerdere dingen tegelijk |
| `afwas` | één pan of schaal en een snijplank | twee pannen, of pan en schaal | drie of meer pannen, schalen en kommen |

Tel weinig = 1, gemiddeld = 2, veel = 3. Totaal 3–4 = weinig werk, 5–7 = gemiddeld, 8–9 = veel werk. Staat `werk` in het recept, dan controleert de build dat `moeite` hierbij past. De receptpagina toont de drie onderdelen als bolletjes.

## Ingrediënten: groepen en boodschappen

- **Groepen per onderdeel van het gerecht**, in de volgorde van gebruik (bijv. Vulling, Roommengsel, Puree, Bovenop). Kruiden staan bij het onderdeel waarvoor je ze gebruikt; zout, peper en dergelijke onder "Overig". Staat een kruid verdeeld over twee onderdelen, maak dan twee regels.
- **Eén standaardeenheid per product.** Grote groenten (paprika, courgette, prei, ui, sjalot, winterpeen, aubergine, komkommer, venkel, bloemkool, broccoli, spitskool, savooiekool) altijd in hele of halve stuks, eventueel met het gewicht tussen haakjes: "1 kleine prei (ca. 100 g)". Aardappel (ook zoete), sperziebonen, cherrytomaatjes, champignons, doperwten, bimi, spinazie en wortel per gewicht. `node scripts/build.mjs` stopt bij een afwijking; de lijsten staan bovenin dat script. Voor andere producten kies je zelf, maar dan overal hetzelfde: de build stopt ook als een product in het ene recept per stuk en in het andere per gewicht staat.
- **`s` (soort)** per ingrediënt is verplicht en bepaalt de plek in de boodschappennotitie: groente & fruit, vlees, vis & vega, zuivel & eieren, brood & deeg, pasta, rijst & granen, conserven & potten, sauzen & olie, kruiden & specerijen of overig houdbaar. `null` = niet in de notitie (bijv. water).
- **`p` (product)** is optioneel: de naam in de notitie. Standaard is dat `n` zonder haakjes en alles na de eerste komma. Gebruik `p` als dat niet klopt (bijv. `n`: "kleine ui", `p`: "ui"). Zo worden dezelfde producten binnen een recept opgeteld.
- **`keuze`** op een groep, voor alternatieven (bijv. saus A of B): groepen met dezelfde `keuze` komen onderaan de notitie onder "Kies één".
- Staat er "optioneel" in de groepsnaam of omschrijving, dan komt het als "(optioneel)" in de notitie.

- **`huis`** is optioneel (`true`/`false`): overschrijft of iets onder "Waarschijnlijk in huis" valt (zie hieronder).

Op de receptpagina zet de knop "Boodschappen" het recept (voor het gekozen aantal personen) op het boodschappenlijstje; je blijft op het recept. De knop wordt dan "Op lijstje" en opent bij de volgende tik `#boodschappen`. Daar vink je items af, wijzig je het aantal personen, kies je bij alternatieven (saus A of B) en haal je recepten er weer af. Het lijstje is gegroepeerd per soort en wordt in de browser bewaard.

Het lijstje toont winkelhoeveelheden: stuks, zakken, rollen en teentjes worden naar boven afgerond op hele aantallen; gram/ml en lepels van hetzelfde product worden opgeteld tot één getal (el = 15, tl = 5); iets waarvan je alleen lepels nodig hebt staat er zonder hoeveelheid.

Onderaan staat "Waarschijnlijk in huis": kruiden & specerijen, sauzen & olie en overig houdbaar waarvan je alleen lepels of een snufje nodig hebt. Die gaan niet mee bij exporteren, tenzij je ze aantikt.

"Exporteren" deelt de nog niet afgevinkte items als tekst, met één item per regel zodat het in Google Keep (+ > Checkboxes) of Notities (checklist) met één tik een afvinkbaar lijstje wordt. Op een computer wordt een `.txt` gedownload. "Kopieer" kopieert dezelfde tekst.

## Overzicht

- Rechtsboven de taalknop (EN/NL) en het boodschappenlijstje. Daaronder een zoekveld (zoekt ook in de omschrijving), daaronder één regel met favorieten (hartje), Filters (klapt de categorieën open) en sorteren (Snelst, Langst, Favoriet). De filters worden automatisch opgebouwd uit de categorieën in de recepten. Met een filter of zoekterm staat er "n recepten · Wis filters".
- "Favoriet van vandaag" is een lage kaart boven de lijst; hij wisselt per dag en verdwijnt bij filteren of zoeken.
- Receptkaartjes zijn liggend: icoon links, titel en tijd · moeite · keuken rechts. Eén per regel op de telefoon, twee naast elkaar op een breed scherm. Favorieten hebben een hartje op het icoon.

## App en offline

- De site is te installeren op het startscherm (Chrome op Android: menu > "App installeren" of "Toevoegen aan startscherm"). Het app-icoon staat in `site/app/` (`icoon.svg` is de bron van de png's).
- `site/sw.js` is de service worker. De build vult daarin de lijst met bestanden en een versie in; bij elke wijziging aan de site of de recepten verandert die versie en wordt alles opnieuw opgehaald. Nieuwe bestanden in `site/` gaan vanzelf mee.
- Beide talen worden bewaard (`./` en `en/`, met `recepten.json` en `recepten.en.json`). Pagina en recepten komen eerst van het netwerk; na 3 seconden of zonder verbinding uit de opslag op het toestel. Iconen en het lettertype komen altijd uit die opslag.
- Voortgang: het aantal personen en de afgevinkte ingrediënten en stappen per recept worden in de browser bewaard. De vinkjes vervallen na 12 uur, het aantal personen blijft.

## Kookmodus en timers

- Op de receptpagina start "Start kookmodus" (of "Verder in kookmodus" als je al bezig bent) de kookmodus op `#<id>/koken`: één stap per scherm in grote letters, met Vorige/Volgende, vegen of de pijltjestoetsen. Volgende vinkt de stap af, Vorige haalt het vinkje van de vorige stap weg, zodat de voortgang gelijk loopt met de receptpagina. Zijn alle stappen af, dan begint de kookmodus opnieuw bij stap 1.
- Het scherm blijft aan zolang de kookmodus open is. De knop Ingrediënten toont de lijst (met vinkjes) zonder de kookmodus te verlaten. Sluiten (✕, Esc of de terugknop van de telefoon) gaat terug naar het recept, bij de stap waar je bent.
- Tijden in een stap (zie Receptformaat) zijn timerknoppen, op de receptpagina en in de kookmodus. Lopende timers staan in een balk onderaan elke pagina, met pauze, +1 minuut en stop. Ze lopen door na herladen (bewaard in de browser, maximaal 12 uur).
- Is een timer klaar, dan piept de site (elke paar seconden, maximaal 2 minuten), trilt de telefoon en knippert de balk tot je op Stop tikt. Staat de site niet in beeld, dan komt er een melding (toestemming wordt gevraagd bij de eerste timer). Op de achtergrond kan die melding door de browser tot een minuut later komen.

