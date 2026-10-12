// Demo seed data for the Workstr platform. Fictional companies/people unless noted.
// Dates are relative to "now" so statuses (expiring, expired) stay meaningful.
const d = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
const img = (n) => `./work/w${n}.jpg`;

export const CITIES = {
  Rotterdam: [51.9244, 4.4777],
  Amsterdam: [52.3676, 4.9041],
  "Den Helder": [52.9563, 4.7601],
  Vlissingen: [51.4425, 3.5736],
  Eemshaven: [53.4386, 6.8347],
  Antwerpen: [51.2194, 4.4025],
  Delfzijl: [53.3319, 6.9187],
  Moerdijk: [51.7, 4.6167],
  Schiedam: [51.9192, 4.3889],
  Utrecht: [52.0907, 5.1214],
  Eindhoven: [51.4416, 5.4697],
};

export const me = {
  name: "Sem de Snoo",
  headline: "NDT Inspector · UT2 / PAUT",
  city: "Schiedam",
  about:
    "Inspecteur met offshore- en petrochemie-ervaring. Rustig, precies en graag op locatie.",
  skills: ["UT", "PAUT", "NDT", "Weld Inspection", "Offshore", "MT", "Rapportage"],
  sectors: ["Offshore", "Energy", "Industrial"],
  availability: "2w", // now | 2w | 1m | date | no
  availableFrom: "",
  radiusKm: 80,
  minRate: 50,
  contracts: ["freelance", "project"],
  certs: [
    { id: "c1", name: "UT2", number: "EN9712-UT2-44871", issuer: "Lloyd's Register", validUntil: d(540), verified: true },
    { id: "c2", name: "VCA", number: "VCA-2291034", issuer: "SSVV", validUntil: d(410), verified: true },
    { id: "c3", name: "BOSIET", number: "OPITO-778120", issuer: "Falck Safety", validUntil: d(24), verified: true },
    { id: "c4", name: "Offshore Medical", number: "OGUK-55120", issuer: "Arbo Offshore", validUntil: d(190), verified: false },
    { id: "c5", name: "PAUT", number: "", issuer: "Applus+", validUntil: d(300), verified: false },
  ],
  experience: [
    { id: "e1", role: "NDT Inspector", company: "NorthSea Inspection Services", from: "2022-03", to: "", text: "UT, PAUT en MT op offshore jackets en topsides." },
    { id: "e2", role: "Junior NDT Technician", company: "Rijnmond Testing", from: "2019-09", to: "2022-02", text: "Lasinspecties in petrochemie, rapportage volgens ISO 17640." },
  ],
  education: [{ id: "o1", name: "MBO 4 Metaaltechniek", school: "Albeda", year: "2019" }],
  projects: [
    {
      id: "p1", title: "Offshore Jacket Inspection", sector: "Offshore", from: "2026-01", to: "2026-04",
      text: "UT inspecties uitgevoerd aan lasverbindingen van een offshore jacket.",
      skills: ["UT", "NDT", "Weld Inspection", "Offshore"], photos: [img(2)],
    },
    {
      id: "p2", title: "Refinery Shutdown — Pipe Welds", sector: "Energy", from: "2025-09", to: "2025-10",
      text: "PAUT op pijpleidinglassen tijdens een geplande stop.",
      skills: ["PAUT", "NDT", "Weld Inspection"], photos: [img(7)],
    },
  ],
};

export const companies = {
  vanoord: {
    id: "vanoord", name: "Van Oord", city: "Rotterdam", industry: "Offshore & marine",
    about: "Marine contractor in offshore wind, olie & gas en waterbouw. Projecten wereldwijd vanuit Rotterdam.",
    people: [{ n: "Lotte Brink", r: "Recruiter technische functies" }, { n: "Ruben Hak", r: "QA/QC Lead" }],
    workplace: ["Projecten op zee, rotaties 14/14", "Eigen QA/QC-team van 40 inspecteurs", "Opleidingsbudget voor level 3"],
    media: [img(2), img(6), img(4)],
  },
  rijnmond: {
    id: "rijnmond", name: "Rijnmond Process", city: "Schiedam", industry: "Petrochemie",
    about: "Onderhoud en shutdowns voor raffinaderijen in de Rotterdamse haven.",
    people: [{ n: "Inge Vos", r: "HR" }], workplace: ["Dagdienst, 5 min van Schiedam centrum", "Vaste ploeg van 12 man"],
    media: [img(7), img(8)],
  },
  dockwise: {
    id: "dockwise", name: "Delta Fabrication", city: "Vlissingen", industry: "Staalbouw",
    about: "Fabricage van monopiles en transition pieces voor offshore wind.",
    people: [{ n: "Mark de Wit", r: "Productieleider" }], workplace: ["Grootste lashal van Zeeland", "Robotlassen + handwerk"],
    media: [img(5), img(1)],
  },
  noordwind: {
    id: "noordwind", name: "Noordwind Energy", city: "Eemshaven", industry: "Energy",
    about: "Bouw en onderhoud van windparken en converterstations in Noord-Nederland.",
    people: [{ n: "Femke Dijkstra", r: "Talent partner" }], workplace: ["Nieuw kantoor aan de haven", "Hybride voor engineers"],
    media: [img(3), img(6)],
  },
};

