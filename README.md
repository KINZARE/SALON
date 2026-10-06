# Shared Money

Nederlandse, lokale app voor gedeelde uitgaven. Maak groepen en deelnemers, verdeel bedragen gelijk, exact, per aandeel of percentage, bekijk saldi en leg reeds uitgevoerde verrekeningen vast. Uitgaven kunnen worden bewerkt, verwijderd en hersteld. Bonfoto's, zoeken, wijzigingshistorie, CSV-export en JSON-reservekopieën zijn inbegrepen.

## Huidige grenzen

- Gegevens staan uitsluitend in IndexedDB van deze browser. Geen login, Supabase-verbinding, bankkoppeling, echte betaling of abonnement.
- Een deellink bevat een onafhankelijke momentopname; wijzigingen synchroniseren niet. Bonfoto's worden niet meegedeeld.
- Betalingen registreren alleen wat buiten de app al is betaald.
- Maak reservekopieën voordat je browsergegevens wist. Maximum 32 MB per werkruimte/reservekopie en 2 MB per bonfoto.
- Een groep gebruikt één valuta; geen wisselkoersen. Alle ondersteunde valuta gebruiken twee decimalen.
- Na de eerste geslaagde online laadbeurt en installatie van de serviceworker werkt de app offline. Een nieuwe release ververst de cache; browsergegevens blijven behouden.

## Ontwikkelen en verifiëren

Node.js 22 of hoger.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run build` exporteert naar `out` en genereert een serviceworker met alle productieassets en een inhoudsafhankelijke cacheversie. De Playwright-configuratie start automatisch de statische testserver. `E2E_URL` selecteert een bestaande deployment; `PLAYWRIGHT_EXECUTABLE_PATH` selecteert een eigen Chromium-binary.

## Render

Statische site, branch `deploy/shared-money`, build `npm ci --no-audit --no-fund && npm run build`, publish directory `out`. Geen secrets nodig. `render.yaml` is de equivalente configuratie voor een toekomstige Blueprint. Deze zelfstandige app staat uitsluitend op de deploymentbranch, zonder wijzigingen aan SALON main.

## Later uitbreiden

De `WorkspaceRepository`-interface scheidt opslag van presentatie en berekeningen. Een toekomstige serverrepository heeft ook autorisatie, servervalidatie en conflictcontrole nodig. De huidige deellinks zijn geen samenwerkingsprotocol en de huidige identiteit is geen geverifieerd account.
