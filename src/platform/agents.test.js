// Run: node --test src/platform/agents.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { seedCandidates, seedApps, seedEvents, seedMessages, seedWorkflows, externalPool, seedJobs } from "./data.js";
import { vacancyAgent, matchingAgent, talentAgent, outreachAgent, screeningAgent, screenCandidate, complianceAgent, interviewAgent, freeSlots, applyPlan, decide, allJobs } from "./agents.js";

const store0 = () => ({ jobs: [], ats: { candidates: seedCandidates, apps: seedApps, events: seedEvents, messages: seedMessages, workflows: seedWorkflows, tasks: [], runs: [], queue: [], outage: {}, approvals: [] } });
const TEXT = "NDT Inspector Monopiles\nLocatie: Rotterdam. Freelance, €58 - €70 per uur.\n- UT en PAUT op monopile-lassen\nEisen: UT2, VCA, BOSIET.";

test("vacancy agent structures + flags missing info", () => {
  const p = vacancyAgent(TEXT, "vanoord");
  assert.equal(p.job.title, "NDT Inspector Monopiles");
  assert.deepEqual(p.job.certs, ["UT2", "VCA", "BOSIET"]);
  assert.equal(vacancyAgent("hallo", "x").actions.length, 0);
  assert.ok(vacancyAgent("Lasser\nRotterdam", "x").log.some((l) => l.includes("salaris")));
});

test("full flow: vacancy → matching → talent → outreach → screening → approval → interview", () => {
  let s = store0();
  const v = vacancyAgent(TEXT, "vanoord");
  s = applyPlan(s, v, "Vacancy Agent");
  const job = allJobs(s).find((j) => j.id === v.job.id);
  assert.ok(job);

  s = applyPlan(s, matchingAgent(s.ats, job, 70), "Matching Agent");
  const matched = s.ats.apps.filter((a) => a.job === job.id);
  assert.ok(matched.length >= 2, "UT2 inspectors in CRM should match");

  const tal = talentAgent(s.ats, externalPool, job, 70, 2);
  s = applyPlan(s, tal, "Talent Agent");
  assert.ok(s.ats.candidates.length > seedCandidates.length);
  assert.ok(s.ats.runs.some((r) => r.trigger.includes("Nieuwe kandidaat")), "import fires candidate.created");

  s = applyPlan(s, outreachAgent(s.ats, job), "Outreach Agent");
  for (const a of s.ats.apps.filter((a) => a.job === job.id && a.stage === "Nieuw"))
    assert.ok(s.ats.tasks.some((t) => t.cand === a.cand), "uncontactable candidate → recruiter task");
  assert.ok(s.ats.queue.some((q) => q.key.startsWith("outreach:")) || s.ats.tasks.length, "outreach sends or creates task");
  const again = applyPlan(s, outreachAgent(s.ats, job), "Outreach Agent");
  assert.equal(again.ats.queue.length, s.ats.queue.length, "idempotent");

  s = applyPlan(s, screeningAgent(s.ats, job), "Screening Agent");
  const screened = s.ats.apps.filter((a) => a.job === job.id && a.screen);
  assert.ok(screened.length > 0);
  // never auto-rejected: everything not passing is waiting for a human
  assert.equal(s.ats.apps.filter((a) => a.job === job.id && a.stage === "Afgewezen").length, 0);
  const waiting = s.ats.approvals.length;
  assert.equal(waiting, screened.filter((a) => a.screen.result !== "pass").length);

  if (waiting) {
    const ap = s.ats.approvals[0];
    s = decide(s, ap.id, false); // human overrides: keep candidate
    assert.equal(s.ats.approvals.length, waiting - 1);
  }

  const before = s.ats.events.length;
  s = applyPlan(s, interviewAgent(s.ats, job), "Interview Agent");
  assert.ok(s.ats.events.length > before, "interviews planned");
  assert.ok(s.ats.queue.some((q) => q.workflow === "Gespreksbevestiging"), "confirmation via workflow");
  assert.ok(s.ats.apps.some((a) => a.job === job.id && a.stage === "Gesprek"));
});

test("screening rules", () => {
  const job = { ...seedJobs[0], certs: ["UT2", "VCA"], start: new Date(Date.now() + 40 * 864e5).toISOString() };
  const ok = screenCandidate(seedCandidates[1], job);
  assert.equal(ok.result, "pass");
  const bad = screenCandidate({ ...seedCandidates[1], certs: [] }, job);
  assert.equal(bad.result, "fail");
});

test("compliance + free slots", () => {
  const p = complianceAgent(store0().ats, seedJobs);
  assert.ok(p.log.some((l) => l.includes("BOSIET")), "Sem's BOSIET expires in 24 days");
  const slots = freeSlots([{ date: "2026-10-13", time: "09:00" }], 2, new Date("2026-10-12T12:00:00"));
  assert.deepEqual(slots, [{ date: "2026-10-13", time: "10:00" }, { date: "2026-10-13", time: "11:00" }]);
});
