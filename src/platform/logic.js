// Workstr core rules. Predictable things are plain code (brief §34):
// cert expiry, matching score, timesheet checks, money. "AI" structuring here is a
// keyword extractor that only re-labels what the user wrote — it never invents.
import { CITIES } from "./data.js";

const DAY = 864e5;
export const daysLeft = (date, now = new Date()) => Math.ceil((new Date(date) - now) / DAY);

// Verified | Uploaded | Expiring soon | Expired | Missing
export function certStatus(cert, now = new Date()) {
  if (!cert) return "missing";
  if (cert.validUntil) {
    const left = daysLeft(cert.validUntil, now);
    if (left < 0) return "expired";
    if (left <= 60) return "expiring";
  }
  return cert.verified ? "verified" : "uploaded";
}

export function km(a, b) {
  const A = CITIES[a], B = CITIES[b];
  if (!A || !B) return null;
  const r = (x) => (x * Math.PI) / 180;
  const h = Math.sin(r(B[0] - A[0]) / 2) ** 2 + Math.cos(r(A[0])) * Math.cos(r(B[0])) * Math.sin(r(B[1] - A[1]) / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
}

const AVAIL_DAYS = { now: 0, "2w": 14, "1m": 30 };
export const AVAIL_LABEL = { now: "Per direct", "2w": "Binnen 2 weken", "1m": "Binnen 1 maand", date: "Vanaf datum", no: "Niet beschikbaar" };

// Explainable match: every point of the score comes with a reason the user can read.
// Weights: certs 35, skills 25, location 15, rate 10, contract 10, availability 5.
export function matchJob(p, job, now = new Date()) {
  const reasons = [];
  let score = 0;

  const certs = job.certs || [];
  let certPts = 0;
  for (const name of certs) {
    const st = certStatus(p.certs.find((c) => c.name === name), now);
    if (st === "verified" || st === "uploaded") {
      certPts += 1;
      reasons.push({ type: "ok", text: `Je hebt ${name}${st === "uploaded" ? " (nog niet geverifieerd)" : ""}` });
    } else if (st === "expiring") {
      certPts += 0.75;
      reasons.push({ type: "warn", text: `${name} verloopt binnenkort` });
    } else {
      reasons.push({ type: "no", text: `${name} ${st === "expired" ? "is verlopen" : "ontbreekt"}` });
    }
  }
  score += certs.length ? (35 * certPts) / certs.length : 35;

  const have = new Set(p.skills.map((s) => s.toLowerCase()));
  const hit = (job.skills || []).filter((s) => have.has(s.toLowerCase()));
  score += job.skills?.length ? (25 * hit.length) / job.skills.length : 25;
  if (hit.length) reasons.push({ type: "ok", text: `Skills: ${hit.slice(0, 3).join(", ")}` });
  if ((p.projects || []).some((pr) => pr.sector === job.sector))
    reasons.push({ type: "ok", text: `Je hebt ${job.sector.toLowerCase()}-ervaring in je projecten` });

  const dist = km(p.city, job.city);
  if (dist === null || dist <= p.radiusKm) {
    score += 15;
    reasons.push({ type: "ok", text: dist === null ? "Locatie onbekend — check zelf" : `Locatie ligt binnen je radius (${dist} km)` });
  } else {
    score += dist <= p.radiusKm * 2 ? 7 : 0;
    reasons.push({ type: "warn", text: `${dist} km — buiten je radius van ${p.radiusKm} km` });
  }

  if (job.unit === "uur") {
    if (job.rateMax >= p.minRate) {
      score += 10;
      reasons.push({ type: "ok", text: "Het tarief past binnen je voorkeur" });
    } else reasons.push({ type: "no", text: `Tarief onder je minimum van €${p.minRate}/u` });
  } else score += 5; // salary jobs: no hourly preference to compare

  if (p.contracts.includes(job.contract)) score += 10;
  else reasons.push({ type: "warn", text: `Contractvorm '${job.contract}' staat niet in je voorkeuren` });

  if (p.availability === "no") reasons.push({ type: "warn", text: "Je staat op niet beschikbaar" });
  else {
    const from = p.availability === "date" ? daysLeft(p.availableFrom || now, now) : AVAIL_DAYS[p.availability];
    if (from <= daysLeft(job.start, now)) score += 5;
    else reasons.push({ type: "warn", text: "Start ligt vóór je beschikbaarheid" });
  }

  const order = { ok: 0, warn: 1, no: 2 };
  reasons.sort((a, b) => order[a.type] - order[b.type]);
  return { score: Math.round(score), reasons };
}

// ---- Structuring (projects + vacancies) ------------------------------------
const SKILL_WORDS = [
  [/\bpaut\b|phased array/i, "PAUT"], [/\btofd\b/i, "ToFD"], [/\but\b|ultrason/i, "UT"], [/\bmt\b|magnetisch/i, "MT"],
  [/\bpt\b|penetrant/i, "PT"], [/\bvt\b|visu/i, "VT"], [/\bndt\b|ndo\b|niet.destructie/i, "NDT"],
  [/las(sen|verbinding|inspect)|weld/i, "Weld Inspection"], [/mig|mag\b/i, "MIG/MAG"], [/\btig\b/i, "TIG"],
  [/offshore|jacket|platform|topside/i, "Offshore"], [/coating|verf/i, "Coating Inspection"], [/wps|pqr/i, "WPS"],
  [/rapport/i, "Rapportage"], [/tekening/i, "Tekeninglezen"], [/rigg/i, "Rigging"], [/onderhoud|maintenance/i, "Maintenance"],
];
const SECTOR_WORDS = [
  [/offshore|jacket|platform|monopile|topside/i, "Offshore"], [/wind|energie|energy|converter/i, "Energy"],
  [/raffinaderij|refinery|petrochem|shutdown/i, "Energy"], [/bouw|construction|brug/i, "Construction"],
  [/fabriek|productie|staalbouw|industrie/i, "Industrial"],
];
const OBJECT_WORDS = [
  [/jacket/i, "Jacket"], [/monopile/i, "Monopile"], [/pijpleiding|pipeline|leiding/i, "Pipeline"], [/tank/i, "Tank"],
  [/brug|bridge/i, "Bridge"], [/topside/i, "Topside"], [/converter/i, "Converter Station"], [/raffinaderij|refinery/i, "Refinery"],
];
export const CERT_WORDS = ["UT2", "UT3", "VCA", "VCA-VOL", "BOSIET", "Offshore Medical", "PAUT", "ToFD", "VT2", "MT2", "CSWIP 3.1", "GWO"];

const found = (list, text) => [...new Set(list.filter(([re]) => re.test(text)).map(([, v]) => v))];

export function structureProject(text) {
  const sector = found(SECTOR_WORDS, text)[0] || "";
  const object = found(OBJECT_WORDS, text)[0] || "";
  const skills = found(SKILL_WORDS, text);
  const activity = skills.some((s) => ["UT", "PAUT", "MT", "VT", "NDT", "ToFD", "Weld Inspection"].includes(s))
    ? "Inspection" : skills.some((s) => /MIG|TIG/.test(s)) ? "Welding" : "Project";
  const title = [sector === "Offshore" ? "Offshore" : "", object, activity].filter(Boolean).join(" ");
  return { title, sector, skills };
}

export function structureVacancy(text) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const rate = text.match(/€\s?(\d[\d.]*)\s?[-–]\s?€?\s?(\d[\d.]*)/);
  const num = (s) => Number(String(s).replace(/\./g, ""));
  const rateMin = rate ? num(rate[1]) : 0, rateMax = rate ? num(rate[2]) : 0;
  const lower = text.toLowerCase();
  const contract = /freelance|zzp/.test(lower) ? "freelance" : /project|tijdelijk/.test(lower) ? "project" : /vast|loondienst/.test(lower) ? "vast" : "";
  return {
    title: lines[0]?.replace(/^(vacature|functie)\s*[:\-]\s*/i, "") || "",
    city: Object.keys(CITIES).find((c) => lower.includes(c.toLowerCase())) || "",
    rateMin, rateMax, unit: rateMax > 500 ? "maand" : "uur", contract,
    skills: found(SKILL_WORDS, text),
    certs: CERT_WORDS.filter((c) => new RegExp(`\\b${c.replace(/[.+]/g, "\\$&")}\\b`, "i").test(text)),
    tasks: lines.filter((l) => /^[-•*]/.test(l)).map((l) => l.replace(/^[-•*]\s*/, "")).slice(0, 6),
    sector: found(SECTOR_WORDS, text)[0] || "Industrial",
  };
}

