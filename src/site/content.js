// All website copy and demo data. Components read from here, so copy changes (or a CMS / EN
// translation later) never touch layout code. Demo people and companies are fictional.

const img = (n) => `work/w${n}.jpg`; // every .jpg has a .webp sibling (see Pic)

// Placeholder media — replace with real Workstr footage by swapping these paths.
export const media = {
  heroWide: { webm: "media/hero-wide.webm", mp4: "media/hero-wide.mp4", poster: "media/hero-wide.jpg" },
  heroPortrait: { mp4: "media/hero-portrait.mp4", poster: "media/hero-portrait.jpg" },
};

export const nav = [
  { label: "Product", items: [
    { href: "professionals/", label: "Workstr App", text: "Ontdek werk en bouw je Work Profile" },
    { href: "business/", label: "Workstr Business", text: "Vacatures, matches en talent" },
    { href: "managed-services/", label: "Managed Services", text: "Externe workforce, voor enterprise" },
    { href: "ai/", label: "AI", text: "Wat Workstr concreet automatiseert" },
  ] },
  { href: "professionals/", label: "Voor professionals" },
  { href: "business/", label: "Voor bedrijven" },
  { href: "managed-services/", label: "Managed Services" },
  { href: "ai/", label: "AI" },
  { href: "about/", label: "Over Workstr" },
];

export const footer = [
  ["Product", [["professionals/", "Professionals"], ["business/", "Bedrijven"], ["managed-services/", "Managed Services"], ["ai/", "AI"]]],
  ["Bedrijf", [["about/", "Over Workstr"], ["contact/", "Contact"], ["early-access/", "Early access"], ["app.html#/app", "Inloggen"]]],
  ["Juridisch", [["privacy/", "Privacy"], ["terms/", "Voorwaarden"], ["privacy/#cookies", "Cookies"]]],
];

export const jobs = [
  { id: "ndt", title: "NDT Inspector", co: "Northshore Engineering", city: "Rotterdam", rate: "€45–€60 p/u", type: "Freelance", score: 92, photo: img(2),
    tags: ["UT2", "Offshore"], reasons: [["ok", "Je hebt UT2"], ["ok", "Offshore-ervaring"], ["ok", "31 km van je woonplaats"], ["ok", "Tarief binnen je voorkeur"], ["warn", "BOSIET verloopt binnenkort"]] },
  { id: "mech", title: "Mechanical Engineer", co: "Atlas Industrial", city: "Eindhoven", rate: "€4.200–€5.400 p/m", type: "Vast", score: 87, photo: img(6),
    tags: ["Pompen", "Rotating equipment"], reasons: [["ok", "6 jaar rotating equipment"], ["ok", "Project in de petrochemie"], ["ok", "Vast contract, zoals je zoekt"], ["warn", "Reistijd 54 minuten"]] },
  { id: "qa", title: "QA/QC Inspector", co: "Delta Steelworks", city: "Vlissingen", rate: "€50–€62 p/u", type: "Project", score: 84, photo: img(7),
    tags: ["VT2", "Staalbouw"], reasons: [["ok", "Je hebt VT2 en VCA"], ["ok", "Staalbouwprojecten in je profiel"], ["ok", "Beschikbaar per de startdatum"], ["no", "CSWIP 3.1 gevraagd, niet in je profiel"]] },
  { id: "tech", title: "Service Technician", co: "Kade Energy", city: "Groningen", rate: "€3.400–€4.100 p/m", type: "Fulltime", score: 79, photo: img(3),
    tags: ["Elektrotechniek", "Storingsdienst"], reasons: [["ok", "Elektrotechnische achtergrond"], ["ok", "VCA geldig"], ["warn", "Buiten je reisafstand van 80 km"]] },
];

export const person = {
  name: "Daan Visser", role: "NDT Inspector", city: "Rotterdam", photo: img(5),
  skills: ["UT", "PAUT", "ToFD", "VT", "Weld Inspection"], certs: [["UT2", "Verified"], ["BOSIET", "Verified"], ["VCA", "Uploaded"]],
  project: { file: "offshore-project.jpg", text: "UT inspecties uitgevoerd aan offshore jacket.", title: "Offshore Jacket Inspection",
    skills: ["UT", "NDT", "Weld Inspection", "Offshore"], period: "jan – apr 2026" },
};

