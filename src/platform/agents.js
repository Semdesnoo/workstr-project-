// Workstr recruitment agents. Each agent is a pure function: (state, input) → plan { log, actions }.
// applyPlan() executes a plan against the store; fireEvent() runs triggers → workflows.
// Predictable checks (certs, rates, distance, slots) are rules; language (structuring, messages) is
// templated here and swappable for an LLM call server-side. Nothing irreversible happens without a human.
import { matchJob, toProfile, certStatus, daysLeft, km, structureVacancy } from "./logic.js";
import { TRIGGERS, CHANNELS, runWorkflows, enqueue } from "./engine.js";

export const AGENTS = [
  { id: "vacancy", name: "Vacancy Agent", role: "Zet ruwe tekst om in een complete, gestructureerde vacature en signaleert ontbrekende info." },
  { id: "matching", name: "Matching Agent", role: "Scoort je hele CRM op de vacature en zet passende kandidaten in de pipeline — met uitleg." },
  { id: "talent", name: "Talent Agent", role: "Sourcet buiten je CRM (externe databases, LinkedIn) en importeert de beste profielen." },
  { id: "outreach", name: "Outreach Agent", role: "Benadert nieuwe kandidaten persoonlijk via het beste kanaal: WhatsApp, e-mail of taak." },
  { id: "screening", name: "Screening Agent", role: "Toetst knock-outcriteria: certificaten, beschikbaarheid, tarief en reisafstand." },
  { id: "compliance", name: "Compliance Agent", role: "Bewaakt certificaten in de pipeline: verlopen, bijna verlopen, niet geverifieerd." },
  { id: "approval", name: "Human Approval", role: "Elke afwijzing, twijfel of aanbod wacht op een mens. Agents beslissen nooit alleen." },
  { id: "interview", name: "Interview Agent", role: "Plant gesprekken in vrije slots en laat de bevestiging automatisch versturen." },
];

const uid = () => crypto.randomUUID();
const first = (c) => c.name.split(" ")[0];
export const allJobs = (store) => store.jobs;
const scoreOf = (c, j) => matchJob(toProfile(c), j);
const appsFor = (ats, jobId, stage) => ats.apps.filter((a) => a.job === jobId && (!stage || a.stage === stage));

// ---------------------------------------------------------------- agents
export function vacancyAgent(text, company) {
  const v = structureVacancy(text);
  const missing = [!v.title && "functietitel", !v.city && "locatie", !v.rateMax && "salaris/tarief", !v.contract && "contractvorm", !v.certs.length && "certificaten"].filter(Boolean);
  const job = { ...v, id: uid(), company, contract: v.contract || "project", start: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    duration: "n.t.b.", photo: "./work/w3.jpg", team: "", tasks: v.tasks.length ? v.tasks : ["Zie gesprek"] };
  const ok = v.title && v.city;
  return {
    log: [ok ? `Vacature “${v.title}” gestructureerd: ${v.certs.length} certificaten, ${v.skills.length} skills.` : "Kon geen titel of locatie vinden — niet gepubliceerd.",
      ...(missing.length ? [`Ontbreekt: ${missing.join(", ")}. ${missing.includes("salaris/tarief") ? "Salaristransparantie verhoogt respons." : ""}`] : [])],
    actions: ok ? [{ type: "job", job }] : [], job: ok ? job : null,
  };
}

export function matchingAgent(ats, job, min = 70) {
  const hits = ats.candidates.filter((c) => !ats.apps.some((a) => a.cand === c.id && a.job === job.id))
    .map((c) => ({ c, m: scoreOf(c, job) })).filter((x) => x.m.score >= min).sort((a, b) => b.m.score - a.m.score);
  return {
    log: [`${ats.candidates.length} CRM-profielen gescoord op ${job.title}: ${hits.length} ≥ ${min}%.`,
      ...hits.map((x) => `${x.c.name} ${x.m.score}% — ${x.m.reasons.filter((r) => r.type === "ok").slice(0, 2).map((r) => r.text).join(", ")}`)],
    actions: hits.map((x) => ({ type: "app", cand: x.c.id, job: job.id, stage: "Nieuw" })),
  };
}

