import React, { useEffect, useRef, useState } from "react";
import {
  Compass, Sparkle, Plus, ChatCircle, User, MapPin, Clock, Briefcase, CurrencyEur, BookmarkSimple, X, Check,
  Warning, ArrowLeft, PaperPlaneRight, Camera, Certificate, GraduationCap, Wrench, FilePdf, Lightning, CaretRight,
  Buildings, ImageSquare, SlidersHorizontal,
} from "@phosphor-icons/react";
import { companies, seedJobs, CITIES } from "./data.js";
import { matchJob, certStatus, structureProject, daysLeft, AVAIL_LABEL, CERT_WORDS } from "./logic.js";
import { Logo, Reasons, StatusBadge, initials } from "./ui.jsx";

const CONTRACT = { freelance: "Freelance", project: "Project", vast: "Vast", parttime: "Parttime", fulltime: "Fulltime" };
const rateText = (j) => (j.unit === "uur" ? `€${j.rateMin}–€${j.rateMax} p/u` : `€${j.rateMin.toLocaleString("nl-NL")}–€${j.rateMax.toLocaleString("nl-NL")} p/m`);
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "");
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toTimeString().slice(0, 5);

// Downscale an uploaded photo so the demo can keep it in localStorage.
async function toDataUrl(file, max = 720) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = Object.assign(document.createElement("canvas"), { width: bmp.width * s, height: bmp.height * s });
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.72);
}

export function profileCompletion(p) {
  const checks = [p.about, p.projects.length, p.experience.length, p.skills.length >= 3, p.certs.length, p.education.length,
    p.availability, p.projects.some((x) => x.photos?.length)];
  return Math.round((100 * checks.filter(Boolean).length) / checks.length);
}

