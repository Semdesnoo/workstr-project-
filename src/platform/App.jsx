import React, { useEffect, useState } from "react";
import { me, seedRequests, seedTimesheets, seedAgentLog, seedApprovals } from "./data.js";
import Candidate from "./Candidate.jsx";
import Biz from "./Biz.jsx";
import { Msp } from "./Desk.jsx";
import BusinessGate from "./Cloud.jsx";
import "./platform.css";

// Prototype store (localStorage). The candidate app and Business share it, so the whole
// loop — interest → match → chat — can be clicked through from both sides in one browser.
export const KEY = "workstr.v4";
const seed = () => ({
  onboarded: false, profile: me, jobs: [], saved: [], dismissed: [], chats: {},
  // Rijnmond already wants Sem; Youssef already showed interest in Van Oord's NDT job.
  interests: [{ id: "i-seed-1", job: "j2", person: "me", cand: false, co: true, at: new Date().toISOString() },
    { id: "i-seed-2", job: "j1", person: "c2", cand: true, co: false, at: new Date().toISOString() }],
  msp: { requests: seedRequests, timesheets: seedTimesheets, log: seedAgentLog, approvals: seedApprovals },
});

function useStore() {
  const [s, set] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota: keeps working in memory */ } }, [s]);
  return [s, set];
}

// #/ats = the full ATS + agents on Supabase: parked (see ROADMAP), reachable but not in the switcher.
const SURFACES = [["app", "App"], ["business", "Business"], ["managed", "Managed"]];
const read = () => { const h = location.hash.slice(2); return [...SURFACES.map(([k]) => k), "ats"].includes(h) ? h : "app"; };

export default function Platform() {
  const [store, update] = useStore();
  const [surface, setSurface] = useState(read);
  useEffect(() => { const on = () => setSurface(read()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  useEffect(() => { document.title = { app: "Workstr", business: "Workstr Business", managed: "Workstr Managed", ats: "Workstr ATS" }[surface]; }, [surface]);

  return (<>
    {surface !== "ats" && <nav className="switcher" aria-label="Workstr producten">
      {SURFACES.map(([k, l]) => <a key={k} href={`#/${k}`} aria-current={surface === k ? "page" : undefined}>{l}</a>)}
    </nav>}
    {surface === "app" && <div className="appwide"><Candidate store={store} update={update} /></div>}
    {surface === "business" && <Biz store={store} update={update} />}
    {surface === "managed" && <Msp store={store} update={update} />}
    {surface === "ats" && <BusinessGate />}
  </>);
}