export function talentAgent(ats, pool, job, min = 75, limit = 3) {
  const hits = pool.filter((x) => !ats.candidates.some((c) => c.extId === x.id))
    .map((x) => ({ x, s: scoreOf(x, job).score })).filter((h) => h.s >= min).sort((a, b) => b.s - a.s).slice(0, limit);
  return {
    log: [`Extern gezocht voor ${job.title}: ${hits.length} profielen ≥ ${min}% (max ${limit}).`, ...hits.map((h) => `${h.x.name} (${h.x.source}) ${h.s}%`)],
    actions: hits.flatMap((h) => { const id = uid(); return [{ type: "import", candidate: { ...h.x, id, extId: h.x.id, tags: ["Gesourcet"] } }, { type: "app", cand: id, job: job.id, stage: "Nieuw", event: true }]; }),
  };
}

export function outreachAgent(ats, job) {
  const log = [], actions = [];
  for (const a of appsFor(ats, job.id, "Nieuw")) {
    const c = ats.candidates.find((x) => x.id === a.cand);
    const m = scoreOf(c, job);
    const why = m.reasons.filter((r) => r.type === "ok").slice(0, 2).map((r) => r.text.toLowerCase()).join(" en ");
    const rate = job.unit === "uur" ? `€${job.rateMin}–${job.rateMax}/u` : `€${job.rateMin}–${job.rateMax}/mnd`;
    const text = `Hoi ${first(c)}, ik zag je profiel en denk dat ${job.title} in ${job.city} (${rate}) goed bij je past: ${why}. Zin om kort te bellen?`;
    const channel = c.phone ? "whatsapp" : c.email ? "email" : null;
    if (!channel) { actions.push({ type: "task", cand: c.id, key: `outreach:${job.id}:${c.id}`, text: `Geen contactgegevens voor ${c.name} — benader via LinkedIn InMail` }); log.push(`${c.name}: geen telefoon/e-mail → taak voor recruiter.`); continue; }
    actions.push({ type: "message", cand: c.id, channel, text, key: `outreach:${job.id}:${c.id}` }, { type: "stage", cand: c.id, job: job.id, to: "Benaderd" });
    log.push(`${c.name}: ${CHANNELS[channel]} verstuurd (${m.score}%).`);
  }
  if (!log.length) log.push("Geen nieuwe kandidaten om te benaderen.");
  return { log, actions };
}

// Knock-out screening. Pass → Gescreend. Doubt or fail → Human Approval (never auto-reject).
export function screenCandidate(c, job, now = new Date()) {
  const reasons = [];
  let fail = false, doubt = false;
  for (const name of job.certs || []) {
    const st = certStatus(c.certs.find((x) => x.name === name), now);
    if (st === "missing" || st === "expired") { fail = true; reasons.push(`${name} ${st === "expired" ? "verlopen" : "ontbreekt"}`); }
    else if (st === "expiring") { doubt = true; reasons.push(`${name} verloopt binnenkort`); }
    else if (st === "uploaded") { doubt = true; reasons.push(`${name} niet geverifieerd`); }
  }
  if (job.unit === "uur" && c.rate > job.rateMax * 1.1) { doubt = true; reasons.push(`Tarief €${c.rate} > max €${job.rateMax}`); }
  const dist = km(c.city, job.city);
  if (dist !== null && dist > 200) { doubt = true; reasons.push(`${dist} km reisafstand`); }
  const startIn = daysLeft(job.start, now), avail = { now: 0, "2w": 14, "1m": 30 }[c.availability] ?? 999;
  if (avail > startIn) { doubt = true; reasons.push("Beschikbaar na startdatum"); }
  return { result: fail ? "fail" : doubt ? "doubt" : "pass", reasons };
}

export function screeningAgent(ats, job, now = new Date()) {
  const log = [], actions = [];
  for (const a of appsFor(ats, job.id, "Benaderd").filter((a) => !a.screen)) {
    const c = ats.candidates.find((x) => x.id === a.cand);
    const s = screenCandidate(c, job, now);
    actions.push({ type: "screen", app: a.id, screen: s });
    if (s.result === "pass") { actions.push({ type: "stage", cand: c.id, job: job.id, to: "Gescreend" }); log.push(`${c.name}: geslaagd.`); }
    else {
      actions.push({ type: "approval", agent: "Screening Agent", text: `${c.name} — ${s.result === "fail" ? "voldoet niet" : "twijfel"} voor ${job.title}: ${s.reasons.join(", ")}`,
        approve: s.result === "fail" ? { type: "stage", cand: c.id, job: job.id, to: "Afgewezen", label: "Afwijzen" } : { type: "stage", cand: c.id, job: job.id, to: "Gescreend", label: "Toch doorzetten" },
        reject: s.result === "fail" ? { type: "stage", cand: c.id, job: job.id, to: "Gescreend", label: "Toch doorzetten" } : null });
      log.push(`${c.name}: ${s.result === "fail" ? "knock-out" : "twijfel"} (${s.reasons.join(", ")}) → Human Approval.`);
    }
  }
  if (!log.length) log.push("Geen benaderde kandidaten om te screenen.");
  return { log, actions };
}

