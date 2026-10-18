// Deletes a throwaway e2e account (and a company it alone belonged to) on the real Supabase project.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => l.split(/=(.*)/s).slice(0, 2)));
export async function purge(email, password) {
  const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  if (!(await db.auth.signInWithPassword({ email, password })).error) await db.rpc("delete_account");
}
