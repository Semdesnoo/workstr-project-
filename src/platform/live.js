// Live mode: the same store shape the prototype uses, loaded from and written to Supabase.
// Components keep calling update(fn); pushLive diffs prev → next and writes only what changed.
// Privacy is enforced by RLS + RPCs in the database (supabase/migrations/*_loop.sql), not here.
import { supabase as db } from "./db.js";
import { companies, seedRequests, seedTimesheets, seedAgentLog, seedApprovals } from "./data.js";

export const BLANK = () => ({ name: "", photo: "", headline: "", city: "Rotterdam", about: "", years: 0, skills: [], sectors: [], availability: "now", availableFrom: "",
  radiusKm: 80, minRate: 45, contracts: ["freelance"], certs: [], experience: [], education: [], projects: [], discoverable: true });
export const MATCH_TEXT = "It's a match — jullie kunnen nu direct met elkaar praten.";

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const num = (v) => (v == null ? undefined : Number(v));

// ---------------------------------------------------------------- row ↔ store mapping (pure, tested in live.test.js)
export const profileRow = (p) => ({ name: p.name.trim(), headline: p.headline || null, city: p.city || null, about: p.about || null, photo: p.photo || null,
  years: p.years || 0, skills: p.skills, sectors: p.sectors, experience: p.experience, education: p.education, availability: p.availability,
  available_from: p.availableFrom || null, radius_km: p.radiusKm, min_rate: p.minRate || 0, contracts: p.contracts, discoverable: !!p.discoverable });
export const certRow = (c) => ({ name: c.name, number: c.number || null, issuer: c.issuer || null, valid_until: c.validUntil || null });
export const projectRow = (x) => ({ title: x.title, text: x.text || null, sector: x.sector || null, skills: x.skills || [], period: `${x.from || ""}/${x.to || ""}`, photos: x.photos || [] });
export const profileFrom = (r) => ({ id: r.id, name: r.name, headline: r.headline || "", city: r.city || "", about: r.about || "", photo: r.photo || "",
  years: r.years, skills: r.skills, sectors: r.sectors, experience: r.experience, education: r.education, availability: r.availability,
  availableFrom: r.available_from || "", radiusKm: r.radius_km, minRate: num(r.min_rate), contracts: r.contracts, discoverable: r.discoverable,
  certs: (r.profile_certificates || []).map((c) => ({ id: c.id, name: c.name, number: c.number || "", issuer: c.issuer || "", validUntil: c.valid_until || "", verified: c.verified })),
  projects: (r.projects || []).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((x) => {
    const [from = "", to = ""] = (x.period || "").split("/");
    return { id: x.id, title: x.title, text: x.text || "", sector: x.sector || "", skills: x.skills, photos: x.photos, from, to };
  }) });

export const companyRow = (c) => ({ name: c.name, city: c.city || null, industry: c.industry || null, size: c.size || null, kvk: c.kvk || null,
  about: c.about || null, workplace: c.workplace || [], media: c.media || [], people: c.people || [] });
export const companyFrom = (r, own) => ({ id: r.id, name: r.name, city: r.city || "", industry: r.industry || "", size: r.size || "", kvk: r.kvk || "",
  about: r.about || "", workplace: r.workplace, media: r.media, people: r.people?.length ? r.people : [{ n: r.name, r: "" }], own });

export const jobRow = (j) => ({ title: j.title, city: j.city || null, sector: j.sector || null, duration: j.duration || null, rate_min: j.rateMin || null,
  rate_max: j.rateMax || null, unit: j.unit || "uur", contract: j.contract || null, start_date: j.start || null, skills: j.skills || [], certs: j.certs || [],
  tasks: j.tasks || [], photo: j.photo || null, video: j.video || null, team: j.team || null, min_years: j.minYears ?? null });
export const jobFrom = (r) => ({ id: r.id, company: r.company_id, title: r.title, city: r.city || "", sector: r.sector || "Industrie", duration: r.duration || "n.t.b.",
  rateMin: num(r.rate_min) || 0, rateMax: num(r.rate_max) || 0, unit: r.unit, contract: r.contract || "project", start: r.start_date, skills: r.skills,
  certs: r.certs, tasks: r.tasks, photo: r.photo || "./work/w1.jpg", video: r.video || undefined, team: r.team || "", minYears: r.min_years ?? undefined, status: r.status });

// ---------------------------------------------------------------- auth
// App waits for `auth.pending` before loading, so sign-up + first save finish before the UI switches to live.
export const auth = { pending: Promise.resolve() };
export const withAccount = (fn) => (auth.pending = fn());
const AUTH_NL = [[/invalid login/i, "E-mail of wachtwoord klopt niet."], [/already registered|already been registered/i, "Er bestaat al een account met dit e-mailadres. Kies ‘Ik heb al een account’."],
  [/password should be/i, "Kies een wachtwoord van minstens 8 tekens."], [/rate limit|too many/i, "Te veel pogingen. Probeer het over een paar minuten opnieuw."],
  [/invalid.*email|email.*invalid/i, "Dit e-mailadres wordt niet geaccepteerd."]];
