import React, { useEffect, useRef, useState } from "react";
import { CellSignalFull, WifiHigh, BatteryFull } from "@phosphor-icons/react";
import { me, companies, seedRequests, seedTimesheets, seedAgentLog, seedApprovals } from "./data.js";
import Candidate from "./Candidate.jsx";
import Biz from "./Biz.jsx";
import { Msp } from "./Desk.jsx";
import BusinessGate from "./Cloud.jsx";
import { supabase } from "./db.js";
import { auth, loadLive, pushLive, reportError } from "./live.js";
import Funnel from "./Funnel.jsx";
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

// Logged in = live mode: same store shape, loaded from Supabase, every update diffed and written back.
// ponytail: polling every 8 s instead of realtime channels; switch when chat latency matters.
function useLiveStore(uid) {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  const ref = useRef(null), queue = useRef(Promise.resolve()), busy = useRef(0);
  const reload = async () => { const next = await loadLive(uid, ref.current); if (!busy.current) { ref.current = next; setS(next); } };
  useEffect(() => {
    ref.current = null; setS(null);
    if (!uid) return undefined;
    let on = true;
    auth.pending.catch(() => {}).then(() => on && reload()).catch((e) => { setErr(e.message); reportError(e.message, "load"); });
    const t = setInterval(() => { if (on && !busy.current && document.visibilityState === "visible") reload().catch(() => {}); }, 8000);
    return () => { on = false; clearInterval(t); };
  }, [uid]); // eslint-disable-line
  const update = (fn) => {
    const prev = ref.current, next = fn(prev);
    if (next === prev) return;
    ref.current = next; setS(next); busy.current++;
    queue.current = queue.current.then(() => pushLive(prev, next, uid))
      .then((again) => { busy.current--; return again && !busy.current && reload(); })
      .catch((e) => { busy.current--; setErr(`Opslaan mislukt: ${e.message}`); reportError(e.message, "save"); return reload(); });
  };
  return [s, update, err, () => setErr("")];
}

function useSession() {
  const [uid, setUid] = useState(undefined); // undefined = still checking
  useEffect(() => {
    if (!supabase) { setUid(null); return undefined; }
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setUid(sess?.user.id || null));
    return () => data.subscription.unsubscribe();
  }, []);
  return uid;
}

// #/ats = the full ATS + agents on Supabase: parked (see ROADMAP), reachable but not in the switcher.
const SURFACES = [["app", "App"], ["business", "Business"], ["managed", "Managed"]];
const read = () => { const h = location.hash.slice(2); return [...SURFACES.map(([k]) => k), "business-app", "ats", "funnel"].includes(h) ? h : "app"; };

// iPhone frame on desktop; full screen on a real phone (CSS hides the chrome ≤640px).
const Phone = ({ children }) => (
  <div className="appwide">
    <div className="iphone">
      <span className="island" aria-hidden /><div className="statusbar" aria-hidden><span>9:41</span><span><CellSignalFull size={17} weight="fill" /><WifiHigh size={17} weight="bold" /><BatteryFull size={24} weight="fill" /></span></div>
      {children}
      <span className="homebar" aria-hidden />
    </div>
  </div>
);

export default function Platform() {
  const [demo, updateDemo] = useStore();
  const uid = useSession();
  const [liveStore, updateLive, err, clearErr] = useLiveStore(uid);
  const [store, update] = uid ? [liveStore, updateLive] : [demo, updateDemo];
  const [surface, setSurface] = useState(read);
  // ponytail: registered company is merged into the shared seed map so app + business read one source; move to the DB in week 4.
  if (store?.company) companies[store.company.id] = store.company;
  useEffect(() => { const on = () => setSurface(read()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  useEffect(() => { document.title = { app: "Workstr", business: "Workstr Business", "business-app": "Workstr Business", managed: "Workstr Managed", ats: "Workstr ATS", funnel: "Workstr Funnel" }[surface]; }, [surface]);

  if (surface === "funnel") return <Funnel uid={uid} />;
  if (uid === undefined || (uid && !store)) return <div className="loading" role="status">{err || "Workstr laden…"}</div>;
  return (<>
    {err && <div className="toast" role="alert" style={{ zIndex: 99 }}>{err} <button className="btn sm ghost" onClick={clearErr}>Sluit</button></div>}
    {surface !== "ats" && <nav className="switcher" aria-label="Workstr producten">
      {SURFACES.map(([k, l]) => <a key={k} href={`#/${k}`} aria-current={surface.split("-")[0] === k ? "page" : undefined}>{l}</a>)}
    </nav>}
    {surface.startsWith("business") && <nav className="viewtoggle" aria-label="Weergave Business">
      <a href="#/business" aria-current={surface === "business" ? "page" : undefined}>Website</a>
      <a href="#/business-app" aria-current={surface === "business-app" ? "page" : undefined}>Mobiele app</a>
    </nav>}
    {surface === "app" && <Phone><Candidate store={store} update={update} /></Phone>}
    {surface === "business" && <Biz store={store} update={update} />}
    {surface === "business-app" && <Phone><div className="bizapp"><Biz store={store} update={update} /></div></Phone>}
    {surface === "managed" && <Msp store={store} update={update} />}
    {surface === "ats" && <BusinessGate />}
  </>);
}
