import React, { useEffect, useRef, useState } from "react";
import {
  Sparkle, Plus, ChatCircle, User, MapPin, Briefcase, CurrencyEur, X, Check,
  Warning, ArrowLeft, PaperPlaneRight, Camera, Certificate, GraduationCap, Wrench, FilePdf, Lightning, CaretRight,
  Buildings, ImageSquare, SlidersHorizontal, Heart, BookmarkSimple, Eye, EyeSlash, ArrowRight, House, CaretUp, PaperPlaneTilt,
} from "@phosphor-icons/react";
import { showInterest, sendMessage, markRead, decline, isMatch, findInterest } from "./loop.js";
import { companies, seedJobs, CITIES } from "./data.js";
import { matchJob, certStatus, structureProject, daysLeft, AVAIL_LABEL, CERT_WORDS, profileChecklist, completion } from "./logic.js";
import { Logo, Reasons, StatusBadge, initials, Media } from "./ui.jsx";

const CONTRACT = { freelance: "Freelance", project: "Project", vast: "Vast", parttime: "Parttime", fulltime: "Fulltime" };
const rateText = (j) => (j.unit === "uur" ? `€${j.rateMin}–€${j.rateMax} p/u` : `€${j.rateMin.toLocaleString("nl-NL")}–€${j.rateMax.toLocaleString("nl-NL")} p/m`);
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "");
const uid = () => crypto.randomUUID();
const now = () => new Date().toTimeString().slice(0, 5);

// Downscale an uploaded photo so the demo can keep it in localStorage.
async function toDataUrl(file, max = 720) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = Object.assign(document.createElement("canvas"), { width: bmp.width * s, height: bmp.height * s });
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.72);
}

