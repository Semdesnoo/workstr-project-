// Pilaar 5: de kernloop in cijfers, uit de echte data (alleen voor Workstr-staff, zie funnel_stats).
import React, { useEffect, useState } from "react";
import { funnel, signIn, signOut } from "./live.js";
import { AuthForm, Logo } from "./ui.jsx";

const STEPS = [["accounts", "Accounts"], ["work_profiles", "Work Profile gemaakt"], ["profielen_met_project", "Met minstens één project"],
  ["bedrijven", "Bedrijven"], ["vacatures_live", "Live vacatures"], ["sollicitaties", "Sollicitaties (interesse professional)"],
  ["bedrijf_toont_interesse", "Interesse van bedrijf"], ["matches", "Wederzijdse matches"], ["gesprekken", "Gesprekken (beide kanten schreven)"]];
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "–");

export default function Funnel({ uid }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!uid) return;
    setErr(""); setRows(null);
    funnel(days).then((r) => setRows(Object.fromEntries(r.map((x) => [x.step, Number(x.total)]))), (e) => setErr(/geen toegang/.test(e.message) ? "Alleen voor het Workstr-team. Vraag een beheerder je toe te voegen aan ‘staff’." : e.message));
  }, [uid, days]);
  const max = rows ? Math.max(1, ...Object.values(rows)) : 1;
  return (
    <main className="funnel">
      <div className="row between"><Logo sub="Funnel" />{uid && <button className="btn sm ghost" onClick={() => signOut()}>Uitloggen</button>}</div>
      {uid === undefined ? <p className="muted">Laden…</p> : !uid ? <section className="card"><h1>Inloggen</h1><AuthForm mode="login" onDone={(m, e, p) => signIn(m, e, p)} /></section> : <>
        <div className="row wrap" role="group" aria-label="Periode">{[[7, "7 dagen"], [30, "30 dagen"], [3650, "Alles"]].map(([d, l]) =>
          <button key={d} className={`chip ${days === d ? "on" : ""}`} aria-pressed={days === d} onClick={() => setDays(d)}>{l}</button>)}</div>
        {err && <p role="alert" className="err">{err}</p>}
        {rows && <section className="card stack" aria-label="Funnel">
          {STEPS.map(([k, l], n) => <div key={k} className="fbar"><span className="sm">{l}</span><i style={{ width: `${(100 * rows[k]) / max}%` }} />
            <span className="sm"><b>{rows[k]}</b> <span className="muted xs">{n && k !== "bedrijven" ? pct(rows[k], rows[STEPS[n - 1][0]]) : ""}</span></span></div>)}
          <p className="xs muted">Percentage = t.o.v. de stap erboven. Geen tracking-cookies: alles komt uit de gegevens zelf.</p>
        </section>}
      </>}
    </main>
  );
}
