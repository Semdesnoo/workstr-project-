// Interactive, client-side demos. Fictional data from content.js; no backend.
import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Sparkle, MagnifyingGlass, FilePdf, UploadSimple, Buildings, UsersThree, Briefcase, ChatCircle, SquaresFour, Bell, ShieldCheck, Clock } from "@phosphor-icons/react";
import { jobs, person, gallery, chat, oldWay, newWay, candidates, vacancyFields, compliance, agents, orchestration, mspModules, mspRequest, industries, roadmap, flywheel, aiCapabilities, media } from "./content.js";
import { Phone, Pic, Video, Reveal } from "./ui.jsx";
import { Feed, Reason, SCREENS, ChatScreen, MatchesScreen } from "./screens.jsx";
import { useInView, reduced, track } from "./lib.js";

const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));

// ---- Hero: cinematic video band with the live app on top ----------------------
export function HeroVisual() {
  const chips = [["92% match", "a"], ["UT2 verified", "b"], ["Available now", "c"], ["€45–€60 p/u", "d"], ["+ Add project", "e"], ["Direct message", "f"]];
  return (
    <div className="hero-visual">
      <Video m={media.heroWide} portrait={media.heroPortrait} className="hero-video" eager label="Vakmensen aan het werk" />
      <div className="hero-shade" aria-hidden />
      {chips.map(([t, k], i) => <span key={k} className={`float f-${k}`} style={{ "--i": i }} aria-hidden>{t}</span>)}
      <Phone className="hero-phone" label="De Workstr app: een feed met vacatures, matchpercentage en werkfoto's"><Feed auto /></Phone>
    </div>
  );
}

// ---- Old way vs Workstr --------------------------------------------------------
export function OldNew() {
  const [ref, seen] = useInView(0.35);
  return (
    <div ref={ref} className={`oldnew ${seen ? "go" : ""}`}>
      <div className="old"><h3>De oude manier</h3><ol>{oldWay.map((s, i) => <li key={s} style={{ "--i": i }}>{s}</li>)}</ol></div>
      <div className="arrow" aria-hidden><ArrowRight size={28} /></div>
      <div className="new"><h3>Met Workstr</h3><ol>{newWay.map(([t, d], i) => <li key={t} style={{ "--i": i }}><b>{t}</b><span>{d}</span></li>)}</ol></div>
    </div>
  );
}