export default function Candidate({ store, update }) {
  const [tab, setTab] = useState("discover");
  const [jobId, setJobId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [create, setCreate] = useState(null);
  const [cv, setCv] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2400); return () => clearTimeout(t); } }, [toast]);

  const p = store.profile;
  const jobs = [...store.jobs, ...seedJobs].map((j) => ({ ...j, m: matchJob(p, j) }));
  const byId = (id) => jobs.find((j) => j.id === id);
  const unread = store.convs.reduce((n, c) => n + (c.unread || 0), 0);

  const interest = (j) => {
    update((s) => {
      if (s.interested.includes(j.id)) return s;
      const conv = { id: uid(), company: j.company, job: j.id, unread: 1, messages: [
        { from: "sys", text: `Interesse gedeeld voor ${j.title}. ${companies[j.company].name} ziet je Work Profile en waarom je matcht.` },
        { from: "them", text: `Hoi ${s.profile.name.split(" ")[0]}, dank voor je interesse! Wanneer kun je kort bellen?`, at: now() },
      ] };
      return { ...s, interested: [...s.interested, j.id], convs: [conv, ...s.convs] };
    });
    setToast(`Interesse verstuurd naar ${companies[j.company].name}`);
    setJobId(null);
  };
  const save = (j) => { update((s) => ({ ...s, saved: s.saved.includes(j.id) ? s.saved.filter((x) => x !== j.id) : [...s.saved, j.id] })); };
  const dismiss = (j) => update((s) => ({ ...s, dismissed: [...s.dismissed, j.id] }));

  if (!store.onboarded) return <Onboarding onDone={() => update((s) => ({ ...s, onboarded: true }))} />;

  const ctx = { store, update, p, jobs, byId, setJobId, setCompanyId, setChatId, setCreate, interest, save, dismiss, setToast, setCv, setPrefs };
  return (
    <div className="app">
      <div className="screen" style={tab === "discover" ? { overflow: "hidden" } : undefined}>
        {tab === "discover" && <Discover {...ctx} />}
        {tab === "matches" && <Matches {...ctx} />}
        {tab === "create" && <CreateHub {...ctx} />}
        {tab === "inbox" && <Inbox {...ctx} />}
        {tab === "profile" && <Profile {...ctx} />}
      </div>
      <nav className="tabs" aria-label="Hoofdmenu">
        {[["discover", "Discover", Compass], ["matches", "Matches", Sparkle], ["create", "Create", Plus], ["inbox", "Inbox", ChatCircle], ["profile", "Profile", User]].map(([id, label, Icon]) => (
          <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
            {id === "create" ? <span className="create"><Icon size={22} weight="bold" /></span> : <Icon size={24} weight={tab === id ? "fill" : "regular"} />}
            {label}
            {id === "inbox" && unread > 0 && <span className="dot" aria-label={`${unread} ongelezen`} />}
          </button>
        ))}
      </nav>
      {jobId && <JobDetail job={byId(jobId)} {...ctx} onClose={() => setJobId(null)} />}
      {companyId && <Company id={companyId} {...ctx} onClose={() => setCompanyId(null)} />}
      {chatId && <Chat id={chatId} {...ctx} onClose={() => setChatId(null)} />}
      {create && <CreateFlow kind={create} {...ctx} onClose={() => setCreate(null)} />}
      {cv && <CvView p={p} onClose={() => setCv(false)} />}
      {prefs && <Availability {...ctx} onClose={() => setPrefs(false)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Onboarding({ onDone }) {
  return (
    <div className="app" style={{ background: "url(./work/w2.jpg) center/cover" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 24, gap: 18, background: "linear-gradient(transparent 20%, var(--bg) 62%)" }}>
        <Logo size={30} />
        <h1 style={{ fontSize: 40 }}>Less searching.<br />More working.</h1>
        <p className="muted">Bouw één levend Work Profile met je projecten, skills en certificaten. Werk komt naar jou toe — en je ziet altijd waarom het past.</p>
        <button className="btn primary block" onClick={onDone}>Start met je Work Profile</button>
        <button className="btn ghost block" onClick={onDone}>Ik heb al een account</button>
      </div>
    </div>
  );
}

function JobCard({ j, setJobId, interest, save, dismiss, store }) {
  const c = companies[j.company];
  const saved = store.saved.includes(j.id);
  const sent = store.interested.includes(j.id);
  return (
    <article className="job" aria-label={`${j.title} bij ${c.name}`}>
      <img src={j.photo} alt="" />
      <div className="job-body">
        <div className="row between">
          <span className="sm" style={{ fontWeight: 600 }}>{c.name}</span>
          <span className="match">{j.m.score}% match</span>
        </div>
        <h2>{j.title}</h2>
        <div className="facts">
          <span><MapPin size={16} />{j.city}</span>
          <span><CurrencyEur size={16} />{rateText(j)}</span>
          <span><Briefcase size={16} />{CONTRACT[j.contract]}</span>
          <span><Clock size={16} />Start {fmtDate(j.start)}</span>
        </div>
        <div className="row wrap">{j.certs.map((x) => <span key={x} className="chip">{x}</span>)}</div>
        <div className="job-actions">
          <button className="icon-btn" aria-label="Niet interessant" onClick={() => dismiss(j)}><X size={20} /></button>
          <button className="icon-btn" aria-label={saved ? "Niet meer bewaren" : "Bewaar"} aria-pressed={saved} onClick={() => save(j)}>
            <BookmarkSimple size={20} weight={saved ? "fill" : "regular"} />
          </button>
          <button className="btn" onClick={() => setJobId(j.id)}>Bekijk functie</button>
          <button className="btn primary" disabled={sent} onClick={() => interest(j)}>{sent ? "Verstuurd" : "Interesse"}</button>
        </div>
      </div>
    </article>
  );
}

function Discover(ctx) {
  const [f, setF] = useState("all");
  const list = ctx.jobs.filter((j) => !ctx.store.dismissed.includes(j.id) && (f === "all" || j.contract === f)).sort((a, b) => b.m.score - a.m.score);
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div className="feed-top">
        <div className="filters" role="group" aria-label="Contractvorm">
          {[["all", "Alles"], ["freelance", "Freelance"], ["project", "Project"], ["vast", "Vast"]].map(([id, l]) => (
            <button key={id} className={`chip ${f === id ? "on" : ""}`} aria-pressed={f === id} onClick={() => setF(id)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="feed">
        {list.map((j) => <JobCard key={j.id} j={j} {...ctx} />)}
        {!list.length && (
          <div className="empty">
            <h2>Je bent bij.</h2>
            <p className="muted">Geen eindeloze feed: Workstr laat alleen zien wat relevant is. Nieuwe kansen komen in je Weekly Opportunities.</p>
            <button className="btn" onClick={() => ctx.update((s) => ({ ...s, dismissed: [] }))}>Toon overgeslagen vacatures</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Back({ onClose, label = "Terug" }) {
  return <button className="icon-btn" aria-label={label} onClick={onClose}><ArrowLeft size={20} /></button>;
}

function JobDetail({ job: j, onClose, interest, save, store, setCompanyId, p }) {
  const c = companies[j.company];
  const sent = store.interested.includes(j.id);
  return (
    <div className="overlay" role="dialog" aria-label={j.title}>
      <div className="screen">
        <div className="hero"><img src={j.photo} alt={`Werkplek ${c.name}`} /><Back onClose={onClose} /></div>
        <div className="pad stack" style={{ marginTop: -40, position: "relative" }}>
          <button className="row" style={{ background: "none", border: 0, padding: 0 }} onClick={() => setCompanyId(j.company)}>
            <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(c.name)}</span>
            <span style={{ fontWeight: 600 }}>{c.name}</span><CaretRight size={14} className="muted" />
          </button>
          <div className="row between"><h1 style={{ fontSize: 28 }}>{j.title}</h1><span className="match">{j.m.score}%</span></div>
          <div className="factgrid">
            <div><span className="xs muted">Locatie</span><b>{j.city}</b></div>
            <div><span className="xs muted">{j.unit === "uur" ? "Tarief" : "Salaris"}</span><b>{rateText(j)}</b></div>
            <div><span className="xs muted">Contract</span><b>{CONTRACT[j.contract]}</b></div>
            <div><span className="xs muted">Duur · start</span><b>{j.duration} · {fmtDate(j.start)}</b></div>
          </div>
          <section className="card">
            <h3 className="sec-title">Waarom dit bij jou past</h3>
            <Reasons reasons={j.m.reasons} />
          </section>
          <section>
            <h3 className="sec-title">Wat je gaat doen</h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>{j.tasks.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
          <section>
            <h3 className="sec-title">Certificaten</h3>
            <div className="list">
              {j.certs.map((name) => (
                <div className="li" key={name}><Certificate size={20} /><span className="grow">{name}</span>
                  <StatusBadge status={certStatus(p.certs.find((x) => x.name === name))} /></div>
              ))}
            </div>
          </section>
          <section><h3 className="sec-title">Team</h3><p>{j.team}</p></section>
          <section><h3 className="sec-title">Skills</h3><div className="row wrap">{j.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div></section>
        </div>
      </div>
      <div className="sticky-cta">
        <button className="icon-btn" aria-label="Bewaar" aria-pressed={store.saved.includes(j.id)} onClick={() => save(j)}>
          <BookmarkSimple size={20} weight={store.saved.includes(j.id) ? "fill" : "regular"} />
        </button>
        <button className="btn primary grow" disabled={sent} onClick={() => interest(j)}>{sent ? "Interesse verstuurd" : "Interesse tonen"}</button>
      </div>
    </div>
  );
}

function Company({ id, onClose, jobs, setJobId }) {
  const c = companies[id];
  const [t, setT] = useState("about");
  const tabs = [["about", "About"], ["jobs", "Jobs"], ["projects", "Projects"], ["people", "People"], ["workplace", "Workplace"], ["media", "Media"]];
  const own = jobs.filter((j) => j.company === id);
  return (
    <div className="overlay" role="dialog" aria-label={c.name}>
      <div className="screen">
        <div className="hero" style={{ height: 200 }}><img src={c.media[0]} alt="" /><Back onClose={onClose} /></div>
        <div className="pad" style={{ paddingBottom: 8 }}>
          <h1 style={{ fontSize: 28 }}>{c.name}</h1>
          <p className="muted sm">{c.industry} · {c.city}</p>
        </div>
        <div className="tabbar-inline" role="tablist">
          {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}>{l}</button>)}
        </div>
        <div className="pad stack">
          {t === "about" && <p>{c.about}</p>}
          {t === "jobs" && <div className="list">{own.map((j) => (
            <button className="li" key={j.id} onClick={() => setJobId(j.id)}><img className="thumb" src={j.photo} alt="" />
              <span className="grow"><b>{j.title}</b><br /><span className="sm muted">{j.city} · {rateText(j)}</span></span><span className="match">{j.m.score}%</span></button>
          ))}</div>}
          {t === "projects" && <div className="portfolio">{c.media.map((m, i) => <figure key={m}><img src={m} alt="" /><figcaption>{["Jacket fabricage", "Offshore installatie", "Shutdown 2025"][i] || "Project"}</figcaption></figure>)}</div>}
          {t === "people" && <div className="list">{c.people.map((x) => <div className="li" key={x.n}><span className="avatar">{initials(x.n)}</span><span><b>{x.n}</b><br /><span className="sm muted">{x.r}</span></span></div>)}</div>}
          {t === "workplace" && <ul className="reasons">{c.workplace.map((w) => <li key={w}><Buildings size={18} className="muted" />{w}</li>)}</ul>}
          {t === "media" && <div className="portfolio">{c.media.map((m) => <figure key={m}><img src={m} alt={`Beeld van ${c.name}`} /></figure>)}</div>}
        </div>
      </div>
    </div>
  );
}

function Matches({ jobs, store, setJobId }) {
  const open = jobs.filter((j) => !store.dismissed.includes(j.id) && !store.interested.includes(j.id)).sort((a, b) => b.m.score - a.m.score);
  const weekly = open.slice(0, 3);
  const Row = ({ j, right }) => (
    <button className="li" onClick={() => setJobId(j.id)}>
      <img className="thumb" src={j.photo} alt="" />
      <span className="grow"><b>{j.title}</b><br /><span className="sm muted">{companies[j.company].name} · {j.city}</span></span>
      {right ?? <span className="match">{j.m.score}%</span>}
    </button>
  );
  return (
    <div className="pad stack">
      <div className="top" style={{ padding: 0 }}><h1 style={{ fontSize: 28 }}>Matches</h1></div>
      <section className="card stack" style={{ background: "var(--elev)" }}>
        <div><p className="sec-title" style={{ color: "var(--lav)" }}>Your Weekly Opportunities</p>
          <h2>{weekly.length} nieuwe matches voor jou</h2>
          <p className="sm muted">Elke maandag een selectie. Geen eindeloos scrollen — alleen wat echt past.</p></div>
        {weekly.map((j) => (
          <button key={j.id} className="card" style={{ textAlign: "left", display: "grid", gap: 8, background: "var(--surface)" }} onClick={() => setJobId(j.id)}>
            <div className="row between"><b>{j.title}</b><span className="match">{j.m.score}%</span></div>
            <span className="sm muted">{companies[j.company].name} · {j.city} · {rateText(j)}</span>
            <span className="sm" style={{ color: j.m.reasons[0]?.type === "ok" ? "var(--ok)" : "var(--warn)" }}>✓ {j.m.reasons.filter((r) => r.type === "ok").slice(0, 2).map((r) => r.text).join(" · ")}</span>
          </button>
        ))}
      </section>
      <section><h3 className="sec-title">Interesse verstuurd</h3>
        <div className="list">{store.interested.map((id) => jobs.find((j) => j.id === id)).filter(Boolean).map((j) => <Row key={j.id} j={j} right={<span className="chip">In gesprek</span>} />)}
          {!store.interested.length && <p className="sm muted">Nog niets — tik op Interesse bij een vacature.</p>}</div></section>
      <section><h3 className="sec-title">Bewaard</h3>
        <div className="list">{store.saved.map((id) => jobs.find((j) => j.id === id)).filter(Boolean).map((j) => <Row key={j.id} j={j} />)}
          {!store.saved.length && <p className="sm muted">Bewaarde vacatures verschijnen hier.</p>}</div></section>
    </div>
  );
}

function CreateHub({ setCreate }) {
  const items = [["project", "Project toevoegen", "Foto's + korte tekst. AI structureert, jij keurt goed.", Camera, true],
    ["experience", "Werkervaring", "", Briefcase], ["cert", "Certificaat", "", Certificate], ["education", "Opleiding", "", GraduationCap],
    ["skill", "Skill", "", Wrench], ["photo", "Foto toevoegen", "", ImageSquare]];
  return (
    <div className="pad stack">
      <h1 style={{ fontSize: 28 }}>Create</h1>
      <p className="muted">Laat zien wat je hebt gedaan. Je Work Profile groeit mee met elk project.</p>
      <div className="create-grid">
        {items.map(([k, title, sub, Icon, wide]) => (
          <button key={k} className={wide ? "wide" : ""} onClick={() => setCreate(k === "photo" ? "project" : k)}>
            <Icon size={26} color={wide ? "var(--primary)" : undefined} />
            <span><b>{title}</b>{sub && <><br /><span className="sm muted">{sub}</span></>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SkillPicker({ value, onChange }) {
  const [v, setV] = useState("");
  const add = () => { const s = v.trim(); if (s && !value.includes(s)) onChange([...value, s]); setV(""); };
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row wrap">{value.map((s) => <button type="button" key={s} className="chip x" aria-label={`Verwijder ${s}`} onClick={() => onChange(value.filter((x) => x !== s))}>{s}</button>)}</div>
      <div className="row"><input className="in" value={v} placeholder="Skill toevoegen" aria-label="Skill toevoegen" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <button type="button" className="btn" onClick={add}>Voeg toe</button></div>
    </div>
  );
}

function CreateFlow({ kind, onClose, update, setToast, p }) {
  const [step, setStep] = useState("write");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [f, setF] = useState({});
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const titles = { project: "Project toevoegen", experience: "Werkervaring", cert: "Certificaat", education: "Opleiding", skill: "Skill" };
  const done = (msg, fn) => { update((s) => ({ ...s, profile: fn(s.profile) })); setToast(msg); onClose(); };

  const onPhotos = async (e) => {
    const files = [...e.target.files].filter((x) => x.type.startsWith("image/")).slice(0, 4);
    setPhotos([...photos, ...(await Promise.all(files.map((x) => toDataUrl(x))))].slice(0, 4));
  };

  let body;
  if (kind === "project" && step === "write") {
    body = (<>
      <label className="f">Wat heb je gedaan?<textarea className="in" value={text} onChange={(e) => setText(e.target.value)} placeholder="Bijv. UT inspecties uitgevoerd aan offshore jacket." /></label>
      <label className="btn" style={{ justifySelf: "start" }}><Camera size={18} />Foto's kiezen<input type="file" accept="image/*" multiple className="sr" onChange={onPhotos} /></label>
      {!!photos.length && <div className="portfolio">{photos.map((src, i) => <figure key={i}><img src={src} alt={`Upload ${i + 1}`} /></figure>)}</div>}
      <button className="btn primary block" disabled={text.trim().length < 8} onClick={() => { setF({ ...structureProject(text), text, from: "", to: "" }); setStep("review"); }}>
        <Lightning size={18} />Structureer met AI</button>
    </>);
  } else if (kind === "project") {
    body = (<>
      <div className="ai-note"><Sparkle size={18} />AI-voorstel op basis van jouw tekst. Controleer alles — Workstr voegt nooit ervaring toe die jij niet beschreef.</div>
      <label className="f">Project<input className="in" value={f.title} onChange={set("title")} /></label>
      <label className="f">Werkzaamheden<textarea className="in" value={f.text} onChange={set("text")} /></label>
      <label className="f">Sector<input className="in" value={f.sector} onChange={set("sector")} /></label>
      <div className="row"><label className="f grow">Van<input className="in" type="month" value={f.from} onChange={set("from")} /></label>
        <label className="f grow">Tot<input className="in" type="month" value={f.to} onChange={set("to")} /></label></div>
      <div className="f"><span>Skills</span><SkillPicker value={f.skills} onChange={set("skills")} /></div>
      <button className="btn primary block" disabled={!f.title} onClick={() => done("Project toegevoegd aan je profiel", (p) => ({
        ...p, projects: [{ id: uid(), ...f, photos }, ...p.projects], skills: [...new Set([...p.skills, ...f.skills])] }))}>
        <Check size={18} />Goedkeuren en toevoegen</button>
    </>);
  } else if (kind === "cert") {
    body = (<>
      <label className="f">Certificaat<input className="in" list="certs" value={f.name || ""} onChange={set("name")} /><datalist id="certs">{CERT_WORDS.map((c) => <option key={c} value={c} />)}</datalist></label>
      <label className="f">Certificaatnummer<input className="in" value={f.number || ""} onChange={set("number")} /></label>
      <label className="f">Uitgever<input className="in" value={f.issuer || ""} onChange={set("issuer")} /></label>
      <label className="f">Geldig tot<input className="in" type="date" value={f.validUntil || ""} onChange={set("validUntil")} /></label>
      <label className="btn" style={{ justifySelf: "start" }}><Camera size={18} />{f.file ? "Upload toegevoegd ✓" : "Upload foto/scan"}<input type="file" accept="image/*,application/pdf" className="sr" onChange={(e) => setF((x) => ({ ...x, file: e.target.files[0]?.name }))} /></label>
      <p className="xs muted">Een upload is nog niet officieel geverifieerd. Status wordt eerst “Uploaded”.</p>
      <button className="btn primary block" disabled={!f.name || !f.validUntil} onClick={() => done("Certificaat toegevoegd", (p) => ({
        ...p, certs: [...p.certs.filter((c) => c.name !== f.name), { id: uid(), ...f, verified: false }] }))}>Toevoegen</button>
    </>);
  } else if (kind === "experience") {
    body = (<>
      <label className="f">Functie<input className="in" value={f.role || ""} onChange={set("role")} /></label>
      <label className="f">Bedrijf<input className="in" value={f.company || ""} onChange={set("company")} /></label>
      <div className="row"><label className="f grow">Van<input className="in" type="month" value={f.from || ""} onChange={set("from")} /></label>
        <label className="f grow">Tot (leeg = nu)<input className="in" type="month" value={f.to || ""} onChange={set("to")} /></label></div>
      <label className="f">Wat deed je?<textarea className="in" value={f.text || ""} onChange={set("text")} /></label>
      <button className="btn primary block" disabled={!f.role || !f.company} onClick={() => done("Werkervaring toegevoegd", (p) => ({ ...p, experience: [{ id: uid(), ...f }, ...p.experience] }))}>Toevoegen</button>
    </>);
  } else if (kind === "education") {
    body = (<>
      <label className="f">Opleiding<input className="in" value={f.name || ""} onChange={set("name")} /></label>
      <label className="f">School<input className="in" value={f.school || ""} onChange={set("school")} /></label>
      <label className="f">Jaar<input className="in" inputMode="numeric" value={f.year || ""} onChange={set("year")} /></label>
      <button className="btn primary block" disabled={!f.name} onClick={() => done("Opleiding toegevoegd", (p) => ({ ...p, education: [...p.education, { id: uid(), ...f }] }))}>Toevoegen</button>
    </>);
  } else {
    body = (<SkillsEdit initial={p.skills} onSave={(skills) => done("Skills bijgewerkt", (p) => ({ ...p, skills }))} />);
  }
  return (
    <div className="overlay" role="dialog" aria-label={titles[kind]}>
      <div className="top"><Back onClose={onClose} label="Sluiten" /><b>{titles[kind]}</b><span style={{ width: 44 }} /></div>
      <div className="screen"><div className="pad stack">{body}</div></div>
    </div>
  );
}

function SkillsEdit({ initial, onSave }) {
  const [skills, setSkills] = useState(initial);
  return (<><SkillPicker value={skills} onChange={setSkills} /><button className="btn primary block" onClick={() => onSave(skills)}>Opslaan</button></>);
}

function Inbox({ store, setChatId }) {
  return (
    <div className="pad stack">
      <h1 style={{ fontSize: 28 }}>Inbox</h1>
      <div className="list">
        {store.convs.map((c) => {
          const last = [...c.messages].reverse().find((m) => m.from !== "sys");
          return (
            <button key={c.id} className="li" onClick={() => setChatId(c.id)}>
              <span className="avatar">{initials(companies[c.company].name)}</span>
              <span className="grow"><b>{companies[c.company].name}</b><br />
                <span className="sm muted" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last?.text}</span></span>
              {c.unread > 0 && <span className="match" style={{ padding: "2px 8px" }}>{c.unread}</span>}
            </button>
          );
        })}
        {!store.convs.length && <p className="muted">Nog geen gesprekken.</p>}
      </div>
    </div>
  );
}

function suggestions(conv, p) {
  const last = [...conv.messages].reverse().find((m) => m.from === "them")?.text.toLowerCase() || "";
  const out = [];
  if (/kennis|bellen|gesprek/.test(last)) out.push("Dat klinkt goed. Kun je meer informatie sturen over de projectduur en het tarief?");
  out.push(`Ik ben ${AVAIL_LABEL[p.availability].toLowerCase()} beschikbaar. Wanneer schikt het jullie?`);
  out.push("Kun je iets meer vertellen over het team en de rotatie?");
  return out;
}

function Chat({ id, onClose, store, update, p }) {
  const conv = store.convs.find((c) => c.id === id);
  const [text, setText] = useState("");
  const end = useRef(null);
  useEffect(() => { update((s) => ({ ...s, convs: s.convs.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) })); }, [id]); // eslint-disable-line
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [conv.messages.length]);
  const send = () => {
    const t = text.trim(); if (!t) return;
    const push = (m) => update((s) => ({ ...s, convs: s.convs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, m] } : c)) }));
    push({ from: "me", text: t, at: now() }); setText("");
    setTimeout(() => push({ from: "them", text: "Top, dank je! Ik stuur je vandaag een uitnodiging voor een kort videogesprek.", at: now() }), 1400);
  };
  const c = companies[conv.company];
  return (
    <div className="overlay" role="dialog" aria-label={`Chat met ${c.name}`}>
      <div className="top" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        <Back onClose={onClose} /><span className="row"><span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(c.name)}</span><b>{c.name}</b></span><span style={{ width: 44 }} />
      </div>
      <div className="msgs">
        {conv.messages.map((m, i) => m.from === "sys"
          ? <p key={i} className="xs muted" style={{ textAlign: "center", padding: "4px 24px" }}>{m.text}</p>
          : <div key={i} className={`msg ${m.from}`}>{m.text}</div>)}
        <div ref={end} />
      </div>
      <div className="suggest" aria-label="AI-suggesties">
        {suggestions(conv, p).map((s) => <button key={s} className="chip" onClick={() => setText(s)}><Sparkle size={12} />{s}</button>)}
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input className="in" value={text} onChange={(e) => setText(e.target.value)} placeholder="Bericht" aria-label="Bericht" />
        <button className="icon-btn" style={{ background: "var(--primary)", borderColor: "var(--primary)" }} aria-label="Verstuur"><PaperPlaneRight size={18} weight="fill" /></button>
      </form>
    </div>
  );
}

function Profile({ p, setCreate, setCv, setPrefs, update }) {
  const pct = profileCompletion(p);
  return (
    <div className="pad stack" style={{ gap: 20 }}>
      <div className="row between"><Logo /><a className="chip" href="#/business">Voor bedrijven</a></div>
      <div className="row" style={{ gap: 14 }}>
        <span className="avatar lg">{initials(p.name)}</span>
        <div className="grow"><h1 style={{ fontSize: 24 }}>{p.name}</h1><p className="muted sm">{p.headline}</p><p className="muted sm"><MapPin size={13} /> {p.city}</p></div>
      </div>
      <button className="card row" style={{ textAlign: "left" }} onClick={() => setPrefs(true)}>
        <span className="grow"><span className="xs muted">Beschikbaarheid</span><br /><b style={{ color: p.availability === "no" ? "var(--muted)" : "var(--ok)" }}>● {AVAIL_LABEL[p.availability]}{p.availability === "date" && p.availableFrom ? ` ${fmtDate(p.availableFrom)}` : ""}</b>
          <span className="sm muted"> · {p.radiusKm} km · min €{p.minRate}/u</span></span>
        <SlidersHorizontal size={20} />
      </button>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row between sm"><span>Work Profile {pct}% compleet</span><span className="muted">Workstr Passport</span></div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <button className="btn primary block" onClick={() => setCv(true)}><FilePdf size={18} />Generate CV</button>
      <p>{p.about}</p>

      <section><div className="row between"><h3 className="sec-title">Projecten</h3><button className="btn sm ghost" onClick={() => setCreate("project")}><Plus size={14} />Project</button></div>
        <div className="portfolio">{p.projects.map((x) => (
          <figure key={x.id}>{x.photos?.[0] ? <img src={x.photos[0]} alt="" /> : <div style={{ aspectRatio: "4/3", display: "grid", placeItems: "center" }} className="muted"><Camera size={24} /></div>}
            <figcaption>{x.title}<br /><span className="xs muted">{x.sector}{x.from ? ` · ${x.from.slice(0, 4)}` : ""}</span></figcaption></figure>
        ))}</div></section>

      <section><div className="row between"><h3 className="sec-title">Certificaten</h3><button className="btn sm ghost" onClick={() => setCreate("cert")}><Plus size={14} />Certificaat</button></div>
        <div className="list">{p.certs.map((c) => {
          const st = certStatus(c), left = daysLeft(c.validUntil);
          return (<div className="li" key={c.id}><Certificate size={22} /><span className="grow"><b>{c.name}</b><br />
            <span className="xs muted">{c.issuer}{c.number ? ` · ${c.number}` : ""} · {left < 0 ? "verlopen" : `nog ${left} dagen`}</span></span><StatusBadge status={st} /></div>);
        })}</div></section>

      <section><div className="row between"><h3 className="sec-title">Werkervaring</h3><button className="btn sm ghost" onClick={() => setCreate("experience")}><Plus size={14} />Ervaring</button></div>
        <div className="list">{p.experience.map((e) => <div className="li" key={e.id}><Briefcase size={22} /><span className="grow"><b>{e.role}</b> · {e.company}<br /><span className="xs muted">{e.from} – {e.to || "nu"}</span></span></div>)}</div></section>

      <section><div className="row between"><h3 className="sec-title">Skills</h3><button className="btn sm ghost" onClick={() => setCreate("skill")}>Bewerk</button></div>
        <div className="row wrap">{p.skills.map((s) => <span className="chip" key={s}>{s}</span>)}</div></section>

      <section><div className="row between"><h3 className="sec-title">Opleiding</h3><button className="btn sm ghost" onClick={() => setCreate("education")}><Plus size={14} />Opleiding</button></div>
        {p.education.map((o) => <p key={o.id}><b>{o.name}</b> <span className="muted sm">· {o.school} · {o.year}</span></p>)}</section>

      <button className="btn ghost sm" style={{ justifySelf: "center" }} onClick={() => { localStorage.removeItem("workstr.v2"); location.reload(); }}>Demo resetten</button>
    </div>
  );
}

function Availability({ p, update, onClose }) {
  const set = (k, v) => update((s) => ({ ...s, profile: { ...s.profile, [k]: v } }));
  return (
    <div className="overlay" role="dialog" aria-label="Beschikbaarheid">
      <div className="top"><Back onClose={onClose} label="Sluiten" /><b>Beschikbaarheid & voorkeuren</b><span style={{ width: 44 }} /></div>
      <div className="screen"><div className="pad stack">
        <div className="f"><span className="sm muted">Beschikbaar</span>
          <div className="row wrap">{Object.entries(AVAIL_LABEL).map(([k, l]) => <button key={k} className={`chip ${p.availability === k ? "on" : ""}`} aria-pressed={p.availability === k} onClick={() => set("availability", k)}>{l}</button>)}</div></div>
        {p.availability === "date" && <label className="f">Vanaf<input className="in" type="date" value={p.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} /></label>}
        <label className="f">Woonplaats<select className="in" value={p.city} onChange={(e) => set("city", e.target.value)}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Reisafstand: {p.radiusKm} km<input type="range" min="10" max="300" step="10" value={p.radiusKm} onChange={(e) => set("radiusKm", +e.target.value)} /></label>
        <label className="f">Minimum uurtarief (€)<input className="in" type="number" min="0" value={p.minRate} onChange={(e) => set("minRate", +e.target.value)} /></label>
        <div className="f"><span className="sm muted">Contractvorm</span>
          <div className="row wrap">{Object.entries(CONTRACT).map(([k, l]) => {
            const on = p.contracts.includes(k);
            return <button key={k} className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => set("contracts", on ? p.contracts.filter((x) => x !== k) : [...p.contracts, k])}>{l}</button>;
          })}</div></div>
        <div className="ai-note"><Sparkle size={18} />Je matches worden direct herberekend met deze voorkeuren.</div>
        <button className="btn primary block" onClick={onClose}>Klaar</button>
      </div></div>
    </div>
  );
}

function CvView({ p, onClose }) {
  const valid = p.certs.filter((c) => certStatus(c) !== "expired");
  return (
    <div className="overlay" role="dialog" aria-label="CV">
      <div className="top"><Back onClose={onClose} label="Sluiten" /><b>Je CV</b><button className="btn primary sm" onClick={() => window.print()}><FilePdf size={16} />PDF</button></div>
      <div className="cv-wrap">
        <article className="cv">
          <h1>{p.name}</h1>
          <p className="muted">{p.headline} · {p.city} · {AVAIL_LABEL[p.availability]}</p>
          <p style={{ marginTop: 10 }}>{p.about}</p>
          <h2>Werkervaring</h2>
          {p.experience.map((e) => <p key={e.id} style={{ marginBottom: 8 }}><b>{e.role}</b> — {e.company} <span className="muted">({e.from} – {e.to || "heden"})</span><br />{e.text}</p>)}
          <h2>Projecten</h2>
          {p.projects.map((x) => <p key={x.id} style={{ marginBottom: 8 }}><b>{x.title}</b> <span className="muted">{x.sector}{x.from ? ` · ${x.from} – ${x.to || "heden"}` : ""}</span><br />{x.text}<br /><span className="muted">{x.skills.join(" · ")}</span></p>)}
          <h2>Certificaten</h2>
          {valid.map((c) => <p key={c.id}><b>{c.name}</b> — {c.issuer}, geldig tot {new Date(c.validUntil).toLocaleDateString("nl-NL")}{c.verified ? " (geverifieerd)" : ""}</p>)}
          <h2>Skills</h2><p>{p.skills.join(" · ")}</p>
          <h2>Opleiding</h2>{p.education.map((o) => <p key={o.id}>{o.name} — {o.school} ({o.year})</p>)}
          <p className="muted" style={{ marginTop: 24, fontSize: 11 }}>Gegenereerd met workstr. — Work Profile</p>
        </article>
      </div>
    </div>
  );
}