export const seedJobs = [
  {
    id: "j1", company: "vanoord", title: "NDT Inspector", city: "Rotterdam", rateMin: 45, rateMax: 60, unit: "uur",
    contract: "freelance", start: d(21), duration: "6 maanden", sector: "Offshore", photo: img(2),
    skills: ["UT", "NDT", "Weld Inspection", "Offshore"], certs: ["UT2", "VCA", "BOSIET"],
    tasks: ["UT-inspecties op jacket-knooppunten", "Rapportage in client-format", "Afstemming met QA/QC Lead"],
    team: "QA/QC-team van 8, rotatie 14/14",
  },
  {
    id: "j2", company: "rijnmond", title: "PAUT Technician — Shutdown", city: "Schiedam", rateMin: 52, rateMax: 62, unit: "uur",
    contract: "project", start: d(45), duration: "5 weken", sector: "Energy", photo: img(7),
    skills: ["PAUT", "NDT", "Weld Inspection"], certs: ["PAUT", "VCA"],
    tasks: ["PAUT op leidingwerk tijdens stop", "Dagelijkse voortgangsrapportage"],
    team: "Shutdownteam van 30, dagdienst",
  },
  {
    id: "j3", company: "dockwise", title: "Welding Inspector (CSWIP 3.1)", city: "Vlissingen", rateMin: 4200, rateMax: 5200, unit: "maand",
    contract: "vast", start: d(30), duration: "Vast", sector: "Industrial", photo: img(5),
    skills: ["Weld Inspection", "VT", "WPS", "Rapportage"], certs: ["CSWIP 3.1", "VCA"],
    tasks: ["VT en maatcontrole op monopiles", "WPS/PQR beheer", "Klantinspecties begeleiden"],
    team: "QC-afdeling van 6",
  },
  {
    id: "j4", company: "noordwind", title: "QA/QC Inspector Offshore Wind", city: "Eemshaven", rateMin: 60, rateMax: 75, unit: "uur",
    contract: "freelance", start: d(60), duration: "9 maanden", sector: "Offshore", photo: img(6),
    skills: ["NDT", "UT", "Offshore", "Coating Inspection"], certs: ["UT2", "BOSIET", "Offshore Medical", "GWO"],
    tasks: ["Inspecties op converterstation", "Punch lists en NCR's opstellen"],
    team: "Projectteam van 15",
  },
  {
    id: "j5", company: "dockwise", title: "MIG/MAG Lasser", city: "Vlissingen", rateMin: 3300, rateMax: 3900, unit: "maand",
    contract: "vast", start: d(14), duration: "Vast", sector: "Industrial", photo: img(1),
    skills: ["MIG/MAG", "Lassen", "Tekeninglezen"], certs: ["VCA"],
    tasks: ["Lassen van secundair staal", "Werken volgens WPS"],
    team: "Ploeg van 20 lassers",
  },
];

export const seedConversations = [
  {
    id: "v1", company: "vanoord", job: "j1", unread: 1,
    messages: [
      { from: "them", text: "Hoi Sem, we zouden graag kennis met je maken voor het jacket-project.", at: "09:12" },
    ],
  },
];

