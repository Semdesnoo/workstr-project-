// Workstr Business — prototype. Exactly five things: post a vacancy → see matches → open a
// Work Profile → show interest → chat. Same local store and loop as the candidate app.
import React, { useEffect, useRef, useState } from "react";
import { SquaresFour, Briefcase, ChatCircle, Plus, Lightning, Sparkle, Check, X, MapPin, Certificate, Camera, ArrowLeft } from "@phosphor-icons/react";
import { companies, seedJobs, seedCandidates, CITIES } from "./data.js";
import { matchJob, toProfile, structureVacancy, certStatus, experienceYears, AVAIL_LABEL } from "./logic.js";
import { showInterest, sendMessage, markRead, isMatch, findInterest, uid } from "./loop.js";
import { Logo, StatusBadge, Reasons, initials } from "./ui.jsx";

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
  const [co, setCo] = useState("vanoord");
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
const Status = ({ i }) => (isMatch(i) ? <span className="tag human">Match</span> : i?.cand ? <span className="tag ai">Interesse ontvangen</span> : i?.co ? <span className="tag">Benaderd</span> : null);

function Dashboard({ co, jobs, ranked, incoming, matches, unread, who, store, setPerson, setJob }) {
  const fresh = jobs.reduce((n, j) => n + ranked(j).filter(({ m, x }) => m.score >= 70 && !findInterest(store, j.id, x.id)).length, 0);
  return (<>
    <header><div><h1>Goedemorgen, {companies[co].name}</h1><p className="muted">Wie past, wie wil jou spreken, en met wie praat je al.</p></div></header>
    <div className="kpis"><Kpi label="Open vacatures" value={jobs.length} /><Kpi label="Nieuwe matches" value={fresh} /><Kpi label="Nieuwe berichten" value={unread} /><Kpi label="Lopende gesprekken" value={matches.length} /></div>
    <div className="cols even">
      <section className="card stack"><h3 className="sec-title">Interesse ontvangen</h3>
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

function Vacancies({ co, jobs, ranked, update, open }) {
  const [raw, setRaw] = useState(null);
  const [v, setV] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const publish = () => {
    const id = uid();
    update((s) => ({ ...s, jobs: [{ ...v, id, company: co, rateMin: +v.rateMin, rateMax: +v.rateMax, start: v.start || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      duration: "n.t.b.", photo: companies[co].media[0], team: "", tasks: v.tasks.length ? v.tasks : ["Zie gesprek"] }, ...s.jobs] }));
    setRaw(null); setV(null); open(id);
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