export function complianceAgent(ats, jobs, now = new Date()) {
  const log = [], actions = [];
  for (const a of ats.apps.filter((x) => !["Afgewezen", "Geplaatst"].includes(x.stage))) {
    const c = ats.candidates.find((x) => x.id === a.cand), j = jobs.find((x) => x.id === a.job);
    if (!c || !j) continue;
    for (const name of j.certs || []) {
      const cert = c.certs.find((x) => x.name === name), st = certStatus(cert, now);
      const key = `compliance:${c.id}:${name}:${st}`;
      if (actions.some((x) => x.key === key)) continue; // same cert, several vacancies
      if (st === "expiring" || st === "expired") {
        const channel = c.phone ? "whatsapp" : "email";
        actions.push({ type: "message", cand: c.id, channel, key, text: `Hoi ${first(c)}, je ${name} ${st === "expired" ? "is verlopen" : `verloopt over ${daysLeft(cert.validUntil, now)} dagen`}. Upload je nieuwe certificaat in de Workstr app, dan blijf je inzetbaar voor ${j.title}.` });
        log.push(`${c.name}: ${name} ${st === "expired" ? "verlopen" : "verloopt"} → herinnering.`);
      } else if (st === "uploaded") { actions.push({ type: "task", cand: c.id, key, text: `Verifieer ${name} van ${c.name} bij de uitgever` }); log.push(`${c.name}: ${name} niet geverifieerd → taak.`); }
    }
  }
  if (!log.length) log.push("Alle certificaten in de pipeline zijn in orde.");
  return { log, actions };
}

// Next free weekday slots 09:00–16:00, skipping slots already in the agenda.
export function freeSlots(events, count, now = new Date()) {
  const out = [], d = new Date(now); d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const date = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    for (let h = 9; h <= 16 && out.length < count; h += 1) {
      const time = `${String(h).padStart(2, "0")}:00`;
      if (!events.some((e) => e.date === date && e.time === time) && !out.some((s) => s.date === date && s.time === time)) out.push({ date, time });
    }
  }
  return out;
}

export function interviewAgent(ats, job, now = new Date()) {
  const ready = appsFor(ats, job.id, "Gescreend").filter((a) => !ats.events.some((e) => e.cand === a.cand && e.job === job.id));
  const slots = freeSlots(ats.events, ready.length, now);
  return {
    log: ready.length ? ready.map((a, i) => `${ats.candidates.find((c) => c.id === a.cand)?.name}: gesprek ${slots[i].date} ${slots[i].time}.`) : ["Geen gescreende kandidaten zonder gesprek."],
    actions: ready.map((a, i) => ({ type: "event", event: { id: uid(), cand: a.cand, job: job.id, ...slots[i], type: "Videogesprek" } })),
  };
}

// ---------------------------------------------------------------- execution
// Triggers → workflows → actions (shared by UI events and agents).
export function fireEvent(ats, jobs, ev) {
  const c = ats.candidates.find((x) => x.id === ev.cand), j = jobs.find((x) => x.id === ev.job);
  const s = c && j ? scoreOf(c, j).score : 0;
  const e = { id: uid(), score: s, source: c?.source, ...ev, vars: { voornaam: c && first(c), naam: c?.name, vacature: j?.title, plaats: j?.city, score: s, ...ev.vars } };
  const acts = runWorkflows(ats.workflows, e);
  let next = { ...ats, runs: [{ id: e.id, at: new Date().toISOString(), trigger: TRIGGERS[e.type], cand: c?.name,
    actions: acts.map((x) => `${x.workflow}: ${x.type === "message" ? CHANNELS[x.channel] : x.type === "stage" ? `fase → ${x.to}` : "taak"}`) }, ...ats.runs].slice(0, 50) };
  for (const x of acts) {
    if (x.type === "message") next = addMessage(next, { cand: e.cand, channel: x.channel, text: x.text, key: x.key, auto: x.workflow, approval: x.approval });
    else if (x.type === "stage" && e.job) next = { ...next, apps: next.apps.map((p) => (p.cand === e.cand && p.job === e.job ? { ...p, stage: x.to } : p)) };
    else if (x.type === "task") next = { ...next, tasks: [{ id: uid(), cand: e.cand, text: x.text, done: false }, ...next.tasks] };
  }
  return next;
}

