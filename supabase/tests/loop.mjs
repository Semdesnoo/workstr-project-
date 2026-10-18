// Kernloop + privacy against the real Supabase project.
// Run: SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/loop.mjs
// Creates throwaway users: P (vindbaar), Q (niet vindbaar), company C, other company D.
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY");
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const must = ({ data, error }) => { if (error) throw error; return data; };

async function user(label) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signUp({ email: `workstr-loop-${label}-${Date.now()}@mailinator.com`, password: crypto.randomUUID() });
  if (error) throw error;
  if (!data.session) throw new Error('No session after sign-up: turn OFF Authentication → Email → "Confirm email"');
  return { db, id: data.user.id };
}
async function company(label) {
  const u = await user(label);
  u.company = must(await u.db.rpc("create_company", { p_name: `Loop ${label}` }));
  must(await u.db.from("companies").update({ city: "Rotterdam", industry: "Offshore", about: "Testbedrijf voor de kernloop." }).eq("id", u.company));
  u.vac = must(await u.db.from("vacancies").insert({ company_id: u.company, title: `NDT Inspector ${label}`, certs: ["UT2"], skills: ["UT"] }).select().single());
  return u;
}

const P = await user("p"), Q = await user("q"), C = await company("c"), D = await company("d");

// --- profielen
must(await P.db.from("profiles").insert({ name: "Pim Test", headline: "NDT Inspector", city: "Rotterdam", skills: ["UT", "NDT"], years: 6 }));
must(await Q.db.from("profiles").insert({ name: "Quinn Test", headline: "Lasser", city: "Schiedam", discoverable: false }));
must(await P.db.from("profile_certificates").insert({ name: "UT2", valid_until: "2028-01-01" }));
must(await Q.db.from("profile_certificates").insert({ name: "VCA", valid_until: "2027-01-01" }));
must(await P.db.from("projects").insert({ title: "Offshore Jacket Inspection", skills: ["UT", "Offshore"] }));
ok((await P.db.from("profile_certificates").insert({ name: "BOSIET", verified: true })).error, "user could self-verify a certificate");
ok((await P.db.from("profiles").update({ name: "Kaping" }).eq("id", Q.id).select()).data.length === 0, "P changed Q's profile");
ok((await P.db.from("profiles").insert({ id: Q.id, name: "Kaping" })).error, "P created a profile for someone else");

// --- vindbaarheid
const seenByC = must(await C.db.from("profiles").select("id"));
ok(seenByC.some((r) => r.id === P.id), "company cannot see discoverable profile");
ok(!seenByC.some((r) => r.id === Q.id), "company sees private profile");
ok(must(await P.db.from("profiles").select("id")).every((r) => r.id === P.id), "professional sees other profiles");
ok(must(await P.db.from("vacancies").select("id")).some((r) => r.id === C.vac.id), "professional cannot see live vacancy");
ok(must(await P.db.from("companies").select("about").eq("id", C.company))[0]?.about, "professional cannot see company profile");

// --- Q solliciteert bij C → C ziet Q (+ certificaten), D niet
const qi = must(await Q.db.rpc("show_interest", { p_vacancy: C.vac.id, p_note: "Per direct beschikbaar" }));
ok(must(await C.db.from("profiles").select("id").eq("id", Q.id)).length === 1, "company cannot see applicant");
ok(must(await C.db.from("profile_certificates").select("name").eq("profile_id", Q.id)).length === 1, "company cannot see applicant certificates");
ok(must(await D.db.from("profiles").select("id").eq("id", Q.id)).length === 0, "other company sees private applicant");
ok(must(await D.db.from("interests").select("id")).length === 0, "other company sees interests");
ok((await D.db.rpc("company_interest", { p_vacancy: D.vac.id, p_profile: Q.id })).error, "company showed interest in invisible profile");
ok((await D.db.rpc("company_interest", { p_vacancy: C.vac.id, p_profile: P.id })).error, "company used another company's vacancy");
ok((await P.db.rpc("company_interest", { p_vacancy: C.vac.id, p_profile: P.id })).error, "professional acted as company");

// --- chat pas na wederzijdse interesse
ok((await Q.db.from("chat_messages").insert({ interest_id: qi, sender: "cand", body: "Hoi" })).error, "chat before mutual interest");
must(await C.db.rpc("company_interest", { p_vacancy: C.vac.id, p_profile: Q.id }));
const row = must(await Q.db.from("interests").select("cand, co, note").eq("id", qi).single());
ok(row.cand && row.co && row.note === "Per direct beschikbaar", "mutual interest not stored");
must(await C.db.from("chat_messages").insert({ interest_id: qi, sender: "co", body: "Ben je donderdag beschikbaar?" }));
must(await Q.db.from("chat_messages").insert({ interest_id: qi, sender: "cand", body: "Ja, vanaf 15:00." }));
ok((await Q.db.from("chat_messages").insert({ interest_id: qi, sender: "co", body: "nep" })).error, "sender spoofing allowed");
ok(must(await Q.db.from("chat_messages").select("id").eq("interest_id", qi)).length === 2, "professional cannot read chat");
ok(must(await D.db.from("chat_messages").select("id")).length === 0, "other company reads chat");
ok(must(await P.db.from("chat_messages").select("id")).length === 0, "other professional reads chat");

// --- afwijzen sluit de chat
must(await Q.db.rpc("decline_interest", { p_interest: qi }));
ok((await C.db.from("chat_messages").insert({ interest_id: qi, sender: "co", body: "Nog één ding" })).error, "chat after decline");

// --- anoniem ziet niets
const anon = createClient(url, key, { auth: { persistSession: false } });
for (const t of ["profiles", "projects", "interests", "chat_messages", "vacancies"]) {
  const { data } = await anon.from(t).select("id");
  ok(!data || data.length === 0, `anon can read ${t}`);
}

// --- account verwijderen ruimt het profiel op
must(await P.db.from("profiles").delete().eq("id", P.id));
ok(must(await C.db.from("profiles").select("id").eq("id", P.id)).length === 0, "deleted profile still visible");
ok(must(await P.db.from("projects").select("id")).length === 0, "projects survived profile delete");

console.log(`✔ kernloop + privacy: ${n}/${n} checks passed`);
