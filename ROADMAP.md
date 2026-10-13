# Workstr Roadmap

**Eén loop eerst:** Work Profile → laat zien wat je deed → Workstr begrijpt je ervaring → ontdek kansen → zie waarom je matcht → interesse → bedrijf ziet je echte profiel → chat → hire.

Alles wat die loop niet sneller of beter maakt, wacht. Bouwen en testen gebeurt met testdata; KvK pas bij de eerste echte pilot.

## Waar we staan

| Onderdeel | Status |
|---|---|
| Website | Live (GitHub Pages). Af voor nu. |
| Database + login + afscherming per bedrijf | Live op Supabase. Migraties en tests via GitHub Actions. |
| Business ATS + 8 agents (`#/business`) | Werkt op Supabase, maar is **meer dan V1 nodig heeft**. Geparkeerd; code blijft staan. |
| Candidate App: Work Profile, Discover, Matches, Chat, CV (`#/app`) | Klikbare demo in localStorage. **Hier ligt de focus.** |
| Managed (MSP) | Demo. Geparkeerd. |

## Besluiten

**Twee soorten profielen.**
- *Work Profile*: van de professional zelf (freelancer/zzp of in vaste dienst, wel of niet zoekend). Een bedrijf ziet het alleen na interesse van de professional of als die "vindbaar" aanzet.
- *Beheerd profiel*: van een bedrijf (eigen pool, CRM, leverancier). Alleen zichtbaar voor dat bedrijf. Het bedrijf kan de persoon uitnodigen het profiel over te nemen → wordt een Work Profile; het bedrijf houdt toegang via de koppeling.

**Matching = gewogen score + harde poort.** Skills 30, ervaring 20, certificaten 20, locatie 10, beschikbaarheid 10, tarief 5, contract 5. Mist een verplicht certificaat of is het verlopen, dan nooit hoger dan 59% en staat de reden erbij. In technisch werk is een certificaat geen pluspunt maar een voorwaarde; een "85% match" zonder VCA leidt niet tot een plaatsing. (Gebouwd in `logic.js`, getest.)

## Volgorde

1. **Work Profile.** Profiel in ±5 minuten: naam, foto, functie, locatie, ervaring, skills, certificaten, beschikbaarheid, tarief, contractvorm, intro. Kernfunctie: **+ Add Project** (foto → één zin → AI structureert → gebruiker keurt goed).
2. **Discover.** Simpele vacaturekaart: titel, bedrijf, plaats, tarief, contract, match%, werkfoto. Twee acties: *niet interessant*, *bekijk*. Detail met **"Waarom deze baan bij jou past"**.
3. **Business-minimaal.** Vijf dingen: vacature plaatsen → matches → profiel bekijken → interesse tonen → chatten. Dashboard: open vacatures, nieuwe matches, nieuwe berichten.
4. **Matching: gewogen regels.** Skills 30, ervaring 20, certificaten 20, locatie 10, beschikbaarheid 10, tarief 5, contract 5. Altijd met uitleg. AI pas als data laat zien wat voorspelt.
5. **Chat na wederzijdse interesse.** "It's a match" → gesprek. Geen motivatiebrief.
6. **Generate my CV.** PDF uit het Work Profile.
7. **MSP.** Requests → Suppliers → Workers → Documents → Compliance.
8. **Agents, één voor één.** Compliance → Support → Supplier. Daarna pas Recruitment, Contract, Finance.

## Komende 30 dagen

| Week | Wat | Klaar als |
|---|---|---|
| 1 | UX vastleggen. Candidate: onboarding, Discover, vacature, Matches, Create, project, Profile, availability, Inbox, Chat. Business: dashboard, vacature, kandidatenlijst, profiel, chat. Design system vast. | Alle schermen staan, geen open vragen over de flow. |
| 2 | Volledig klikbaar prototype van beide flows. | Sem → profiel → project → NDT-vacature 92% → interesse → Van Oord accepteert → chat. En andersom vanuit het bedrijf. |
| 3 | Testen met 15 professionals + 5 bedrijven, zonder uitleg. | Lijst met waar mensen vastlopen + antwoorden op de testvragen. |
| 4 | MVP op Supabase: auth, profiles, projects, skills, certificates, companies, vacancies, matches, chat. | De loop werkt met echte accounts. |

## Bewust niet nu
MSP-facturatie, payroll, uitgebreide timesheets, Contract/Finance Agent, ATS-integraties, volledig leveranciersportaal, complexe analytics, meertaligheid/Europa, extra sectoren, WhatsApp/LinkedIn-koppelingen.

## Zonder KvK

| Kan nu | Wacht op KvK |
|---|---|
| Supabase, GitHub, testaccounts | Betalende klanten / facturen |
| Testen met echte mensen (met korte toestemmingstekst) | WhatsApp met eigen nummer (Meta-verificatie) |
| AI-API's (persoonlijk account) | Echte kandidaatdata op schaal verwerken |