export const gallery = [
  { photo: img(2), project: "Offshore jacket inspection", skills: "UT · PAUT · Weld Inspection", exp: "7 jaar", employer: "Northshore Engineering", period: "jan – apr 2026" },
  { photo: img(7), project: "Brugdek lassen", skills: "TIG · MIG/MAG · WPS", exp: "11 jaar", employer: "Delta Steelworks", period: "sep – dec 2025" },
  { photo: img(6), project: "Shutdown raffinaderij", skills: "Rotating equipment · Rigging", exp: "5 jaar", employer: "Atlas Industrial", period: "mrt 2025" },
  { photo: img(4), project: "Pijpleiding tie-in", skills: "Pipefitting · Tekeninglezen", exp: "9 jaar", employer: "Kade Energy", period: "zomer 2025" },
  { photo: img(8), project: "Coating survey windpark", skills: "Coating Inspection · NACE", exp: "4 jaar", employer: "Northshore Engineering", period: "okt 2025" },
];

export const chat = [
  ["co", "We zouden graag kennis met je maken. Ben je donderdag beschikbaar?"],
  ["me", "Ja, vanaf 15:00."],
  ["co", "Top. Ik stuur je een uitnodiging voor 15:30 op ons kantoor in Rotterdam."],
];

export const oldWay = ["Vacaturebank openen", "Vacature lezen", "CV aanpassen", "Motivatie schrijven", "Formulier invullen", "Wachten"];
export const newWay = [["Discover", "Werk dat bij je past komt naar je toe"], ["Match", "Je ziet waarom het past"], ["Connect", "Direct in gesprek, zonder brief"]];

export const candidates = [
  { name: "Daan Visser", role: "NDT Inspector", city: "Rotterdam", score: 94, avail: "Nu beschikbaar", why: ["UT2 verified", "4 offshore-projecten", "18 km van de locatie", "Tarief €52 p/u — binnen budget"] },
  { name: "Ilse Bakker", role: "NDT Inspector", city: "Schiedam", score: 91, avail: "Over 2 weken", why: ["UT2 en PAUT", "Staalbouw en offshore", "12 km van de locatie", "Medical verloopt over 40 dagen"] },
  { name: "Mehmet Kaya", role: "NDT Technician", city: "Dordrecht", score: 88, avail: "Nu beschikbaar", why: ["UT2 uploaded, nog niet gecontroleerd", "3 jaar ervaring", "24 km van de locatie", "Zoekt project van 6+ maanden"] },
];

export const vacancyFields = [
  ["Functie", "NDT Inspector"], ["Werkzaamheden", "UT en PAUT op lasverbindingen, rapportage aan QA/QC"], ["Eisen", "UT2 · VCA · BOSIET"],
  ["Tarief", "€45–€60 p/u"], ["Locatie", "Rotterdam"], ["Skills", "UT · PAUT · Weld Inspection"], ["Certificaten", "UT2 · VCA · BOSIET (verplicht)"],
];

export const compliance = { name: "Daan Visser", items: [["VCA", "Verified"], ["UT2", "Verified"], ["BOSIET", "Verified"], ["Medical", "Verloopt over 21 dagen"], ["Client induction", "Ontbreekt"]] };

export const agents = [
  { name: "Compliance Agent", lines: ["42 documenten verwerkt", "3 wachten op menselijke controle"] },
  { name: "Supplier Agent", lines: ["8 leveranciers benaderd", "3 reacties ontvangen"] },
  { name: "Support Agent", lines: ["27 vragen afgehandeld", "2 doorgezet naar een collega"] },
  { name: "Recruitment Agent", lines: ["14 profielen gescreend", "5 voorgesteld voor shortlist"] },
  { name: "Contract Agent", lines: ["6 contracten voorbereid", "1 afwijkend tarief gemarkeerd"] },
  { name: "Finance Agent", lines: ["31 timesheets gecontroleerd", "2 overuren zonder akkoord"] },
];

export const orchestration = ["Aanvraag ontvangen", "Recruitment Agent", "Supplier Agent", "Compliance Agent", "Menselijke goedkeuring", "Klaar voor onboarding"];

