import React, { useState } from "react";
import {
  SquaresFour, Briefcase, MagnifyingGlass, ChatCircle, Buildings, ChartBar, Gear, Tray, UsersThree, Truck, ShieldCheck,
  FileText, Timer, Robot, Sparkle, Check, X, Plus, Lightning,
} from "@phosphor-icons/react";
import {
  companies, seedJobs, talent, bizCandidates, plans, workers, suppliers, contracts, agents, agentTemplates, REQUIRED_DOCS, CITIES,
} from "./data.js";
import { matchJob, structureVacancy, compliance, timesheetIssues, km, eur, daysLeft, AVAIL_LABEL, CERT_WORDS } from "./logic.js";
import { Logo, StatusBadge, Reasons, initials } from "./ui.jsx";

const ME_CO = "vanoord"; // logged-in demo employer
const t = () => new Date().toTimeString().slice(0, 5);
const uid = () => Math.random().toString(36).slice(2, 9);

function Shell({ sub, nav, page, setPage, children }) {
  return (
    <div className="desk">
      <nav className="side" aria-label={`${sub} menu`}>
        <Logo sub={sub} />
        {nav.map(([id, label, Icon, count]) => (
          <button key={id} aria-current={page === id ? "page" : undefined} onClick={() => setPage(id)}>
            <Icon size={18} />{label}{count ? <span className="count">{count}</span> : null}
          </button>
        ))}
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
const Head = ({ title, sub, children }) => (
  <header><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="row">{children}</div></header>
);
const Kpi = ({ label, value, hint }) => <div className="kpi"><span className="sm muted">{label}</span><b>{value}</b>{hint && <span className="xs muted">{hint}</span>}</div>;

// ============================ Workstr Business ============================
export function Business({ store, update }) {
  const [page, setPage] = useState("overview");
  const myJobs = [...store.jobs, ...seedJobs].filter((j) => j.company === ME_CO);
  const convs = store.convs.filter((c) => c.company === ME_CO);
  const nav = [["overview", "Overview", SquaresFour], ["vacancies", "Vacancies", Briefcase, myJobs.length], ["talent", "Talent", MagnifyingGlass],
    ["messages", "Messages", ChatCircle, convs.length], ["company", "Company", Buildings], ["analytics", "Analytics", ChartBar], ["settings", "Settings", Gear]];
  return (
    <Shell sub="Business" nav={nav} page={page} setPage={setPage}>
      {page === "overview" && <BizOverview myJobs={myJobs} store={store} />}
      {page === "vacancies" && <Vacancies myJobs={myJobs} update={update} />}
      {page === "talent" && <TalentSearch />}
      {page === "messages" && <BizMessages convs={convs} update={update} />}
      {page === "company" && <CompanyEdit />}
      {page === "analytics" && <Analytics />}
      {page === "settings" && <Settings />}
    </Shell>
  );
}

function BizOverview({ myJobs, store }) {
  const fresh = bizCandidates.filter((c) => c.stage === "Nieuw").length + store.interested.length;
  return (<>
    <Head title="Goedemorgen, Van Oord" sub="Wat er vandaag gebeurt in je recruitment." />
    <div className="kpis">
      <Kpi label="Open vacancies" value={myJobs.length + 6} /><Kpi label="New candidates" value={19 + fresh} />
      <Kpi label="Interviews" value={6} /><Kpi label="Matches today" value={14} />
    </div>
    <div className="cols">
      <section className="card"><h3 className="sec-title">Pipeline</h3>
        <table className="t"><thead><tr><th>Kandidaat</th><th>Vacature</th><th>Match</th><th>Fase</th></tr></thead>
          <tbody>{bizCandidates.map((c) => <tr key={c.name}><td><b>{c.name}</b></td><td className="muted">{c.job}</td><td><span className="match">{c.score}%</span></td><td><span className="tag">{c.stage}</span></td></tr>)}</tbody></table>
      </section>
      <section className="card stack"><h3 className="sec-title">Workstr signaleert</h3>
        <Reasons reasons={[{ type: "ok", text: "3 kandidaten met geverifieerd UT2 beschikbaar binnen 30 km" },
          { type: "warn", text: "Vacature ‘QA/QC Inspector’ — tarief ligt 8% onder markt" }, { type: "warn", text: "2 kandidaten wachten > 48 uur op reactie" }]} />
      </section>
    </div>
  </>);
}

function Vacancies({ myJobs, update }) {
  const [step, setStep] = useState(null);
  const [raw, setRaw] = useState("");
  const [v, setV] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const publish = () => {
    const job = { ...v, id: uid(), company: ME_CO, rateMin: +v.rateMin, rateMax: +v.rateMax, start: v.start || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      duration: v.duration || "n.t.b.", photo: v.photo, team: v.team || "", tasks: v.tasks.length ? v.tasks : ["Zie gesprek"] };
    update((s) => ({ ...s, jobs: [job, ...s.jobs] }));
    setStep(null); setRaw(""); setV(null);
  };
  const example = "NDT Inspector Monopiles\nLocatie: Rotterdam. Freelance, €58 - €70 per uur.\n- UT en PAUT op monopile-lassen\n- Rapportage aan QA/QC Lead\nEisen: UT2, VCA, BOSIET. Offshore ervaring is een plus.";
  return (<>
    <Head title="Vacancies" sub="Plak tekst of schrijf zelf. AI structureert, jij publiceert.">
      {!step && <button className="btn primary" onClick={() => setStep("paste")}><Plus size={16} />Nieuwe vacature</button>}
    </Head>
    {step === "paste" && (
      <section className="card stack" style={{ marginBottom: 20 }}>
        <label className="f">Bestaande vacaturetekst (uit Word, PDF of oude vacature)<textarea className="in" style={{ minHeight: 160 }} value={raw} onChange={(e) => setRaw(e.target.value)} /></label>
        <div className="row"><button className="btn ghost sm" onClick={() => setRaw(example)}>Voorbeeld plakken</button><span className="grow" />
          <button className="btn" onClick={() => setStep(null)}>Annuleer</button>
          <button className="btn primary" disabled={raw.trim().length < 10} onClick={() => { setV({ ...structureVacancy(raw), photo: "./work/w3.jpg" }); setStep("review"); }}><Lightning size={16} />Structureer</button></div>
      </section>
    )}
    {step === "review" && v && (
      <section className="card stack" style={{ marginBottom: 20 }}>
        <div className="ai-note"><Sparkle size={18} />Gestructureerd uit jouw tekst. Controleer de velden voor publicatie.</div>
        <div className="cols even">
          <label className="f">Functietitel<input className="in" value={v.title} onChange={set("title")} /></label>
          <label className="f">Locatie<select className="in" value={v.city} onChange={set("city")}><option value="">—</option>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="f">Tarief min (€/{v.unit})<input className="in" type="number" value={v.rateMin} onChange={set("rateMin")} /></label>
          <label className="f">Tarief max (€/{v.unit})<input className="in" type="number" value={v.rateMax} onChange={set("rateMax")} /></label>
          <label className="f">Contractvorm<select className="in" value={v.contract} onChange={set("contract")}><option value="">—</option><option value="freelance">Freelance</option><option value="project">Project</option><option value="vast">Vast</option></select></label>
          <label className="f">Startdatum<input className="in" type="date" value={v.start || ""} onChange={set("start")} /></label>
        </div>
        <div className="row wrap"><span className="sm muted">Certificaten:</span>{v.certs.map((c) => <span key={c} className="chip">{c}</span>)}
          <span className="sm muted" style={{ marginLeft: 12 }}>Skills:</span>{v.skills.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        {!!v.tasks.length && <ul style={{ margin: 0 }}>{v.tasks.map((x) => <li key={x}>{x}</li>)}</ul>}
        <div className="row"><span className="grow" /><button className="btn" onClick={() => setStep("paste")}>Terug</button>
          <button className="btn primary" disabled={!v.title || !v.city || !v.contract} onClick={publish}>Publiceer in Discover</button></div>
      </section>
    )}
    <section className="card"><table className="t"><thead><tr><th>Functie</th><th>Locatie</th><th>Tarief</th><th>Certificaten</th><th>Status</th></tr></thead>
      <tbody>{myJobs.map((j) => <tr key={j.id}><td><b>{j.title}</b></td><td>{j.city}</td><td>€{j.rateMin}–{j.rateMax}/{j.unit}</td><td>{j.certs.join(", ")}</td><td><span className="tag">Live</span></td></tr>)}</tbody></table></section>
  </>);
}

function TalentSearch() {
  const [q, setQ] = useState("UT Inspector");
  const [f, setF] = useState({ city: "Rotterdam", now: false, ut2: true, offshore: true, maxRate: 65 });
  const tog = (k) => setF({ ...f, [k]: !f[k] });
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const far = new Date(Date.now() + 999 * 864e5).toISOString();
  const job = { certs: f.ut2 ? ["UT2"] : [], skills: [...new Set(talent.flatMap((x) => x.skills).filter((s) => words.some((w) => s.toLowerCase().includes(w))))],
    city: f.city, unit: "uur", rateMax: f.maxRate, contract: "freelance", start: new Date(Date.now() + 30 * 864e5).toISOString(), sector: "Offshore" };
  const rows = talent
    .filter((x) => (!f.city || (km(x.city, f.city) ?? 0) <= 100) && (!f.now || x.availability === "now") && x.rate <= f.maxRate
      && (!f.ut2 || x.certs.some((c) => c.name === "UT2" && c.verified)) && (!f.offshore || x.skills.includes("Offshore")))
    .map((x) => ({ x, m: matchJob({ ...x, certs: x.certs.map((c) => ({ ...c, validUntil: far })), radiusKm: 100, minRate: x.rate, contracts: ["freelance"], projects: [] }, job) }))
    .sort((a, b) => b.m.score - a.m.score);
  return (<>
    <Head title="Talent" sub="Zoek op skills, projecten en certificaten — niet alleen functietitel." />
    <section className="card stack" style={{ marginBottom: 16 }}>
      <div className="row"><MagnifyingGlass size={20} /><input className="in" aria-label="Zoek talent" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="row wrap">
        <select className="in" style={{ width: "auto" }} aria-label="Locatie" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}><option value="">Overal</option>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
        <button className={`chip ${f.now ? "on" : ""}`} aria-pressed={f.now} onClick={() => tog("now")}>Availability: Now</button>
        <button className={`chip ${f.ut2 ? "on" : ""}`} aria-pressed={f.ut2} onClick={() => tog("ut2")}>UT2: Verified</button>
        <button className={`chip ${f.offshore ? "on" : ""}`} aria-pressed={f.offshore} onClick={() => tog("offshore")}>Offshore: Yes</button>
        <label className="row sm muted">Max €<input className="in" style={{ width: 80 }} type="number" value={f.maxRate} onChange={(e) => setF({ ...f, maxRate: +e.target.value })} />/u</label>
      </div>
    </section>
    <section className="card"><table className="t"><thead><tr><th>Professional</th><th>Locatie</th><th>Beschikbaar</th><th>Tarief</th><th>Certificaten</th><th>Match</th><th /></tr></thead>
      <tbody>{rows.map(({ x, m }) => (
        <tr key={x.id}><td><div className="row"><span className="avatar">{initials(x.name)}</span><span><b>{x.name}</b><br /><span className="sm muted">{x.headline} · {x.projects} projecten</span></span></div></td>
          <td>{x.city}</td><td>{AVAIL_LABEL[x.availability]}</td><td>€{x.rate}/u</td>
          <td><div className="row wrap">{x.certs.map((c) => <span key={c.name} className="row xs">{c.name}<StatusBadge status={c.verified ? "verified" : "uploaded"} /></span>)}</div></td>
          <td><span className="match">{m.score}%</span></td><td><button className="btn sm">Benader</button></td></tr>
      ))}</tbody></table>
      {!rows.length && <p className="muted" style={{ padding: 12 }}>Geen professionals met deze filters. Verruim locatie of tarief.</p>}
    </section>
  </>);
}

function BizMessages({ convs, update }) {
  const [id, setId] = useState(convs[0]?.id);
  const [text, setText] = useState("");
  const c = convs.find((x) => x.id === id);
  const send = (e) => {
    e.preventDefault(); if (!text.trim()) return;
    update((s) => ({ ...s, convs: s.convs.map((x) => (x.id === id ? { ...x, unread: (x.unread || 0) + 1, messages: [...x.messages, { from: "them", text, at: t() }] } : x)) }));
    setText("");
  };
  return (<>
    <Head title="Messages" sub="Gesprekken met kandidaten. Berichten komen direct in hun Workstr-inbox." />
    <div className="cols" style={{ gridTemplateColumns: "280px 1fr" }}>
      <section className="card list">{convs.map((x) => <button key={x.id} className="li" aria-current={x.id === id} onClick={() => setId(x.id)}><span className="avatar">SS</span><span className="grow"><b>Sem de Snoo</b><br /><span className="sm muted">{seedJobs.find((j) => j.id === x.job)?.title || "Vacature"}</span></span></button>)}
        {!convs.length && <p className="muted">Nog geen gesprekken.</p>}</section>
      {c && <section className="card" style={{ display: "flex", flexDirection: "column", minHeight: 420, padding: 0 }}>
        <div className="msgs">{c.messages.map((m, i) => m.from === "sys" ? null : <div key={i} className={`msg ${m.from === "them" ? "me" : "them"}`}>{m.text}</div>)}</div>
        <form className="composer" onSubmit={send}><input className="in" aria-label="Bericht" value={text} onChange={(e) => setText(e.target.value)} placeholder="Schrijf een bericht" /><button className="btn primary">Verstuur</button></form>
      </section>}
    </div>
  </>);
}

function CompanyEdit() {
  const c = companies[ME_CO];
  return (<>
    <Head title="Company profile" sub="Zo zien kandidaten je bedrijf in de app. Echte beelden werken het best." />
    <div className="cols">
      <section className="card stack"><label className="f">Over ons<textarea className="in" defaultValue={c.about} /></label>
        <label className="f">Werkplek<textarea className="in" defaultValue={c.workplace.join("\n")} /></label>
        <div className="row"><button className="btn">Foto's / video uploaden</button><button className="btn primary">Opslaan</button></div></section>
      <section className="portfolio">{c.media.map((m) => <figure key={m}><img src={m} alt="Werkplek Van Oord" /></figure>)}</section>
    </div>
  </>);
}

function Analytics() {
  const funnel = [["Matches", 412], ["Interesse", 168], ["Gesprekken", 64], ["Aanbiedingen", 21], ["Plaatsingen", 14]];
  return (<>
    <Head title="Analytics" sub="We meten plaatsingen en relevante matches — niet scrolltijd." />
    <div className="kpis"><Kpi label="Time-to-hire" value="11 d" hint="markt: 34 d" /><Kpi label="Cost-per-hire" value="€640" /><Kpi label="Relevante matches" value="78%" hint="gesprek na match" /><Kpi label="Plaatsingen (90 d)" value="14" /></div>
    <section className="card funnel"><h3 className="sec-title">Funnel laatste 90 dagen</h3>
      {funnel.map(([l, n]) => <div key={l}><span>{l}</span><span className="bar"><i style={{ width: `${(100 * n) / funnel[0][1]}%` }} /></span><b>{n}</b></div>)}</section>
  </>);
}

function Settings() {
  return (<>
    <Head title="Settings" sub="Abonnement" />
    <div className="plans">{plans.map((p) => (
      <section key={p.name} className={`card stack ${p.name === "Starter" ? "cur" : ""}`}><div className="row between"><h3>{p.name}</h3>{p.name === "Starter" && <span className="tag ai">Huidig</span>}</div>
        <b style={{ fontSize: 28 }}>{p.price}<span className="sm muted"> /mnd</span></b><ul style={{ margin: 0, paddingLeft: 18 }}>{p.items.map((i) => <li key={i}>{i}</li>)}</ul></section>
    ))}</div>
    <p className="xs muted" style={{ marginTop: 12 }}>Prijzen indicatief.</p>
  </>);
}

// ============================ Workstr MSP ============================
export function Msp({ store, update }) {
  const [page, setPage] = useState("dashboard");
  const msp = store.msp;
  const log = (agent, kind, text) => update((s) => ({ ...s, msp: { ...s.msp, log: [{ t: t(), agent, kind, text }, ...s.msp.log] } }));
  const setMsp = (fn) => update((s) => ({ ...s, msp: fn(s.msp) }));
  const ctx = { msp, setMsp, log };
  const nav = [["dashboard", "Dashboard", SquaresFour], ["requests", "Requests", Tray, msp.requests.length], ["workers", "Workers", UsersThree],
    ["suppliers", "Suppliers", Truck], ["compliance", "Compliance", ShieldCheck], ["contracts", "Contracts", FileText],
    ["timesheets", "Timesheets", Timer], ["agents", "AI Agents", Robot, msp.approvals.length]];
  return (
    <Shell sub="MSP" nav={nav} page={page} setPage={setPage}>
      {page === "dashboard" && <MspDash {...ctx} go={setPage} />}
      {page === "requests" && <Requests {...ctx} />}
      {page === "workers" && <Workers />}
      {page === "suppliers" && <Suppliers {...ctx} />}
      {page === "compliance" && <Compliance {...ctx} />}
      {page === "contracts" && <Contracts {...ctx} />}
      {page === "timesheets" && <Timesheets {...ctx} />}
      {page === "agents" && <AgentCenter {...ctx} />}
    </Shell>
  );
}

const sheetRows = (msp) => msp.timesheets.map((ts) => { const w = workers.find((x) => x.id === ts.worker); return { ts, w, ...timesheetIssues(ts, w.rate) }; });

function MspDash({ msp, go }) {
  const comp = workers.map((w) => compliance(w, REQUIRED_DOCS).pct);
  const flagged = sheetRows(msp).filter((r) => r.issues.length && r.ts.status !== "approved").length;
  return (<>
    <Head title="Workforce overview" sub="Opdrachtgever: Van Oord · Week 41" />
    <div className="kpis">
      <Kpi label="Open requests" value={msp.requests.reduce((n, r) => n + r.count - r.filled, 0)} hint={`${msp.requests.length} aanvragen`} />
      <Kpi label="Actieve externen" value={workers.length} /><Kpi label="Gem. compliance" value={`${Math.round(comp.reduce((a, b) => a + b, 0) / comp.length)}%`} />
      <Kpi label="Timesheets met afwijking" value={flagged} /><Kpi label="Wacht op jou" value={msp.approvals.length} hint="menselijke goedkeuring" />
    </div>
    <div className="cols">
      <section className="card"><div className="row between"><h3 className="sec-title">Agent-activiteit</h3><button className="btn sm ghost" onClick={() => go("agents")}>Agent Center</button></div><Log rows={msp.log.slice(0, 6)} /></section>
      <section className="card stack"><h3 className="sec-title">Mens behandelt uitzonderingen</h3>
        {msp.approvals.map((a) => <div key={a.id} className="li"><Robot size={20} className="muted" /><span className="grow sm">{a.text}<br /><span className="xs muted">{a.agent}</span></span></div>)}
        {!msp.approvals.length && <p className="muted sm">Niets openstaand.</p>}
        <button className="btn" onClick={() => go("agents")}>Beoordelen</button></section>
    </div>
  </>);
}

function Log({ rows }) {
  const cls = { AI: "ai", Regel: "rule", Mens: "human" };
  return <table className="t"><tbody>{rows.map((r, i) => <tr key={i}><td className="muted sm" style={{ width: 54 }}>{r.t}</td><td><span className={`tag ${cls[r.kind]}`}>{r.kind}</span></td><td className="sm"><b>{r.agent}</b> — {r.text}</td></tr>)}</tbody></table>;
}

function Requests({ msp, setMsp, log }) {
  const [form, setForm] = useState(null);
  const [open, setOpen] = useState(msp.requests[0]?.id);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const create = () => {
    const r = { ...form, id: uid(), count: +form.count, rateMin: +form.rateMin, rateMax: +form.rateMax, certs: form.certs, status: "Sourcing", filled: 0, submissions: [] };
    const internal = workers.filter((w) => r.certs.every((c) => w.docs[c] && daysLeft(w.docs[c]) > 0)).length;
    setMsp((m) => ({ ...m, requests: [r, ...m.requests] }));
    log("Recruitment Agent", "AI", `${internal} interne kandidaten gevonden voor ${r.count}x ${r.role}.`);
    log("Supplier Agent", "AI", `Request ${r.role} uitgezet bij ${suppliers.length} leveranciers, deadline 48 uur.`);
    setForm(null); setOpen(r.id);
  };
  const r = msp.requests.find((x) => x.id === open);
  return (<>
    <Head title="Requests" sub="Personeelsaanvragen van de opdrachtgever.">
      {!form && <button className="btn primary" onClick={() => setForm({ role: "NDT Inspector", count: 5, start: "2026-11-02", city: "Rotterdam", duration: "6 maanden", certs: ["UT2", "VCA", "Offshore Medical", "BOSIET"], rateMin: 65, rateMax: 75 })}><Plus size={16} />Nieuwe aanvraag</button>}
    </Head>
    {form && <section className="card stack" style={{ marginBottom: 16 }}>
      <div className="cols even">
        <label className="f">Functie<input className="in" value={form.role} onChange={set("role")} /></label>
        <label className="f">Aantal<input className="in" type="number" min="1" value={form.count} onChange={set("count")} /></label>
        <label className="f">Start<input className="in" type="date" value={form.start} onChange={set("start")} /></label>
        <label className="f">Locatie<select className="in" value={form.city} onChange={set("city")}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Duur<input className="in" value={form.duration} onChange={set("duration")} /></label>
        <div className="row"><label className="f grow">Tarief min<input className="in" type="number" value={form.rateMin} onChange={set("rateMin")} /></label><label className="f grow">max<input className="in" type="number" value={form.rateMax} onChange={set("rateMax")} /></label></div>
      </div>
      <div className="row wrap"><span className="sm muted">Vereist:</span>{CERT_WORDS.map((c) => { const on = form.certs.includes(c); return <button key={c} className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => setForm({ ...form, certs: on ? form.certs.filter((x) => x !== c) : [...form.certs, c] })}>{c}</button>; })}</div>
      <div className="row"><span className="grow" /><button className="btn" onClick={() => setForm(null)}>Annuleer</button><button className="btn primary" disabled={!form.role || form.count < 1} onClick={create}>Aanvraag starten</button></div>
    </section>}
    <div className="cols">
      <section className="card"><table className="t"><thead><tr><th>Aanvraag</th><th>Start</th><th>Tarief</th><th>Ingevuld</th><th>Status</th></tr></thead>
        <tbody>{msp.requests.map((x) => <tr key={x.id} onClick={() => setOpen(x.id)} style={{ cursor: "pointer", background: x.id === open ? "var(--elev)" : undefined }}>
          <td><b>{x.count}x {x.role}</b><br /><span className="sm muted">{x.city} · {x.duration}</span></td><td>{x.start}</td><td>€{x.rateMin}–{x.rateMax}</td>
          <td><div className="bar" style={{ width: 80 }}><i style={{ width: `${(100 * x.filled) / x.count}%` }} /></div><span className="xs muted">{x.filled}/{x.count}</span></td><td><span className="tag">{x.status}</span></td></tr>)}</tbody></table></section>
      {r && <section className="card stack"><h3>{r.count}x {r.role}</h3><div className="row wrap">{r.certs.map((c) => <span className="chip" key={c}>{c}</span>)}</div>
        <h4 className="sec-title">Matching (intern + leveranciers)</h4>
        <div className="list">{workers.map((w) => ({ w, c: compliance(w, r.certs) })).sort((a, b) => b.c.pct - a.c.pct).map(({ w, c }) => (
          <div className="li" key={w.id}><span className="avatar">{initials(w.name)}</span><span className="grow"><b>{w.name}</b><br /><span className="xs muted">{w.supplier} · €{w.rate}/u · {w.site}</span></span>
            <span className={`badge ${c.pct === 100 ? "verified" : c.pct >= 75 ? "expiring" : "missing"}`}>{c.pct}% eisen</span></div>))}
          {(r.submissions || []).map((s, i) => <div className="li" key={i}><span className="avatar">{initials(s.name)}</span><span className="grow"><b>{s.name}</b><br /><span className="xs muted">via {s.supplier} · €{s.rate}/u</span></span><span className="tag ai">Nieuw ingediend</span></div>)}</div>
      </section>}
    </div>
  </>);
}

function Workers() {
  return (<>
    <Head title="Workers" sub="Alle externe medewerkers, ongeacht leverancier." />
    <section className="card"><table className="t"><thead><tr><th>Naam</th><th>Rol</th><th>Leverancier</th><th>Locatie</th><th>Tarief</th><th>Onboarding</th></tr></thead>
      <tbody>{workers.map((w) => { const c = compliance(w, REQUIRED_DOCS); return (
        <tr key={w.id}><td><b>{w.name}</b></td><td>{w.role}</td><td>{w.supplier}</td><td>{w.site}</td><td>€{w.rate}/u</td>
          <td style={{ width: 160 }}><div className={`bar ${c.pct === 100 ? "ok" : c.pct >= 75 ? "warn" : "err"}`}><i style={{ width: `${c.pct}%` }} /></div><span className="xs muted">{c.pct}% complete</span></td></tr>); })}</tbody></table></section>
  </>);
}

function Suppliers({ msp, setMsp, log }) {
  const [portal, setPortal] = useState(false);
  const [sub, setSub] = useState({ req: msp.requests[0]?.id, name: "", rate: 70 });
  const submit = (e) => {
    e.preventDefault();
    const r = msp.requests.find((x) => x.id === sub.req);
    setMsp((m) => ({ ...m, requests: m.requests.map((x) => (x.id === sub.req ? { ...x, submissions: [...(x.submissions || []), { name: sub.name, rate: +sub.rate, supplier: "TechForce" }] } : x)) }));
    log("Supplier Agent", "Regel", `TechForce diende ${sub.name} in voor ${r.role} (€${sub.rate}/u)${+sub.rate > r.rateMax ? " — boven max tarief, gemarkeerd" : ""}.`);
    setSub({ ...sub, name: "" });
  };
  return (<>
    <Head title={portal ? "Workstr Supplier — TechForce" : "Suppliers"} sub={portal ? "Zo ziet een leverancier de portal." : "Opdrachtgever → Workstr MSP → Leveranciers → Professionals"}>
      <button className="btn" onClick={() => setPortal(!portal)}>{portal ? "Terug naar MSP" : "Bekijk als leverancier"}</button>
    </Head>
    {!portal ? (
      <section className="card"><table className="t"><thead><tr><th>Leverancier</th><th>Open requests</th><th>Ingediend</th><th>Gem. reactietijd</th><th>Score</th></tr></thead>
        <tbody>{suppliers.map((s) => <tr key={s.id}><td><b>{s.name}</b></td><td>{s.open}</td><td>{s.submitted}</td>
          <td>{s.avgHours ? `${s.avgHours} u` : "—"} {s.avgHours > 48 && <span className="issue">Supplier Agent volgt op</span>}</td><td>{s.score}</td></tr>)}</tbody></table></section>
    ) : (
      <div className="cols">
        <section className="card"><h3 className="sec-title">Open requests: {msp.requests.length}</h3><div className="list">
          {msp.requests.map((r) => <div className="li" key={r.id}><span className="grow"><b>{r.role}</b><br /><span className="sm muted">{r.count - r.filled} needed · {r.city} · €{r.rateMin}–{r.rateMax}/u · {r.certs.join(", ")}</span></span>
            <button className="btn sm primary" onClick={() => setSub({ ...sub, req: r.id })}>Submit candidate</button></div>)}</div></section>
        <form className="card stack" onSubmit={submit}><h3 className="sec-title">Kandidaat voorstellen — {msp.requests.find((x) => x.id === sub.req)?.role}</h3>
          <label className="f">Naam professional<input className="in" required value={sub.name} onChange={(e) => setSub({ ...sub, name: e.target.value })} /></label>
          <label className="f">Tarief (€/u)<input className="in" type="number" value={sub.rate} onChange={(e) => setSub({ ...sub, rate: e.target.value })} /></label>
          <button className="btn primary">Indienen</button></form>
      </div>
    )}
  </>);
}

function Compliance({ log }) {
  return (<>
    <Head title="Compliance" sub="Vervaldatums zijn regels, geen AI. AI leest alleen documenten uit." />
    <div className="cols even">{workers.map((w) => { const c = compliance(w, REQUIRED_DOCS); return (
      <section className="card stack" key={w.id}><div className="row between"><b>{w.name}</b><span className="sm muted">{c.pct}% complete</span></div>
        <div className={`bar ${c.pct === 100 ? "ok" : c.pct >= 75 ? "warn" : "err"}`}><i style={{ width: `${c.pct}%` }} /></div>
        <ul className="reasons">{c.items.map((i) => (
          <li key={i.name}><span className="grow">{i.name}{i.status === "expiring" && <span className="xs muted"> · verloopt over {i.days} dagen</span>}</span><StatusBadge status={i.status} /></li>))}</ul>
        {c.pct < 100 && <button className="btn sm" onClick={() => log("Compliance Agent", "Regel", `Herinnering naar ${w.name}: ${c.items.filter((i) => i.status !== "verified").map((i) => i.name).join(", ")}.`)}>Herinnering sturen</button>}
      </section>); })}</div>
  </>);
}

function Contracts({ msp, setMsp, log }) {
  return (<>
    <Head title="Contracts" sub="Contract Agent bereidt voor. Jij beslist." />
    <section className="card"><table className="t"><thead><tr><th>Professional</th><th>Opdrachtgever</th><th>Tarief</th><th>Einde</th><th>Signalen</th><th /></tr></thead>
      <tbody>{contracts.map((k) => { const left = daysLeft(k.end); const done = msp.contractDone?.includes(k.id); const flags = [];
        if (k.rate !== k.agreed) flags.push(`Tarief €${k.rate} wijkt af van afspraak €${k.agreed}`);
        if (left <= k.notice + 14) flags.push(`Einde over ${left} d — opzegtermijn ${k.notice} d`);
        return (<tr key={k.id}><td><b>{k.worker}</b></td><td>{k.client}</td><td>€{k.rate}/u</td><td>{new Date(k.end).toLocaleDateString("nl-NL")}</td>
          <td>{flags.map((f) => <span key={f} className="issue">{f}</span>)}{!flags.length && <span className="muted sm">—</span>}</td>
          <td>{flags.length > 0 && (done ? <span className="tag human">Goedgekeurd</span> : <button className="btn sm" onClick={() => { setMsp((m) => ({ ...m, contractDone: [...(m.contractDone || []), k.id] })); log("Contract Agent", "Mens", `Concept voor ${k.worker} goedgekeurd door MSP-beheerder.`); }}>Concept goedkeuren</button>)}</td></tr>);
      })}</tbody></table></section>
  </>);
}

function Timesheets({ msp, setMsp, log }) {
  const rows = sheetRows(msp);
  const act = (r, status) => {
    setMsp((m) => ({ ...m, timesheets: m.timesheets.map((x) => (x.id === r.ts.id ? { ...x, status } : x)) }));
    log(status === "approved" ? "Workflow" : "Finance Agent", status === "approved" ? "Mens" : "AI",
      status === "approved" ? `Timesheet ${r.w.name} goedgekeurd → finance (${eur(r.amount)}).` : `Timesheet ${r.w.name} teruggestuurd met uitleg: ${r.issues.join("; ")}.`);
  };
  const total = rows.filter((r) => r.ts.status === "approved").reduce((n, r) => n + r.amount, 0);
  return (<>
    <Head title="Timesheets" sub="Professional registreert → manager keurt goed → Workstr controleert contracttarief → finance." />
    <div className="kpis"><Kpi label="Ingediend" value={`${rows.filter((r) => r.ts.submitted).length}/${rows.length}`} /><Kpi label="Met afwijking" value={rows.filter((r) => r.issues.length).length} /><Kpi label="Goedgekeurd naar finance" value={eur(total)} /></div>
    <section className="card"><table className="t"><thead><tr><th>Professional</th><th>Week</th><th>Ma–Zo</th><th>Uren</th><th>Bedrag</th><th>Controles</th><th /></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.ts.id}><td><b>{r.w.name}</b><br /><span className="xs muted">contract €{r.w.rate}/u</span></td><td>{r.ts.week}</td><td className="sm muted">{r.ts.days.join(" · ")}</td><td>{r.hours}</td><td>{eur(r.amount)}</td>
          <td>{r.issues.length ? r.issues.map((i) => <span key={i} className="issue">⚠ {i}</span>) : <span style={{ color: "var(--ok)" }} className="sm">✓ Alles klopt</span>}</td>
          <td>{r.ts.status ? <span className={`tag ${r.ts.status === "approved" ? "human" : ""}`}>{r.ts.status === "approved" ? "Goedgekeurd" : "Teruggestuurd"}</span> : (
            <div className="row"><button className="btn sm primary" disabled={!r.ts.submitted} onClick={() => act(r, "approved")}><Check size={14} />Keur goed</button>
              {r.issues.length > 0 && <button className="btn sm" onClick={() => act(r, "returned")}><X size={14} />Terug</button>}</div>)}</td></tr>
      ))}</tbody></table></section>
  </>);
}

