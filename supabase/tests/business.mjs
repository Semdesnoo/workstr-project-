// Round-trip test for the Business persistence layer (src/platform/db.js) against real Supabase.
// Run: SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/business.mjs
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { sync, load, emptyStore, demoStore } from "../../src/platform/db.js";
import { seedCandidates, seedJobs, seedWorkflows } from "../../src/platform/data.js";
import { applyPlan, talentAgent, matchingAgent, outreachAgent } from "../../src/platform/agents.js";
import { externalPool } from "../../src/platform/data.js";

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY");
const db = createClient(url, key, { auth: { persistSession: false } });
const { data: auth, error: e1 } = await db.auth.signUp({ email: `workstr-business-${Date.now()}@mailinator.com`, password: crypto.randomUUID() });
if (e1) throw e1;
assert.ok(auth.session, 'turn OFF "Confirm email"');
const { data: cid, error: e2 } = await db.rpc("create_company", { p_name: "Business roundtrip" });
if (e2) throw e2;

// 1. demo data saves and loads back identically (ids, links, certs)
const demo = demoStore();
await sync(emptyStore(), demo, cid, db);
let s = await load(cid, db);
assert.equal(s.ats.candidates.length, seedCandidates.length);
assert.equal(s.jobs.length, seedJobs.length);
assert.equal(s.ats.workflows.length, seedWorkflows.length);
const sem = s.ats.candidates.find((c) => c.name === "Sem de Snoo");
assert.deepEqual(sem.certs.map((c) => c.name).sort(), ["BOSIET", "UT2", "VCA"]);
assert.deepEqual(s.ats.apps.map((a) => a.id).sort(), demo.ats.apps.map((a) => a.id).sort());
const ev = demo.ats.events[0], evBack = s.ats.events.find((e) => e.id === ev.id);
assert.equal(`${evBack.date} ${evBack.time}`, `${ev.date} ${ev.time}`, "agenda time survives round-trip");

// 2. agents run on loaded data and their effects persist
const job = s.jobs.find((j) => j.title === "NDT Inspector");
let next = applyPlan({ ...s }, matchingAgent(s.ats, job, 60), "Matching Agent");
next = applyPlan(next, talentAgent(next.ats, externalPool, job, 60, 2), "Talent Agent");
next = applyPlan(next, outreachAgent(next.ats, job), "Outreach Agent");
await sync(s, next, cid, db);
const after = await load(cid, db);
assert.equal(after.ats.candidates.length, next.ats.candidates.length, "sourced candidates saved");
assert.ok(after.ats.candidates.some((c) => c.extId), "external id stored");
assert.equal(after.ats.queue.length, next.ats.queue.length, "outbound jobs saved");
assert.ok(after.ats.agentLog.length > 0, "audit log written");

// 3. updates and deletes
const moved = { ...after, ats: { ...after.ats, apps: after.ats.apps.map((a, i) => (i === 0 ? { ...a, stage: "Aanbod" } : a)), workflows: after.ats.workflows.slice(1) } };
await sync(after, moved, cid, db);
const final = await load(cid, db);
assert.equal(final.ats.apps.find((a) => a.id === moved.ats.apps[0].id).stage, "Aanbod");
assert.equal(final.ats.workflows.length, after.ats.workflows.length - 1);

// 4. re-importing the same external profile is blocked by the database
const dup = after.ats.candidates.find((c) => c.extId);
const { error: d } = await db.from("candidates").insert({ company_id: cid, name: dup.name, external_id: dup.extId });
assert.ok(d, "duplicate external import allowed");

console.log("✔ business persistence: round-trip, agents, updates, deletes, dedupe passed");
