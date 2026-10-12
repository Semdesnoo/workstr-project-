// Workstr Business — AI Recruitment OS for technical recruitment.
// Layer 1: ATS/CRM (candidates, vacancies, match score, pipeline, messages, agenda, triggers & workflows).
// Layer 2: sourcing from external databases, integrations (LinkedIn, WhatsApp, e-mail) and a durable
// background queue with retries. Channels run on a demo provider until real credentials are connected.
import React, { useEffect, useState } from "react";
import {
  Users, Kanban, ChatCircle, CalendarBlank, Lightning, MagnifyingGlass, PlugsConnected, Queue, Plus, Check, X,
  ArrowClockwise, WhatsappLogo, EnvelopeSimple, DeviceMobile, LinkedinLogo, Database, Clock, Sparkle, Trash,
} from "@phosphor-icons/react";
import { seedJobs, externalPool, CITIES } from "./data.js";
import { matchJob, toProfile, certStatus, daysLeft, AVAIL_LABEL } from "./logic.js";
import { TRIGGERS, STAGES, CHANNELS, processQueue, demoSend } from "./engine.js";
import { fireEvent, addMessage } from "./agents.js";
import { StatusBadge, initials } from "./ui.jsx";

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (iso) => new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const CH_ICON = { whatsapp: WhatsappLogo, email: EnvelopeSimple, app: DeviceMobile };
const STATUS_NL = { queued: "In wachtrij", retry: "Opnieuw proberen", sent: "Verzonden", failed: "Mislukt", dead: "Dead-letter", approval: "Wacht op goedkeuring", cancelled: "Geannuleerd" };

export const ATS_NAV = [
  ["kandidaten", "Kandidaten", Users], ["pipeline", "Pipeline", Kanban], ["berichten", "Berichten", ChatCircle],
  ["agenda", "Agenda", CalendarBlank], ["workflows", "Workflows", Lightning], ["sourcing", "Sourcing", MagnifyingGlass],
  ["integraties", "Integraties", PlugsConnected], ["achtergrond", "Achtergrondtaken", Queue],
];

export function useAts(store, update, jobs) {
  const ats = store.ats;
  const set = (fn) => update((s) => ({ ...s, ats: fn(s.ats) }));
  const job = (id) => jobs.find((j) => j.id === id);
  const cand = (id) => ats.candidates.find((c) => c.id === id);
  const score = (c, j) => (c && j ? matchJob(toProfile(c), j).score : 0);
  const best = (c) => ats.apps.filter((a) => a.cand === c.id).map((a) => ({ a, j: job(a.job), s: score(c, job(a.job)) })).filter((x) => x.j).sort((x, y) => y.s - x.s)[0];

  const emit = (ev) => set((a) => fireEvent(a, jobs, ev));
  return { ats, set, job, cand, score, best, emit };
}

// Manual send: message and queue job share one key so the thread can show delivery status.
export const sendMessage = (ctx, cand, channel, text) => ctx.set((a) => addMessage(a, { cand, channel, text }));

// Background worker: processes the outbound queue every 1.5s while Business is open.
// ponytail: in-browser timer for the demo; live = server worker (cron/queue consumer) running processQueue.
export function useWorker(ctx) {
  useEffect(() => {
    const t = setInterval(() => ctx.set((a) => {
      const contacts = Object.fromEntries(a.candidates.map((c) => [c.id, c]));
      const q = processQueue(a.queue, (j) => demoSend(j, { contacts, outage: a.outage }));
      return q.some((j, i) => j !== a.queue[i]) ? { ...a, queue: q } : a;
    }), 1500);
    return () => clearInterval(t);
  }, []); // eslint-disable-line
}

const Head = ({ title, sub, children }) => (
  <header><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="row">{children}</div></header>
);
const Score = ({ s }) => <span className="match" style={s < 60 ? { background: "var(--elev)", color: "var(--text)" } : undefined}>{s}%</span>;
const ChIcon = ({ ch, size = 16 }) => { const I = CH_ICON[ch] || ChatCircle; return <I size={size} aria-label={CHANNELS[ch]} />; };