export const Checklist = ({ items }) => (
  <ul className="checklist">{items.map((i) => <li key={i.label} className={i.done ? "" : "todo"}>
    {i.done ? <Check size={18} weight="bold" className="ok" /> : <span className="todo-dot" aria-hidden />}{i.label}<span className="sr">{i.done ? " (klaar)" : " (nog te doen)"}</span></li>)}</ul>
);
export const Ring = ({ pct, label = "compleet" }) => <div className="ring" style={{ "--p": pct }} role="img" aria-label={`${pct}% ${label}`}><b>{pct}%</b></div>;

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
  const mine = (store.interests || []).filter((i) => i.person === "me" && byId(i.job));
  const unread = mine.reduce((n, i) => n + (i.unreadCand || 0), 0) + mine.filter((i) => i.co && !i.cand && i.declined !== "cand").length;
  const fresh = mine.find((i) => isMatch(i) && !i.seenCand);

  const interest = (j, note = "") => {
    const wasWanted = findInterest(store, j.id, "me")?.co;
    update((s) => {
      const t = showInterest(s, j.id, "me", "cand");
      return note.trim() ? { ...t, interests: t.interests.map((i) => (i.job === j.id && i.person === "me" ? { ...i, note: note.trim() } : i)) } : t;
    });
    if (!wasWanted) setToast(`Sollicitatie verstuurd — ${companies[j.company].name} ziet nu je Work Profile`);
    setJobId(null);
  };
  const like = (j) => update((s) => ({ ...s, liked: (s.liked || []).includes(j.id) ? s.liked.filter((x) => x !== j.id) : [...(s.liked || []), j.id] }));
  const save = (j) => { update((s) => ({ ...s, saved: s.saved.includes(j.id) ? s.saved.filter((x) => x !== j.id) : [...s.saved, j.id] })); };
  const dismiss = (j) => update((s) => ({ ...s, dismissed: [...s.dismissed, j.id] }));
  useEffect(() => {
    const on = (e) => setCreate(e.detail);
    document.addEventListener("workstr:create", on);
    return () => document.removeEventListener("workstr:create", on);
  }, []);
  const openChat = (id) => { update((s) => markRead(s, id, "cand")); setChatId(id); setTab("inbox"); };

  if (!store.onboarded) return <Onboarding store={store} update={update} />;

  const ctx = { store, update, p, jobs, byId, mine, setJobId, setCompanyId, setChatId, openChat, setCreate, interest, save, like, dismiss, setToast, setCv, setPrefs, setTab };
  return (
    <div className="app">
      <div className={`screen ${tab === "discover" ? "full" : ""}`}>
        {tab === "discover" && <Discover {...ctx} />}
        {tab === "matches" && <Matches {...ctx} />}
        {tab === "create" && <CreateHub {...ctx} />}
        {tab === "inbox" && <Inbox {...ctx} />}
        {tab === "profile" && <Profile {...ctx} />}
      </div>
      <nav className="tabs" aria-label="Hoofdmenu">
        {[["discover", "Discover", House], ["matches", "Matches", Sparkle], ["create", "Create", Plus], ["inbox", "Inbox", ChatCircle], ["profile", "Profile", User]].map(([id, label, Icon]) => (
          <button key={id} aria-label={label} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
            <Icon size={22} weight={tab === id ? "fill" : "regular"} /><span className="lbl">{label}</span>
            {id === "matches" && unread > 0 && <span className="dot" />}
          </button>
        ))}
      </nav>
      {jobId && <JobDetail job={byId(jobId)} {...ctx} onClose={() => setJobId(null)} />}
      {companyId && <Company id={companyId} {...ctx} onClose={() => setCompanyId(null)} />}
      {chatId && <Chat id={chatId} {...ctx} onClose={() => setChatId(null)} />}
      {create && <CreateFlow kind={create} {...ctx} onClose={() => setCreate(null)} />}
      {cv && <CvView p={p} onClose={() => setCv(false)} />}
      {prefs && <Availability {...ctx} onClose={() => setPrefs(false)} />}
      {fresh && !chatId && <MatchModal i={fresh} job={byId(fresh.job)} p={p} onChat={() => openChat(fresh.id)} onLater={() => update((s) => markRead(s, fresh.id, "cand"))} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Avatar({ p, lg }) {
  return p.photo ? <img className={`avatar ${lg ? "lg" : ""}`} src={p.photo} alt="" style={{ objectFit: "cover", padding: 0 }} />
    : <span className={`avatar ${lg ? "lg" : ""}`}>{initials(p.name || "") || <Camera size={lg ? 26 : 18} />}</span>;
}

function MatchModal({ i, job, p, onChat, onLater }) {
  const c = companies[job.company];
  return (
    <div className="overlay match-modal" role="dialog" aria-label="It's a match">
      <div className="stack" style={{ margin: "auto", padding: 28, textAlign: "center", justifyItems: "center", maxWidth: 420 }}>
        <div className="row" style={{ gap: 0 }}><Avatar p={p} lg /><span className="avatar lg" style={{ marginLeft: -14, background: "var(--elev)", color: "var(--text)", border: "3px solid var(--bg)" }}>{initials(c.name)}</span></div>
        <h1 style={{ fontSize: 40 }}>It's a match</h1>
        <p className="muted">Jij en {c.name} willen allebei praten over <b style={{ color: "#fff" }}>{job.title}</b>. Geen motivatiebrief nodig.</p>
        <button className="btn primary block" onClick={onChat}><ChatCircle size={18} />Start gesprek</button>
        <button className="btn ghost block" onClick={onLater}>Later</button>
      </div>
    </div>
  );
}

// ---- Onboarding: Work Profile in ±5 minutes ---------------------------------
const SKILL_SUGGEST = ["UT", "PAUT", "MT", "PT", "VT", "NDT", "ToFD", "Weld Inspection", "Offshore", "Coating Inspection", "MIG/MAG", "TIG", "WPS", "Tekeninglezen", "Rapportage", "Maintenance", "Rigging"];
const blankProfile = () => ({ name: "", photo: "", headline: "", city: "Rotterdam", about: "", years: 0, skills: [], sectors: [], availability: "now", availableFrom: "",
  radiusKm: 80, minRate: 45, contracts: ["freelance"], certs: [], experience: [], education: [], projects: [], discoverable: true });

const SECTORS = ["Offshore & wind", "Energie", "Petrochemie", "Staalbouw", "Maritiem", "Industrie", "Bouw"];
const PLAN = [
  [User, "Wie ben je", "Foto, naam, vak en woonplaats"],
  [Wrench, "Ervaring", "Jaren, skills en sectoren — hier draait matching op"],
  [Certificate, "Certificaten", "Met geldigheid: verlopen of ontbrekend = geen match"],
  [SlidersHorizontal, "Wat zoek je", "Beschikbaarheid, contract, tarief en reisafstand"],
  [ChatCircle, "Over jou", "Twee zinnen en of bedrijven je mogen vinden"],
  [Camera, "Eerste project", "Foto + één zin — je sterkste bewijs"],
];

function Onboarding({ store, update }) {
  const [step, setStep] = useState(-2); // -2 splash · -1 plan · 0..4 wizard · 5 klaar
  const [f, setF] = useState(blankProfile);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  const finish = (project) => {
    update((s) => ({ ...s, onboarded: true, profile: f, dismissed: [], saved: [], interests: (s.interests || []).filter((i) => i.person !== "me") }));
    if (project) setTimeout(() => document.dispatchEvent(new CustomEvent("workstr:create", { detail: "project" })));
  };
  const useDemo = () => update((s) => ({ ...s, onboarded: true }));
  const year = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  const valid = [f.name.trim() && f.headline.trim(), f.skills.length > 0, true, f.contracts.length > 0, true][step];
  const items = profileChecklist(f);

  if (step === -2) return (
    <div className="onb">
      <div className="onb-art" aria-hidden>
        <div className="bubble" style={{ width: 150, height: 150, left: "10%", top: "14%", "--ring": "#c9c7ff" }}><img src="./work/w2.jpg" alt="" /></div>
        <div className="bubble" style={{ width: 112, height: 112, right: "12%", top: "8%", "--ring": "#ffe2a8" }}><img src="./work/w5.jpg" alt="" /></div>
        <div className="bubble" style={{ width: 124, height: 124, left: "38%", top: "40%", "--ring": "#bdf0d2" }}><img src="./work/w7.jpg" alt="" /></div>
        <span className="pillname glass" style={{ left: "44%", top: "30%" }}>UT2 · Offshore</span>
        <span className="dotb" style={{ width: 22, height: 22, left: "6%", top: "58%", background: "#c9c7ff" }} />
        <span className="dotb" style={{ width: 12, height: 12, right: "18%", top: "52%", background: "#bdf0d2" }} />
        <span className="dotb" style={{ width: 34, height: 34, right: "-10px", top: "30%", background: "#7c78ff" }} />
        <h1>Less searching.<br />More working.</h1>
      </div>
      <div>
        <div className="onb-sheet">
          <Logo size={24} />
          <p className="muted sm">Hoe wil je Workstr gebruiken?</p>
          <button className="rolecard dark" onClick={() => setStep(-1)}><span className="ri"><Wrench size={22} /></span>
            <span><b>Ik zoek werk</b><small>Maak je Work Profile · ±5 min</small></span><ArrowRight size={20} /></button>
          <button className="rolecard" onClick={() => { location.hash = "#/business-app"; }}><span className="ri"><Buildings size={22} /></span>
            <span><b>Ik zoek personeel</b><small>Workstr Business voor bedrijven</small></span><ArrowRight size={20} /></button>
          <button className="btn ghost block" onClick={useDemo}>Bekijk met demoprofiel (Sem)</button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="app">
      <div className="top"><button className="icon-btn" aria-label="Terug" onClick={() => setStep(step - 1)}><ArrowLeft size={20} /></button>
        <span className="sm muted">{step < 0 ? "Je Work Profile" : step < 5 ? `Stap ${step + 1} van 6 · ${PLAN[step][1]}` : "Stap 6 van 6 · Eerste project"}</span><span style={{ width: 44 }} /></div>
      {step >= 0 && <div className="segbar" aria-hidden>{PLAN.map((_, k) => <i key={k} className={k <= step ? "on" : ""} />)}</div>}
      <div className="screen"><div className="pad stack">
        {step === -1 && <>
          <h1 className="h-xl">Zo bouw je een sterk profiel</h1>
          <p className="muted">6 korte stappen, ±5 minuten. Hoe completer je profiel, hoe beter je matches — en bedrijven zien meteen wat je kunt.</p>
          <ol className="plan">{PLAN.map(([I, t, d], k) => <li key={t}><span className="pnum">{k + 1}</span><span><b>{t}</b><br /><span className="sm muted">{d}</span></span><I size={20} className="muted" /></li>)}</ol>
          <div className="ai-note"><Sparkle size={18} />AI helpt structureren, maar verzint nooit ervaring. Jij keurt alles goed.</div>
          <button className="btn primary block" onClick={() => setStep(0)}>Start met stap 1</button>
        </>}
        {step === 0 && <>
          <h1 className="h-xl">Wie ben je?</h1>
          <label className="row" style={{ cursor: "pointer" }}><Avatar p={f} lg /><span className="btn sm"><Camera size={16} />{f.photo ? "Andere foto" : "Profielfoto"}</span>
            <input type="file" accept="image/*" className="sr" aria-label="Profielfoto" onChange={async (e) => e.target.files[0] && set("photo", await toDataUrl(e.target.files[0], 320))} /></label>
          <p className="xs muted" style={{ marginTop: -6 }}>Een foto maakt je herkenbaar in de chat met bedrijven.</p>
          <label className="f">Naam<input className="in" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className="f">Functie of richting<input className="in" placeholder="Bijv. NDT Inspector · UT2" value={f.headline} onChange={(e) => set("headline", e.target.value)} /></label>
          <label className="f">Woonplaats<select className="in" value={f.city} onChange={(e) => set("city", e.target.value)}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></label>
        </>}
        {step === 1 && <>
          <h1 className="h-xl">Wat kun je?</h1>
          <label className="f">Jaren werkervaring in je vak<input className="in" type="number" min="0" max="50" value={f.years} onChange={(e) => set("years", Math.min(50, Math.max(0, +e.target.value)))} /></label>
          <div className="f"><span>Tik je skills aan <span className="muted">· minstens 3 voor goede matches</span></span>
            <div className="row wrap">{SKILL_SUGGEST.map((x) => <button key={x} type="button" className={`chip ${f.skills.includes(x) ? "on" : ""}`} aria-pressed={f.skills.includes(x)} onClick={() => toggle("skills", x)}>{x}</button>)}</div></div>
          <div className="f"><span>Andere skill</span><SkillPicker value={f.skills.filter((x) => !SKILL_SUGGEST.includes(x))} onChange={(v) => set("skills", [...f.skills.filter((x) => SKILL_SUGGEST.includes(x)), ...v])} /></div>
          <div className="f"><span>Sectoren waarin je gewerkt hebt</span>
            <div className="row wrap">{SECTORS.map((x) => <button key={x} type="button" className={`chip ${f.sectors.includes(x) ? "on" : ""}`} aria-pressed={f.sectors.includes(x)} onClick={() => toggle("sectors", x)}>{x}</button>)}</div></div>
        </>}
        {step === 2 && <>
          <h1 className="h-xl">Certificaten</h1>
          <p className="sm muted">Tik aan wat je hebt en vul de geldigheid in. Upload kan later; tot controle heet het “Uploaded”, niet “Verified”.</p>
          <div className="row wrap">{CERT_WORDS.map((x) => { const on = f.certs.some((c) => c.name === x); return (
            <button key={x} type="button" className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => set("certs", on ? f.certs.filter((c) => c.name !== x) : [...f.certs, { id: uid(), name: x, issuer: "", number: "", validUntil: year, verified: false }])}>{x}</button>); })}</div>
          {f.certs.map((c) => <label key={c.id} className="row sm"><span className="grow"><b>{c.name}</b> geldig tot</span>
            <input className="in" style={{ width: "auto" }} type="date" aria-label={`${c.name} geldig tot`} value={c.validUntil} onChange={(e) => set("certs", f.certs.map((x) => (x.id === c.id ? { ...x, validUntil: e.target.value } : x)))} /></label>)}
        </>}
        {step === 3 && <>
          <h1 className="h-xl">Wat zoek je?</h1>
          <div className="f"><span>Beschikbaar</span><div className="row wrap">{Object.entries(AVAIL_LABEL).filter(([k]) => k !== "date").map(([k, l]) => <button key={k} type="button" className={`chip ${f.availability === k ? "on" : ""}`} aria-pressed={f.availability === k} onClick={() => set("availability", k)}>{l}</button>)}</div></div>
          <div className="f"><span>Contractvorm</span><div className="row wrap">{Object.entries(CONTRACT).map(([k, l]) => <button key={k} type="button" className={`chip ${f.contracts.includes(k) ? "on" : ""}`} aria-pressed={f.contracts.includes(k)} onClick={() => toggle("contracts", k)}>{l}</button>)}</div></div>
          <label className="f">Minimum uurtarief (€)<input className="in" type="number" min="0" max="500" value={f.minRate} onChange={(e) => set("minRate", Math.min(500, Math.max(0, +e.target.value)))} /></label>
          <label className="f">Reisafstand: {f.radiusKm} km<input type="range" min="10" max="300" step="10" value={f.radiusKm} onChange={(e) => set("radiusKm", +e.target.value)} /></label>
        </>}
        {step === 4 && <>
          <h1 className="h-xl">Over jou</h1>
          <label className="f">Korte introductie<textarea className="in" style={{ minHeight: 100 }} maxLength={400} placeholder="Wie ben je als vakman? Twee zinnen is genoeg." value={f.about} onChange={(e) => set("about", e.target.value)} /></label>
          <button type="button" className="card row" style={{ textAlign: "left" }} aria-pressed={f.discoverable} onClick={() => set("discoverable", !f.discoverable)}>
            {f.discoverable ? <Eye size={22} /> : <EyeSlash size={22} />}
            <span className="grow"><b>{f.discoverable ? "Bedrijven mogen mij vinden" : "Alleen zichtbaar na mijn interesse"}</b><br /><span className="xs muted">Altijd later aan te passen in je profiel.</span></span>
            <span className="chip">{f.discoverable ? "Aan" : "Uit"}</span></button>
        </>}
        {step === 5 && <>
          <h1 className="h-xl">Je Work Profile staat.</h1>
          <Ring pct={completion(items)} />
          <Checklist items={items} />
          <p className="muted">Laat nu zien wat je echt gedaan hebt. Eén project met een foto zegt meer dan “{f.years || 5} jaar ervaring”.</p>
          <button className="btn primary block" onClick={() => finish(true)}><Camera size={18} />Voeg je eerste project toe</button>
          <button className="btn ghost block" onClick={() => finish(false)}>Eerst vacatures bekijken</button>
        </>}
        {step >= 0 && step < 5 && <button className="btn primary block" disabled={!valid} onClick={() => setStep(step + 1)}>{step === 4 ? "Profiel afronden" : "Volgende"}</button>}
      </div></div>
    </div>
  );
}

function FeedItem({ j, setJobId, setCompanyId, save, like, store }) {
  const c = companies[j.company];
  const saved = store.saved.includes(j.id);
  const liked = (store.liked || []).includes(j.id);
  const wanted = findInterest(store, j.id, "me")?.co;
  const why = j.m.gated ? j.m.reasons.find((r) => r.type === "no") : null;
  const pros = j.m.reasons.filter((r) => r.type === "ok").slice(0, 2);
  return (
    <article className="ttitem" aria-label={`${j.title} bij ${c.name}`}>
      <Media src={j.video || j.photo} alt={j.video ? `Video van ${c.name}` : ""} />
      <div className="rail">
        <button aria-label={`Bedrijf ${c.name}`} onClick={() => setCompanyId(j.company)}><span className="co">{initials(c.name)}</span></button>
        <button aria-label={liked ? "Vind ik niet meer leuk" : "Vind ik leuk"} aria-pressed={liked} className={liked ? "on" : ""} onClick={() => like(j)}><Heart size={34} weight="fill" />{liked ? "Leuk" : "Like"}</button>
        <button aria-label={saved ? "Niet meer bewaren" : "Bewaar"} aria-pressed={saved} className={saved ? "on" : ""} onClick={() => save(j)}><BookmarkSimple size={32} weight="fill" />{saved ? "Bewaard" : "Opslaan"}</button>
      </div>
      <button className="infobar" aria-label={`Bekijk vacature: ${j.title}`} onClick={() => setJobId(j.id)}>
        <span className="row between">
          <span className="row" style={{ gap: 8 }}><span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(c.name)}</span><b className="sm">{c.name}</b><span className="xs muted">· {j.city}</span></span>
          <span className="match" style={j.m.gated ? { background: "var(--elev)", color: "var(--text)" } : undefined}>{j.m.score}% match</span>
        </span>
        <b className="ib-title">{j.title}</b>
        <span className="sm muted">{rateText(j)} · {CONTRACT[j.contract]} · start {fmtDate(j.start)}</span>
        {wanted ? <span className="sm ib-why" style={{ color: "var(--lav)", fontWeight: 600 }}>{c.name} wil jou spreken</span>
          : why ? <span className="sm ib-why" style={{ color: "var(--err)" }}>✕ {why.text.replace(" — verplicht voor deze functie", "")}</span>
          : <span className="sm ib-why" style={{ color: "var(--ok)" }}>✓ {pros.map((r) => r.text).join(" · ")}</span>}
        <span className="ib-more"><CaretUp size={14} weight="bold" />Tik voor bedrijf & solliciteren</span>
      </button>
    </article>
  );
}

