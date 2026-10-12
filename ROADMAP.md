# Workstr Roadmap

**Workstr: AI Recruitment Operating System voor technische recruitment.**
Drie delen: **App** (kandidaten), **Business** (ATS/CRM + agents), **Managed** (externe inhuur).

Principe: eerst bouwen en bewijzen met testdata. KvK, Meta-verificatie en betalende klanten pas zodra het werkt.

## Waar we staan

| Onderdeel | Status |
|---|---|
| Website (`index.html`) | Live op GitHub Pages. Etalage, af voor nu. |
| App / Business / Managed (`app.html`) | Klikbare demo; data in de browser (localStorage). |
| Logica: `logic.js`, `engine.js`, `agents.js` | Echte, geteste code (14 tests). Gaat mee naar de backend. |
| Database, login, server, kanalen, AI | Nog niet gebouwd. Dat is de volgende stap. |

## Fases

Elke fase is pas af als het "Klaar als"-criterium echt werkt.

### Fase 1: Fundament (geen KvK nodig)
- Next.js + Supabase (Postgres, Auth, Storage) + Vercel, gratis tiers.
- Datamodel: companies, members (rollen), candidates, certificates, documents, vacancies, applications, messages, events, workflows, workflow_runs, outbound_jobs, approvals, agent_runs, audit_log.
- Row Level Security: elk bedrijf ziet alleen eigen data.
- `logic.js`/`engine.js`/`agents.js` server-side, tests blijven draaien.
- Seed met **fictieve testdata**, geen echte persoonsgegevens.

**Klaar als:** inloggen als recruiter van bedrijf A toont alleen data van A; de tests draaien tegen de database.

### Fase 2: Laag 1 live (ATS/CRM)
- Kandidaten, vacatures, pipeline, agenda en workflows op de echte database.
- Cv uploaden → profiel (AI-extractie, mens controleert).

**Klaar als:** een recruiter een week kan werken zonder de demo.

### Fase 3: Achtergrond + e-mail (geen KvK nodig)
- Verzendwachtrij als server-worker (cron/queue) in plaats van de browser-timer.
- E-mail via Resend (gratis tier). Eigen domein van ±€10/jaar, geen KvK nodig.

**Klaar als:** workflows versturen e-mail terwijl niemand de app open heeft; mislukte berichten worden opnieuw geprobeerd.

### Fase 4: Agents met echte AI
- Vacancy-, Outreach- en Screening-agent met een AI-model server-side; sleutel nooit in de browser.
- Human Approval blijft de poort voor afwijzen, twijfel en aanbod.

**Klaar als:** de volledige flow draait op echte data met echte tekstgeneratie.

### Fase 5: Kandidaten-app
- PWA (installeerbaar via de browser) op dezelfde backend: Work Profile, Discover, matches, chat, CV.
- Native app (App Store/Play) pas na bewezen gebruik.

**Klaar als:** een kandidaat zich aanmeldt, matches ziet en een recruiter hem in Business terugvindt.

### Fase 6: Formaliseren (nu wel KvK)
- KvK, privacyverklaring, verwerkersovereenkomst, AI Act-transparantie.
- Meta Business-verificatie → WhatsApp live.
- LinkedIn-partneraanvraag (optioneel, geen afhankelijkheid).
- Eerste pilotklant met echte data.

### Fase 7: Managed
- Requests, leveranciers, compliance, contracten, uren.

## Zonder KvK

| Kan nu | Wacht op KvK |
|---|---|
| Supabase, Vercel, GitHub (gratis) | Betalende klanten / facturen |
| Domein + e-mail via Resend | WhatsApp met eigen nummer live (Meta-verificatie) |
| AI-API's (persoonlijk account) | LinkedIn-partnerprogramma |
| WhatsApp **testnummer** van Meta (max. 5 testontvangers) | Echte kandidaatdata van derden verwerken |

## Bewust niet nu
Meer demo-schermen, Managed, native apps, LinkedIn-scraping (tegen hun voorwaarden), nieuwe agents.
