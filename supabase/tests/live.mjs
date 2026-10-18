// Pilaren 3, 5, 6 against the real Supabase project.
// Run: SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/live.mjs
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY");
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const must = ({ data, error }) => { if (error) throw error; return data; };
async function user(label) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const email = `workstr-live-${label}-${Date.now()}@mailinator.com`, password = crypto.randomUUID();
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('No session after sign-up: turn OFF "Confirm email"');
  return { db, id: data.user.id, email, password };
}
const A = await user("a"), B = await user("b");
const png = new Blob([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0))], { type: "image/png" });

// 3. opslag: alleen in je eigen map, publiek leesbaar, geen andere bestandstypen
const path = `${A.id}/${crypto.randomUUID()}.png`;
must(await A.db.storage.from("media").upload(path, png, { contentType: "image/png" }));
const pub = A.db.storage.from("media").getPublicUrl(path).data.publicUrl;
ok((await fetch(pub)).status === 200, "public media url not readable");
ok((await B.db.storage.from("media").upload(`${A.id}/inbraak.png`, png, { contentType: "image/png" })).error, "B uploaded into A's folder");
ok((await B.db.storage.from("media").remove([path])).data?.length === 0, "B deleted A's file");
ok((await A.db.storage.from("media").upload(`${A.id}/x.html`, new Blob(["<script>"], { type: "text/html" }), { contentType: "text/html" })).error, "html upload allowed");

// bedrijf met client-id
const cid = crypto.randomUUID();
ok(must(await A.db.rpc("create_company", { p_name: "Live BV", p_id: cid })) === cid, "create_company ignored client id");
ok(must(await A.db.from("members").select("role").eq("company_id", cid))[0]?.role === "admin", "creator not admin");
ok(typeof must(await B.db.rpc("create_company", { p_name: "Oud pad" })) === "string", "create_company without id broke");

// 5. funnel alleen voor staff
ok((await A.db.rpc("funnel_stats")).error, "non-staff can read funnel");

// 6. foutmeldingen: iedereen mag schrijven, niemand leest terug
const anon = createClient(url, key, { auth: { persistSession: false } });
must(await anon.from("client_errors").insert({ message: "test: live.mjs", page: "/test" }));
ok(!(await anon.from("client_errors").select("id")).data?.length, "anon can read client errors");
ok((await anon.from("client_errors").insert({ message: "x".repeat(600) })).error, "oversized error accepted");

// 6. account verwijderen: profiel weg, inloggen kan niet meer
must(await A.db.from("profiles").insert({ name: "Weg Straks" }));
must(await A.db.storage.from("media").remove([path]));
must(await A.db.rpc("delete_account"));
const relog = await createClient(url, key, { auth: { persistSession: false } }).auth.signInWithPassword({ email: A.email, password: A.password });
ok(relog.error, "deleted account can still sign in");
ok(must(await B.db.from("members").select("user_id").eq("company_id", cid)).length === 0, "membership survived account delete");


// opruimen: testaccounts + hun bedrijven
must(await B.db.rpc("delete_account"));
console.log(`✔ opslag, funnel, account verwijderen, foutmeldingen: ${n}/${n} checks passed`);
