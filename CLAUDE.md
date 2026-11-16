# Instructies voor Claude

- Recepten toevoegen of wijzigen: alleen in `recepten/<id>.json`, volgens het formaat in README.md. Nederlands, metrische eenheden, standaard 2 personen.
- Houd het bijbehorende doc `recepten/<id>.md` in het claude.ai-project "Recepten" gelijk met het JSON-bestand.
- Draai `node scripts/build.mjs` voor elke commit; die controleert alle recepten.
- Push naar `main`; GitHub Actions publiceert de site.
- Geen dependencies of frameworks toevoegen zonder overleg.
