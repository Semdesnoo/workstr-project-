// Workstr Business — prototype. Exactly five things: post a vacancy → see matches → open a
// Work Profile → show interest → chat. Same local store and loop as the candidate app.
import React, { useEffect, useRef, useState } from "react";
import { SquaresFour, Briefcase, ChatCircle, Plus, Lightning, Sparkle, Check, X, MapPin, Certificate, Camera, ArrowLeft, ArrowRight, Buildings, UsersThree, MagnifyingGlass } from "@phosphor-icons/react";
import { companies, seedJobs, seedCandidates, CITIES } from "./data.js";
import { matchJob, toProfile, structureVacancy, certStatus, experienceYears, AVAIL_LABEL, companyChecklist, completion } from "./logic.js";
import { Checklist, Ring } from "./Candidate.jsx";
import { showInterest, sendMessage, markRead, isMatch, findInterest, uid } from "./loop.js";
import { Logo, StatusBadge, Reasons, initials, Media, isVideo, saveMedia, MAX_VIDEO_MB } from "./ui.jsx";

const CONTRACT = { freelance: "Freelance", project: "Project", vast: "Vast", parttime: "Parttime", fulltime: "Fulltime" };
const EXAMPLE = "NDT Inspector Monopiles\nLocatie: Rotterdam. Freelance, €58 - €70 per uur.\n- UT en PAUT op monopile-lassen\n- Rapportage aan QA/QC Lead\nEisen: UT2, VCA, BOSIET";

// Professionals a company can see: other Work Profiles + the app user, if discoverable or they showed interest.
export function people(store) {
  const others = seedCandidates.filter((c) => c.id !== "c1").map((c) => ({ ...toProfile(c), projects: [] }));
  const me = { ...store.profile, id: "me" };
  const visible = store.onboarded && me.name && (me.discoverable || (store.interests || []).some((i) => i.person === "me" && i.cand));
  return visible ? [me, ...others] : others;
}
// Candidate-facing reasons, rephrased for the employer.
const forEmployer = (r) => ({ ...r, text: r.text.replace(/^Je hebt /, "Heeft ").replace("binnen je radius", "binnen de radius van de kandidaat").replace("je voorkeur", "de voorkeur van de kandidaat").replace(/^Je staat/, "Staat").replace("je beschikbaarheid", "de beschikbaarheid").replace("je minimum", "het minimum").replace("Je hebt", "Heeft").replace("je projecten", "de projecten").replace(" — verplicht voor deze functie", " (verplicht)").replace("je voorkeuren", "de voorkeuren") });

