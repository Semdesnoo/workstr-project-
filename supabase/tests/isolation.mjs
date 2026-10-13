// Tenant-isolation check against the real Supabase project.
// Run: SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/isolation.mjs
// Needs: migration applied (GitHub Action "Database"), Auth → "Confirm email" OFF. Creates two throwaway test users.
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY");

async function tenant(label) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const email = `isolation-${label}-${Date.now()}@example.com`;
  const { error: e1 } = await db.auth.signUp({ email, password: crypto.randomUUID() });
  if (e1) throw e1;
  const { data: company, error: e2 } = await db.rpc("create_company", { p_name: `Test ${label}` });
  if (e2) throw e2;
  const { data: cand, error: e3 } = await db.from("candidates").insert({ company_id: company, name: `Kandidaat ${label}` }).select().single();
  if (e3) throw e3;
  const { data: vac, error: e4 } = await db.from("vacancies").insert({ company_id: company, title: `Vacature ${label}` }).select().single();
  if (e4) throw e4;
  return { db, company, cand, vac };
}

const A = await tenant("a");
const B = await tenant("b");

// 1. A sees only its own candidates
const { data: seen } = await A.db.from("candidates").select("id, company_id");
assert.ok(seen.length >= 1 && seen.every((r) => r.company_id === A.company), "A sees foreign candidates");

// 2. A cannot write into B's company
const { error: w } = await A.db.from("candidates").insert({ company_id: B.company, name: "inbreker" });
assert.ok(w, "A could insert into B");

// 3. A cannot link its candidate to B's vacancy, even with known ids
const { error: x } = await A.db.from("applications").insert({ company_id: A.company, candidate_id: A.cand.id, vacancy_id: B.vac.id });
assert.ok(x, "cross-company application allowed");

// 4. A cannot read or change B's company
const { data: bc } = await A.db.from("companies").select("id").eq("id", B.company);
assert.equal(bc.length, 0);
const { data: upd } = await A.db.from("candidates").update({ name: "gewijzigd" }).eq("id", B.cand.id).select();
assert.equal(upd.length, 0, "A updated B's candidate");

// 5. Anonymous visitors see nothing
const anon = createClient(url, key, { auth: { persistSession: false } });
const { data: an } = await anon.from("candidates").select("id");
assert.ok(!an || an.length === 0, "anon can read candidates");

// 6. Own flow works: application within own company
const { error: ok } = await A.db.from("applications").insert({ company_id: A.company, candidate_id: A.cand.id, vacancy_id: A.vac.id });
assert.ifError(ok);

console.log("✔ tenant isolation: 6/6 checks passed");