export const aiCapabilities = [
  { title: "Document uitlezen", text: "Een foto van een certificaat wordt naam, nummer en geldigheid. Jij bevestigt.", from: "IMG_2041.jpg", to: ["UT2 · Level 2", "Nr. NL-48213", "Geldig tot 14-03-2028"] },
  { title: "Match uitleggen", text: "Elke score komt met de redenen erachter. Geen zwarte doos.", from: "92% match", to: ["✓ UT2", "✓ 31 km", "⚠ BOSIET verloopt"] },
  { title: "Vraag beantwoorden", text: "Standaardvragen over uren, documenten of startdata krijgen direct antwoord.", from: "Is mijn timesheet goedgekeurd?", to: ["Ja, op maandag door je manager.", "Uitbetaling volgt na facturatie."] },
  { title: "Leverancier opvolgen", text: "Geen reactie binnen 48 uur? Er gaat een vriendelijke herinnering uit.", from: "Aanvraag 5× NDT Inspector", to: ["Leverancier B: 48u geen reactie", "Herinnering verstuurd"] },
  { title: "Contract voorbereiden", text: "Gegevens uit aanvraag en profiel komen in het template. Een mens tekent.", from: "Template inhuur", to: ["Tarief €68 p/u", "Looptijd 6 maanden", "Wacht op akkoord"] },
  { title: "Afwijking signaleren", text: "Regels controleren uren en tarieven. AI legt uit wat er afwijkt.", from: "Timesheet week 44", to: ["46 uur, 6 overuren", "Geen akkoord op overuren", "Gemarkeerd voor controle"] },
];

export const mspModules = ["Requests", "Workers", "Suppliers", "Compliance", "Contracts", "Timesheets", "Invoices", "Analytics", "AI Agents"];
export const mspRequest = { title: "5× NDT Inspector", meta: ["Rotterdam", "Start 2 nov", "6 maanden", "€65–€75 p/u"], req: ["UT2", "VCA", "BOSIET"] };

export const industries = [
  ["Industrie", img(6)], ["Offshore", img(2)], ["Energie", img(3)], ["Engineering", img(1)], ["Bouw", img(4)],
  ["Onderhoud", img(8)], ["QA/QC", img(7)], ["NDT", img(5)], ["Welding", img(2)],
];

export const trust = [
  ["Jij bepaalt wie je ziet", "Zet je profiel op vindbaar of laat bedrijven je pas zien als jij interesse toont."],
  ["Geen automatische afwijzing", "Workstr neemt geen aannamebeslissingen. Bij twijfel beslist een mens."],
  ["Transparante matching", "Bij elke match zie je welke ervaring, voorkeuren en eisen meetellen."],
  ["Upload is geen verificatie", "Een geüpload certificaat heet ‘uploaded’ tot het echt is gecontroleerd."],
  ["Altijd aan te passen", "Je gegevens zijn van jou. Wijzig of verwijder ze wanneer je wilt."],
  ["Privacy by design", "We vragen alleen wat nodig is om goed te matchen."],
];

export const roadmap = [
  ["Nu", ["Work Profile", "Discover", "Matching", "Chat"]],
  ["Hierna", ["Business-platform", "Certificaten", "CV genereren"]],
  ["Later", ["Managed Services", "Leveranciers", "Compliance", "AI-operations"]],
];

export const flywheel = ["Je bouwt je profiel", "Workstr begrijpt je beter", "Betere kansen", "Meer gesprekken", "Meer werkgevers", "Meer kansen", "Je profiel groeit mee"];