// ---- Business ---------------------------------------------------------------
export const talent = [
  { id: "t1", name: "Sem de Snoo", headline: "NDT Inspector · UT2 / PAUT", city: "Schiedam", availability: "2w", rate: 55,
    skills: me.skills, certs: [{ name: "UT2", verified: true }, { name: "VCA", verified: true }, { name: "BOSIET", verified: true }], projects: 2 },
  { id: "t2", name: "Youssef El Amrani", headline: "UT/MT Inspector", city: "Rotterdam", availability: "now", rate: 58,
    skills: ["UT", "MT", "NDT", "Offshore", "Weld Inspection"], certs: [{ name: "UT2", verified: true }, { name: "BOSIET", verified: false }, { name: "VCA", verified: true }], projects: 5 },
  { id: "t3", name: "Kim Jansen", headline: "Welding Inspector CSWIP 3.1", city: "Vlissingen", availability: "1m", rate: 62,
    skills: ["Weld Inspection", "VT", "WPS"], certs: [{ name: "CSWIP 3.1", verified: true }, { name: "VCA", verified: true }], projects: 3 },
  { id: "t4", name: "Pieter Bos", headline: "PAUT / ToFD Level 2", city: "Antwerpen", availability: "now", rate: 70,
    skills: ["PAUT", "ToFD", "UT", "NDT"], certs: [{ name: "UT2", verified: true }, { name: "PAUT", verified: true }], projects: 7 },
  { id: "t5", name: "Anouk de Graaf", headline: "QA/QC Coordinator Offshore", city: "Den Helder", availability: "now", rate: 68,
    skills: ["NDT", "Offshore", "Coating Inspection", "Rapportage"], certs: [{ name: "BOSIET", verified: true }, { name: "VCA", verified: true }], projects: 4 },
  { id: "t6", name: "Lars Meijer", headline: "MIG/MAG Lasser", city: "Moerdijk", availability: "2w", rate: 38,
    skills: ["MIG/MAG", "Lassen", "Tekeninglezen"], certs: [{ name: "VCA", verified: true }], projects: 1 },
];

export const bizCandidates = [
  { name: "Youssef El Amrani", job: "NDT Inspector", stage: "Nieuw", score: 94 },
  { name: "Sem de Snoo", job: "NDT Inspector", stage: "Gesprek", score: 92 },
  { name: "Pieter Bos", job: "QA/QC Inspector Offshore Wind", stage: "Nieuw", score: 81 },
  { name: "Anouk de Graaf", job: "QA/QC Inspector Offshore Wind", stage: "Shortlist", score: 88 },
  { name: "Kim Jansen", job: "Welding Inspector (CSWIP 3.1)", stage: "Aanbod", score: 90 },
];

export const plans = [
  { name: "Free", price: "€0", items: ["1 vacature", "Matches + chat"] },
  { name: "Starter", price: "€149", items: ["5 vacatures", "AI-vacaturehulp", "Chat"] },
  { name: "Pro", price: "€399", items: ["Onbeperkt vacatures", "Talent Search", "Analytics", "Priority"] },
];

// ---- MSP --------------------------------------------------------------------
export const REQUIRED_DOCS = ["VCA", "UT2", "BOSIET", "Offshore Medical", "Client induction"];

export const workers = [
  { id: "w1", name: "Sem de Snoo", role: "NDT Inspector", supplier: "Direct", site: "Rotterdam", rate: 65,
    docs: { VCA: d(410), UT2: d(540), BOSIET: d(240), "Offshore Medical": d(21) } },
  { id: "w2", name: "Youssef El Amrani", role: "NDT Inspector", supplier: "TechForce", site: "Rotterdam", rate: 68,
    docs: { VCA: d(200), UT2: d(320), BOSIET: d(300), "Offshore Medical": d(150), "Client induction": d(365) } },
  { id: "w3", name: "Pieter Bos", role: "PAUT Technician", supplier: "InspectPro", site: "Vlissingen", rate: 72,
    docs: { VCA: d(-5), UT2: d(600), "Offshore Medical": d(90), "Client induction": d(200) } },
  { id: "w4", name: "Anouk de Graaf", role: "QA/QC Coordinator", supplier: "TechForce", site: "Den Helder", rate: 74,
    docs: { VCA: d(500), UT2: d(400), BOSIET: d(80), "Offshore Medical": d(200), "Client induction": d(300) } },
];

export const suppliers = [
  { id: "s1", name: "TechForce", open: 3, submitted: 7, avgHours: 19, score: 4.6 },
  { id: "s2", name: "InspectPro", open: 2, submitted: 2, avgHours: 52, score: 3.9 },
  { id: "s3", name: "NorthStaff", open: 1, submitted: 0, avgHours: null, score: 4.1 },
];

export const seedRequests = [
  { id: "r1", role: "NDT Inspector", count: 5, start: "2026-11-02", city: "Rotterdam", duration: "6 maanden",
    certs: ["UT2", "VCA", "Offshore Medical", "BOSIET"], rateMin: 65, rateMax: 75, status: "Sourcing", filled: 2 },
  { id: "r2", role: "PAUT Technician", count: 2, start: "2026-12-01", city: "Vlissingen", duration: "3 maanden",
    certs: ["UT2", "VCA"], rateMin: 68, rateMax: 78, status: "Leveranciers actief", filled: 1 },
];

