import React, { useEffect, useState } from "react";
import { me, seedConversations, seedRequests, seedTimesheets, seedAgentLog, seedApprovals, seedCandidates, seedApps, seedEvents, seedMessages, seedWorkflows } from "./data.js";
import Candidate from "./Candidate.jsx";
import { Msp } from "./Desk.jsx";
import BusinessGate from "./Cloud.jsx";
import { Logo } from "./ui.jsx";
import "./platform.css";

export const KEY = "workstr.v3";
const seed = () => ({
  onboarded: false, profile: me, jobs: [], convs: seedConversations, saved: [], dismissed: [], interested: [],
  msp: { requests: seedRequests, timesheets: seedTimesheets, log: seedAgentLog, approvals: seedApprovals },
  ats: { candidates: seedCandidates, apps: seedApps, events: seedEvents, messages: seedMessages, workflows: seedWorkflows, tasks: [], runs: [], queue: [], outage: {} },
});

// One shared demo store so the ecosystem is visible: a vacancy published in
// Business shows up in the app's Discover; a candidate's interest lands in Business Messages.
function useStore() {
  const [s, set] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota: demo keeps working in memory */ } }, [s]);
  return [s, set];
}

const SURFACES = [["app", "App"], ["business", "Business"], ["managed", "Managed"]];
const read = () => (SURFACES.some(([k]) => location.hash === `#/${k}`) ? location.hash.slice(2) : "app");

export default function Platform() {
  const [store, update] = useStore();
  const [surface, setSurface] = useState(read);
  useEffect(() => { const on = () => setSurface(read()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  useEffect(() => { document.title = { app: "Workstr App", business: "Workstr Business", managed: "Workstr Managed" }[surface]; }, [surface]);

  return (<>
    <nav className="switcher" aria-label="Workstr producten">
      {SURFACES.map(([k, l]) => <a key={k} href={`#/${k}`} aria-current={surface === k ? "page" : undefined}>{l}</a>)}
    </nav>
    {surface === "app" && (
      <div className="stage">
        <aside className="stage-side">
          <Logo size={28} />
          <h1>Less searching.<br />More working.</h1>
          <p className="muted">Eén levend Work Profile met projecten, skills en certificaten. Werk dat past komt naar jou toe — en Workstr legt altijd uit waarom.</p>
          <p className="muted sm" style={{ marginTop: 24 }}>Probeer: publiceer een vacature in <b>Business</b> en zie hem verschijnen in Discover — of importeer een kandidaat via <b>Business → Sourcing</b> en zie de workflows draaien.</p>
        </aside>
        <div className="phone"><Candidate store={store} update={update} /></div>
      </div>
    )}
    {surface === "business" && <BusinessGate />}
    {surface === "managed" && <Msp store={store} update={update} />}
  </>);
}