export const flows = {
  professionals: [
    ["Discover", "Swipe door werk met beeld van de echte werkplek.", "discover"],
    ["Matches", "Elke week een paar kansen die echt passen, met uitleg.", "matches"],
    ["Work Profile", "Eén levend profiel in plaats van een stapel cv's.", "profile"],
    ["Projecten", "Foto en één zin. Workstr maakt er een project van.", "project"],
    ["Certificaten", "Met geldigheid en status. Je ziet wat binnenkort verloopt.", "certs"],
    ["Beschikbaarheid", "Per direct, over twee weken of vanaf een datum.", "availability"],
    ["Chat", "Wederzijdse interesse opent het gesprek. Geen motivatiebrief.", "chat"],
    ["CV", "Eén tik genereert een actueel cv als pdf.", "cv"],
  ],
  business: [
    ["Vacature", "Plak tekst of upload een pdf. Workstr zet het in velden, jij controleert."],
    ["Matching", "Professionals op skills, projecten, certificaten en voorkeuren — niet alleen op titel."],
    ["Talent zoeken", "Zoek zelf, filter op beschikbaarheid en certificaten."],
    ["Profielen", "Zie projecten, certificaten met status en waarom iemand past."],
    ["Communicatie", "Toon interesse. Bij wederzijdse interesse opent de chat."],
    ["Analytics", "Van match naar gesprek naar plaatsing, per vacature."],
    ["Bedrijfsprofiel", "Laat projecten, team en werkplek zien met foto en video."],
  ],
  managed: [
    ["Aanvraag", "De opdrachtgever vraagt aan: rol, aantal, start, eisen, tarief."],
    ["Talent", "Workstr zoekt eerst in de eigen talentpool."],
    ["Leveranciers", "Aangesloten leveranciers krijgen de aanvraag en dragen voor."],
    ["Compliance", "Certificaten, medicals en inductions per persoon op één plek."],
    ["Contracten", "Templates gevuld met tarief en looptijd. Akkoord door een mens."],
    ["Timesheets", "Uren gecontroleerd tegen contract en afspraken."],
    ["Finance", "Facturen vergeleken met uren en tarieven."],
    ["Rapportage", "Inzicht in je volledige externe workforce."],
  ],
};

export const faq = {
  professionals: [
    ["Is Workstr gratis voor professionals?", "Workstr is in ontwikkeling. Aanmelden voor early access is gratis. Prijsinformatie volgt bij lancering."],
    ["Heb ik een cv nodig?", "Nee. Je bouwt een Work Profile met ervaring, projecten en certificaten. Workstr kan daar een cv van maken."],
    ["Wie kan mijn profiel zien?", "Dat bepaal jij. Vindbaar voor bedrijven met een passende vacature, of alleen zichtbaar voor bedrijven waar jij interesse in toont."],
    ["Kan ik mijn profiel privé maken?", "Ja. Zet ‘vindbaar’ uit en bedrijven zien je pas na jouw interesse."],
    ["Hoe werkt matching?", "Op skills, ervaring, certificaten, locatie, beschikbaarheid, tarief en contractvorm. Ontbreekt een verplicht certificaat, dan zie je dat bij de match staan."],
    ["Kan ik Workstr gebruiken als freelancer?", "Ja. Je geeft je uurtarief en gewenste contractvormen op, zoals freelance of project."],
  ],
  business: [
    ["Hoe werkt matching?", "Workstr vergelijkt de eisen van je vacature met skills, projecten, certificaten en voorkeuren van professionals, en laat per match de redenen zien."],
    ["Kan Workstr naast ons ATS worden gebruikt?", "Dat is het uitgangspunt voor de eerste versie. Koppelingen bepalen we samen met pilotpartners."],
    ["Kunnen wij kandidaten direct benaderen?", "Je toont interesse in een profiel. Accepteert de professional, dan opent de chat."],
    ["Wat is Workstr Managed Services?", "Voor organisaties met veel externe inhuur: aanvragen, leveranciers, compliance, contracten en uren vanuit één omgeving. Dit is een enterprise-roadmap en nog in ontwikkeling."],
    ["Hoe werkt certificaatbeheer?", "Professionals voegen certificaten met geldigheid toe. Een upload heet ‘uploaded’ tot hij gecontroleerd is. Verloopt iets, dan zie je dat op tijd."],
    ["Kan Workstr leveranciers beheren?", "Dat hoort bij Managed Services, dat in ontwikkeling is. Praat met ons als je pilotpartner wilt worden."],
    ["Wat kost Workstr?", "Prijsinformatie volgt bij lancering."],
  ],
};

export const pages = {
  about: {
    mission: "Werk vinden en mensen vinden is nog steeds te traag, te onpersoonlijk en te afhankelijk van een cv. Workstr wil dat veranderen: met een profiel dat laat zien wat iemand echt kan, matches die zichzelf uitleggen en software die administratie overneemt.",
    principles: [["Show the work", "Projecten, beelden en certificaten zeggen meer dan een functietitel."], ["Remove the friction", "Geen motivatiebrief, geen formulier van twintig velden."], ["Human when it matters", "Software doet het standaardwerk. Mensen nemen de beslissingen."]],
  },
};
