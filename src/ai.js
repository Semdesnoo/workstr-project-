// Workstr AI layer.
// One abstraction for every AI call in the demo. Today it runs on a local
// simulation so the pitch demo works with zero cost and zero API keys. When a
// backend is configured (see WORKSTR_AI_ENDPOINT below) the exact same
// functions transparently call the real service instead. No UI code changes.
//
// To go live with real OpenAI later:
//   1. Deploy a small serverless function (e.g. /api/ai) that holds the
//      OPENAI_API_KEY server-side and forwards { task, payload } to OpenAI.
//   2. Set window.WORKSTR_AI_ENDPOINT = "/api/ai" (or a full URL) before the
//      app mounts, e.g. via an inline <script> in index.html.
// That is the only switch. The key never touches the browser.

const ENDPOINT =
  (typeof window !== "undefined" && window.WORKSTR_AI_ENDPOINT) || null;

// Small helper so the demo "feels" like real work is happening.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function callBackend(task, payload) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, payload }),
  });
  if (!res.ok) throw new Error(`AI backend error ${res.status}`);
  return res.json();
}

// --- Local simulation helpers -------------------------------------------------

const SKILL_LIBRARY = [
  "Samenwerken", "Klantcontact", "Projectmanagement", "Communicatie",
  "Figma", "Adobe Suite", "Branding", "React", "TypeScript", "SQL",
  "Data-analyse", "Leidinggeven", "Plannen", "Sales", "Onderhandelen",
  "Gastvrijheid", "Koffie", "Voorraadbeheer", "Lassen", "Kwaliteitscontrole",
  "Nederlands", "Engels", "Rijbewijs B", "VCA", "Nauwkeurigheid",
];

function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function guessRole(text) {
  const t = (text || "").toLowerCase();
  if (/(figma|design|brand|creat)/.test(t)) return "Brand & Product Designer";
  if (/(react|front|develop|software|code)/.test(t)) return "Frontend Developer";
  if (/(koffie|barista|horeca|hospitality|gast)/.test(t)) return "Hospitality Professional";
  if (/(las|staal|weld|constructie|qa|qc|kwaliteit)/.test(t)) return "QA/QC Specialist";
  if (/(sales|account|commerc)/.test(t)) return "Commercieel Talent";
  return "Veelzijdige Professional";
}

// --- Public API ---------------------------------------------------------------

/**
 * Analyse a CV (raw text) and return a structured, visual-ready profile.
 * @returns {Promise<{name,role,headline,summary,skills:string[],
 *   experience:{title,org,period}[],certificates:string[],location}>}
 */
export async function analyzeCV({ text = "", name = "", fileName = "" } = {}) {
  if (ENDPOINT) return callBackend("analyze_cv", { text, name, fileName });

  await wait(2200);
  const role = guessRole(text + " " + fileName);
  const skills = pick(SKILL_LIBRARY, 6);
  return {
    name: name || "Sanne de Vries",
    role,
    location: "Utrecht",
    headline: `${role} met oog voor mensen én resultaat.`,
    summary:
      "Op basis van je cv ziet Workstr een sterke combinatie van vakinhoud en samenwerking. " +
      "Je profiel benadrukt wat je hebt gebouwd, niet alleen waar je hebt gewerkt.",
    skills,
    experience: [
      { title: role, org: "Vorige werkgever", period: "2022 - nu" },
      { title: "Medior rol", org: "Eerdere werkgever", period: "2019 - 2022" },
    ],
    certificates: pick(["VCA Basis", "Scrum Foundation", "Rijbewijs B", "EHBO"], 2),
  };
}

/**
 * Optimise a raw job description into a clearer, better-targeted posting.
 * @returns {Promise<{title,optimizedText,highlights:string[],
 *   suggestedSkills:string[],tone}>}
 */
export async function optimizeJob({ text = "", title = "" } = {}) {
  if (ENDPOINT) return callBackend("optimize_job", { text, title });

  await wait(2000);
  const role = title || guessRole(text);
  return {
    title: role,
    tone: "Helder, uitnodigend, concreet",
    optimizedText:
      `Wij zoeken een ${role.toLowerCase()} die impact wil maken in een hecht team. ` +
      "Je krijgt ruimte om te bouwen, te leren en het verschil te maken voor onze klanten. " +
      "We hechten aan groei, eerlijk werk en een fijne werkplek.",
    highlights: [
      "Duidelijke rol en verwachtingen",
      "Nadruk op groei en werkplek",
      "Inclusieve, activerende toon",
    ],
    suggestedSkills: pick(SKILL_LIBRARY, 5),
  };
}

/**
 * Compute a match score + human-readable reasons between a profile and a job.
 * @returns {Promise<{score:number, reasons:string[]}>}
 */
export async function matchScore({ profileSkills = [], jobSkills = [] } = {}) {
  if (ENDPOINT) return callBackend("match_score", { profileSkills, jobSkills });

  await wait(400);
  const overlap = profileSkills.filter((s) => jobSkills.includes(s));
  // Deterministic-ish score so the same pair looks stable, with a believable range.
  const base = 62 + overlap.length * 9;
  const score = Math.min(97, base + (profileSkills.length % 5));
  // Always return exactly 3 concrete "why we match" reasons (transparency).
  const reasons = [];
  if (overlap.length >= 1) {
    reasons.push(`Deelt ${overlap.length} kernvaardighe${overlap.length === 1 ? "id" : "den"}: ${overlap.slice(0, 3).join(", ")}`);
  } else {
    reasons.push("Aansluitend profiel op de gevraagde vaardigheden");
  }
  reasons.push("Ervaringsniveau past bij het gevraagde niveau");
  reasons.push("Voorkeuren rond uren, werkplek en beschikbaarheid komen overeen");
  return { score, reasons: reasons.slice(0, 3) };
}

/**
 * Generate a conversational icebreaker to open a fresh match chat.
 * @returns {Promise<string>}
 */
export async function icebreaker({ profileRole = "", jobTitle = "", company = "" } = {}) {
  if (ENDPOINT) return callBackend("icebreaker", { profileRole, jobTitle, company });

  await wait(900);
  const options = [
    `Leuk, een match! Wat sprak je het meest aan in de rol van ${jobTitle} bij ${company}?`,
    `Hoi! We zagen sterke overlap met ${jobTitle}. Zullen we een korte kennismaking plannen?`,
    `Fijn dat er interesse is van beide kanten. Wat zou je graag als eerste willen weten over ${company}?`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}

/** Whether the app is currently wired to a real AI backend. */
export const isLiveAI = Boolean(ENDPOINT);
