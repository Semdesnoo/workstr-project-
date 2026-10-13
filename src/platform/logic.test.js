// Run: node --test src/platform
import test from "node:test";
import assert from "node:assert/strict";
import { certStatus, matchJob, structureProject, structureVacancy, timesheetIssues, compliance, km, CAP, experienceYears } from "./logic.js";
import { me, seedJobs, workers, REQUIRED_DOCS } from "./data.js";

const now = new Date("2026-10-12");
const inDays = (n) => new Date(now.getTime() + n * 864e5).toISOString().slice(0, 10);

test("cert statuses", () => {
  assert.equal(certStatus(undefined, now), "missing");
  assert.equal(certStatus({ validUntil: inDays(-1), verified: true }, now), "expired");
  assert.equal(certStatus({ validUntil: inDays(20), verified: true }, now), "expiring");
  assert.equal(certStatus({ validUntil: inDays(200), verified: false }, now), "uploaded");
  assert.equal(certStatus({ validUntil: inDays(200), verified: true }, now), "verified");
});

test("match explains itself and ranks the right job first", () => {
  const scores = seedJobs.map((j) => [j.id, matchJob(me, j).score]);
  scores.sort((a, b) => b[1] - a[1]);
  assert.deepEqual(scores.slice(0, 2).map((s) => s[0]).sort(), ["j1", "j2"]); // inspection jobs near home
  const m = matchJob(me, seedJobs[0]);
  assert.ok(m.reasons.some((r) => r.type === "warn" && r.text.includes("BOSIET")));
  assert.ok(m.reasons.some((r) => r.text.includes("radius")));
  const lasser = matchJob(me, seedJobs.find((j) => j.id === "j5"));
  assert.ok(lasser.score < m.score);
});

test("distance", () => assert.ok(Math.abs(km("Rotterdam", "Amsterdam") - 57) < 5));

test("required certificate is a hard gate; experience counts", () => {
  const job = { ...seedJobs[0], certs: ["UT2", "VCA"], skills: ["UT"], minYears: 4, start: inDays(60) };
  const full = { ...me, years: 6, certs: [{ name: "UT2", validUntil: inDays(400), verified: true }, { name: "VCA", validUntil: inDays(400), verified: true }] };
  const noVca = { ...full, certs: full.certs.slice(0, 1) };
  assert.ok(matchJob(full, job, now).score > 90);
  const g = matchJob(noVca, job, now);
  assert.equal(g.score, CAP);
  assert.ok(g.gated && g.reasons.some((r) => r.type === "no" && r.text.startsWith("VCA")));
  assert.ok(matchJob({ ...full, years: 1 }, job, now).score < matchJob(full, job, now).score);
  assert.equal(experienceYears({ experience: [{ from: "2020-01", to: "2022-01" }] }, now), 2);
});

test("project structuring only labels what was written", () => {
  const p = structureProject("UT inspecties uitgevoerd aan offshore jacket.");
  assert.equal(p.title, "Offshore Jacket Inspection");
  assert.equal(p.sector, "Offshore");
  assert.deepEqual(p.skills.sort(), ["Offshore", "UT"].sort());
});

test("vacancy structuring", () => {
  const v = structureVacancy("NDT Inspector\nLocatie Rotterdam, freelance, €65 - €75 per uur\n- UT op lassen\nEisen: UT2, VCA, BOSIET");
  assert.equal(v.title, "NDT Inspector");
  assert.equal(v.city, "Rotterdam");
  assert.equal(v.rateMin, 65);
  assert.equal(v.contract, "freelance");
  assert.deepEqual(v.certs, ["UT2", "VCA", "BOSIET"]);
  assert.deepEqual(v.tasks, ["UT op lassen"]);
});

test("timesheet rules", () => {
  const r = timesheetIssues({ days: [8, 8, 8, 8, 8, 6, 0], rate: 70, approvedOvertime: false, submitted: true }, 68);
  assert.equal(r.hours, 46);
  assert.equal(r.amount, 46 * 68);
  assert.ok(r.issues.some((i) => i.includes("6 overuren")));
  assert.ok(r.issues.some((i) => i.includes("Weekend")));
  assert.ok(r.issues.some((i) => i.includes("Tarief")));
  assert.deepEqual(timesheetIssues({ days: [8, 8, 8, 8, 8, 0, 0], rate: 68, approvedOvertime: false, submitted: true }, 68).issues, []);
});

test("compliance pct", () => {
  const c = compliance(workers[0], REQUIRED_DOCS);
  assert.equal(c.pct, 80); // induction missing, medical expiring still counts
  assert.equal(c.items.find((i) => i.name === "Client induction").status, "missing");
});