export async function signIn(mode, email, password) {
  if (!db) throw new Error("Accounts zijn hier niet beschikbaar (geen database gekoppeld).");
  const r = mode === "signup" ? await db.auth.signUp({ email, password }) : await db.auth.signInWithPassword({ email, password });
  if (r.error) throw new Error(AUTH_NL.find(([re]) => re.test(r.error.message))?.[1] || r.error.message);
  if (!r.data.session) throw new Error("Bevestig eerst je e-mailadres via de link in je mail en log dan in.");
  return r.data.user.id;
}
export const signOut = () => db.auth.signOut();

// AVG: own files first (Storage API), then the account; the database cascades the rest.
export async function deleteAccount(uid) {
  const files = must(await db.storage.from("media").list(uid, { limit: 1000 }));
  if (files.length) must(await db.storage.from("media").remove(files.map((f) => `${uid}/${f.name}`)));
  must(await db.rpc("delete_account"));
  await db.auth.signOut();
}

// ---------------------------------------------------------------- media: data:/idb: values become Storage URLs on save
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
async function blobOf(src) {
  if (src.startsWith("data:")) return (await fetch(src)).blob();
  const idb = await new Promise((ok, no) => { const r = indexedDB.open("workstr-media", 1); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  return new Promise((ok, no) => { const r = idb.transaction("m").objectStore("m").get(src); r.onsuccess = () => (r.result ? ok(r.result) : no(new Error("Video niet meer gevonden, upload hem opnieuw"))); });
}
async function upload(uid, blob) {
  const ext = EXT[blob.type];
  if (!ext) throw new Error("Alleen foto's (jpg, png, webp) en video's (mp4, mov, webm) kunnen worden opgeslagen.");
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  must(await db.storage.from("media").upload(path, blob, { contentType: blob.type }));
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------- load
const seenKey = (uid) => `workstr.seen.${uid}`;
const readSeen = (uid) => { try { return JSON.parse(localStorage.getItem(seenKey(uid))) || {}; } catch { return {}; } };

export async function loadLive(uid, prev) {
  const [me, mem, cos, vacs, ints, msgs] = (await Promise.all([
    db.from("profiles").select("*, profile_certificates(*), projects(*)").eq("id", uid).maybeSingle(),
    db.from("members").select("company_id").eq("user_id", uid).limit(1),
    db.from("companies").select("*"),
    db.from("vacancies").select("*").order("created_at", { ascending: false }),
    db.from("interests").select("*"),
    db.from("chat_messages").select("*").order("created_at"),
  ])).map(must);
  const own = mem[0]?.company_id;
  // ponytail: a company loads every visible profile; paginate / search server-side past a few thousand.
  const others = own ? must(await db.from("profiles").select("*, profile_certificates(*), projects(*)").neq("id", uid).limit(1000)) : [];
  for (const c of cos) companies[c.id] = companyFrom(c, c.id === own);

  const seen = readSeen(uid);
  const was = new Map((prev?.interests || []).map((i) => [i.id, i]));
  const chats = {};
  for (const i of ints) if (i.cand && i.co) chats[i.id] = [{ from: "sys", text: MATCH_TEXT, at: i.created_at }];
  for (const m of msgs) (chats[m.interest_id] ||= []).push({ from: m.sender, text: m.body, at: m.created_at });
  const interests = ints.map((r) => {
    const o = was.get(r.id), list = chats[r.id] || [];
    const fresh = (side) => (o ? list.slice((prev.chats?.[r.id] || []).length).filter((m) => m.from !== side && m.from !== "sys").length : 0);
    return { id: r.id, job: r.vacancy_id, person: r.profile_id === uid ? "me" : r.profile_id, cand: r.cand, co: r.co, declined: r.declined || undefined,
      note: r.note || undefined, at: r.created_at, seenCand: o?.seenCand ?? !!seen[r.id]?.cand, seenCo: o?.seenCo ?? !!seen[r.id]?.co,
      unreadCand: (o?.unreadCand || 0) + fresh("cand"), unreadCo: (o?.unreadCo || 0) + fresh("co") };
  });
  return {
    live: true, uid, onboarded: !!me, profile: me ? profileFrom(me) : BLANK(), company: own ? companies[own] : null,
    jobs: vacs.filter((v) => v.status === "live" || v.company_id === own).map(jobFrom),
    people: others.map(profileFrom), interests, chats,
    saved: prev?.saved || [], liked: prev?.liked || [], dismissed: prev?.dismissed || [],
    msp: prev?.msp || { requests: seedRequests, timesheets: seedTimesheets, log: seedAgentLog, approvals: seedApprovals },
  };
}
export const emptyLive = (uid) => ({ live: true, uid, onboarded: false, profile: BLANK(), company: null, jobs: [], people: [], interests: [], chats: {}, saved: [], liked: [], dismissed: [] });

// ---------------------------------------------------------------- push (returns true when the store should be reloaded)
async function diffRows(table, a, b, row) {
  const old = new Map(a.map((x) => [x.id, x]));
  for (const x of b) {
    if (old.get(x.id) === x) continue;
    const r = await row(x);
    must(old.has(x.id) ? await db.from(table).update(r).eq("id", x.id) : await db.from(table).insert({ id: x.id, ...r }));
  }
  const keep = new Set(b.map((x) => x.id));
  const gone = a.filter((x) => !keep.has(x.id)).map((x) => x.id);
  if (gone.length) must(await db.from(table).delete().in("id", gone));
}

export async function pushLive(prev, next, uid) {
  let reload = false;
  const up = async (src) => { if (!/^(data:|idb:)/.test(src || "")) return src || null; reload = true; return upload(uid, await blobOf(src)); };
  const ups = (list = []) => Promise.all(list.map(up));

  const c = next.company, own = c?.id;
  if (c && c !== prev.company) {
    if (prev.company?.id !== own) { must(await db.rpc("create_company", { p_name: c.name, p_id: own })); reload = true; }
    must(await db.from("companies").update({ ...companyRow(c), media: await ups(c.media) }).eq("id", own));
  }
  if (own && next.jobs !== prev.jobs) {
    const old = new Map(prev.jobs.map((j) => [j.id, j]));
    for (const j of next.jobs) {
      if (j.company !== own || old.get(j.id) === j) continue;
      must(await db.from("vacancies").upsert({ id: j.id, company_id: own, ...jobRow(j), photo: await up(j.photo), video: await up(j.video) }));
      reload = true;
    }
  }
  if (next.onboarded && next.profile !== prev.profile) {
    const p = next.profile, row = { ...profileRow(p), photo: await up(p.photo) };
    must(prev.onboarded ? await db.from("profiles").update(row).eq("id", uid) : await db.from("profiles").insert(row));
    const was = prev.onboarded ? prev.profile : BLANK();
    if (was.certs !== p.certs) await diffRows("profile_certificates", was.certs, p.certs, certRow);
    if (was.projects !== p.projects) await diffRows("projects", was.projects, p.projects, async (x) => ({ ...projectRow(x), photos: await ups(x.photos) }));
  }

  const old = new Map((prev.interests || []).map((i) => [i.id, i]));
  const ownJob = (id) => next.jobs.some((j) => j.id === id && j.company === own);
  let seenChanged = false;
  for (const i of next.interests || []) {
    const o = old.get(i.id);
    if (o === i) continue;
    if (i.person === "me" && i.cand && !o?.cand) { must(await db.rpc("show_interest", { p_vacancy: i.job, p_note: i.note || null })); reload = true; }
    if (own && i.co && !o?.co && ownJob(i.job)) { must(await db.rpc("company_interest", { p_vacancy: i.job, p_profile: i.person === "me" ? uid : i.person })); reload = true; }
    if (o && i.declined && i.declined !== o.declined) must(await db.rpc("decline_interest", { p_interest: i.id }));
    if (o && (i.seenCand !== o.seenCand || i.seenCo !== o.seenCo)) seenChanged = true;
  }
  if (seenChanged) localStorage.setItem(seenKey(uid), JSON.stringify(Object.fromEntries(next.interests.map((i) => [i.id, { cand: !!i.seenCand, co: !!i.seenCo }]))));

  for (const [id, list] of Object.entries(next.chats || {})) {
    const before = prev.chats?.[id] || [];
    if (list === before) continue;
    for (const m of list.slice(before.length)) if (m.from === "cand" || m.from === "co") must(await db.from("chat_messages").insert({ interest_id: id, sender: m.from, body: m.text }));
  }
  return reload;
}

// First save right after sign-up/login from an onboarding flow. Never overwrites an existing profile/company.
export async function saveFirst(uid, patch) {
  const base = await loadLive(uid);
  if (patch.profile && base.onboarded) return;
  if (patch.company && base.company) return;
  await pushLive(base, { ...base, ...patch, jobs: [...(patch.jobs || []), ...base.jobs] }, uid);
}

// ---------------------------------------------------------------- funnel (staff only) + client errors
export const funnel = async (days) => must(await db.rpc("funnel_stats", { p_days: days }));

let reported = 0;
export function reportError(message, source = "") {
  if (!db || reported++ >= 10) return;
  db.from("client_errors").insert({ message: String(message || "onbekend").slice(0, 500), source: String(source).slice(0, 300), page: location.hash.slice(0, 300) }).then(() => {}, () => {});
}
if (db && typeof addEventListener === "function") {
  addEventListener("error", (e) => reportError(e.message, `${e.filename}:${e.lineno}`));
  addEventListener("unhandledrejection", (e) => reportError(e.reason?.message || e.reason, "promise"));
}
