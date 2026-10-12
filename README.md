# Workstr

> Less searching. More working.

**AI Recruitment Operating System voor technische recruitment.** Drie delen: Workstr App · Workstr Business · Workstr Managed.

- **Website** (`index.html` → `src/site/`): opbouw geïnspireerd op bird.com (rustige layout, grote tweekleurige koppen, live productmockups) en jaicob.ai (zoek-hero, feature-tabs, oud-vs-nieuw, AI-agents). Eigen merk, eigen teksten, geen overgenomen code, logo's of claims. Donker standaard, licht/donker-schakelaar.
- **Platform** (`app.html` → `src/platform/`), één ecosysteem, drie interfaces:
  - `#/app`: Candidate App (mobile-first): Discover, Matches, Create, Inbox, Work Profile, Generate CV.
  - `#/business`: Workstr Business, het AI Recruitment OS.
    - Laag 1, ATS/CRM: kandidaten, vacatures, matchscore, pipeline (kanban), omnichannel berichten, agenda, triggers en workflows.
    - Laag 2, automation: sourcing uit externe databases/LinkedIn, integraties (WhatsApp, e-mail, agenda) en een betrouwbare verzendwachtrij (idempotency, retries met backoff, dead-letter).
    - 8 agents (`src/platform/agents.js`): Vacancy, Matching, Talent, Outreach, Screening, Compliance, Human Approval, Interview. Plus één volledige flow; afwijzen, twijfel en aanbod gaan altijd langs een mens.
  - `#/managed`: Workstr Managed (MSP): Requests, Workers, Suppliers (+ portal), Compliance, Contracts, Timesheets, Agent Center.

Regels (matching, certificaatstatus, compliance, timesheetcontroles, bedragen) zijn gewone code in `src/platform/logic.js`. De "AI"-structurering is een lokale extractor die alleen labelt wat de gebruiker schreef. Alles is demo-data in localStorage (reset: Profile → Demo resetten).

## Architectuur

```
WORKSTR ── App (candidates) · Business (employers) · MSP (enterprise)   src/platform/Candidate.jsx, Desk.jsx
   │
WORKSTR ENGINE
   ├── Matching   skills, projects, preferences, location     src/platform/logic.js  (matchJob, km)
   ├── AI Agents  support, compliance, recruitment, supplier, finance   Desk.jsx Agent Center + logic.js rules
   └── Data layer profiles, vacancies, contracts, documents, messages   src/platform/data.js + localStorage store
```

## Starten

Node.js 22.12+.

```sh
npm ci
npm run dev
npm run build
node --test src/platform/*.test.js       # unit: matching, engine, agents
npm test                                  # Playwright e2e + axe (WCAG AA), Edge
```

## Live

https://semdesnoo.github.io/workstr-project-/ (site) · `/app.html` (platform). Deploy: `dist/` naar branch `gh-pages`.

## Nog niet gebouwd

Echte backend/auth en database, live kanalen (WhatsApp Cloud API, e-mailprovider, LinkedIn-partnerkoppeling, agenda) en een server-side worker voor de wachtrij; echte AI-koppeling (server-side key), video, Word/PDF-parsing, facturatie-engine, betalingen. Klantlogo's en testimonials pas na toestemming van echte pilotklanten.

## Media

Werkfoto's in `public/work/` via Unsplash. Font: Geist. Iconen: Phosphor.