// ---- Sticky phone that changes screen as you scroll ------------------------------
const STORY = [
  ["discover", "Discover", "Zie het werk. Niet alleen de vacaturetekst.", "Scroll door vacatures met beeld van de echte werkplek, het team en het project. Probeer het: scroll in de telefoon."],
  ["matches", "Matches", "Werk dat jou vindt.", "Geen eindeloze feed. Een paar kansen per week die echt passen, met de redenen erbij."],
  ["profile", "Work Profile", "Meer dan een cv.", "Projecten, skills, certificaten en beschikbaarheid in één profiel dat met je carrière meegroeit."],
  ["chat", "Chat", "Van match naar gesprek.", "Toon interesse. Wil het bedrijf jou ook spreken, dan opent de chat. Geen motivatiebrief."],
];
export function Story() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(+e.target.dataset.i)), { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="story">
      <div className="story-phone">
        <Phone label={`App-scherm: ${STORY[active][1]}`}>
          {STORY.map(([k], i) => { const S = SCREENS[k]; return <div key={k} className={`layer ${i === active ? "on" : ""}`} aria-hidden={i !== active}><S /></div>; })}
        </Phone>
        <div className="story-dots" aria-hidden>{STORY.map((s, i) => <i key={s[0]} className={i === active ? "on" : ""} />)}</div>
      </div>
      <div className="story-steps">
        {STORY.map(([k, label, title, text], i) => (
          <div key={k} className={`story-step ${i === active ? "on" : ""}`} data-i={i} ref={(el) => (refs.current[i] = el)}>
            <span className="eyebrow">{String(i + 1).padStart(2, "0")} · {label}</span><h3>{title}</h3><p>{text}</p>
            <div className="story-inline">{(() => { const S = SCREENS[k]; return <Phone label={`App-scherm: ${label}`}><S /></Phone>; })()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Show your work: horizontal editorial gallery --------------------------------
export function Gallery() {
  const ref = useRef(null);
  const go = (d) => ref.current.scrollBy({ left: d * ref.current.clientWidth * 0.7, behavior: reduced() ? "auto" : "smooth" });
  return (
    <div className="gallery-wrap">
      <div className="gallery" ref={ref} tabIndex={0} aria-label="Projecten van professionals (fictieve voorbeelden)">
        {gallery.map((g) => (
          <figure key={g.project}>
            <Pic src={g.photo} alt={g.project} />
            <figcaption>
              <span className="eyebrow">Project</span><b>{g.project}</b>
              <dl><div><dt>Skills</dt><dd>{g.skills}</dd></div><div><dt>Ervaring</dt><dd>{g.exp}</dd></div><div><dt>Werkgever</dt><dd>{g.employer}</dd></div><div><dt>Periode</dt><dd>{g.period}</dd></div></dl>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="gallery-nav"><button className="icon" aria-label="Vorige" onClick={() => go(-1)}><ArrowLeft size={18} /></button><button className="icon" aria-label="Volgende" onClick={() => go(1)}><ArrowRight size={18} /></button></div>
    </div>
  );
}

// ---- Demo 3: photo + one sentence → structured project → Work Profile ---------------
const PSTEPS = ["Foto", "Beschrijving", "Workstr structureert", "Jij keurt goed", "Profiel bijgewerkt"];
export function ProjectDemo() {
  const [ref, seen] = useInView(0.4);
  const [s, setS] = useState(0);
  const [typed, setTyped] = useState("");
  const run = useRef(0);
  const play = async () => {
    const id = ++run.current;
    track("demo_started", { demo: "project" });
    setS(0); setTyped("");
    await wait(700); if (id !== run.current) return; setS(1);
    for (let i = 1; i <= person.project.text.length; i += reduced() ? 999 : 2) { await wait(28); if (id !== run.current) return; setTyped(person.project.text.slice(0, i)); }
    setTyped(person.project.text);
    await wait(500); if (id !== run.current) return; setS(2);
    await wait(1300); if (id !== run.current) return; setS(3);
  };
  useEffect(() => { if (seen) play(); }, [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  const approve = () => { setS(4); track("profile_demo_interaction", { action: "approve" }); track("demo_completed", { demo: "project" }); };
  return (
    <div ref={ref} className="pdemo">
      <ol className="pdemo-steps" aria-label="Stappen">{PSTEPS.map((t, i) => <li key={t} className={i <= s ? "on" : ""} aria-current={i === s ? "step" : undefined}>{t}</li>)}</ol>
      <div className="pdemo-stage">
        <div className={`pcard upload ${s >= 0 ? "in" : ""}`}><Pic src={jobs[0].photo} /><span><UploadSimple size={14} /> {person.project.file}</span></div>
        <div className={`pcard text ${s >= 1 ? "in" : ""}`}><small>Wat heb je gedaan?</small><p aria-live="polite">{typed}<i className="caret" /></p></div>
        <div className={`pcard result ${s >= 2 ? "in" : ""}`}>
          <small><Sparkle size={13} weight="fill" /> Voorstel van Workstr — controleer voordat je toevoegt</small>
          <b>{person.project.title}</b><span className="muted">Ultrasoon onderzoek aan lasverbindingen · {person.project.period}</span>
          <div className="chips">{person.project.skills.map((k, i) => <span key={k} style={{ "--i": i }}>{k}</span>)}</div>
          {s === 3 && <button className="btn primary sm" onClick={approve}><Check size={14} /> Goedkeuren en toevoegen</button>}
          {s === 4 && <span className="added"><Check size={14} weight="bold" /> Toegevoegd aan Work Profile</span>}
        </div>
        <div className={`pcard profile ${s >= 4 ? "in" : ""}`}>
          <div className="row"><Pic src={person.photo} className="avatar" /><span><b>{person.name}</b><small>{person.role} · {person.city}</small></span></div>
          <div className="bar"><i style={{ width: s >= 4 ? "92%" : "74%" }} /></div><small className="muted">Work Profile {s >= 4 ? 92 : 74}% · cv bijgewerkt</small>
          <div className="chips">{[...new Set([...person.skills, ...person.project.skills])].map((k) => <span key={k}>{k}</span>)}</div>
        </div>
      </div>
      <button className="btn ghost sm replay" onClick={() => { track("profile_demo_interaction", { action: "replay" }); play(); }}>Opnieuw afspelen</button>
    </div>
  );
}

// ---- Demo 2: pick a job, see the score explained ------------------------------------
export function MatchDemo() {
  const [j, setJ] = useState(jobs[0]);
  const [ref, seen] = useInView(0.4);
  const score = seen ? j.score : 0;
  return (
    <div ref={ref} className="mdemo">
      <div className="mdemo-jobs" role="tablist" aria-label="Kies een vacature">
        {jobs.map((x) => <button key={x.id} role="tab" aria-selected={x.id === j.id} onClick={() => { setJ(x); track("job_demo_interaction", { action: "match", job: x.id }); }}>
          <Pic src={x.photo} /><span><b>{x.title}</b><small>{x.co} · {x.city}</small></span></button>)}
      </div>
      <div className="mdemo-panel" role="tabpanel" aria-label={`Match voor ${j.title}`}>
        <div className="ring" style={{ "--p": score }}><b>{score}%</b><small>match</small></div>
        <ul key={j.id} className="reasons">{j.reasons.map((r, i) => <Reason key={r[1]} r={r} i={i} />)}</ul>
        <p className="muted sm">Een verplicht certificaat dat ontbreekt telt zwaar: dan staat dat er gewoon bij.</p>
      </div>
    </div>
  );
}

// ---- Match → mutual interest → chat -------------------------------------------------
export function ChatDemo() {
  const [ref, seen] = useInView(0.4);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!seen) return;
    (async () => { for (let i = 1; i <= 2 + chat.length; i++) { await wait(900); setStage(i); } })();
  }, [seen]);
  const steps = ["Match", "Wederzijdse interesse", "Chat opent"];
  return (
    <div ref={ref} className="cdemo">
      <ol className="cdemo-steps">{steps.map((t, i) => <li key={t} className={stage > i ? "on" : ""}>{t}</li>)}</ol>
      <Phone label="Chat tussen Northshore Engineering en de professional"><ChatScreen n={Math.max(0, stage - 2)} /></Phone>
    </div>
  );
}

// ---- Phone becomes the Business dashboard ----------------------------------------------
export function Morph() {
  const [ref, seen] = useInView(0.5, "business_section_viewed");
  return (
    <div ref={ref} className={`morph ${seen ? "go" : ""}`}>
      <div className="morph-frame">
        <div className="morph-app"><MatchesScreen /></div>
        <div className="morph-desk"><Dashboard /></div>
      </div>
    </div>
  );
}

const Dashboard = () => (
  <div className="dash">
    <aside><b className="logo">workstr<i>.</i></b>{[[SquaresFour, "Overzicht"], [Briefcase, "Vacatures"], [UsersThree, "Talent"], [ChatCircle, "Berichten"]].map(([I, l], i) => <span key={l} className={i === 0 ? "on" : ""}><I size={14} />{l}</span>)}</aside>
    <div className="dash-main">
      <b className="dash-h">Goedemorgen, Northshore</b>
      <div className="kpis">{[["Open vacatures", 3], ["Nieuwe matches", 18], ["Gesprekken", 6]].map(([l, v]) => <div key={l}><small>{l}</small><b>{v}</b></div>)}</div>
      <div className="dash-list"><small>NDT Inspector · beste matches</small>{candidates.map((c) => <div key={c.name}><span>{c.name}</span><small>{c.city}</small><em className="match">{c.score}%</em></div>)}</div>
    </div>
  </div>
);

// ---- Workstr Business: tabs through the real flow ---------------------------------------
export function BusinessDemo({ start = "overview" }) {
  const [t, setT] = useState(start);
  const [parsed, setParsed] = useState(0);
  const [pick, setPick] = useState(null);
  const [short, setShort] = useState([]);
  const tabs = [["overview", "Overzicht", SquaresFour], ["vacancy", "Vacature maken", Briefcase], ["talent", "Talent zoeken", MagnifyingGlass], ["chat", "Chat", ChatCircle]];
  const parse = async () => { track("demo_started", { demo: "vacancy" }); for (let i = 1; i <= vacancyFields.length; i++) { await wait(220); setParsed(i); } track("demo_completed", { demo: "vacancy" }); };
  const toggleShort = (n) => { setShort((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n])); track("demo_completed", { demo: "shortlist" }); };
  return (
    <div className="bdemo">
      <div className="bdemo-tabs" role="tablist" aria-label="Workstr Business demo">
        {tabs.map(([k, l, I]) => <button key={k} role="tab" aria-selected={t === k} onClick={() => setT(k)}><I size={16} />{l}</button>)}
      </div>
      <div className="bdemo-body" role="tabpanel" aria-label={tabs.find((x) => x[0] === t)[1]}>
        {t === "overview" && <Dashboard />}
        {t === "vacancy" && (
          <div className="vac">
            <div className="vac-in">
              <div className="drop"><FilePdf size={28} /><b>vacature-ndt-inspector.pdf</b><small>of begin met een lege vacature</small></div>
              <button className="btn primary" onClick={parse} disabled={parsed > 0}><Sparkle size={16} /> Zet in velden</button>
            </div>
            <dl className="vac-out">{vacancyFields.map(([k, v], i) => <div key={k} className={i < parsed ? "in" : ""}><dt>{k}</dt><dd>{i < parsed ? v : "—"}</dd></div>)}
              {parsed === vacancyFields.length && <p className="ok-line"><Check size={14} /> Uit jouw document gehaald. Controleer en publiceer.</p>}</dl>
          </div>)}
        {t === "talent" && (
          <div className="talent">
            <div className="search"><MagnifyingGlass size={18} /><span>NDT Inspector</span></div>
            <div className="filters">{["Rotterdam + 30 km", "Beschikbaar", "UT2 verified", "Offshore", "max €65 p/u"].map((f) => <span key={f}>{f}</span>)}</div>
            <ul className="results">{candidates.map((c) => (
              <li key={c.name} className={pick === c.name ? "open" : ""}>
                <button className="res-main" aria-expanded={pick === c.name} onClick={() => { setPick(pick === c.name ? null : c.name); track("job_demo_interaction", { action: "why", who: c.name }); }}>
                  <span className="av">{c.name.split(" ").map((w) => w[0]).join("")}</span><span><b>{c.name}</b><small>{c.role} · {c.city} · {c.avail}</small></span><em className="match">{c.score}%</em>
                </button>
                {pick === c.name && <ul className="why">{c.why.map((w) => <li key={w}>{w}</li>)}</ul>}
                <button className={`btn sm ${short.includes(c.name) ? "primary" : ""}`} aria-pressed={short.includes(c.name)} onClick={() => toggleShort(c.name)}>{short.includes(c.name) ? <><Check size={14} /> Op shortlist</> : "Shortlist"}</button>
              </li>))}</ul>
            <p className="muted sm" aria-live="polite">{short.length ? `${short.length} op je shortlist` : "Klik een kandidaat voor de redenen."}</p>
          </div>)}
        {t === "chat" && <div className="bchat">{chat.map(([w, m]) => <p key={m} className={`bub ${w === "co" ? "me" : "co"}`}>{m}</p>)}<small className="muted">Je chat pas na wederzijdse interesse.</small></div>}
      </div>
    </div>
  );
}

export function CompanyProfile() {
  return (
    <div className="company">
      <div className="company-cover"><Video m={{ mp4: "media/hero-portrait.mp4", poster: "media/hero-portrait.jpg" }} label="Bedrijfsvideo Northshore Engineering (voorbeeld)" /></div>
      <div className="company-body">
        <div className="row"><span className="av big">NE</span><span><b>Northshore Engineering</b><small>Offshore & inspectie · Rotterdam</small></span></div>
        <div className="seg">{["Over", "Vacatures", "Projecten", "Team", "Werkplek"].map((s, i) => <span key={s} className={i === 2 ? "on" : ""}>{s}</span>)}</div>
        <div className="company-media">{[2, 6, 8].map((n) => <Pic key={n} src={`work/w${n}.jpg`} />)}</div>
        <ul className="company-points"><li><Clock size={14} /> Rotaties 14/14</li><li><UsersThree size={14} /> Team van 40 inspecteurs</li><li><ShieldCheck size={14} /> Opleidingsbudget voor level 3</li></ul>
      </div>
    </div>
  );
}

// ---- Managed Services ----------------------------------------------------------------
export function MspFlow() {
  const [ref, seen] = useInView(0.35, "msp_section_viewed");
  const nodes = [["Opdrachtgever", Buildings], ["Workstr", Sparkle], ["Talentpool + leveranciers", UsersThree], ["Professionals", Briefcase]];
  return (
    <div ref={ref} className={`msp ${seen ? "go" : ""}`}>
      <div className="msp-req">
        <small className="eyebrow">Aanvraag</small><b>{mspRequest.title}</b>
        <div className="chips">{mspRequest.meta.map((m) => <span key={m}>{m}</span>)}</div>
        <div className="chips req">{mspRequest.req.map((m) => <span key={m}>{m} verplicht</span>)}</div>
      </div>
      <ol className="msp-nodes">{nodes.map(([l, I], i) => <li key={l} style={{ "--i": i }}><I size={20} /><span>{l}</span></li>)}</ol>
      <p className="muted">Workstr zoekt eerst in de eigen talentpool en activeert daarna aangesloten leveranciers.</p>
    </div>
  );
}

export const MspDashboard = () => (
  <div className="mspdash">
    <aside>{mspModules.map((m, i) => <span key={m} className={i === 3 ? "on" : ""}>{m}</span>)}</aside>
    <div className="mspdash-main">
      <div className="kpis">{[["Open aanvragen", 12], ["Actieve externen", 148], ["Leveranciers", 9], ["Acties nodig", 7]].map(([l, v]) => <div key={l}><small>{l}</small><b>{v}</b></div>)}</div>
      <ComplianceDemo />
      <p className="muted sm">Voorbeeldweergave met fictieve gegevens.</p>
    </div>
  </div>
);

// ---- Demo 5: compliance status changes ------------------------------------------------
export function ComplianceDemo() {
  const [ref, seen] = useInView(0.4);
  const [items, setItems] = useState(compliance.items);
  const [sent, setSent] = useState(false);
  useEffect(() => { if (seen) wait(1600).then(() => setSent(true)); }, [seen]);
  const done = items.filter(([, s]) => s === "Verified").length;
  const pct = Math.round(((done + items.filter(([, s]) => s === "Uploaded" || s.startsWith("Verloopt")).length * 0.5) / items.length) * 100);
  const upload = () => { setItems((xs) => xs.map(([n, s]) => (n === "Client induction" ? [n, "Uploaded"] : [n, s]))); track("demo_completed", { demo: "compliance" }); };
  const kind = (s) => (s === "Verified" ? "ok" : s === "Ontbreekt" ? "no" : "warn");
  return (
    <div ref={ref} className="comp">
      <div className="row between"><b>{compliance.name}</b><span className="muted sm">NDT Inspector · Project Maasvlakte</span></div>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div><small className="muted">{pct}% klaar voor start</small>
      <ul>{items.map(([n, s]) => <li key={n}><span>{n}</span><em className={kind(s)}>{s === "Verified" ? "✓ " : s === "Ontbreekt" ? "✕ " : "⚠ "}{s}</em></li>)}</ul>
      <p className={`toastline ${sent ? "in" : ""}`} aria-live="polite">{sent && <><Bell size={14} /> Herinnering voor ontbrekend document verstuurd</>}</p>
      {items.some(([, s]) => s === "Ontbreekt") ? <button className="btn sm" onClick={upload}>Simuleer upload client induction</button>
        : <p className="muted sm">Geüpload, nog niet gecontroleerd. Pas na controle wordt het ‘Verified’.</p>}
    </div>
  );
}

// ---- AI agents + orchestration -----------------------------------------------------------
export function Agents() {
  const [ref] = useInView(0.3, "ai_section_viewed");
  return (
    <div ref={ref} className="agents">
      {agents.map((a, i) => (
        <Reveal key={a.name} className="agent" delay={(i % 3) * 80}><span className="pulse" aria-hidden /><b>{a.name}</b>{a.lines.map((l) => <small key={l}>{l}</small>)}</Reveal>
      ))}
      <p className="muted sm agents-note">Voorbeeldweergave van het Agent Center. Elke actie wordt gelogd.</p>
    </div>
  );
}

export function Orchestration() {
  const [ref, seen] = useInView(0.4);
  const human = orchestration.indexOf("Menselijke goedkeuring");
  const [s, setS] = useState(-1);
  useEffect(() => { if (!seen) return; (async () => { for (let i = 0; i <= human; i++) { await wait(800); setS(i); } })(); }, [seen, human]);
  return (
    <div ref={ref} className="orch">
      <ol>{orchestration.map((t, i) => <li key={t} className={`${i <= s ? "done" : ""} ${i === human ? "human" : ""} ${i === s ? "now" : ""}`}><span className="dot" aria-hidden />{t}
        {i === human && s === human && <button className="btn primary sm" onClick={() => setS(human + 1)}>Keur goed</button>}</li>)}</ol>
      <p className="muted sm" aria-live="polite">{s > human ? "Goedgekeurd door een mens. Klaar voor onboarding." : s === human ? "Wacht op jouw akkoord — AI beslist dit niet zelf." : "Agents bereiden voor…"}</p>
    </div>
  );
}

export function AiCapabilities() {
  return (
    <div className="caps">
      {aiCapabilities.map((c, i) => (
        <Reveal key={c.title} className="cap" delay={(i % 3) * 80}>
          <div className="cap-demo" aria-hidden><span className="cap-from">{c.from}</span><ArrowRight size={14} /><span className="cap-to">{c.to.map((t, k) => <i key={t} style={{ "--i": k }}>{t}</i>)}</span></div>
          <h3>{c.title}</h3><p className="muted">{c.text}</p>
        </Reveal>
      ))}
    </div>
  );
}

// ---- Sectors filmstrip, roadmap, flywheel ------------------------------------------------
export const Industries = () => (
  <div className="strip" tabIndex={0} aria-label="Eerste focussectoren">
    {industries.map(([l, p]) => <figure key={l}><Pic src={p} alt="" /><figcaption>{l}</figcaption></figure>)}
    <figure className="more"><figcaption>En dit is pas het begin.</figcaption></figure>
  </div>
);

export function Roadmap() {
  const [t, setT] = useState(0);
  return (
    <div className="road">
      <div className="road-tabs" role="tablist" aria-label="Roadmap">{roadmap.map(([l], i) => <button key={l} role="tab" aria-selected={t === i} onClick={() => setT(i)}>{l}</button>)}</div>
      <div role="tabpanel" aria-label={roadmap[t][0]}><ul key={t}>{roadmap[t][1].map((x, i) => <li key={x} style={{ "--i": i }}>{x}</li>)}</ul></div>
    </div>
  );
}

export function Flywheel() {
  const [a, setA] = useState(0);
  useEffect(() => { if (reduced()) return undefined; const id = setInterval(() => setA((x) => (x + 1) % flywheel.length), 2200); return () => clearInterval(id); }, []);
  return (
    <div className="fly">
      <ol>{flywheel.map((f, i) => <li key={f} style={{ "--a": `${(360 / flywheel.length) * i}deg` }} className={i === a ? "on" : ""}><button onClick={() => setA(i)} aria-current={i === a ? "step" : undefined}>{f}</button></li>)}</ol>
      <div className="fly-core"><Pic src={person.photo} className="avatar" /><b>{flywheel[a]}</b></div>
    </div>
  );
}

