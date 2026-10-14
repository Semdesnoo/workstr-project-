// Static HTML entry per page (own title, description, canonical, OG, JSON-LD) + sitemap.
// Run: node scripts/site-pages.mjs   (also imported by vite.config.js for the build inputs)
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { faq } from "../src/site/content.js";

export const SITE = "https://semdesnoo.github.io/workstr-project-/";

export const pages = [
  ["home", "", "Workstr — Less searching. More working.", "Workstr is het platform waar professionals hun werkidentiteit opbouwen, kansen ontdekken en direct verbinden met bedrijven — en waar werkgevers recruitment en externe inhuur beheren."],
  ["professionals", "professionals/", "Workstr App voor professionals — laat zien wat je kunt", "Ontdek werk met beeld van de echte werkplek, bouw een Work Profile dat met je meegroeit en kom direct in contact met bedrijven."],
  ["business", "business/", "Workstr Business — recruitment zonder onnodig werk", "Vacatures die zichzelf structureren, matches met uitleg, talent zoeken op projecten en certificaten, en direct contact met professionals."],
  ["managed-services", "managed-services/", "Workstr Managed Services — je externe workforce in één omgeving", "Aanvragen, leveranciers, compliance, contracten en uren voor organisaties met veel externe inhuur. Enterprise roadmap, in ontwikkeling."],
  ["ai", "ai/", "AI bij Workstr — werk dat gewoon gebeurt", "Wat Workstr concreet automatiseert: documenten uitlezen, matches uitleggen, vragen beantwoorden en afwijkingen signaleren. Met menselijke controle."],
  ["about", "about/", "Over Workstr — people are more than a CV", "Missie, principes en roadmap van Workstr: werk vinden en mensen vinden sneller, menselijker en transparanter maken."],
  ["contact", "contact/", "Contact — praat met Workstr", "Plan een demo van Workstr Business, word pilotpartner of praat over Managed Services."],
  ["early-access", "early-access/", "Early access — wees er als eerste bij | Workstr", "Meld je aan voor early access van Workstr als professional of als bedrijf."],
  ["privacy", "privacy/", "Privacy | Workstr", "Hoe Workstr omgaat met gegevens op deze website."],
  ["terms", "terms/", "Voorwaarden | Workstr", "Voorwaarden voor de Workstr website en demo-omgeving."],
];

const org = { "@context": "https://schema.org", "@type": "Organization", name: "Workstr", url: SITE, logo: `${SITE}logo.png`, slogan: "Less searching. More working." };
const app = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Workstr", applicationCategory: "BusinessApplication", operatingSystem: "iOS, Android, Web", url: SITE };
const faqLd = (items) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const ld = { home: [org, app], professionals: [app, faqLd(faq.professionals)], business: [app, faqLd(faq.business)] };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export const html = ([id, path, title, desc]) => {
  const root = path ? "../" : "./";
  const url = SITE + path;
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0B0C0F" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" type="image/png" href="${root}logo.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Workstr" />
    <meta property="og:locale" content="nl_NL" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}media/og.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${SITE}media/og.jpg" />
${id === "home" ? `    <link rel="preload" as="image" href="${root}media/hero-wide.jpg" media="(min-width: 701px)" fetchpriority="high" />\n    <link rel="preload" as="image" href="${root}media/hero-portrait.jpg" media="(max-width: 700px)" fetchpriority="high" />\n` : ""}${(ld[id] || []).map((x) => `    <script type="application/ld+json">${JSON.stringify(x)}</script>\n`).join("")}  </head>
  <body data-page="${id}" data-root="${root}">
    <div id="root"></div>
    <noscript><p style="padding:24px">Workstr — Less searching. More working. Zet JavaScript aan om deze pagina te bekijken.</p></noscript>
    <script type="module" src="/src/site/main.jsx"></script>
  </body>
</html>
`;
};

export const file = (path) => (path ? `${path}index.html` : "index.html");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = fileURLToPath(new URL("..", import.meta.url));
  for (const p of pages) {
    if (p[1]) mkdirSync(base + p[1], { recursive: true });
    writeFileSync(base + file(p[1]), html(p));
  }
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(base + "public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([, path]) => `  <url><loc>${SITE}${path}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
  writeFileSync(base + "public/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
  console.log(`wrote ${pages.length} pages + sitemap`);
}
