// Supabase persistence for Workstr Business.
// The UI keeps working on one immutable store ({ jobs, ats }); after every change `sync`
// diffs the previous and next store by object reference and upserts/deletes only what changed.
// Security is enforced by RLS in the database, not here.
import { createClient } from "@supabase/supabase-js";
import { seedCandidates, seedJobs, seedApps, seedEvents, seedMessages, seedWorkflows } from "./data.js";

const URL = import.meta.env?.VITE_SUPABASE_URL;
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;
export const supabase = URL && KEY ? createClient(URL, KEY) : null;

const num = (v) => (v == null ? null : Number(v));
const pad = (n) => String(n).padStart(2, "0");
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// table ↔ UI mapping. `get` picks the UI array, `to` builds a row, `from` builds a UI object.
export const TABLES = [
  { table: "candidates", get: (s) => s.ats.candidates,
    to: (x, cid) => ({ id: x.id, company_id: cid, name: x.name, headline: x.headline || null, city: x.city || null, email: x.email || null, phone: x.phone || null,
      source: x.source || "Handmatig", availability: x.availability || "now", rate: x.rate ?? null, skills: x.skills || [], tags: x.tags || [], external_id: x.extId || null }),
    from: (r) => ({ id: r.id, name: r.name, headline: r.headline || "", city: r.city || "", email: r.email || "", phone: r.phone || "", source: r.source,
      availability: r.availability, rate: num(r.rate), skills: r.skills, tags: r.tags, extId: r.external_id, certs: [] }) },
  { table: "vacancies", get: (s) => s.jobs,
    to: (x, cid) => ({ id: x.id, company_id: cid, title: x.title, city: x.city || null, sector: x.sector || null, duration: x.duration || null,
      rate_min: x.rateMin || null, rate_max: x.rateMax || null, unit: x.unit || "uur", contract: x.contract || null, start_date: x.start || null,
      skills: x.skills || [], certs: x.certs || [], tasks: x.tasks || [] }),
    from: (r) => ({ id: r.id, company: r.company_id, title: r.title, city: r.city || "", sector: r.sector || "Industrial", duration: r.duration || "n.t.b.",
      rateMin: num(r.rate_min) || 0, rateMax: num(r.rate_max) || 0, unit: r.unit, contract: r.contract || "project", start: r.start_date,
      skills: r.skills, certs: r.certs, tasks: r.tasks, photo: "./work/w3.jpg", team: "" }) },
  { table: "applications", get: (s) => s.ats.apps,
    to: (x, cid) => ({ id: x.id, company_id: cid, candidate_id: x.cand, vacancy_id: x.job, stage: x.stage, screen: x.screen || null }),
    from: (r) => ({ id: r.id, cand: r.candidate_id, job: r.vacancy_id, stage: r.stage, screen: r.screen || undefined }) },
  { table: "events", get: (s) => s.ats.events,
    to: (x, cid) => ({ id: x.id, company_id: cid, candidate_id: x.cand, vacancy_id: x.job || null, starts_at: new Date(`${x.date}T${x.time}`).toISOString(), kind: x.type }),
    from: (r) => { const d = new Date(r.starts_at); return { id: r.id, cand: r.candidate_id, job: r.vacancy_id, date: localDate(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, type: r.kind }; } },
  { table: "messages", get: (s) => s.ats.messages,
    to: (x, cid) => ({ id: x.id, company_id: cid, candidate_id: x.cand, channel: x.channel, direction: x.dir, body: x.text, key: x.key, workflow: x.auto || null, created_at: x.at }),
    from: (r) => ({ id: r.id, cand: r.candidate_id, channel: r.channel, dir: r.direction, text: r.body, key: r.key, auto: r.workflow || undefined, at: r.created_at }) },
  { table: "workflows", get: (s) => s.ats.workflows,
    to: (x, cid) => ({ id: x.id, company_id: cid, name: x.name, enabled: x.on, trigger: x.trigger, conditions: x.when || {}, actions: x.actions, requires_approval: !!x.approval }),
    from: (r) => ({ id: r.id, name: r.name, on: r.enabled, trigger: r.trigger, when: r.conditions, actions: r.actions, approval: r.requires_approval }) },
  { table: "outbound_jobs", get: (s) => s.ats.queue,
    to: (x, cid) => ({ id: x.id, company_id: cid, candidate_id: x.to, key: x.key, channel: x.channel, body: x.text, status: x.status, attempts: x.attempts,
      run_at: new Date(x.runAt).toISOString(), error: x.error || null, workflow: x.workflow || null }),
    from: (r) => ({ id: r.id, to: r.candidate_id, key: r.key, channel: r.channel, text: r.body, status: r.status, attempts: r.attempts,
      runAt: new Date(r.run_at).getTime(), error: r.error || undefined, workflow: r.workflow || undefined }) },
  // ponytail: a decided approval is deleted; the decision itself lives in audit_log.
  { table: "approvals", get: (s) => s.ats.approvals || [],
    to: (x, cid) => ({ id: x.id, company_id: cid, agent: x.agent, body: x.text, on_approve: x.approve || null, on_reject: x.reject || null }),
    from: (r) => ({ id: r.id, agent: r.agent, text: r.body, approve: r.on_approve || undefined, reject: r.on_reject || undefined }) },
  { table: "tasks", get: (s) => s.ats.tasks,
    to: (x, cid) => ({ id: x.id, company_id: cid, candidate_id: x.cand || null, text: x.text, key: x.key || null, done: !!x.done }),
    from: (r) => ({ id: r.id, cand: r.candidate_id, text: r.text, key: r.key || undefined, done: r.done }) },
];

const certRow = (c, candId, cid) => ({ company_id: cid, candidate_id: candId, name: c.name, number: c.number || null, issuer: c.issuer || null, valid_until: c.validUntil || null, verified: !!c.verified });
const ok = ({ error }) => { if (error) throw new Error(`${error.message}${error.details ? ` (${error.details})` : ""}`); };

// Write the difference between two stores. Parents first (candidates, vacancies), deletes last.
export async function sync(prev, next, cid, db = supabase) {
  const deletes = [];
  for (const t of TABLES) {
    const a = t.get(prev), b = t.get(next);
    if (a === b) continue;
    const old = new Map(a.map((x) => [x.id, x]));
    const changed = b.filter((x) => old.get(x.id) !== x);
    if (changed.length) ok(await db.from(t.table).upsert(changed.map((x) => t.to(x, cid))));
    if (t.table === "candidates") {
      for (const c of changed.filter((x) => old.get(x.id)?.certs !== x.certs)) {
        if (old.has(c.id)) ok(await db.from("certificates").delete().eq("candidate_id", c.id));
        if (c.certs?.length) ok(await db.from("certificates").insert(c.certs.map((x) => certRow(x, c.id, cid))));
      }
    }
    const keep = new Set(b.map((x) => x.id));
    const gone = a.filter((x) => !keep.has(x.id)).map((x) => x.id);
    if (gone.length) deletes.unshift([t.table, gone]);
  }
  for (const [table, ids] of deletes) ok(await db.from(table).delete().in("id", ids));
  // audit log is append-only: insert entries that weren't there before
  const seen = new Set(prev.ats.agentLog || []);
  const fresh = (next.ats.agentLog || []).filter((l) => !seen.has(l));
  if (fresh.length) ok(await db.from("audit_log").insert(fresh.map((l) => ({ company_id: cid, actor: l.agent, kind: l.human ? "human" : "ai", body: l.text, at: l.at }))));
}

export const emptyStore = () => ({ jobs: [], ats: { candidates: [], apps: [], events: [], messages: [], workflows: [], tasks: [], runs: [], queue: [], outage: {}, approvals: [], agentLog: [], agentRuns: {} } });

export async function load(cid, db = supabase) {
  const q = (table, extra = (x) => x) => extra(db.from(table).select("*").eq("company_id", cid)).then((r) => { ok(r); return r.data; });
  const [cands, certs, vacs, apps, events, msgs, wfs, jobs, aps, tasks, log] = await Promise.all([
    q("candidates", (x) => x.order("created_at")), q("certificates"), q("vacancies", (x) => x.order("created_at", { ascending: false })),
    q("applications", (x) => x.order("created_at")), q("events"), q("messages", (x) => x.order("created_at")), q("workflows"),
    q("outbound_jobs", (x) => x.order("created_at")), q("approvals", (x) => x.eq("status", "open").order("created_at")),
    q("tasks", (x) => x.order("created_at", { ascending: false })), q("audit_log", (x) => x.order("at", { ascending: false }).limit(80)),
  ]);
  const T = Object.fromEntries(TABLES.map((t) => [t.table, t.from]));
  const candidates = cands.map(T.candidates).map((c) => ({ ...c, certs: certs.filter((x) => x.candidate_id === c.id)
    .map((x) => ({ name: x.name, number: x.number || "", issuer: x.issuer || "", validUntil: x.valid_until, verified: x.verified })) }));
  return { jobs: vacs.map(T.vacancies), ats: { candidates, apps: apps.map(T.applications), events: events.map(T.events), messages: msgs.map(T.messages),
    workflows: wfs.map(T.workflows), queue: jobs.map(T.outbound_jobs), approvals: aps.map(T.approvals), tasks: tasks.map(T.tasks),
    agentLog: log.map((l) => ({ at: l.at, agent: l.actor, text: l.body, human: l.kind === "human" })), runs: [], outage: {}, agentRuns: {} } };
}

// Fictional demo data with fresh uuids, so a new company has something to work with.
export function demoStore() {
  const ids = new Map();
  const id = (old) => { if (!ids.has(old)) ids.set(old, crypto.randomUUID()); return ids.get(old); };
  const s = emptyStore();
  s.jobs = seedJobs.map((j) => ({ ...j, id: id(j.id) }));
  s.ats.candidates = seedCandidates.map((c) => ({ ...c, id: id(c.id) }));
  s.ats.apps = seedApps.map((a) => ({ ...a, id: id(a.id), cand: id(a.cand), job: id(a.job) }));
  s.ats.events = seedEvents.map((e) => ({ ...e, id: id(e.id), cand: id(e.cand), job: id(e.job) }));
  s.ats.messages = seedMessages.map((m) => ({ ...m, id: id(m.id), cand: id(m.cand), key: crypto.randomUUID() }));
  s.ats.workflows = seedWorkflows.map((w) => ({ ...w, id: id(w.id) }));
  return s;
}
