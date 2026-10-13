// Workstr Business with a real backend: sign in → pick/create company → load → auto-save every change.
import React, { useEffect, useRef, useState } from "react";
import { supabase, load, sync, emptyStore, demoStore } from "./db.js";
import { Business } from "./Desk.jsx";
import { Logo } from "./ui.jsx";

const Center = ({ children }) => <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}><div className="card stack" style={{ width: "min(420px, 100%)", padding: 28 }}>{children}</div></div>;

function Login() {
  const [mode, setMode] = useState("in");
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const { data, error } = mode === "in" ? await supabase.auth.signInWithPassword(f) : await supabase.auth.signUp(f);
    setBusy(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "Onjuist e-mailadres of wachtwoord." : error.message);
    else if (mode === "up" && !data.session) setErr("Check je e-mail om je account te bevestigen.");
  };
  return (
    <Center>
      <Logo size={26} sub="Business" />
      <h1 style={{ fontSize: 24 }}>{mode === "in" ? "Inloggen" : "Account aanmaken"}</h1>
      <form className="stack" onSubmit={submit}>
        <label className="f">E-mail<input className="in" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="f">Wachtwoord<input className="in" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p role="alert" className="sm" style={{ color: "var(--err)" }}>{err}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? "Bezig…" : mode === "in" ? "Inloggen" : "Account aanmaken"}</button>
      </form>
      <button className="btn ghost sm" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}>{mode === "in" ? "Nog geen account? Maak er een aan" : "Al een account? Log in"}</button>
    </Center>
  );
}

function CreateCompany({ onDone }) {
  const [name, setName] = useState("");
  const [demo, setDemo] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const { data: id, error } = await supabase.rpc("create_company", { p_name: name.trim() });
      if (error) throw error;
      if (demo) await sync(emptyStore(), demoStore(), id);
      onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Center>
      <Logo size={26} sub="Business" />
      <h1 style={{ fontSize: 24 }}>Maak je bedrijf aan</h1>
      <form className="stack" onSubmit={submit}>
        <label className="f">Bedrijfsnaam<input className="in" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="row sm"><input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />Vul met fictieve demodata (kandidaten, vacatures, workflows)</label>
        {err && <p role="alert" className="sm" style={{ color: "var(--err)" }}>{err}</p>}
        <button className="btn primary block" disabled={busy || !name.trim()}>{busy ? "Bezig…" : "Aanmaken"}</button>
      </form>
      <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
    </Center>
  );
}

// Store that saves itself: every change is diffed against the last saved version, writes run one at a time.
// ponytail: last-write-wins per row; two people editing the same row at once → add realtime + version column.
function CloudBusiness({ company, initial, onSignOut }) {
  const [store, setStore] = useState(initial);
  const [status, setStatus] = useState("saved");
  const saved = useRef(initial);
  const chain = useRef(Promise.resolve());
  useEffect(() => {
    const target = store;
    if (saved.current === target) return;
    setStatus("saving");
    chain.current = chain.current.then(async () => {
      if (saved.current === target) return;
      await sync(saved.current, target, company.id);
      saved.current = target;
      setStatus((s) => (s === "saving" ? "saved" : s));
    }).catch((e) => setStatus(`error:${e.message}`));
  }, [store, company.id]);
  return <Business store={store} update={setStore} company={company} status={status} onSignOut={onSignOut} />;
}

export default function BusinessGate() {
  const [session, setSession] = useState(undefined);
  const [company, setCompany] = useState(undefined);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const uid = session?.user?.id;
  useEffect(() => {
    setCompany(undefined); setData(null); setErr("");
    if (!uid) return;
    supabase.from("members").select("company_id, role, companies(name)").eq("user_id", uid).limit(1).then(({ data: rows, error }) => {
      if (error) return setErr(error.message);
      setCompany(rows[0] ? { id: rows[0].company_id, name: rows[0].companies?.name, role: rows[0].role } : null);
    });
  }, [uid, nonce]);
  useEffect(() => { if (company) load(company.id).then(setData, (e) => setErr(e.message)); }, [company]);

  if (!supabase) return <Center><b>Supabase is niet geconfigureerd.</b><p className="sm muted">Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY.</p></Center>;
  if (err) return <Center><b>Er ging iets mis</b><p className="sm muted">{err}</p><button className="btn" onClick={() => setNonce(nonce + 1)}>Opnieuw</button></Center>;
  if (session === undefined || (session && company === undefined) || (company && !data)) return <Center><p className="muted">Laden…</p></Center>;
  if (!session) return <Login />;
  if (company === null) return <CreateCompany onDone={() => setNonce(nonce + 1)} />;
  return <CloudBusiness key={company.id} company={company} initial={data} onSignOut={() => supabase.auth.signOut()} />;
}