function Discover(ctx) {
  const { jobs, store, update, setPrefs } = ctx;
  const [f, setF] = useState("all");
  const list = jobs.filter((j) => !store.dismissed.includes(j.id) && (f === "all" || j.contract === f)).sort((a, b) => b.m.score - a.m.score);
  return (
    <div className="ttwrap">
      <div className="tttop">
        <div className="tpills" role="group" aria-label="Contractvorm">
          {[["all", "Voor jou"], ["freelance", "Freelance"], ["project", "Project"], ["vast", "Vast"]].map(([id, l]) => (
            <button key={id} className={`chip ${f === id ? "on" : ""}`} aria-pressed={f === id} onClick={() => setF(id)}>{l}</button>
          ))}
        </div>
        <button className="round-glass glass" aria-label="Voorkeuren" onClick={() => setPrefs(true)}><SlidersHorizontal size={20} /></button>
      </div>
      <div className="tt">
        {list.map((j) => <FeedItem key={j.id} j={j} {...ctx} />)}
        {!list.length && (
          <div className="ttitem ttempty">
            <div className="empty">
              <h2 className="h-lg">Je bent bij.</h2>
              <p className="muted">Geen eindeloze feed: Workstr laat alleen zien wat relevant is.</p>
              <button className="btn primary" onClick={() => { setF("all"); update((s) => ({ ...s, dismissed: [] })); }}>Toon alles opnieuw</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Back({ onClose, label = "Terug" }) {
  return <button className="icon-btn" aria-label={label} onClick={onClose}><ArrowLeft size={20} /></button>;
}

function JobDetail({ job: j, onClose, interest, save, store, setCompanyId, p, openChat }) {
  const c = companies[j.company];
  const i = findInterest(store, j.id, "me");
  const [t, setT] = useState("why");
  const [apply, setApply] = useState(false);
  const [note, setNote] = useState("");
  const saved = store.saved.includes(j.id);
  const tabs = [["why", "Waarom jij"], ["co", "Bedrijf"], ["work", "Het werk"], ["req", "Eisen"]];
  return (
    <div className="overlay" role="dialog" aria-label={j.title}>
      <div className="screen">
        <div className="dhero"><Media src={j.video || j.photo} alt={`Werkplek ${c.name}`} />
          <button className="icon-btn" style={{ left: 16 }} aria-label="Terug" onClick={onClose}><ArrowLeft size={20} /></button>
          <button className="icon-btn" style={{ right: 16 }} aria-label="Bewaar" aria-pressed={saved} onClick={() => save(j)}><Heart size={20} weight={saved ? "fill" : "regular"} /></button>
        </div>
        <div className="sheet">
          <span className="handle" />
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div className="stack" style={{ gap: 8 }}>
              <h1 className="h-xl">{j.title}</h1>
              <button className="row linkbtn" style={{ fontWeight: 500 }} onClick={() => setCompanyId(j.company)}>
                <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(c.name)}</span>{c.name}<CaretRight size={14} className="muted" /></button>
            </div>
            <div className="scorebox"><b>{j.m.score}%</b><small>match</small></div>
          </div>
          {i?.co && !i?.cand && <div className="ai-note"><Sparkle size={18} />{c.name} heeft jouw Work Profile bekeken en wil met je praten.</div>}
          <div className="tiles">
            <div><span className="xs muted">Locatie</span><b>{j.city}</b></div>
            <div><span className="xs muted">{j.unit === "uur" ? "Tarief" : "Salaris"}</span><b>{rateText(j)}</b></div>
            <div><span className="xs muted">Contract</span><b>{CONTRACT[j.contract]}</b></div>
            <div><span className="xs muted">Start · duur</span><b>{fmtDate(j.start)} · {j.duration}</b></div>
          </div>
          <div className="seg" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}>{l}</button>)}</div>
          {t === "why" && <section className="panel"><h3 className="h-lg" style={{ fontSize: 18 }}>Waarom dit bij jou past</h3><Reasons reasons={j.m.reasons} /></section>}
          {t === "work" && <section className="panel"><h3 className="h-lg" style={{ fontSize: 18 }}>Wat je gaat doen</h3>
            <ul className="reasons">{j.tasks.map((x) => <li key={x}><Check size={18} className="ok" />{x}</li>)}</ul>
            <div className="row wrap">{j.skills.map((x) => <span key={x} className="chip">{x}</span>)}</div></section>}
          {t === "req" && <section className="panel"><h3 className="h-lg" style={{ fontSize: 18 }}>Verplichte certificaten</h3>
            <div className="list">{j.certs.map((name) => (
              <div className="li" key={name}><Certificate size={20} /><span className="grow">{name}</span><StatusBadge status={certStatus(p.certs.find((x) => x.name === name))} /></div>))}</div></section>}
          {t === "co" && <section className="panel">
            <div className="row"><span className="avatar" style={{ width: 52, height: 52, fontSize: 16 }}>{initials(c.name)}</span>
              <span className="grow"><b>{c.name}</b><br /><span className="sm muted">{c.industry} · {c.city}</span></span></div>
            <p>{c.about}</p>
            <div className="mediastrip">{c.media.map((m) => <Media key={m} src={m} alt={`Werkplek ${c.name}`} />)}</div>
            <ul className="reasons">{[j.team, ...c.workplace].filter(Boolean).map((w) => <li key={w}><Buildings size={18} className="muted" />{w}</li>)}</ul>
            <div className="row wrap">{c.people.map((x) => <span key={x.n} className="chip">{x.n} · {x.r}</span>)}</div>
            <button className="btn" onClick={() => setCompanyId(j.company)}>Volledig bedrijfsprofiel <ArrowRight size={16} /></button>
          </section>}
        </div>
      </div>
      <div className="floating-cta">
        {isMatch(i) ? <button className="btn primary grow" onClick={() => { onClose(); openChat(i.id); }}><ChatCircle size={18} />Open gesprek</button>
          : i?.cand ? <button className="btn grow" disabled>Sollicitatie verstuurd · wacht op {c.name}</button>
          : i?.co ? <button className="btn primary grow" onClick={() => interest(j)}>{c.name} wil jou spreken — Accepteer</button>
          : <button className="btn primary grow" onClick={() => setApply(true)}><PaperPlaneTilt size={18} />Solliciteer</button>}
      </div>
      {apply && <div className="sheet-backdrop" onClick={() => setApply(false)}>
        <div className="applysheet" role="dialog" aria-label="Solliciteren" onClick={(e) => e.stopPropagation()}>
          <span className="handle" />
          <h2 className="h-lg">Solliciteren bij {c.name}</h2>
          <p className="sm muted">Geen cv of motivatiebrief nodig. {c.name} ziet je Work Profile en waarom je past.</p>
          <div className="panel" style={{ background: "var(--elev)", boxShadow: "none" }}>
            <div className="row"><Avatar p={p} /><span className="grow"><b>{p.name}</b><br /><span className="xs muted">{p.headline} · {p.city}</span></span><span className="match">{j.m.score}%</span></div>
            <div className="row wrap">{p.certs.slice(0, 4).map((x) => <span key={x.id || x.name} className="chip">{x.name}</span>)}{p.projects.length > 0 && <span className="chip">{p.projects.length} projecten</span>}</div>
          </div>
          <label className="f">Bericht (optioneel)<textarea className="in" style={{ minHeight: 76 }} maxLength={300} placeholder="Bijv. wanneer je kunt starten of een vraag over het project" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className="btn primary block" onClick={() => interest(j, note)}><PaperPlaneTilt size={18} />Verstuur sollicitatie</button>
          <button className="btn ghost block" onClick={() => setApply(false)}>Annuleer</button>
        </div>
      </div>}
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
        <div className="hero" style={{ height: 200 }}><Media src={c.media[0]} alt={`Beeld van ${c.name}`} /><Back onClose={onClose} /></div>
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
          {t === "projects" && <div className="portfolio">{c.media.map((m, i) => <figure key={m}><Media src={m} alt="" /><figcaption>{["Jacket fabricage", "Offshore installatie", "Shutdown 2025"][i] || "Project"}</figcaption></figure>)}</div>}
          {t === "people" && <div className="list">{c.people.map((x) => <div className="li" key={x.n}><span className="avatar">{initials(x.n)}</span><span><b>{x.n}</b><br /><span className="sm muted">{x.r}</span></span></div>)}</div>}
          {t === "workplace" && <ul className="reasons">{c.workplace.map((w) => <li key={w}><Buildings size={18} className="muted" />{w}</li>)}</ul>}
          {t === "media" && <div className="portfolio">{c.media.map((m) => <figure key={m}><Media src={m} alt={`Beeld van ${c.name}`} /></figure>)}</div>}
        </div>
      </div>
    </div>
  );
}

