import { test } from "node:test";
import assert from "node:assert/strict";
import { profileRow, profileFrom, certRow, projectRow, jobRow, jobFrom, companyRow, companyFrom } from "./live.js";
import { me, seedJobs, companies } from "./data.js";

test("store ↔ row mapping round-trips what the UI edits", () => {
  const row = { id: "u1", ...profileRow(me), profile_certificates: me.certs.map((c) => ({ id: c.id, ...certRow(c), verified: c.verified })),
    projects: me.projects.map((x, k) => ({ id: x.id, created_at: `2026-0${9 - k}-01`, ...projectRow(x) })) };
  const back = profileFrom(row);
  for (const k of ["name", "headline", "city", "skills", "availability", "radiusKm", "minRate", "contracts", "discoverable", "experience", "education"]) assert.deepEqual(back[k], me[k], k);
  assert.deepEqual(back.certs.map((c) => [c.name, c.validUntil, c.verified]), me.certs.map((c) => [c.name, c.validUntil, c.verified]));
  assert.deepEqual(back.projects.map((x) => [x.title, x.from, x.to, x.photos]), me.projects.map((x) => [x.title, x.from, x.to, x.photos]));
  assert.equal("verified" in certRow(me.certs[0]), false, "client never writes verified");

  const j = { ...seedJobs[0], minYears: 4 };
  const jb = jobFrom({ id: j.id, company_id: j.company, status: "live", ...jobRow(j) });
  for (const k of ["title", "city", "rateMin", "rateMax", "contract", "start", "skills", "certs", "tasks", "photo", "video", "team", "minYears"]) assert.deepEqual(jb[k], j[k], k);

  const c = companies.vanoord, cb = companyFrom({ id: c.id, ...companyRow(c) }, true);
  for (const k of ["name", "about", "workplace", "media", "people"]) assert.deepEqual(cb[k], c[k], k);
  assert.equal(cb.own, true);
});