// ============================== Kandidaten (CRM) ==============================
export function Candidates({ ctx, jobs, go }) {
  const { ats, best } = ctx;
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("");
  const [open, setOpen] = useState(null);
  const rows = ats.candidates.filter((c) => (!src || c.source === src) && `${c.name} ${c.headline} ${c.city} ${c.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const sources = [...new Set(ats.candidates.map((c) => c.source))];
  const last = (c) => ats.messages.filter((m) => m.cand === c.id).map((m) => m.at).sort().pop();
  return (<>
    <Head title="Kandidaten" sub={`${ats.candidates.length} kandidaten in je CRM — uit de app, LinkedIn, databases en leveranciers.`}>
      <button className="btn primary" onClick={() => go("sourcing")}><Plus size={16} />Kandidaten sourcen</button>
    </Head>
    <div className="row wrap" style={{ marginBottom: 12 }}>
      <input className="in" style={{ maxWidth: 320 }} placeholder="Zoek op naam, skill, plaats" aria-label="Zoek kandidaten" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="in" style={{ width: "auto" }} aria-label="Bron" value={src} onChange={(e) => setSrc(e.target.value)}><option value="">Alle bronnen</option>{sources.map((s) => <option key={s}>{s}</option>)}</select>
    </div>
    <div className={open ? "cols" : ""}>
      <section className="card"><table className="t"><thead><tr><th>Kandidaat</th><th>Bron</th><th>Beste match</th><th>Fase</th><th>Laatste contact</th></tr></thead>
        <tbody>{rows.map((c) => { const b = best(c); const l = last(c); return (
          <tr key={c.id} onClick={() => setOpen(c.id)} style={{ cursor: "pointer", background: open === c.id ? "var(--elev)" : undefined }}>
            <td><div className="row"><span className="avatar">{initials(c.name)}</span><span><button className="linkbtn" onClick={() => setOpen(c.id)}>{c.name}</button><br /><span className="xs muted">{c.headline} · {c.city}</span></span></div></td>
            <td><span className="tag">{c.source}</span></td>
            <td>{b ? <span className="row"><Score s={b.s} /><span className="xs muted">{b.j.title}</span></span> : <span className="muted sm">—</span>}</td>
            <td>{b ? <span className="tag">{b.a.stage}</span> : <span className="muted sm">Pool</span>}</td>
            <td className="sm muted">{l ? fmt(l) : "—"}</td></tr>); })}</tbody></table>
        {!rows.length && <p className="muted" style={{ padding: 12 }}>Geen kandidaten gevonden.</p>}</section>
      {open && <CandidatePanel ctx={ctx} jobs={jobs} id={open} go={go} onClose={() => setOpen(null)} />}
    </div>
  </>);
}

function CandidatePanel({ ctx, jobs, id, go, onClose }) {
  const { ats, cand, job, score, emit, set } = ctx;
  const c = cand(id);
  const [addJob, setAddJob] = useState("");
  const apps = ats.apps.filter((a) => a.cand === id);
  const timeline = [
    ...ats.messages.filter((m) => m.cand === id).map((m) => ({ at: m.at, text: `${m.dir === "in" ? "← " : "→ "}${CHANNELS[m.channel]}: ${m.text}`, auto: m.auto })),
    ...ats.events.filter((e) => e.cand === id).map((e) => ({ at: `${e.date}T${e.time}`, text: `📅 ${e.type} — ${job(e.job)?.title || ""}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  const tasks = ats.tasks.filter((t) => t.cand === id && !t.done);
  const add = () => {
    if (!addJob || apps.some((a) => a.job === addJob)) return;
    set((a) => ({ ...a, apps: [...a.apps, { id: uid(), cand: id, job: addJob, stage: "Nieuw" }] }));
    setAddJob("");
  };
  return (
    <aside className="card stack" aria-label={`Kandidaat ${c.name}`}>
      <div className="row between"><div className="row"><span className="avatar lg" style={{ width: 52, height: 52, fontSize: 18 }}>{initials(c.name)}</span>
        <div><h3>{c.name}</h3><p className="sm muted">{c.headline} · {c.city}</p></div></div>
        <button className="icon-btn" aria-label="Sluiten" onClick={onClose}><X size={16} /></button></div>
      <div className="row wrap sm"><span className="tag">{c.source}</span><span className="tag">{AVAIL_LABEL[c.availability]}</span><span className="tag">€{c.rate}/u</span>
        <span className="muted">{c.email || "geen e-mail"} · {c.phone || "geen telefoon"}</span></div>
      <div className="row wrap">{c.certs.map((x) => <span key={x.name} className="row xs">{x.name}<StatusBadge status={certStatus(x)} /></span>)}</div>
      <div className="row wrap">{c.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
      <h4 className="sec-title">Vacatures</h4>
      {apps.map((a) => { const j = job(a.job); return j && (
        <div key={a.id} className="row"><Score s={score(c, j)} /><span className="grow sm">{j.title}</span>
          <select className="in" style={{ width: "auto", padding: "6px 8px" }} aria-label={`Fase voor ${j.title}`} value={a.stage}
            onChange={(e) => { const stage = e.target.value; set((x) => ({ ...x, apps: x.apps.map((p) => (p.id === a.id ? { ...p, stage } : p)) })); emit({ type: "stage.changed", cand: id, job: a.job, stage }); }}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>); })}
      <div className="row"><select className="in" aria-label="Koppel aan vacature" value={addJob} onChange={(e) => setAddJob(e.target.value)}><option value="">Koppel aan vacature…</option>
        {jobs.filter((j) => !apps.some((a) => a.job === j.id)).map((j) => <option key={j.id} value={j.id}>{j.title} ({score(c, j)}%)</option>)}</select>
        <button className="btn sm" onClick={add} disabled={!addJob}>Koppel</button></div>
      <div className="row wrap">
        <button className="btn sm primary" onClick={() => go("berichten", id)}><ChatCircle size={14} />Bericht</button>
        <button className="btn sm" onClick={() => go("agenda", id)}><CalendarBlank size={14} />Plan gesprek</button>
        <button className="btn sm" onClick={() => emit({ type: "no_reply", cand: id, job: apps[0]?.job })}><Clock size={14} />Simuleer 48u geen reactie</button>
      </div>
      {!!tasks.length && <><h4 className="sec-title">Open taken</h4>{tasks.map((t) => (
        <label key={t.id} className="row sm"><input type="checkbox" onChange={() => set((a) => ({ ...a, tasks: a.tasks.map((x) => (x.id === t.id ? { ...x, done: true } : x)) }))} />{t.text}</label>))}</>}
      <h4 className="sec-title">Tijdlijn</h4>
      <ul className="reasons sm">{timeline.slice(0, 8).map((t, i) => <li key={i}><span className="muted xs" style={{ minWidth: 90 }}>{fmt(t.at)}</span><span>{t.text}{t.auto && <span className="tag ai" style={{ marginLeft: 6 }}>{t.auto}</span>}</span></li>)}
        {!timeline.length && <li className="muted">Nog geen activiteit.</li>}</ul>
    </aside>
  );
}

// ============================== Pipeline ==============================
export function Pipeline({ ctx, jobs }) {
  const { ats, cand, score, emit, set } = ctx;
  const [jid, setJid] = useState(jobs[0]?.id);
  const [drag, setDrag] = useState(null);
  const j = jobs.find((x) => x.id === jid);
  const move = (appId, stage) => {
    const a = ats.apps.find((x) => x.id === appId);
    if (!a || a.stage === stage) return;
    set((x) => ({ ...x, apps: x.apps.map((p) => (p.id === appId ? { ...p, stage } : p)) }));
    emit({ type: "stage.changed", cand: a.cand, job: a.job, stage });
  };
  return (<>
    <Head title="Pipeline" sub="Sleep kandidaten door de fases. Workflows reageren automatisch op elke faseverandering.">
      <select className="in" style={{ width: "auto" }} aria-label="Vacature" value={jid} onChange={(e) => setJid(e.target.value)}>{jobs.map((x) => <option key={x.id} value={x.id}>{x.title} — {x.city}</option>)}</select>
    </Head>
    <div className="kanban">{STAGES.map((st) => {
      const items = ats.apps.filter((a) => a.job === jid && a.stage === st);
      return (
        <section key={st} className="lane" onDragOver={(e) => e.preventDefault()} onDrop={() => { move(drag, st); setDrag(null); }} aria-label={st}>
          <div className="row between"><b className="sm">{st}</b><span className="xs muted">{items.length}</span></div>
          {items.map((a) => { const c = cand(a.cand); return c && (
            <article key={a.id} className="kcard" draggable onDragStart={() => setDrag(a.id)}>
              <div className="row between"><b className="sm">{c.name}</b><Score s={score(c, j)} /></div>
              <span className="xs muted">{c.headline}</span>
              <select className="in" aria-label={`Verplaats ${c.name}`} value={a.stage} onChange={(e) => move(a.id, e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
            </article>); })}
        </section>);
    })}</div>
  </>);
}

// ============================== Berichten (omnichannel inbox) ==============================
export function Inbox({ ctx, focus }) {
  const { ats, cand } = ctx;
  const threads = [...new Set([...ats.messages].sort((a, b) => (a.at < b.at ? 1 : -1)).map((m) => m.cand))];
  const [id, setId] = useState(focus || threads[0]);
  const c = cand(id);
  const [channel, setChannel] = useState("whatsapp");
  const [text, setText] = useState("");
  const msgs = ats.messages.filter((m) => m.cand === id).sort((a, b) => (a.at < b.at ? -1 : 1));
  const jobOf = ats.apps.find((a) => a.cand === id);
  const status = (m) => m.dir === "out" && ats.queue.find((j) => j.key === m.key);
  const templates = ats.workflows.flatMap((w) => w.actions.filter((a) => a.type === "message").map((a) => [w.name, a.template]));
  return (<>
    <Head title="Berichten" sub="WhatsApp, e-mail en de Workstr app in één inbox. Elk bericht loopt via de betrouwbare verzendwachtrij." />
    <div className="cols" style={{ gridTemplateColumns: "300px 1fr" }}>
      <section className="card list">{[...threads, ...ats.candidates.map((x) => x.id).filter((x) => !threads.includes(x) && x === focus)].map((tid) => { const t = cand(tid); const lm = ats.messages.filter((m) => m.cand === tid).pop(); return t && (
        <button key={tid} className="li" aria-current={tid === id} onClick={() => setId(tid)} style={tid === id ? { background: "var(--elev)", borderRadius: 10, paddingInline: 8 } : undefined}>
          <span className="avatar">{initials(t.name)}</span><span className="grow" style={{ minWidth: 0 }}><b className="sm">{t.name}</b><br />
            <span className="xs muted" style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lm ? `${CHANNELS[lm.channel]}: ${lm.text}` : "Nieuw gesprek"}</span></span></button>); })}</section>
      {c ? <section className="card" style={{ display: "flex", flexDirection: "column", minHeight: 480, padding: 0 }}>
        <div className="row between" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}><b>{c.name}</b><span className="xs muted">{c.phone || "geen telefoon"} · {c.email || "geen e-mail"}</span></div>
        <div className="msgs">{msgs.map((m) => { const st = status(m); return (
          <div key={m.id} className={`msg ${m.dir === "in" ? "them" : "me"}`} style={{ maxWidth: "75%" }}>
            <span className="xs" style={{ opacity: .8, display: "flex", gap: 4, alignItems: "center" }}><ChIcon ch={m.channel} size={12} />{CHANNELS[m.channel]}{m.auto ? ` · ${m.auto}` : ""}</span>
            {m.text}
            {m.dir === "out" && <span className="xs" style={{ display: "block", opacity: .85, marginTop: 4 }}>{st ? `${STATUS_NL[st.status]}${st.error ? ` — ${st.error}` : ""}` : "Verzonden"} · {fmt(m.at)}</span>}
          </div>); })}</div>
        <div className="suggest">{templates.slice(0, 4).map(([n, t]) => <button key={n} className="chip" onClick={() => setText(t.replace(/\{voornaam\}/g, c.name.split(" ")[0]).replace(/\{vacature\}/g, ctx.job(jobOf?.job)?.title || "de vacature"))}><Sparkle size={12} />{n}</button>)}</div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendMessage(ctx, id, channel, text.trim()); setText(""); }}>
          <select className="in" style={{ width: "auto", borderRadius: 999 }} aria-label="Kanaal" value={channel} onChange={(e) => setChannel(e.target.value)}>{Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input className="in" aria-label="Bericht" placeholder="Schrijf een bericht" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn primary">Verstuur</button></form>
      </section> : <section className="card muted">Kies een gesprek.</section>}
    </div>
  </>);
}

// ============================== Agenda ==============================
export function Agenda({ ctx, jobs, focus }) {
  const { ats, cand, job, emit, set } = ctx;
  const [week, setWeek] = useState(0);
  const [f, setF] = useState(() => ({ cand: focus || "", job: "", date: new Date(Date.now() + 864e5).toISOString().slice(0, 10), time: "10:00", type: "Videogesprek" }));
  const monday = new Date(); monday.setHours(12, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + week * 7);
  const days = [...Array(5)].map((_, i) => { const x = new Date(monday); x.setDate(x.getDate() + i); return x.toISOString().slice(0, 10); });
  const candApps = ats.apps.filter((a) => a.cand === f.cand);
  const plan = (e) => {
    e.preventDefault();
    const jobId = f.job || candApps[0]?.job;
    set((a) => ({ ...a, events: [...a.events, { id: uid(), ...f, job: jobId }] }));
    emit({ type: "interview.scheduled", cand: f.cand, job: jobId, vars: { datum: new Date(f.date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }), tijd: f.time } });
    setF({ ...f, cand: "" });
  };
  return (<>
    <Head title="Agenda" sub="Gesprekken plannen. De bevestiging gaat automatisch via de workflow ‘Gespreksbevestiging’.">
      <button className="btn sm" onClick={() => setWeek(week - 1)}>← Vorige</button><button className="btn sm" onClick={() => setWeek(0)}>Deze week</button><button className="btn sm" onClick={() => setWeek(week + 1)}>Volgende →</button>
    </Head>
    <div className="cols" style={{ gridTemplateColumns: "1fr 320px" }}>
      <section className="week">{days.map((dd) => (
        <div key={dd} className="day"><b className="sm">{new Date(dd).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}</b>
          {ats.events.filter((e) => e.date === dd).sort((a, b) => (a.time < b.time ? -1 : 1)).map((e) => (
            <div key={e.id} className="evt"><b className="xs">{e.time} · {e.type}</b><span className="sm">{cand(e.cand)?.name}</span><span className="xs muted">{job(e.job)?.title}</span></div>))}
        </div>))}</section>
      <form className="card stack" onSubmit={plan}><h3 className="sec-title">Plan gesprek</h3>
        <label className="f">Kandidaat<select className="in" required value={f.cand} onChange={(e) => setF({ ...f, cand: e.target.value, job: "" })}><option value="">Kies…</option>{ats.candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="f">Vacature<select className="in" value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })}>{(candApps.length ? candApps.map((a) => job(a.job)).filter(Boolean) : jobs).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></label>
        <div className="row"><label className="f grow">Datum<input className="in" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="f grow">Tijd<input className="in" type="time" required value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></label></div>
        <label className="f">Type<select className="in" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{["Videogesprek", "Telefonisch", "Op locatie"].map((t) => <option key={t}>{t}</option>)}</select></label>
        <button className="btn primary" disabled={!f.cand}>Inplannen</button>
      </form>
    </div>
  </>);
}

