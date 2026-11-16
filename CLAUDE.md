# Instructies voor Claude

- Recepten toevoegen of wijzigen: alleen in `recepten/<id>.json`, volgens het formaat in README.md. Nederlands, metrische eenheden, standaard 2 personen.
- Houd het bijbehorende doc `recepten/<id>.md` in het claude.ai-project "Recepten" gelijk met het JSON-bestand.
- Teken bij elk nieuw recept een icoon `site/iconen/<id>.svg` volgens ICONEN.md (zelfde stijl, palet en lijndiktes als de bestaande iconen).
- Draai `node scripts/build.mjs` voor elke commit; die controleert alle recepten.
- Push naar `main`; GitHub Actions publiceert de site.
- Geen dependencies of frameworks toevoegen zonder overleg.
- Ingrediënten: groepeer per onderdeel van het gerecht in volgorde van gebruik, geef elk ingrediënt een `s` (soort voor het boodschappenlijstje) en eventueel een `p`; zie README.md.
