// Workstr Business — AI Agents hub: 8 agents, one end-to-end flow, Human Approval as the gate.
import React, { useState } from "react";
import { Lightning, Robot, Check, X } from "@phosphor-icons/react";
import { externalPool } from "./data.js";
import { CHANNELS } from "./engine.js";
import {
  AGENTS, allJobs, applyPlan, decide, vacancyAgent, matchingAgent, talentAgent, outreachAgent, screeningAgent, complianceAgent, interviewAgent,
} from "./agents.js";

const FLOW = ["matching", "talent", "outreach", "screening", "compliance", "interview"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (iso) => new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const nameOf = (id) => AGENTS.find((a) => a.id === id).name;
const VAC_EXAMPLE = "QA/QC Inspector Offshore Wind\nLocatie: Rotterdam. Freelance, €62 - €75 per uur.\n- Inspecties op transition pieces\n- NCR's en punch lists opstellen\nEisen: UT2, VCA, BOSIET";

export default function AgentsHub({ store, update, jobs, company }) {
  const ats = store.ats;
  const [jid, setJid] = useState(jobs[0]?.id);
  const [running, setRunning] = useState(null);
  const [text, setText] = useState("");
  const approvals = ats.approvals || [];
  const pendingQueue = ats.queue.filter((j) => j.status === "approval");

  const run = (id) => update((s) => {
    const job = allJobs(s).find((j) => j.id === jid);
    const plan = id === "vacancy" ? vacancyAgent(text, company)
      : id === "matching" ? matchingAgent(s.ats, job) : id === "talent" ? talentAgent(s.ats, externalPool, job)
      : id === "outreach" ? outreachAgent(s.ats, job) : id === "screening" ? screeningAgent(s.ats, job)
      : id === "compliance" ? complianceAgent(s.ats, allJobs(s)) : interviewAgent(s.ats, job);
    if (id === "vacancy" && plan.job) setTimeout(() => { setJid(plan.job.id); setText(""); });
    return applyPlan(s, plan, nameOf(id));
  });
  const runFlow = async () => {
    for (const id of FLOW) { setRunning(id); run(id); await sleep(reduced() ? 50 : 700); }
    setRunning(null);
  };
  const approveJob = (j, ok) => update((s) => ({ ...s, ats: { ...s.ats, queue: s.ats.queue.map((x) => (x.id === j.id ? { ...x, status: ok ? "queued" : "cancelled", runAt: Date.now() } : x)) } }));

  return (<>
    <header><div><h1>AI Agents</h1><p className="muted">Acht agents die samenwerken van vacature tot gesprek. Regels voor wat voorspelbaar is, AI voor taal — en een mens bij elke beslissing over mensen.</p></div>
      <div className="row wrap">
        <select className="in" style={{ width: "auto" }} aria-label="Vacature voor agents" value={jid} onChange={(e) => setJid(e.target.value)}>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.city}</option>)}</select>
        <button className="btn primary" disabled={!!running} onClick={runFlow}><Lightning size={16} />{running ? "Bezig…" : "Start volledige flow"}</button>
      </div></header>

    <div className="flowbar" aria-label="Flow">{FLOW.map((id, i) => (
      <span key={id} className={`chip ${running === id ? "on" : ""}`}>{i + 1}. {nameOf(id).replace(" Agent", "")}{ats.agentRuns?.[nameOf(id)] && running !== id ? " ✓" : ""}</span>))}
      <span className="chip">→ Human Approval ({approvals.length + pendingQueue.length})</span></div>

    <div className="cols" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
      <div className="agent-grid">{AGENTS.map((a) => {
        const last = ats.agentRuns?.[a.name];
        return (
          <section key={a.id} className={`card stack agent ${running === a.id ? "busy" : ""}`} aria-label={a.name}>
            <div className="row between"><span className="row"><Robot size={20} color="var(--lav)" /><b>{a.name}</b></span>
              {a.id === "approval" ? <span className="tag human">{approvals.length + pendingQueue.length} open</span> : last && <span className="xs muted">{fmt(last.at)}</span>}</div>
            <p className="sm muted">{a.role}</p>
            {a.id === "vacancy" && <><textarea className="in" style={{ minHeight: 80 }} aria-label="Vacaturetekst" placeholder="Plak een vacaturetekst…" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn sm ghost" style={{ justifySelf: "start" }} onClick={() => setText(VAC_EXAMPLE)}>Voorbeeld plakken</button></>}
            {last && a.id !== "approval" && <p className="xs">{last.summary}</p>}
            {a.id !== "approval" && <button className="btn sm" disabled={!!running || (a.id === "vacancy" && text.trim().length < 10)} onClick={() => run(a.id)}>Run {a.name}</button>}
          </section>);
      })}</div>

      <div className="stack">
        <section className="card stack" aria-label="Human Approval wachtrij">
          <h3 className="sec-title">Human Approval</h3>
          {approvals.map((ap) => (
            <div key={ap.id} className="card stack" style={{ background: "var(--elev)" }}><span className="xs muted">{ap.agent}</span><span className="sm">{ap.text}</span>
              <div className="row wrap"><button className="btn sm primary" onClick={() => update((s) => decide(s, ap.id, true))}><Check size={14} />{ap.approve?.label || "Goedkeuren"}</button>
                <button className="btn sm" onClick={() => update((s) => decide(s, ap.id, false))}><X size={14} />{ap.reject?.label || "Afwijzen"}</button></div></div>))}
          {pendingQueue.map((j) => (
            <div key={j.id} className="card stack" style={{ background: "var(--elev)" }}><span className="xs muted">{j.workflow} · {CHANNELS[j.channel]} naar {ats.candidates.find((c) => c.id === j.to)?.name}</span><span className="sm">{j.text}</span>
              <div className="row"><button className="btn sm primary" onClick={() => approveJob(j, true)}><Check size={14} />Verstuur</button><button className="btn sm" onClick={() => approveJob(j, false)}><X size={14} />Annuleer</button></div></div>))}
          {!approvals.length && !pendingQueue.length && <p className="muted sm">Niets dat op jou wacht.</p>}
        </section>
        <section className="card"><h3 className="sec-title">Agent-log</h3>
          <ul className="reasons sm">{(ats.agentLog || []).slice(0, 14).map((l, i) => (
            <li key={i}><span className={`tag ${l.human ? "human" : "ai"}`} style={{ flex: "none" }}>{l.agent.replace(" Agent", "")}</span><span>{l.text}</span></li>))}
            {!ats.agentLog?.length && <li className="muted">Nog geen activiteit. Start de volledige flow.</li>}</ul></section>
      </div>
    </div>
  </>);
}