// ============================== Workflows ==============================
const blank = () => ({ id: uid(), name: "", on: true, approval: false, trigger: "candidate.created", when: {}, actions: [{ type: "message", channel: "whatsapp", template: "Hoi {voornaam}, " }] });
export function Workflows({ ctx }) {
  const { ats, set, emit } = ctx;
  const [edit, setEdit] = useState(null);
  const toggle = (id, k) => set((a) => ({ ...a, workflows: a.workflows.map((w) => (w.id === id ? { ...w, [k]: !w[k] } : w)) }));
  const save = () => { set((a) => ({ ...a, workflows: [...a.workflows.filter((w) => w.id !== edit.id), edit] })); setEdit(null); };
  const certCheck = () => {
    for (const c of ats.candidates) for (const x of c.certs) {
      const left = daysLeft(x.validUntil);
      if (left >= 0 && left <= 30) emit({ type: "cert.expiring", cand: c.id, job: ats.apps.find((a) => a.cand === c.id)?.job, vars: { certificaat: x.name, dagen: left } });
    }
  };
  const act = (i, patch) => setEdit({ ...edit, actions: edit.actions.map((a, k) => (k === i ? { ...a, ...patch } : a)) });
  const describe = (a) => (a.type === "message" ? `${CHANNELS[a.channel]}: “${a.template.slice(0, 60)}${a.template.length > 60 ? "…" : ""}”` : a.type === "stage" ? `Zet fase op ${a.to}` : `Taak: ${a.text}`);
  return (<>
    <Head title="Workflows" sub="Als dit gebeurt → doe dat. Triggers, voorwaarden en acties zonder code. Gevoelige acties met menselijke goedkeuring.">
      <button className="btn" onClick={certCheck}><ArrowClockwise size={16} />Certificaatcheck draaien</button>
      {!edit && <button className="btn primary" onClick={() => setEdit(blank())}><Plus size={16} />Nieuwe workflow</button>}
    </Head>
    {edit && <section className="card stack" style={{ marginBottom: 16 }}>
      <div className="cols even">
        <label className="f">Naam<input className="in" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
        <label className="f">Trigger (als…)<select className="in" value={edit.trigger} onChange={(e) => setEdit({ ...edit, trigger: e.target.value })}>{Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="f">Alleen bij fase<select className="in" value={edit.when.stage || ""} onChange={(e) => setEdit({ ...edit, when: { ...edit.when, stage: e.target.value || undefined } })}><option value="">Elke fase</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="f">Minimale matchscore<input className="in" type="number" min="0" max="100" value={edit.when.minScore || ""} onChange={(e) => setEdit({ ...edit, when: { ...edit.when, minScore: +e.target.value || undefined } })} /></label>
      </div>
      <h4 className="sec-title">Acties (dan…)</h4>
      {edit.actions.map((a, i) => (
        <div key={i} className="row wrap" style={{ alignItems: "flex-start" }}>
          <select className="in" style={{ width: "auto" }} aria-label="Actietype" value={a.type} onChange={(e) => act(i, e.target.value === "message" ? { type: "message", channel: "whatsapp", template: "" } : e.target.value === "stage" ? { type: "stage", to: "Benaderd" } : { type: "task", text: "" })}>
            <option value="message">Stuur bericht</option><option value="stage">Wijzig fase</option><option value="task">Maak taak</option></select>
          {a.type === "message" && <><select className="in" style={{ width: "auto" }} aria-label="Kanaal" value={a.channel} onChange={(e) => act(i, { channel: e.target.value })}>{Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <textarea className="in grow" style={{ minHeight: 60 }} aria-label="Bericht" value={a.template} onChange={(e) => act(i, { template: e.target.value })} /></>}
          {a.type === "stage" && <select className="in" style={{ width: "auto" }} aria-label="Naar fase" value={a.to} onChange={(e) => act(i, { to: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>}
          {a.type === "task" && <input className="in grow" aria-label="Taak" value={a.text} onChange={(e) => act(i, { text: e.target.value })} />}
          <button className="icon-btn" aria-label="Verwijder actie" onClick={() => setEdit({ ...edit, actions: edit.actions.filter((_, k) => k !== i) })}><Trash size={16} /></button>
        </div>))}
      <p className="xs muted">Variabelen: {"{voornaam} {naam} {vacature} {plaats} {score} {datum} {tijd} {certificaat} {dagen}"}</p>
      <div className="row wrap"><button className="btn sm" onClick={() => setEdit({ ...edit, actions: [...edit.actions, { type: "task", text: "" }] })}><Plus size={14} />Actie</button>
        <label className="row sm"><input type="checkbox" checked={edit.approval} onChange={(e) => setEdit({ ...edit, approval: e.target.checked })} />Berichten pas na menselijke goedkeuring</label>
        <span className="grow" /><button className="btn" onClick={() => setEdit(null)}>Annuleer</button><button className="btn primary" disabled={!edit.name || !edit.actions.length} onClick={save}>Opslaan</button></div>
    </section>}
    <div className="stack">{ats.workflows.map((w) => (
      <section key={w.id} className="card row wrap" style={{ alignItems: "flex-start", opacity: w.on ? 1 : .55 }}>
        <Lightning size={22} color="var(--lav)" />
        <div className="grow stack" style={{ gap: 6 }}><div className="row wrap"><b>{w.name}</b>{w.approval && <span className="tag human">Met goedkeuring</span>}</div>
          <span className="sm"><span className="muted">Als</span> {TRIGGERS[w.trigger]}{w.when?.stage ? ` (fase ${w.when.stage})` : ""}{w.when?.minScore ? ` en match ≥ ${w.when.minScore}%` : ""}</span>
          {w.actions.map((a, i) => <span key={i} className="sm"><span className="muted">dan</span> {describe(a)}</span>)}</div>
        <button className="btn sm" onClick={() => setEdit(structuredClone(w))}>Bewerk</button>
        <label className="row sm"><input type="checkbox" checked={w.on} onChange={() => toggle(w.id, "on")} />Actief</label>
      </section>))}</div>
    <section className="card" style={{ marginTop: 16 }}><h3 className="sec-title">Laatste runs</h3>
      <table className="t"><tbody>{ats.runs.slice(0, 10).map((r) => <tr key={r.id}><td className="sm muted" style={{ width: 120 }}>{fmt(r.at)}</td><td className="sm"><b>{r.trigger}</b> — {r.cand}</td><td className="sm">{r.actions.length ? r.actions.join(" · ") : <span className="muted">geen workflow van toepassing</span>}</td></tr>)}</tbody></table>
      {!ats.runs.length && <p className="muted sm">Nog geen runs. Importeer een kandidaat, plan een gesprek of verander een fase.</p>}</section>
  </>);
}

// ============================== Sourcing (layer 2) ==============================
export function Sourcing({ ctx, jobs }) {
  const { ats, set, emit } = ctx;
  const [q, setQ] = useState("");
  const [jid, setJid] = useState(jobs[0]?.id);
  const [src, setSrc] = useState("");
  const j = jobs.find((x) => x.id === jid);
  const inCrm = (x) => ats.candidates.some((c) => c.id === x.id);
  const rows = externalPool.filter((x) => (!src || x.source === src) && `${x.name} ${x.headline} ${x.city} ${x.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
    .map((x) => ({ x, s: matchJob(toProfile(x), j).score })).sort((a, b) => b.s - a.s);
  const importOne = (x) => {
    set((a) => ({ ...a, candidates: [...a.candidates, { ...x, tags: [] }], apps: [...a.apps, { id: uid(), cand: x.id, job: jid, stage: "Nieuw" }] }));
    emit({ type: "candidate.created", cand: x.id, job: jid });
  };
  return (<>
    <Head title="Sourcing" sub="Zoek buiten je eigen CRM: externe databases, LinkedIn en leveranciers. Importeren start je workflows automatisch." />
    <section className="card row wrap" style={{ marginBottom: 12 }}>
      <MagnifyingGlass size={18} /><input className="in" style={{ maxWidth: 320 }} aria-label="Zoek extern" placeholder="Bijv. PAUT, Rotterdam, coating" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="in" style={{ width: "auto" }} aria-label="Bron" value={src} onChange={(e) => setSrc(e.target.value)}><option value="">Alle bronnen</option><option>LinkedIn</option><option>Externe database</option></select>
      <span className="sm muted">Score tegen</span><select className="in" style={{ width: "auto" }} aria-label="Vacature" value={jid} onChange={(e) => setJid(e.target.value)}>{jobs.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
    </section>
    <div className="ai-note" style={{ marginBottom: 12 }}><Database size={16} />Demo-dataset. Live via gekoppelde bronnen — zie Integraties. LinkedIn-profielen hebben vaak geen telefoon/e-mail: WhatsApp vereist opt-in.</div>
    <section className="card"><table className="t"><thead><tr><th>Profiel</th><th>Bron</th><th>Certificaten</th><th>Tarief</th><th>Match</th><th /></tr></thead>
      <tbody>{rows.map(({ x, s }) => (
        <tr key={x.id}><td><b>{x.name}</b><br /><span className="xs muted">{x.headline} · {x.city} · {AVAIL_LABEL[x.availability]}</span></td>
          <td><span className="row sm">{x.source === "LinkedIn" ? <LinkedinLogo size={16} /> : <Database size={16} />}{x.source}</span></td>
          <td className="sm">{x.certs.map((c) => c.name).join(", ")}</td><td>€{x.rate}/u</td><td><Score s={s} /></td>
          <td>{inCrm(x) ? <span className="tag">In CRM</span> : <button className="btn sm primary" onClick={() => importOne(x)}>Importeer</button>}</td></tr>))}</tbody></table></section>
  </>);
}

// ============================== Integraties ==============================
export function Integrations({ ctx }) {
  const { ats, set } = ctx;
  const outage = (ch) => set((a) => ({ ...a, outage: { ...a.outage, [ch]: !a.outage?.[ch] } }));
  const items = [
    ["whatsapp", WhatsappLogo, "WhatsApp Business", "Demo-provider", "Meta WhatsApp Business Cloud API: geverifieerd bedrijf, goedgekeurde templates voor eerste contact, opt-in van de kandidaat."],
    ["email", EnvelopeSimple, "E-mail", "Demo-provider", "Gmail/Outlook via OAuth, of Resend/Postmark met eigen domein (SPF/DKIM)."],
    [null, CalendarBlank, "Agenda", "Niet gekoppeld", "Google Calendar of Microsoft 365 (Graph) voor beschikbaarheid en uitnodigingen."],
    [null, LinkedinLogo, "LinkedIn", "Niet gekoppeld", "Officiële route: LinkedIn Talent Solutions-partnerprogramma (Recruiter System Connect). Scrapen is tegen de voorwaarden."],
    [null, Database, "Externe database", "Demo-dataset", "Data-provider of eigen leveranciersdatabases, met AVG-grondslag en bronregistratie per profiel."],
    [null, DeviceMobile, "Workstr app", "Verbonden", "Kandidaten uit de app komen direct in het CRM met hun Work Profile."],
  ];
  return (<>
    <Head title="Integraties" sub="Laag 2: de kanalen en bronnen waar je agents mee werken." />
    <div className="kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>{items.map(([ch, I, name, status, need]) => (
      <section key={name} className="card stack"><div className="row between"><span className="row"><I size={22} /><b>{name}</b></span>
        <span className={`badge ${status === "Verbonden" ? "verified" : status === "Niet gekoppeld" ? "missing" : "uploaded"}`}>{ats.outage?.[ch] ? "Storing" : status}</span></div>
        <p className="sm muted">{need}</p>
        {ch && <label className="row sm"><input type="checkbox" checked={!!ats.outage?.[ch]} onChange={() => outage(ch)} />Simuleer storing (test retries)</label>}
      </section>))}</div>
  </>);
}

// ============================== Achtergrondtaken (queue) ==============================
export function Background({ ctx }) {
  const { ats, set, cand } = ctx;
  const patch = (id, p) => set((a) => ({ ...a, queue: a.queue.map((j) => (j.id === id ? { ...j, ...p } : j)) }));
  const count = (st) => ats.queue.filter((j) => j.status === st).length;
  const q = [...ats.queue].reverse();
  return (<>
    <Head title="Achtergrondtaken" sub="Elk uitgaand bericht is een taak met idempotency-key, automatische retries (exponential backoff) en dead-letter na 5 pogingen." />
    <div className="kpis">{[["Verzonden", "sent"], ["In wachtrij", "queued"], ["Retry", "retry"], ["Wacht op goedkeuring", "approval"], ["Mislukt / dead", "failed"]].map(([l, st]) => (
      <div key={st} className="kpi"><span className="sm muted">{l}</span><b>{st === "failed" ? count("failed") + count("dead") : count(st)}</b></div>))}</div>
    <section className="card"><table className="t"><thead><tr><th>Kanaal</th><th>Aan</th><th>Bericht</th><th>Status</th><th>Pogingen</th><th /></tr></thead>
      <tbody>{q.map((j) => (
        <tr key={j.id}><td><span className="row sm"><ChIcon ch={j.channel} />{CHANNELS[j.channel]}</span></td><td className="sm">{cand(j.to)?.name}</td>
          <td className="sm" style={{ maxWidth: 360 }}>{j.text}{j.workflow && <><br /><span className="tag ai">{j.workflow}</span></>}</td>
          <td><span className={`badge ${j.status === "sent" ? "verified" : ["failed", "dead"].includes(j.status) ? "missing" : "expiring"}`}>{STATUS_NL[j.status]}</span>
            {j.error && <span className="issue">{j.error}</span>}{j.status === "retry" && <span className="xs muted">volgende: {new Date(j.runAt).toLocaleTimeString("nl-NL")}</span>}</td>
          <td>{j.attempts}</td>
          <td><div className="row">
            {j.status === "approval" && <><button className="btn sm primary" onClick={() => patch(j.id, { status: "queued", runAt: Date.now() })}><Check size={14} />Goedkeuren</button><button className="btn sm" onClick={() => patch(j.id, { status: "cancelled" })}><X size={14} />Annuleer</button></>}
            {["retry", "dead"].includes(j.status) && <button className="btn sm" onClick={() => patch(j.id, { status: "retry", runAt: Date.now() })}><ArrowClockwise size={14} />Nu opnieuw</button>}
          </div></td></tr>))}</tbody></table>
      {!q.length && <p className="muted sm" style={{ padding: 12 }}>Wachtrij is leeg.</p>}</section>
  </>);
}
