# Workstr

> Less searching. More working.

Website + klikbare platform-MVP volgens de Workstr Master Project Brief.

- **Website** (`index.html` → `src/site/`): opbouw geïnspireerd op bird.com (rustige layout, grote tweekleurige koppen, live productmockups) en jaicob.ai (zoek-hero, feature-tabs, oud-vs-nieuw, AI-agents). Eigen merk, eigen teksten, geen overgenomen code, logo's of claims. Donker standaard, licht/donker-schakelaar.
- **Platform** (`app.html` → `src/platform/`), één ecosysteem, drie interfaces:
  - `#/app`: Candidate App (mobile-first): Discover, Matches, Create, Inbox, Work Profile, Generate CV.
  - `#/business`: Workstr Business: Overview, Vacancies, Talent, Messages, Company, Analytics, Settings.
  - `#/msp`: Workstr MSP: Requests, Workers, Suppliers (+ portal), Compliance, Contracts, Timesheets, Agent Center (no-code agent templates, actielog, menselijke goedkeuring).

Regels (matching, certificaatstatus, compliance, timesheetcontroles, bedragen) zijn gewone code in `src/platform/logic.js`. De "AI"-structurering is een lokale extractor die alleen labelt wat de gebruiker schreef. Alles is demo-data in localStorage (reset: Profile → Demo resetten).

## Starten

Node.js 22.12+.

```sh
npm ci
npm run dev
npm run build
node --test src/platform/logic.test.js   # unit
npm test                                  # Playwright e2e + axe (WCAG AA), Edge
```

## Live

https://semdesnoo.github.io/workstr-project-/ (site) · `/app.html` (platform). Deploy: `dist/` naar branch `gh-pages`.

## Nog niet gebouwd

Echte backend/auth, echte AI-koppeling (server-side key), video, Word/PDF-parsing, facturatie-engine, betalingen. Klantlogo's en testimonials pas na toestemming van echte pilotklanten.

## Media

Werkfoto's in `public/work/` via Unsplash. Font: Geist. Iconen: Phosphor.