function Matches({ jobs, store, update, mine, setJobId, openChat }) {
  const job = (id) => jobs.find((j) => j.id === id);
  const wanted = mine.filter((i) => i.co && !i.cand && i.declined !== "cand");
  const matched = mine.filter(isMatch);
  const waiting = mine.filter((i) => i.cand && !i.co);
  const touched = new Set(mine.map((i) => i.job));
  const weekly = jobs.filter((j) => !store.dismissed.includes(j.id) && !touched.has(j.id) && !j.m.gated && j.m.score >= 70).sort((a, b) => b.m.score - a.m.score).slice(0, 3);
  const Row = ({ j, right, onClick }) => (
    <button className="li" onClick={onClick || (() => setJobId(j.id))}>
      <img className="thumb" src={j.photo} alt="" />
      <span className="grow"><b>{j.title}</b><br /><span className="sm muted">{companies[j.company].name} · {j.city}</span></span>
      {right ?? <span className="match">{j.m.score}%</span>}
    </button>
  );
  return (
    <div className="pad stack">
      <h1 className="h-xl">Matches</h1>
      {!!wanted.length && <section className="card stack" style={{ borderColor: "var(--primary)" }}>
        <h3 className="sec-title" style={{ color: "var(--lav)" }}>Bedrijven die jou willen spreken</h3>
        {wanted.map((i) => { const j = job(i.job); return (
          <div key={i.id} className="stack" style={{ gap: 8 }}>
            <Row j={j} />
            <div className="row"><button className="btn primary sm grow" onClick={() => update((s) => showInterest(s, j.id, "me", "cand"))}><Check size={14} />Accepteer</button>
              <button className="btn sm grow" onClick={() => update((s) => decline(s, i.id, "cand"))}>Niet interessant</button></div>
          </div>); })}
      </section>}
      {!!matched.length && <section><h3 className="sec-title">It's a match</h3>
        <div className="list">{matched.map((i) => <Row key={i.id} j={job(i.job)} onClick={() => openChat(i.id)} right={<span className="chip on">Chat{i.unreadCand ? ` · ${i.unreadCand}` : ""}</span>} />)}</div></section>}
      <section className="card stack" style={{ background: "var(--elev)" }}>
        <div><p className="sec-title" style={{ color: "var(--lav)" }}>Your Weekly Opportunities</p>
          <h2 className="h-lg">{weekly.length} {weekly.length === 1 ? "kans die echt past" : "kansen die echt passen"}</h2>
          <p className="sm muted">Elke maandag een selectie. Alleen vacatures waar je aan alle harde eisen voldoet.</p></div>
        {weekly.map((j) => (
          <button key={j.id} className="card" style={{ textAlign: "left", display: "grid", gap: 8, background: "var(--surface)" }} onClick={() => setJobId(j.id)}>
            <div className="row between"><b>{j.title}</b><span className="match">{j.m.score}%</span></div>
            <span className="sm muted">{companies[j.company].name} · {j.city} · {rateText(j)}</span>
            <span className="sm" style={{ color: "var(--ok)" }}>✓ {j.m.reasons.filter((r) => r.type === "ok").slice(0, 2).map((r) => r.text).join(" · ")}</span>
          </button>
        ))}
      </section>
      {!!waiting.length && <section><h3 className="sec-title">Wacht op reactie</h3>
        <div className="list">{waiting.map((i) => <Row key={i.id} j={job(i.job)} right={<span className="chip">Verstuurd</span>} />)}</div></section>}
      <section><h3 className="sec-title">Bewaard</h3>
        <div className="list">{store.saved.map(job).filter(Boolean).map((j) => <Row key={j.id} j={j} />)}
          {!store.saved.length && <p className="sm muted">Tik op ♡ in Discover om een vacature te bewaren.</p>}</div></section>
    </div>
  );
}