export default function Biz({ store, update }) {
  const [co, setCo] = useState(store.company?.id || "vanoord");
  const [page, setPage] = useState("dashboard");
  const [jobId, setJobId] = useState(null);
  const [person, setPerson] = useState(null);
  const [chat, setChat] = useState(null);
  const jobs = [...store.jobs, ...seedJobs].filter((j) => j.company === co);
  const pool = people(store);
  const ranked = (j) => pool.map((x) => ({ x, m: matchJob(x, j) })).sort((a, b) => b.m.score - a.m.score);
  const mine = (store.interests || []).filter((i) => jobs.some((j) => j.id === i.job));
  const incoming = mine.filter((i) => i.cand && !i.co && i.declined !== "co");
  const matches = mine.filter(isMatch);
  const unread = matches.reduce((n, i) => n + (i.unreadCo || 0), 0);
  const who = (id) => pool.find((x) => x.id === id) || { id, name: "Onbekend", certs: [], skills: [] };

  const interest = (job, pid) => {
    update((s) => showInterest(s, job, pid, "co"));
    // ponytail: seeded professionals answer automatically so the loop is visible without a second user.
    if (pid !== "me") setTimeout(() => update((s) => {
      const t = showInterest(s, job, pid, "cand");
      const i = findInterest(t, job, pid);
      return sendMessage(t, i.id, "cand", `Hoi! Leuk dat jullie interesse hebben. Ik ben ${AVAIL_LABEL[who(pid).availability]?.toLowerCase() || "binnenkort"} beschikbaar.`);
    }), 1200);
  };
  const openChat = (id) => { update((s) => markRead(s, id, "co")); setChat(id); setPerson(null); setJobId(null); setPage("berichten"); };
  const go = (p) => { setPage(p); setJobId(null); setPerson(null); };

  if (!store.company && !store.bizDemo) return <BizOnboarding update={update} onDone={(id) => setCo(id)} />;

  const nav = [["dashboard", "Dashboard", SquaresFour, 0], ["vacatures", "Vacatures", Briefcase, jobs.length], ["berichten", "Berichten", ChatCircle, unread]];
  return (
    <div className="desk">
      <nav className="side" aria-label="Business menu">
        <Logo sub="Business" />
        {nav.map(([id, label, Icon, n]) => <button key={id} aria-current={page === id ? "page" : undefined} onClick={() => go(id)}><Icon size={18} />{label}{n ? <span className="count">{n}</span> : null}</button>)}
        <label className="f" style={{ marginTop: "auto", padding: "0 10px" }}><span className="xs">Je bekijkt als (demo)</span>
          <select className="in" value={co} onChange={(e) => { setCo(e.target.value); go("dashboard"); }}>{Object.values(companies).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </nav>
      <main className="main">
        {person ? <ProfileView x={who(person.id)} job={jobs.find((j) => j.id === person.job)} store={store} interest={interest} openChat={openChat} onBack={() => setPerson(null)} />
          : page === "dashboard" ? <Dashboard co={co} jobs={jobs} ranked={ranked} incoming={incoming} matches={matches} unread={unread} who={who} store={store} setPerson={setPerson} setJob={(id) => { setPage("vacatures"); setJobId(id); }} />
          : page === "vacatures" ? (jobId ? <Vacancy j={jobs.find((x) => x.id === jobId)} ranked={ranked} store={store} interest={interest} openChat={openChat} setPerson={setPerson} onBack={() => setJobId(null)} />
            : <Vacancies co={co} jobs={jobs} ranked={ranked} update={update} open={setJobId} />)
          : <Messages co={co} matches={matches} jobs={jobs} who={who} store={store} update={update} chat={chat} setChat={(id) => openChat(id)} />}
      </main>
    </div>
  );
}

const Kpi = ({ label, value }) => <div className="kpi"><span className="sm muted">{label}</span><b>{value}</b></div>;
const Status = ({ i }) => (isMatch(i) ? <span className="tag human">Match</span> : i?.cand ? <span className="tag ai">Sollicitatie ontvangen</span> : i?.co ? <span className="tag">Benaderd</span> : null);

function Dashboard({ co, jobs, ranked, incoming, matches, unread, who, store, setPerson, setJob }) {
  const fresh = jobs.reduce((n, j) => n + ranked(j).filter(({ m, x }) => m.score >= 70 && !findInterest(store, j.id, x.id)).length, 0);
  return (<>
    <header><div><h1>Goedemorgen, {companies[co].name}</h1><p className="muted">Wie past, wie wil jou spreken, en met wie praat je al.</p></div></header>
    {companies[co].own && completion(companyChecklist(companies[co], jobs)) < 100 && <section className="card row" style={{ marginBottom: 16, gap: 20 }}>
      <Ring pct={completion(companyChecklist(companies[co], jobs))} label="bedrijfsprofiel" />
      <div className="grow stack" style={{ gap: 8 }}><b>Maak je bedrijfsprofiel af</b><span className="sm muted">Professionals zien dit als ze op jouw vacature tikken.</span><Checklist items={companyChecklist(companies[co], jobs)} /></div>
    </section>}
    <div className="kpis"><Kpi label="Open vacatures" value={jobs.length} /><Kpi label="Nieuwe matches" value={fresh} /><Kpi label="Nieuwe berichten" value={unread} /><Kpi label="Lopende gesprekken" value={matches.length} /></div>
    <div className="cols even">
      <section className="card stack"><h3 className="sec-title">Sollicitaties ontvangen</h3>
        {incoming.map((i) => { const x = who(i.person), j = jobs.find((v) => v.id === i.job); return (
          <button key={i.id} className="li" onClick={() => setPerson({ id: x.id, job: j.id })}><PersonAvatar x={x} /><span className="grow"><b>{x.name}</b><br /><span className="xs muted">{x.headline} · {j.title}</span></span><span className="match">{matchJob(x, j).score}%</span></button>); })}
        {!incoming.length && <p className="sm muted">Nog niemand. Professionals die interesse tonen verschijnen hier.</p>}</section>
      <section className="card stack"><h3 className="sec-title">Per vacature</h3>
        {jobs.map((j) => { const top = ranked(j).filter(({ m }) => !m.gated).slice(0, 3); return (
          <div key={j.id} className="stack" style={{ gap: 6 }}><button className="row between linkbtn" onClick={() => setJob(j.id)}><b>{j.title}</b><span className="xs muted">{ranked(j).filter(({ m }) => m.score >= 70).length} matches →</span></button>
            {top.map(({ x, m }, k) => <button key={x.id} className="row sm linkbtn" style={{ fontWeight: 400 }} onClick={() => setPerson({ id: x.id, job: j.id })}><span className="muted">{k + 1}.</span><span className="grow">{x.name}</span><span className="match">{m.score}%</span></button>)}</div>); })}
        {!jobs.length && <p className="sm muted">Nog geen vacatures.</p>}</section>
    </div>
  </>);
}

// Feed media: the vacancy's own upload first, else the company's first video/photo.
const makeJob = ({ media, ...v }, co) => {
  const all = [...(media ? [media] : []), ...(companies[co]?.media || [])];
  return { ...v, id: uid(), company: co, rateMin: +v.rateMin, rateMax: +v.rateMax, start: v.start || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    duration: "n.t.b.", photo: all.find((m) => !isVideo(m)) || "./work/w1.jpg", video: all.find(isVideo), team: "", tasks: v.tasks.length ? v.tasks : ["Zie gesprek"] };
};
// One file input for photo or video; errors (too big, wrong type) are shown, never swallowed.
function MediaPick({ label, multiple, onAdd }) {
  const [err, setErr] = useState("");
  const pick = async (e) => {
    setErr("");
    const files = [...e.target.files]; e.target.value = "";
    const out = [];
    for (const f of files) { try { out.push(await saveMedia(f)); } catch (x) { setErr(x.message); } }
    if (out.length) onAdd(out);
  };
  return (<span className="stack" style={{ gap: 4 }}>
    <label className="btn sm" style={{ justifySelf: "start" }}><Camera size={16} />{label}<input type="file" accept="image/*,video/*" multiple={multiple} className="sr" onChange={pick} /></label>
    <span className="xs muted">Foto of video (mp4/mov, max {MAX_VIDEO_MB} MB). Korte verticale video's werken het best in de feed.</span>
    {err && <span className="xs" role="alert" style={{ color: "var(--err)" }}>{err}</span>}
  </span>);
}
const VacancyMedia = ({ v, setV }) => (
  <div className="f"><span>Foto of video bij deze vacature (optioneel — anders je bedrijfsbeeld)</span>
    {v.media && <div className="photopick" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}><button type="button" aria-pressed aria-label="Verwijder vacaturebeeld" onClick={() => setV({ ...v, media: "" })}><Media src={v.media} alt="" /><X size={16} weight="bold" className="pick" /></button></div>}
    <MediaPick label={v.media ? "Ander beeld" : "Video of foto toevoegen"} onAdd={([m]) => setV({ ...v, media: m })} />
  </div>
);