// contract rate per worker id; timesheet rows: hours per day Mon..Sun
export const seedTimesheets = [
  { id: "ts1", worker: "w1", week: 41, days: [10, 10, 10, 10, 10, 0, 0], rate: 65, approvedOvertime: true, submitted: true },
  { id: "ts2", worker: "w2", week: 41, days: [8, 8, 8, 8, 8, 6, 0], rate: 68, approvedOvertime: false, submitted: true },
  { id: "ts3", worker: "w3", week: 41, days: [8, 8, 0, 8, 8, 0, 0], rate: 75, approvedOvertime: false, submitted: true },
  { id: "ts4", worker: "w4", week: 41, days: [8, 8, 8, 0, 0, 0, 0], rate: 74, approvedOvertime: false, submitted: false },
];

export const contracts = [
  { id: "k1", worker: "Sem de Snoo", client: "Van Oord", rate: 65, agreed: 65, end: d(160), notice: 14, status: "Actief" },
  { id: "k2", worker: "Pieter Bos", client: "Delta Fabrication", rate: 75, agreed: 72, end: d(40), notice: 30, status: "Afwijking" },
  { id: "k3", worker: "Youssef El Amrani", client: "Van Oord", rate: 68, agreed: 68, end: d(12), notice: 14, status: "Verlengen?" },
];

export const agents = [
  { id: "support", name: "Support Agent", stat: "642 vragen opgelost", sub: "12 doorgezet naar mens", saved: 54 },
  { id: "compliance", name: "Compliance Agent", stat: "86 documenten verwerkt", sub: "7 menselijke controles nodig", saved: 21 },
  { id: "supplier", name: "Supplier Agent", stat: "14 leveranciers benaderd", sub: "5 wachten op reactie", saved: 9 },
  { id: "recruitment", name: "Recruitment Agent", stat: "31 kandidaten gevonden", sub: "9 op shortlist", saved: 16 },
  { id: "contract", name: "Contract Agent", stat: "6 concepten voorbereid", sub: "2 wachten op goedkeuring", saved: 6 },
  { id: "finance", name: "Finance Agent", stat: "8 afwijkende timesheets", sub: "3 opgelost na navraag", saved: 11 },
];

// No-code agent templates (Business/MSP builder). Sending always asks a human unless switched off.
export const agentTemplates = [
  { id: "cert-reminder", name: "Certificaat-herinnering", agent: "Compliance Agent", trigger: "30 dagen voor verloop", channel: "WhatsApp" },
  { id: "supplier-chase", name: "Leverancier opvolgen", agent: "Supplier Agent", trigger: "48 uur geen kandidaat", channel: "E-mail" },
  { id: "intake", name: "Intake-screening", agent: "Recruitment Agent", trigger: "Nieuwe interesse op vacature", channel: "In-app chat" },
  { id: "timesheet", name: "Timesheet-reminder", agent: "Finance Agent", trigger: "Vrijdag 16:00 niet ingediend", channel: "In-app chat" },
  { id: "outreach", name: "Talent outreach", agent: "Recruitment Agent", trigger: "Match ≥ 85% en beschikbaar", channel: "In-app chat" },
];

export const seedAgentLog = [
  { t: "09:41", agent: "Compliance Agent", kind: "AI", text: "Vervaldatum gelezen uit foto Offshore Medical — Sem de Snoo (21 dagen)." },
  { t: "09:42", agent: "Workflow", kind: "Regel", text: "Herinnering verstuurd: Offshore Medical verloopt binnen 30 dagen." },
  { t: "10:05", agent: "Supplier Agent", kind: "AI", text: "InspectPro na 48 uur zonder kandidaat — follow-up verstuurd voor PAUT Technician." },
  { t: "10:30", agent: "Finance Agent", kind: "Regel", text: "Tarief €75 wijkt af van contract €72 — Pieter Bos, week 41." },
];

export const seedApprovals = [
  { id: "a1", agent: "Contract Agent", text: "Verlenging Youssef El Amrani bij Van Oord, 3 maanden à €68/u", kind: "contract" },
  { id: "a2", agent: "Compliance Agent", text: "Certificaatfoto BOSIET van Youssef onleesbaar — handmatig beoordelen", kind: "document" },
  { id: "a3", agent: "Recruitment Agent", text: "Shortlist van 3 kandidaten voor NDT Inspector (r1) naar opdrachtgever sturen", kind: "shortlist" },
];