function CreateHub({ setCreate }) {
  const items = [["project", "Project toevoegen", "Foto's + korte tekst. AI structureert, jij keurt goed.", Camera, true],
    ["experience", "Werkervaring", "", Briefcase], ["cert", "Certificaat", "", Certificate], ["education", "Opleiding", "", GraduationCap],
    ["skill", "Skill", "", Wrench], ["photo", "Foto toevoegen", "", ImageSquare]];
  return (
    <div className="pad stack">
      <h1 className="h-xl">Create</h1>
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

function Inbox({ mine, byId, openChat, store }) {
  const matched = mine.filter(isMatch);
  return (
    <div className="pad stack">
      <h1 className="h-xl">Inbox</h1>
      <div className="list">
        {matched.map((i) => { const j = byId(i.job), c = companies[j.company]; return (
          <button key={i.id} className="li" onClick={() => openChat(i.id)}>
            <span className="avatar">{initials(c.name)}</span>
            <span className="grow"><b>{c.name}</b> <span className="xs muted">· {j.title}</span><br />
              <span className="sm muted" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(store.chats[i.id] || []).filter((m) => m.from !== "sys").at(-1)?.text || "Match — zeg hallo"}</span></span>
            {i.unreadCand > 0 && <span className="match" style={{ padding: "2px 8px" }}>{i.unreadCand}</span>}
          </button>); })}
        {!matched.length && <p className="muted">Nog geen gesprekken. Een chat opent zodra jij en een bedrijf allebei interesse hebben.</p>}
      </div>
    </div>
  );
}

const SUGGEST = ["Ja, dat komt goed uit. Hoe laat?", "Kun je meer vertellen over de projectduur en het tarief?", "Ik ben op dat moment beschikbaar vanaf 15:00."];

function Chat({ id, onClose, store, update, byId }) {
  const i = store.interests.find((x) => x.id === id);
  const msgs = store.chats[id] || [];
  const [text, setText] = useState("");
  const end = useRef(null);
  useEffect(() => { update((s) => markRead(s, id, "cand")); end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]); // eslint-disable-line
  const j = byId(i.job), c = companies[j.company];
  const send = (e) => { e.preventDefault(); update((s) => sendMessage(s, id, "cand", text)); setText(""); };
  return (
    <div className="overlay" role="dialog" aria-label={`Chat met ${c.name}`}>
      <div className="top" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        <Back onClose={onClose} /><span className="row"><span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(c.name)}</span><span><b>{c.name}</b><br /><span className="xs muted">{j.title}</span></span></span><span style={{ width: 44 }} />
      </div>
      <div className="msgs">
        {msgs.map((m, k) => m.from === "sys"
          ? <p key={k} className="xs muted" style={{ textAlign: "center", padding: "4px 24px" }}>{m.text}</p>
          : <div key={k} className={`msg ${m.from === "cand" ? "me" : "them"}`}>{m.text}</div>)}
        <div ref={end} />
      </div>
      <div className="suggest" aria-label="Snelle antwoorden">
        {SUGGEST.map((x) => <button key={x} className="chip" onClick={() => setText(x)}><Sparkle size={12} />{x}</button>)}
      </div>
      <form className="composer" onSubmit={send}>
        <input className="in" value={text} onChange={(e) => setText(e.target.value)} placeholder="Bericht" aria-label="Bericht" />
        <button className="icon-btn" style={{ background: "var(--cta)", borderColor: "var(--cta)" }} aria-label="Verstuur"><PaperPlaneRight size={18} weight="fill" /></button>
      </form>
    </div>
  );
}

