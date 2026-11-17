# Instructies voor Claude

Deze repo is de bron voor hoe de site werkt. README.md beschrijft het receptformaat en de functies van de site; houd die bij als je iets verandert.

Er zijn twee werkplekken:
- **Claude Code** (deze repo): ontwikkelen van de site zelf.
- **claude.ai-project "Recepten"**: recepten toevoegen en wijzigen. Daar staat per recept ook een md-doc `recepten/<id>.md` dat gelijk blijft aan het JSON-bestand.

## Recepten

- Noem nergens een bron (geen website, auteur of link), ook niet in tips, stappen of commentaar. Als iets uit een link komt, neem alleen de inhoud over.
- Recepten toevoegen of wijzigen: alleen in `recepten/<id>.json`, volgens het formaat in README.md. Nederlands, metrische eenheden, standaard 2 personen.
- Schrijf bij elk nieuw of gewijzigd recept ook de Engelse versie `recepten/<id>.en.json` (zie "Engelse versie" in README.md) en houd die gelijk aan het Nederlandse recept.
- Kies een `kleur` en wissel die af met de bestaande recepten.
- Tips: een korte lijst (maximaal 4) met praktische tips voor wie het recept maakt. Geen persoonlijke opmerkingen ("nog niet gemaakt", "heel lekker"), want de site wordt gedeeld.
- Vul bij elk recept `werk` in (snijwerk, pan, afwas) en laat `moeite` daarbij passen (zie README.md).
- `omschrijving` alleen invullen als Vasko er een geeft of vraagt.
- Teken bij elk nieuw recept een icoon `site/iconen/<id>.svg` volgens ICONEN.md (zelfde stijl, palet en lijndiktes als de bestaande iconen).
- Ingrediënten: groepeer per onderdeel van het gerecht in volgorde van gebruik, geef elk ingrediënt een `s` (soort voor het boodschappenlijstje) en eventueel een `p`; zie README.md.
- Eén standaardeenheid per product: grote groenten (paprika, courgette, prei, ui, winterpeen enz.) in stuks, aardappel, sperziebonen, cherrytomaatjes en dergelijke per gewicht. De lijsten staan bovenin scripts/build.mjs en de build controleert ze. Nieuw product dat vaker voorkomt? Zet het in de juiste lijst.
- Recepten gaan direct naar `main`.

## Site ontwikkelen

- Werk op een branch en open een PR naar `main`, zodat het niet botst met recepten die vanuit het project naar `main` gaan. Haal voor je begint de laatste `main` op.
- Ontwerp: richting B "Kleurrijke receptkaarten" van het designcanvas "Kookboek – designrichtingen" (https://claude.ai/artifact/APSMt8PxZVcn4hEGjduSwQ), met de eigen iconenset.
- Geen beoordelingen (1-5), geen status (gemaakt / wil ik maken), geen bron en geen losse tags: alleen recepten die Vasko lekker vindt, met een favoriet-vlag. Geen extra categorieën zoals basis, praktisch of pittigheid.
- Verander je het receptformaat (nieuw of gewijzigd veld), pas dan ook README.md, de controles in `scripts/build.mjs` en alle bestaande recepten aan. Het project leest README.md voordat het een recept maakt.
- Geen dependencies of frameworks toevoegen zonder overleg.
- Bekijk wijzigingen lokaal (`node scripts/build.mjs` en `npx serve _site`), ook op telefoonbreedte (Chrome op Android).

## Altijd

- Draai `node scripts/build.mjs` voor elke commit; die controleert alle recepten.
- Push naar `main` (of merge de PR); GitHub Actions publiceert de site.
