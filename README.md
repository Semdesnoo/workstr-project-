# Workstr

Nederlandse conceptwebsite en interactieve vacaturedemo, gebaseerd op de aangeleverde Workstr-presentatie. De layout gebruikt 187n.ai als referentie: gecentreerde merkopening, interactieve functietabs, contrasterende kleurvlakken, draaibare showcase, uitklapbare partnerinformatie, een conversationeel contactformulier en grote footer. Geen broncode, bedrijfsclaims, klantlogo's of media van de referentiesite zijn overgenomen.

## Starten

Node.js 22.12+.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

Tests gebruiken Microsoft Edge via Playwright (`channel: msedge`). Op een andere machine: installeer Edge of wijzig channel in playwright.config.js en installeer de gekozen Playwright-browser.

## Werkend

- React/Vite-website met Nederlands als voertaal.
- Responsief, systeemthema en handmatige licht/donker-schakelaar.
- Functietabs met toetsenbordbediening.
- Animatie met pauzeknop en reduced-motion ondersteuning.
- Showcase met sleepbediening en vorige/volgende-knoppen.
- Verticale scroll-snap vacaturefeed met drie fictieve vacatures.
- Vacatures lokaal bewaren en verwijderen; fallback bij ontoegankelijke opslag.
- FAQ en uitklapbare partnerinformatie.
- Contactformulier valideert invoer en maakt een mailto-concept. Niets wordt automatisch verzonden of naar een backend gestuurd.

## Bewust nog niet gebouwd

Geen echte vacaturedatabase, video-hosting, accountregistratie, cv-upload, AI-matching, chat, betalingen, notificaties, native app of App Store-publicatie. Het is een foto-demo, geen product met live recruitmentfunctionaliteit. Alle functies in ontwikkeling zijn als zodanig benoemd.

## Productrichting uit de presentatie

CV naar visueel profiel, transparante AI-matchsuggesties, wederzijdse interesse, chat met AI-ijsbreker, abonnementsmodel per actieve vacature en enterprise-maatwerk. AI-uitkomsten en besparingen worden niet als bewezen resultaten gepresenteerd.

## Bestanden

- src/App.jsx: referentie-geïnspireerde pagina en interacties.
- src/components.jsx: herbruikbare merk-, animatie- en feedcomponenten, demodata.
- src/styles.css: basistokens en feedstyling.
- src/reference.css: nieuwe layout en kleurvlakken.
- public/: lokale merk- en fotoassets.
- tests/: browserregressies, responsive controles en axe WCAG-scans.
- artifacts/: lokale testbewijzen (niet voor publicatie).

## Privacy en publicatie

Alleen `workstr-saved` wordt lokaal opgeslagen nadat de gebruiker een vacature bewaart. Geen externe analytics of trackingcookies. Formuliergegevens worden niet door de website verzonden; de gebruiker opent en verstuurt zelf een e-mail. Mailadres info@workstr.com komt uit de presentatie; werking van deze mailbox is niet geverifieerd.

Voor een echte lancering: juridische bedrijfsgegevens en privacyvoorwaarden vaststellen, authenticatie en autorisatie bouwen, veilige cv-opslag, bewaartermijnen, verwijderen/exporteren van gegevens, employer verificatie, moderatie en anti-discriminatiecontroles voor matching regelen.

De build staat in dist/. base './' ondersteunt statische hosting in een subdirectory. Repository: https://github.com/workstrai/workstr-project-. Er is nog geen publieke website-deployment ingesteld.

Aanvullende demo-interacties: werkvibe-keuzehulp, willekeurige suggestie via 'Verras me', zoeken op functie/plaats/skills, sectorfilter en animatie bij bewaren. De keuzehulp gebruikt vaste voorbeeldcategorieën, geen AI. De bijbehorende bestanden zijn src/WorkVibe.jsx en src/playful.css.

## Media

Logo: uitgesneden uit de aangeleverde PDF. Foto's: lokale WebP-versies van Unsplash-beelden (geen echte Workstr-klanten):
- https://images.unsplash.com/photo-1522071820081-009f0129c71c
- https://images.unsplash.com/photo-1442512595331-e89e73853f31
- https://images.unsplash.com/photo-1498050108023-c5249f4df085

Vervang voor de productlancering door eigen team- en vacaturevideo's. Font: lokaal gebundelde Outfit via @fontsource. Iconen: Phosphor.