export function addMessage(ats, { cand, channel, text, key = uid(), auto, approval }) {
  if (ats.messages.some((m) => m.key === key)) return ats; // idempotent
  return { ...ats, queue: enqueue(ats.queue, { id: uid(), key, channel, to: cand, text, workflow: auto, approval }),
    messages: [...ats.messages, { id: uid(), key, cand, channel, dir: "out", text, at: new Date().toISOString(), auto }] };
}

const setStage = (ats, jobs, x, by) => {
  const app = ats.apps.find((p) => p.cand === x.cand && p.job === x.job);
  if (!app || app.stage === x.to) return ats;
  const next = { ...ats, apps: ats.apps.map((p) => (p === app ? { ...p, stage: x.to } : p)) };
  return by === "workflow" ? next : fireEvent(next, jobs, { type: "stage.changed", cand: x.cand, job: x.job, stage: x.to });
};

export function applyAction(store, x, agent) {
  if (x.type === "job") return { ...store, jobs: [x.job, ...store.jobs] };
  const jobs = allJobs(store);
  let a = store.ats;
  switch (x.type) {
    case "import": if (!a.candidates.some((c) => c.id === x.candidate.id)) a = { ...a, candidates: [...a.candidates, x.candidate] }; break;
    case "app":
      if (!a.apps.some((p) => p.cand === x.cand && p.job === x.job)) {
        a = { ...a, apps: [...a.apps, { id: uid(), cand: x.cand, job: x.job, stage: x.stage }] };
        if (x.event) a = fireEvent(a, jobs, { type: "candidate.created", cand: x.cand, job: x.job });
      }
      break;
    case "stage": a = setStage(a, jobs, x, "agent"); break;
    case "message": a = addMessage(a, { ...x, auto: agent }); break;
    case "task": if (!x.key || !a.tasks.some((t) => t.key === x.key)) a = { ...a, tasks: [{ id: uid(), cand: x.cand, text: x.text, key: x.key, done: false }, ...a.tasks] }; break;
    case "screen": a = { ...a, apps: a.apps.map((p) => (p.id === x.app ? { ...p, screen: x.screen } : p)) }; break;
    case "event":
      a = { ...a, events: [...a.events, x.event] };
      a = fireEvent(a, jobs, { type: "interview.scheduled", cand: x.event.cand, job: x.event.job,
        vars: { datum: new Date(x.event.date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }), tijd: x.event.time } });
      break;
    case "approval": a = { ...a, approvals: [...(a.approvals || []), { id: uid(), agent: x.agent, text: x.text, approve: x.approve, reject: x.reject }] }; break;
  }
  return { ...store, ats: a };
}

export function applyPlan(store, plan, agent) {
  let s = plan.actions.reduce((st, x) => applyAction(st, x, agent), store);
  const at = new Date().toISOString();
  s = { ...s, ats: { ...s.ats, agentLog: [...plan.log.map((text) => ({ at, agent, text })), ...(s.ats.agentLog || [])].slice(0, 80),
    agentRuns: { ...(s.ats.agentRuns || {}), [agent]: { at, actions: plan.actions.length, summary: plan.log[0] } } } };
  return s;
}

// Human decision on an approval card: run the chosen action, log who decided.
export function decide(store, id, ok) {
  const ap = (store.ats.approvals || []).find((x) => x.id === id);
  if (!ap) return store;
  let s = { ...store, ats: { ...store.ats, approvals: store.ats.approvals.filter((x) => x.id !== id) } };
  const action = ok ? ap.approve : ap.reject;
  if (action) s = applyAction(s, action, "Human Approval");
  const at = new Date().toISOString();
  return { ...s, ats: { ...s.ats, agentLog: [{ at, agent: "Human Approval", text: `${action?.label || (ok ? "Goedgekeurd" : "Afgewezen")}: ${ap.text}`, human: true }, ...(s.ats.agentLog || [])] } };
}
