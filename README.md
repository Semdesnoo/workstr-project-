# Workstr

> Less searching. More working.

**AI Recruitment Operating System voor technische recruitment.** Drie delen: Workstr App · Workstr Business · Workstr Managed.

- **Website** (`src/site/`, 10 pagina's: home, professionals, business, managed-services, ai, about, contact, early-access, privacy, terms). Elke pagina is een eigen statische HTML-ingang met title, description, canonical, Open Graph en JSON-LD, gegenereerd door `node scripts/site-pages.mjs` (schrijft ook `public/sitemap.xml` en `robots.txt`). Teksten en demodata staan in `src/site/content.js` (klaar voor CMS/EN). Interactieve demo's in `src/site/demos.jsx`, app-schermen als HTML/CSS in `src/site/screens.jsx`. Formulieren schrijven naar Supabase-tabel `leads` (alleen insert, RLS). Analytics-events (`track()` in `src/site/lib.js`) blijven in de browser tot er consent en een tool is. Media vervangen: paden in `media` bovenin `content.js` (`public/media/`).
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
node --test src/platform/*.test.js src/site/lib.test.js   # unit: matching, engine, agents, formuliervalidatie
npm test                                  # Playwright e2e + axe (WCAG AA), Edge
```

## Live

https://semdesnoo.github.io/workstr-project-/ (site) · `/app.html` (platform). Deploy: GitHub Actions (`deploy.yml`) bij elke push naar `main`.

## Nog niet gebouwd

Echte backend/auth en database, live kanalen (WhatsApp Cloud API, e-mailprovider, LinkedIn-partnerkoppeling, agenda) en een server-side worker voor de wachtrij; echte AI-koppeling (server-side key), video, Word/PDF-parsing, facturatie-engine, betalingen. Klantlogo's en testimonials pas na toestemming van echte pilotklanten.

## Media

Werkfoto's in `public/work/` via Unsplash (jpg + webp). Hero-video's in `public/media/` zijn tijdelijke eigen montages van die foto's; vervang ze door echte Workstr-beelden. Font: Geist. Iconen: Phosphor.