function Vacancies({ co, jobs, ranked, update, open }) {
  const [raw, setRaw] = useState(null);
  const [v, setV] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const publish = () => {
    const job = makeJob(v, co);
    update((s) => ({ ...s, jobs: [job, ...s.jobs] }));
    setRaw(null); setV(null); open(job.id);
  };
  return (<>
    <header><div><h1>Vacatures</h1><p className="muted">Plak je vacaturetekst. Workstr zet hem in velden; jij controleert en publiceert.</p></div>
      {raw === null && <button className="btn primary" onClick={() => setRaw("")}><Plus size={16} />Vacature plaatsen</button>}</header>
    {raw !== null && !v && <section className="card stack" style={{ marginBottom: 16 }}>
      <label className="f">Vacaturetekst<textarea className="in" style={{ minHeight: 150 }} value={raw} onChange={(e) => setRaw(e.target.value)} /></label>
      <div className="row"><button className="btn ghost sm" onClick={() => setRaw(EXAMPLE)}>Voorbeeld plakken</button><span className="grow" />
        <button className="btn" onClick={() => setRaw(null)}>Annuleer</button>
        <button className="btn primary" disabled={raw.trim().length < 10} onClick={() => setV(structureVacancy(raw))}><Lightning size={16} />Zet in velden</button></div>
    </section>}
    {v && <section className="card stack" style={{ marginBottom: 16 }}>
      <div className="ai-note"><Sparkle size={18} />Uit jouw tekst gehaald. Controleer voor publicatie — vooral de verplichte certificaten, daar wordt hard op gefilterd.</div>
      <div className="cols even">
        <label className="f">Functietitel<input className="in" value={v.title} onChange={set("title")} /></label>
        <label className="f">Locatie<select className="in" value={v.city} onChange={set("city")}><option value="">—</option>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Tarief min (€/{v.unit})<input className="in" type="number" value={v.rateMin} onChange={set("rateMin")} /></label>
        <label className="f">Tarief max (€/{v.unit})<input className="in" type="number" value={v.rateMax} onChange={set("rateMax")} /></label>
        <label className="f">Contractvorm<select className="in" value={v.contract} onChange={set("contract")}><option value="">—</option>{Object.entries(CONTRACT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="f">Minimaal jaren ervaring<input className="in" type="number" min="0" value={v.minYears ?? 3} onChange={(e) => setV({ ...v, minYears: +e.target.value })} /></label>
      </div>
      <div className="row wrap"><span className="sm muted">Verplichte certificaten:</span>{v.certs.map((c) => <span key={c} className="chip">{c}</span>)}
        <span className="sm muted" style={{ marginLeft: 12 }}>Skills:</span>{v.skills.map((c) => <span key={c} className="chip">{c}</span>)}</div>
      <VacancyMedia v={v} setV={setV} />
      <div className="row"><span className="grow" /><button className="btn" onClick={() => setV(null)}>Terug</button>
        <button className="btn primary" disabled={!v.title || !v.city || !v.contract} onClick={publish}>Publiceer</button></div>
    </section>}
    <section className="card"><table className="t"><thead><tr><th>Functie</th><th>Locatie</th><th>Tarief</th><th>Verplicht</th><th>Matches</th></tr></thead>
      <tbody>{jobs.map((j) => <tr key={j.id} onClick={() => open(j.id)} style={{ cursor: "pointer" }}>
        <td><button className="linkbtn" onClick={() => open(j.id)}>{j.title}</button></td><td>{j.city}</td><td>€{j.rateMin}–{j.rateMax}/{j.unit}</td><td className="sm">{j.certs.join(", ")}</td>
        <td><span className="match">{ranked(j).filter(({ m }) => m.score >= 70).length}</span></td></tr>)}</tbody></table>
      {!jobs.length && <p className="muted" style={{ padding: 12 }}>Nog geen vacatures.</p>}</section>
  </>);
}

function Vacancy({ j, ranked, store, interest, openChat, setPerson, onBack }) {
  const list = ranked(j);
  return (<>
    <header><div><button className="btn ghost sm" onClick={onBack}><ArrowLeft size={14} />Vacatures</button><h1 style={{ marginTop: 8 }}>{j.title}</h1>
      <p className="muted">{j.city} · €{j.rateMin}–{j.rateMax}/{j.unit} · verplicht: {j.certs.join(", ") || "—"}</p></div></header>
    <section className="card"><table className="t"><thead><tr><th>#</th><th>Professional</th><th>Match</th><th>Waarom</th><th>Status</th><th /></tr></thead>
      <tbody>{list.map(({ x, m }, k) => { const i = findInterest(store, j.id, x.id); return (
        <tr key={x.id} style={{ opacity: m.gated ? 0.6 : 1 }}>
          <td className="muted">{k + 1}</td>
          <td><div className="row"><PersonAvatar x={x} /><span><button className="linkbtn" onClick={() => setPerson({ id: x.id, job: j.id })}>{x.name}</button>{x.id === "me" && <span className="tag ai" style={{ marginLeft: 6 }}>App-gebruiker</span>}<br /><span className="xs muted">{x.headline} · {x.city}</span></span></div></td>
          <td><span className="match" style={m.gated ? { background: "var(--elev)", color: "var(--text)" } : undefined}>{m.score}%</span></td>
          <td className="sm">{m.gated ? <span style={{ color: "var(--err)" }}>{m.reasons.find((r) => r.type === "no")?.text.replace(" — verplicht voor deze functie", "")}</span> : m.reasons.filter((r) => r.type === "ok").slice(0, 2).map((r) => forEmployer(r).text).join(" · ")}</td>
          <td><Status i={i} /></td>
          <td>{isMatch(i) ? <button className="btn sm primary" onClick={() => openChat(i.id)}>Chat</button>
            : i?.co ? null : <button className="btn sm" onClick={() => interest(j.id, x.id)}>{i?.cand ? "Accepteer" : "Interesse tonen"}</button>}</td>
        </tr>); })}</tbody></table></section>
  </>);
}

function PersonAvatar({ x, lg }) {
  const style = lg ? { width: 72, height: 72, fontSize: 24 } : {};
  return x.photo ? <img className="avatar" src={x.photo} alt="" style={{ ...style, objectFit: "cover", padding: 0 }} /> : <span className="avatar" style={style}>{initials(x.name || "?")}</span>;
}

function ProfileView({ x, job, store, interest, openChat, onBack }) {
  const m = matchJob(x, job);
  const i = findInterest(store, job.id, x.id);
  return (<>
    <header><div><button className="btn ghost sm" onClick={onBack}><ArrowLeft size={14} />Terug</button></div></header>
    <div className="cols">
      <div className="stack">
        <section className="card row" style={{ gap: 16, alignItems: "center" }}><PersonAvatar x={x} lg />
          <div className="grow"><h1 style={{ fontSize: 28 }}>{x.name}</h1><p className="muted">{x.headline}</p>
            <p className="sm muted"><MapPin size={13} /> {x.city} · {experienceYears(x)} jaar ervaring · {AVAIL_LABEL[x.availability]}{x.rate ? ` · €${x.rate}/u` : x.minRate ? ` · vanaf €${x.minRate}/u` : ""}</p></div></section>
        {x.about && <p>{x.about}</p>}
        <section><h3 className="sec-title">Projecten</h3>
          <div className="portfolio">{(x.projects || []).map((p) => <figure key={p.id}>{p.photos?.[0] ? <img src={p.photos[0]} alt="" /> : <div style={{ aspectRatio: "4/3", display: "grid", placeItems: "center" }} className="muted"><Camera size={24} /></div>}
            <figcaption>{p.title}<br /><span className="xs muted">{p.text}</span></figcaption></figure>)}</div>
          {!x.projects?.length && <p className="sm muted">Nog geen projecten in dit profiel.</p>}</section>
        <section><h3 className="sec-title">Certificaten</h3><div className="list">{x.certs.map((c) => <div key={c.name} className="li"><Certificate size={20} /><span className="grow">{c.name}</span><StatusBadge status={certStatus(c)} /></div>)}</div></section>
        <section><h3 className="sec-title">Skills</h3><div className="row wrap">{x.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div></section>
      </div>
      <aside className="card stack">
        <div className="row between"><b>{job.title}</b><span className="match">{m.score}%</span></div>
        <h3 className="sec-title">Waarom deze match</h3>
        <Reasons reasons={m.reasons.map(forEmployer)} />
        <Status i={i} />
        {i?.note && <div className="ai-note" style={{ color: "var(--text)" }}><ChatCircle size={18} />“{i.note}”</div>}
        {isMatch(i) ? <button className="btn primary block" onClick={() => openChat(i.id)}><ChatCircle size={16} />Open chat</button>
          : i?.co ? <p className="sm muted">Interesse getoond. Je kunt chatten zodra {x.name.split(" ")[0]} ook interesse heeft.</p>
          : <button className="btn primary block" onClick={() => interest(job.id, x.id)}><Check size={16} />{i?.cand ? "Accepteer en start chat" : "Interesse tonen"}</button>}
      </aside>
    </div>
  </>);
}

function Messages({ matches, jobs, who, store, update, chat, setChat }) {
  const id = chat || matches[0]?.id;
  const i = matches.find((x) => x.id === id);
  const [text, setText] = useState("");
  const end = useRef(null);
  const msgs = (i && store.chats[i.id]) || [];
  useEffect(() => { if (i?.unreadCo) update((s) => markRead(s, i.id, "co")); end.current?.scrollIntoView({ block: "end" }); }, [id, msgs.length]); // eslint-disable-line
  const send = (e) => { e.preventDefault(); update((s) => sendMessage(s, i.id, "co", text)); setText(""); };
  return (<>
    <header><div><h1>Berichten</h1><p className="muted">Gesprekken openen pas na wederzijdse interesse. Geen motivatiebrief, geen formulieren.</p></div></header>
    <div className="cols" style={{ gridTemplateColumns: "300px 1fr" }}>
      <section className="card list">{matches.map((m) => { const x = who(m.person), j = jobs.find((v) => v.id === m.job); return (
        <button key={m.id} className="li" aria-current={m.id === id} onClick={() => setChat(m.id)} style={m.id === id ? { background: "var(--elev)", borderRadius: 10, paddingInline: 8 } : undefined}>
          <PersonAvatar x={x} /><span className="grow"><b className="sm">{x.name}</b><br /><span className="xs muted">{j?.title}</span></span>
          {m.unreadCo > 0 && <span className="match" style={{ padding: "2px 8px" }}>{m.unreadCo}</span>}</button>); })}
        {!matches.length && <p className="sm muted">Nog geen matches.</p>}</section>
      {i ? <section className="card" style={{ display: "flex", flexDirection: "column", minHeight: 460, padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}><b>{who(i.person).name}</b> <span className="xs muted">· {jobs.find((v) => v.id === i.job)?.title}</span></div>
        <div className="msgs">{msgs.map((m, k) => m.from === "sys" ? <p key={k} className="xs muted" style={{ textAlign: "center" }}>{m.text}</p>
          : <div key={k} className={`msg ${m.from === "co" ? "me" : "them"}`}>{m.text}</div>)}<div ref={end} /></div>
        <div className="suggest">{["We zouden graag kennis met je maken. Ben je donderdag beschikbaar?", "Kun je je recente projecten kort toelichten?"].map((x) => <button key={x} className="chip" onClick={() => setText(x)}><Sparkle size={12} />{x}</button>)}</div>
        <form className="composer" onSubmit={send}><input className="in" aria-label="Bericht" placeholder="Schrijf een bericht" value={text} onChange={(e) => setText(e.target.value)} /><button className="btn primary">Verstuur</button></form>
      </section> : <section className="card muted">Kies een gesprek.</section>}
    </div>
  </>);
}

// ---- Company onboarding: account → profile → contact → first vacancy -------------------
const INDUSTRIES = ["Offshore & marine", "Energie", "Petrochemie", "Staalbouw", "Bouw & infra", "Industrie & maintenance", "Werving & selectie"];
const SIZES = ["1–10", "11–50", "51–250", "250+"];
const PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `./work/w${n}.jpg`);
const BSTEPS = ["Bedrijf", "Bedrijfsprofiel", "Contactpersoon", "Eerste vacature"];

function BizOnboarding({ update, onDone }) {
  const [step, setStep] = useState(-1);
  const [c, setC] = useState({ id: "own", own: true, name: "", kvk: "", industry: "", city: "Rotterdam", size: "", about: "", workplace: ["", "", ""], media: [PHOTOS[0], PHOTOS[5]], people: [{ n: "", r: "Recruiter" }] });
  const [raw, setRaw] = useState("");
  const [v, setV] = useState(null);
  const set = (k, val) => setC((x) => ({ ...x, [k]: val }));
  const kvkOk = c.kvk === "" || /^\d{8}$/.test(c.kvk);
  const valid = [c.name.trim().length >= 2 && c.industry && kvkOk, c.about.trim().length >= 40 && c.media.length >= 1, c.people[0].n.trim().length >= 2, true][step];
  const finish = (withJob) => {
    const company = { ...c, name: c.name.trim(), workplace: c.workplace.map((w) => w.trim()).filter(Boolean) };
    companies[company.id] = company; // makeJob reads the photo from here
    update((s) => ({ ...s, company, jobs: withJob ? [makeJob(v, company.id), ...s.jobs] : s.jobs }));
    onDone(company.id);
  };
  const toggleMedia = (m) => set("media", c.media.includes(m) ? c.media.filter((x) => x !== m) : [...c.media, m].slice(0, 6));

  return (
    <div className={`bonb ${step >= 0 ? "busy" : ""}`}>
      <aside className="bonb-art">
        <div className="collage" aria-hidden>{[2, 5, 7, 6].map((n) => <img key={n} src={`./work/w${n}.jpg`} alt="" />)}</div>
        <Logo sub="Business" />
        <h1>Vind vakmensen die laten zien wat ze kunnen.</h1>
        <p className="muted">Geen stapel cv's. Work Profiles met projecten, certificaten en een uitleg waarom iemand past.</p>
      </aside>
      <main className="bonb-form">
        {step === -1 ? <>
          <h2 style={{ fontSize: 32, letterSpacing: "-0.03em" }}>Start met Workstr Business</h2>
          <p className="muted">In 4 stappen van account naar je eerste matches. ±5 minuten.</p>
          <ol className="plan">{BSTEPS.map((t, k) => <li key={t}><span className="pnum">{k + 1}</span><span><b>{t}</b><br /><span className="sm muted">{[
            "Naam, sector en vestiging", "Over jullie, werkplekfoto's en wat het werk goed maakt — dit zien professionals", "Wie professionals spreken in de chat", "Plak je tekst, Workstr zet hem in velden, jij controleert"][k]}</span></span>
            {[<Buildings key="a" size={20} />, <Camera key="b" size={20} />, <UsersThree key="c" size={20} />, <MagnifyingGlass key="d" size={20} />][k]}</li>)}</ol>
          <button className="btn primary block" onClick={() => setStep(0)}>Maak bedrijfsaccount</button>
          <button className="btn ghost block" onClick={() => update((s) => ({ ...s, bizDemo: true }))}>Bekijk demo als Van Oord</button>
          <a className="sm muted" href="#/app" style={{ textAlign: "center" }}>Ik zoek zelf werk →</a>
        </> : <>
          <div className="row between"><button className="btn ghost sm" onClick={() => (v ? setV(null) : setStep(step - 1))}><ArrowLeft size={16} />Terug</button>
            <span className="sm muted">Stap {step + 1} van 4 · {BSTEPS[step]}</span></div>
          <div className="steps" aria-hidden>{BSTEPS.map((_, k) => <i key={k} className={k <= step ? "on" : ""} />)}</div>
          {step === 0 && <>
            <h2 className="bh">Over je bedrijf</h2>
            <label className="f">Bedrijfsnaam<input className="in" autoComplete="organization" value={c.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className="f">KvK-nummer (optioneel)<input className="in" inputMode="numeric" maxLength={8} value={c.kvk} aria-invalid={!kvkOk} onChange={(e) => set("kvk", e.target.value.replace(/\D/g, ""))} />
              {!kvkOk && <span className="xs" style={{ color: "var(--err)" }}>Een KvK-nummer heeft 8 cijfers.</span>}</label>
            <div className="f"><span>Sector</span><div className="row wrap">{INDUSTRIES.map((x) => <button key={x} type="button" className={`chip ${c.industry === x ? "on" : ""}`} aria-pressed={c.industry === x} onClick={() => set("industry", x)}>{x}</button>)}</div></div>
            <div className="cols even">
              <label className="f">Vestiging<select className="in" value={c.city} onChange={(e) => set("city", e.target.value)}>{Object.keys(CITIES).map((x) => <option key={x}>{x}</option>)}</select></label>
              <div className="f"><span>Medewerkers</span><div className="row wrap">{SIZES.map((x) => <button key={x} type="button" className={`chip ${c.size === x ? "on" : ""}`} aria-pressed={c.size === x} onClick={() => set("size", x)}>{x}</button>)}</div></div>
            </div>
          </>}
          {step === 1 && <>
            <h2 className="bh">Laat zien hoe het is om bij jullie te werken</h2>
            <label className="f">Over het bedrijf<textarea className="in" style={{ minHeight: 96 }} maxLength={500} placeholder="Wat doen jullie, waar, en voor wie?" value={c.about} onChange={(e) => set("about", e.target.value)} />
              <span className="xs muted">{c.about.trim().length < 40 ? `Nog ${40 - c.about.trim().length} tekens` : "✓ Genoeg om een beeld te krijgen"}</span></label>
            <div className="f"><span>Wat maakt het werk goed? (bijv. rooster, team, opleiding)</span>
              {c.workplace.map((w, k) => <input key={k} className="in" aria-label={`Pluspunt ${k + 1}`} value={w} maxLength={80} onChange={(e) => set("workplace", c.workplace.map((x, n) => (n === k ? e.target.value : x)))} />)}</div>
            <div className="f"><span>Werkplekfoto's en video's · echte beelden werken het best ({c.media.length}/6)</span>
              <div className="photopick">{[...new Set([...PHOTOS, ...c.media])].map((m) => <button key={m} type="button" aria-pressed={c.media.includes(m)} aria-label={isVideo(m) ? "Bedrijfsvideo" : "Werkplekfoto"} onClick={() => toggleMedia(m)}><Media src={m} alt="" />{c.media.includes(m) && <Check size={16} weight="bold" className="pick" />}</button>)}</div>
              <MediaPick label="Eigen foto's of video's uploaden" multiple onAdd={(ms) => set("media", [...ms.filter(isVideo), ...c.media, ...ms.filter((m) => !isVideo(m))].slice(0, 6))} /></div>
          </>}
          {step === 2 && <>
            <h2 className="bh">Wie spreken professionals?</h2>
            <p className="sm muted">Wordt getoond op je bedrijfsprofiel en in de chat. Mensen reageren sneller op een naam dan op een bedrijf.</p>
            <label className="f">Naam contactpersoon<input className="in" autoComplete="name" value={c.people[0].n} onChange={(e) => set("people", [{ ...c.people[0], n: e.target.value }])} /></label>
            <label className="f">Rol<input className="in" value={c.people[0].r} onChange={(e) => set("people", [{ ...c.people[0], r: e.target.value }])} /></label>
          </>}
          {step === 3 && (!v ? <>
            <h2 className="bh">Plaats je eerste vacature</h2>
            <label className="f">Vacaturetekst<textarea className="in" style={{ minHeight: 150 }} value={raw} onChange={(e) => setRaw(e.target.value)} /></label>
            <div className="row"><button className="btn ghost sm" onClick={() => setRaw(EXAMPLE)}>Voorbeeld plakken</button><span className="grow" />
              <button className="btn" onClick={() => finish(false)}>Later plaatsen</button>
              <button className="btn primary" disabled={raw.trim().length < 10} onClick={() => setV(structureVacancy(raw))}><Lightning size={16} />Zet in velden</button></div>
          </> : <>
            <h2 className="bh">Controleer je vacature</h2>
            <div className="ai-note"><Sparkle size={18} />Uit jouw tekst gehaald. Op verplichte certificaten wordt hard gefilterd — controleer ze.</div>
            <div className="cols even">
              <label className="f">Functietitel<input className="in" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></label>
              <label className="f">Locatie<select className="in" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}><option value="">—</option>{Object.keys(CITIES).map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="f">Contractvorm<select className="in" value={v.contract} onChange={(e) => setV({ ...v, contract: e.target.value })}><option value="">—</option>{Object.entries(CONTRACT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
              <label className="f">Tarief (€/{v.unit})<span className="row"><input className="in" type="number" aria-label="Tarief min" value={v.rateMin} onChange={(e) => setV({ ...v, rateMin: e.target.value })} />–<input className="in" type="number" aria-label="Tarief max" value={v.rateMax} onChange={(e) => setV({ ...v, rateMax: e.target.value })} /></span></label>
            </div>
            <div className="row wrap"><span className="sm muted">Verplicht:</span>{v.certs.map((x) => <span key={x} className="chip">{x}</span>)}<span className="sm muted" style={{ marginLeft: 12 }}>Skills:</span>{v.skills.map((x) => <span key={x} className="chip">{x}</span>)}</div>
            <VacancyMedia v={v} setV={setV} />
            <button className="btn primary block" disabled={!v.title || !v.city || !v.contract} onClick={() => finish(true)}>Publiceer en bekijk matches <ArrowRight size={16} /></button>
          </>)}
          {step < 3 && <button className="btn primary block" disabled={!valid} onClick={() => setStep(step + 1)}>Volgende</button>}
        </>}
      </main>
    </div>
  );
}