// ---- MSP rules ---------------------------------------------------------------
export function compliance(worker, required, now = new Date()) {
  const items = required.map((name) => {
    const until = worker.docs[name];
    const st = until ? certStatus({ validUntil: until, verified: true }, now) : "missing";
    return { name, status: st, days: until ? daysLeft(until, now) : null };
  });
  const ok = items.filter((i) => i.status === "verified" || i.status === "expiring").length;
  return { items, pct: Math.round((100 * ok) / required.length) };
}

// Rule-based timesheet checks (brief §31). Money is plain arithmetic.
export function timesheetIssues(ts, contractRate) {
  const hours = ts.days.reduce((a, b) => a + b, 0);
  const issues = [];
  if (!ts.submitted) issues.push("Timesheet niet ingediend");
  if (ts.days.slice(0, 5).some((h) => h === 0)) issues.push("Ontbrekende uren op werkdag");
  if (ts.days.some((h) => h > 12)) issues.push("Meer dan 12 uur op één dag");
  if (hours > 40 && !ts.approvedOvertime) issues.push(`${hours - 40} overuren niet goedgekeurd`);
  if (ts.days[5] + ts.days[6] > 0) issues.push("Weekenduren — toeslag controleren");
  if (ts.rate !== contractRate) issues.push(`Tarief €${ts.rate} ≠ contract €${contractRate}`);
  return { hours, amount: hours * contractRate, issues };
}

export const eur = (n) => "€" + n.toLocaleString("nl-NL");