function AgentBuilder({ setMsp, log, onDone }) {
  const [f, setF] = useState({ ...agentTemplates[0], tone: "Vriendelijk", approval: true });
  const pick = (tpl) => setF({ ...f, ...tpl });
  const create = () => {
    setMsp((m) => ({ ...m, custom: [{ ...f, id: uid(), runs: 0 }, ...(m.custom || [])] }));
    log(f.agent, "Mens", `Nieuwe agent live: ${f.name} — trigger “${f.trigger}” via ${f.channel}${f.approval ? ", verzenden na goedkeuring" : ""}.`);
    onDone();
  };
  return (
    <section className="card stack" style={{ marginBottom: 16 }}>
      <h3 className="sec-title">Nieuwe agent — kies een template</h3>
      <div className="row wrap">{agentTemplates.map((x) => <button key={x.id} className={`chip ${f.id === x.id ? "on" : ""}`} aria-pressed={f.id === x.id} onClick={() => pick(x)}>{x.name}</button>)}</div>
      <div className="cols even">
        <label className="f">Naam<input className="in" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="f">Trigger<input className="in" value={f.trigger} onChange={(e) => setF({ ...f, trigger: e.target.value })} /></label>
        <label className="f">Kanaal<select className="in" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>{["In-app chat", "E-mail", "WhatsApp", "SMS"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Tone of voice<select className="in" value={f.tone} onChange={(e) => setF({ ...f, tone: e.target.value })}>{["Vriendelijk", "Formeel", "Direct"].map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label className="row sm"><input type="checkbox" checked={f.approval} onChange={(e) => setF({ ...f, approval: e.target.checked })} />Menselijke goedkeuring vóór verzenden</label>
      <div className="row"><span className="grow" /><button className="btn" onClick={onDone}>Annuleer</button><button className="btn primary" disabled={!f.name || !f.trigger} onClick={create}><Lightning size={16} />Zet live</button></div>
    </section>
  );
}

function AgentCenter({ msp, setMsp, log }) {
  const [build, setBuild] = useState(false);
  const decide = (a, ok) => { setMsp((m) => ({ ...m, approvals: m.approvals.filter((x) => x.id !== a.id) })); log(a.agent, "Mens", `${ok ? "Goedgekeurd" : "Afgewezen"}: ${a.text}`); };
  const saved = agents.reduce((n, a) => n + a.saved, 0);
  return (<>
    <Head title="Agent Center" sub={`AI doet voorbereiding en standaardwerk. Deze maand ${saved} uur bespaard. Elke actie gelogd; mens behandelt uitzonderingen.`}>
      {!build && <button className="btn primary" onClick={() => setBuild(true)}><Plus size={16} />Nieuwe agent</button>}
    </Head>
    {build && <AgentBuilder setMsp={setMsp} log={log} onDone={() => setBuild(false)} />}
    <div className="kpis">{agents.map((a) => <div className="kpi" key={a.id}><span className="row sm muted"><Robot size={16} />{a.name}</span><b style={{ fontSize: 18, marginTop: 8 }}>{a.stat}</b><span className="xs muted">{a.sub} · {a.saved} u bespaard</span></div>)}
      {(msp.custom || []).map((a) => <div className="kpi" key={a.id} style={{ borderColor: "var(--primary)" }}><span className="row sm muted"><Sparkle size={16} />{a.name}</span><b style={{ fontSize: 18, marginTop: 8 }}>Live · {a.channel}</b><span className="xs muted">{a.trigger} · {a.tone}{a.approval ? " · met goedkeuring" : ""}</span></div>)}</div>
    <div className="cols">
      <section className="card"><h3 className="sec-title">Actielog</h3><Log rows={msp.log} /></section>
      <section className="card stack"><h3 className="sec-title">Wacht op menselijke goedkeuring</h3>
        {msp.approvals.map((a) => <div key={a.id} className="card stack" style={{ background: "var(--elev)" }}><span className="xs muted">{a.agent}</span><span>{a.text}</span>
          <div className="row"><button className="btn sm primary" onClick={() => decide(a, true)}><Check size={14} />Goedkeuren</button><button className="btn sm" onClick={() => decide(a, false)}><X size={14} />Afwijzen</button></div></div>)}
        {!msp.approvals.length && <p className="muted sm">Alles afgehandeld.</p>}
      </section>
    </div>
  </>);
}
