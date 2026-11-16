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
  "tijd": "30-45",                  // range in minuten: tot 15, 15-30, 30-45, 45-60 of 60+
  "personen": 2,
  "moeite": "gemiddeld",           // makkelijk, gemiddeld of veel werk (los van de tijd)
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
  "notities": "Tekst"
}
```

Eén hoeveelheid per regel: `q` is een getal (of `null`), `u` de eenheid, `n` de omschrijving. Zo kan de site omrekenen naar meer of minder personen.

## Categorieën

Elk recept kiest precies één waarde per categorie (maaltijd mag meer dan één zijn). `node scripts/build.mjs` controleert dit.

| Veld | Waarden |
|---|---|
| `keuken` | vrij, bijv. Mexicaans, Italiaans, Thais, Nederlands |
| `maaltijd` | ontbijt, lunch, diner |
| `dieet` | vega, vlees, vis |
| `bereiding` | oven, één pan, meerdere pannen, BBQ, geen koken |
| `moeite` | makkelijk, gemiddeld, veel werk (los van de tijd) |
| `tijd` | tot 15, 15-30, 30-45, 45-60, 60+ (minuten, een range omdat het afhangt van hoe snel je kookt) |

Er zijn geen losse tags en geen bron meer.

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
