# Kookboek

Mijn persoonlijke receptenverzameling als kleine website, gehost op GitHub Pages.

## Opbouw

- `recepten/` – één JSON-bestand per recept. De bestandsnaam is het `id` en het anker in de URL (`#plaattaart-rode-pesto`).
- `site/` – de website zelf (`index.html`) en `site/iconen/` met één icoon per recept (zie ICONEN.md).
- `scripts/build.mjs` – controleert de recepten en voegt ze samen tot `_site/recepten.json`.
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
  "status": "Gemaakt",              // of "Wil ik maken"
  "statusNoot": "zonder oven",      // optioneel
  "tijd": 30,                       // minuten
  "personen": 2,
  "beoordeling": 4,                 // 1-5 of null
  "bron": "https://…",              // tekst, URL of null
  "hoeveelhedenGeschat": true,      // optioneel
  "tags": ["vegetarisch", "snel"],
  "kleur": "salie",                 // tomaat, mosterd, salie, lila of wit
  "ingredienten": [
    { "groep": null, "items": [
      { "q": 200, "u": "g", "n": "penne" },
      { "q": null, "u": null, "n": "peper en zout" }
    ]},
    { "groep": "Topping", "items": [ … ] }
  ],
  "stappen": ["Stap 1", "Stap 2"],
  "notities": "Tekst"
}
```

Eén hoeveelheid per regel: `q` is een getal (of `null`), `u` de eenheid, `n` de omschrijving. Zo kan de site omrekenen naar meer of minder personen.