function Profile({ p, setCreate, setCv, setPrefs, update }) {
  const items = profileChecklist(p);
  const pct = completion(items);
  const next = items.find((i) => !i.done);
  return (
    <div className="pad stack" style={{ gap: 20 }}>
      <div className="row between"><Logo /><a className="chip" href="#/business">Voor bedrijven</a></div>
      <div className="row" style={{ gap: 14 }}>
        <Avatar p={p} lg />
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
        {next && <span className="xs muted">Volgende stap voor een sterker profiel: <b style={{ color: "var(--text)" }}>{next.label}</b></span>}
      </div>
      <button className="card row" style={{ textAlign: "left" }} aria-pressed={!!p.discoverable} onClick={() => update((s) => ({ ...s, profile: { ...s.profile, discoverable: !s.profile.discoverable } }))}>
        {p.discoverable ? <Eye size={22} /> : <EyeSlash size={22} />}
        <span className="grow"><b>{p.discoverable ? "Vindbaar voor bedrijven" : "Alleen zichtbaar na jouw interesse"}</b><br />
          <span className="xs muted">{p.discoverable ? "Bedrijven met een passende vacature zien je profiel en kunnen jou benaderen." : "Bedrijven zien je profiel pas als jij interesse toont."}</span></span>
        <span className="chip">{p.discoverable ? "Aan" : "Uit"}</span>
      </button>
      <button className="btn primary block" onClick={() => setCv(true)}><FilePdf size={18} />Generate my CV</button>
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

      {!!p.years && !p.experience.length && <p className="sm muted">{p.years} jaar werkervaring</p>}
      <section><div className="row between"><h3 className="sec-title">Werkervaring</h3><button className="btn sm ghost" onClick={() => setCreate("experience")}><Plus size={14} />Ervaring</button></div>
        <div className="list">{p.experience.map((e) => <div className="li" key={e.id}><Briefcase size={22} /><span className="grow"><b>{e.role}</b> · {e.company}<br /><span className="xs muted">{e.from} – {e.to || "nu"}</span></span></div>)}</div></section>

      <section><div className="row between"><h3 className="sec-title">Skills</h3><button className="btn sm ghost" onClick={() => setCreate("skill")}>Bewerk</button></div>
        <div className="row wrap">{p.skills.map((s) => <span className="chip" key={s}>{s}</span>)}</div></section>

      <section><div className="row between"><h3 className="sec-title">Opleiding</h3><button className="btn sm ghost" onClick={() => setCreate("education")}><Plus size={14} />Opleiding</button></div>
        {p.education.map((o) => <p key={o.id}><b>{o.name}</b> <span className="muted sm">· {o.school} · {o.year}</span></p>)}</section>

      <button className="btn ghost sm" style={{ justifySelf: "center" }} onClick={() => { localStorage.removeItem("workstr.v4"); location.reload(); }}>Demo resetten</button>
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
