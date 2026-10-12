import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight, CheckCircle, WarningCircle, Sparkle, Robot, ShieldCheck, Timer, Truck, FileText, Moon, Sun, List, X,
  MagnifyingGlass, Compass, UserCircle, Buildings, Plus,
} from "@phosphor-icons/react";
import { Logo, initials } from "../platform/ui.jsx";
import { talent, plans } from "../platform/data.js";
import "../platform/platform.css";
import "./site.css";

const APP = "./app.html";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal-on-scroll + "start when visible" in one tiny hook.
function useInView(opts = { threshold: 0.3 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), opts);
    ref.current && io.observe(ref.current);
    return () => io.disconnect();
  }, []); // eslint-disable-line
  return [ref, seen];
}

function useTheme() {
  const [t, setT] = useState(() => localStorage.getItem("workstr.theme") || "dark");
  useEffect(() => { document.documentElement.dataset.theme = t; localStorage.setItem("workstr.theme", t); }, [t]);
  return [t, () => setT(t === "dark" ? "light" : "dark")];
}

function Nav() {
  const [theme, toggle] = useTheme();
  const [open, setOpen] = useState(false);
  const links = [["#product", "Product"], ["#professionals", "Voor professionals"], ["#bedrijven", "Voor bedrijven"], ["#msp", "MSP"], ["#prijzen", "Prijzen"]];
  return (
    <header className="s-nav">
      <a href="#top" aria-label="Workstr home"><Logo /></a>
      <nav id="s-menu" className={open ? "open" : ""} aria-label="Hoofdnavigatie">
        {links.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}
      </nav>
      <div className="row">
        <button className="icon-btn s-sm" onClick={toggle} aria-label={theme === "dark" ? "Lichte modus" : "Donkere modus"}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
        <a className="btn ghost s-hide-m" href={`${APP}#/business`}>Inloggen</a>
        <a className="btn primary" href={APP}>Probeer de app</a>
        <button className="icon-btn s-sm s-burger" aria-label="Menu" aria-expanded={open} aria-controls="s-menu" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <List size={18} />}</button>
      </div>
    </header>
  );
}

// ---------------- Hero: search box that types and matches (rule-based on demo talent) ----------------
const QUERIES = [
  { q: "UT2 inspecteur, offshore, regio Rotterdam", skills: ["UT", "Offshore"] },
  { q: "PAUT / ToFD level 2, per direct beschikbaar", skills: ["PAUT", "ToFD"] },
  { q: "Welding inspector CSWIP 3.1 in Zeeland", skills: ["Weld Inspection", "WPS"] },
];
function HeroSearch() {
  const [i, setI] = useState(0);
  const [n, setN] = useState(reduced() ? 999 : 0);
  const q = QUERIES[i];
  useEffect(() => {
    if (reduced()) return;
    if (n < q.q.length) { const t = setTimeout(() => setN(n + 1), 38); return () => clearTimeout(t); }
    const t = setTimeout(() => { setI((i + 1) % QUERIES.length); setN(0); }, 3600);
    return () => clearTimeout(t);
  }, [n, i]); // eslint-disable-line
  const done = n >= q.q.length;
  const hits = talent.map((x) => ({ x, s: 70 + 10 * q.skills.filter((k) => x.skills.includes(k)).length + (x.availability === "now" ? 6 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 3);
  return (
    <div className="s-search">
      <div className="s-searchbox"><MagnifyingGlass size={18} /><span>{q.q.slice(0, n)}<i className="s-caret" /></span><span className="s-go"><ArrowRight size={16} /></span></div>
      <p className={`s-found ${done ? "on" : ""}`}><Sparkle size={14} /> {hits.length} geverifieerde professionals gevonden</p>
      <div className="s-cards">
        {hits.map(({ x, s }, k) => (
          <article key={x.id + i} className={`s-pcard ${done ? "on" : ""}`} style={{ transitionDelay: `${k * 120}ms` }}>
            <div className="row"><span className="avatar">{initials(x.name)}</span>
              <span className="grow"><b>{x.name}</b><br /><span className="xs muted">{x.headline}</span></span></div>
            <div className="row wrap">{x.certs.slice(0, 3).map((c) => <span key={c.name} className="chip">{c.verified ? "✓ " : ""}{c.name}</span>)}</div>
            <div className="row between"><span className="xs muted">{x.city} · €{x.rate}/u</span><span className="match">{Math.min(s, 98)}%</span></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="s-hero" id="top">
      <span className="s-pill"><span className="s-dot" />Nu in pilot: technische arbeidsmarkt</span>
      <h1>Less searching.<br /><span className="s-dim">More working.</span></h1>
      <p className="s-lead">Workstr is het werkplatform waar professionals hun werkidentiteit bouwen, kansen ontdekken — en bedrijven hun complete workforce beheren.</p>
      <div className="row s-ctas"><a className="btn primary" href={APP}>Probeer de app <ArrowRight size={16} /></a><a className="btn" href={`${APP}#/business`}>Bekijk Workstr Business</a></div>
      <HeroSearch />
    </section>
  );
}

function Strip() {
  const s = ["NDT", "QA/QC", "Welding", "Mechanical", "Maintenance", "Offshore", "Energy", "Industrial", "Construction"];
  return (
    <section className="s-strip" aria-label="Sectoren">
      <p className="xs muted">Gebouwd voor vakmensen waar certificaten en projecten tellen</p>
      <div className="s-marquee"><div>{[...s, ...s].map((x, k) => <span key={k} aria-hidden={k >= s.length}>{x}</span>)}</div></div>
    </section>
  );
}

// ---------------- Tabbed product section (Discover / Build / Manage / Operate) ----------------
function Phone() {
  const [ref, seen] = useInView({ threshold: 0.1 });
  return <div ref={ref} className="s-phone">{seen ? <iframe title="Workstr app live demo" src={APP} loading="lazy" /> : null}</div>;
}
const TABS = [
  { id: "discover", icon: Compass, label: "Discover", h: "Werk ontdekken dat écht past", p: "Een visuele feed met echte werkbeelden. Elke match legt uit waarom: certificaten, radius, tarief, beschikbaarheid. Geen eindeloos scrollen — wekelijks een selectie.", art: <Phone /> },
  { id: "build", icon: UserCircle, label: "Build", h: "Een profiel dat vanzelf groeit", p: "Upload foto's van een project, schrijf één zin. Workstr stelt titel, skills en sector voor — jij keurt goed. Je CV genereert zichzelf.", art: <BuildArt /> },
  { id: "manage", icon: Buildings, label: "Manage", h: "Recruitment en externe inhuur in één", p: "Vacature plakken, gestructureerd publiceren, talent zoeken op skills en certificaten. Groei door naar leveranciers, compliance en uren.", art: <ManageArt /> },
  { id: "operate", icon: Robot, label: "AI Operations", h: "Agents doen het werk. Jij houdt regie.", p: "Support, compliance, leveranciers, contracten en finance. Elke actie gelogd, uitzonderingen naar een mens.", art: <AgentArt /> },
];
function Product() {
  const [t, setT] = useState(0);
  const cur = TABS[t];
  return (
    <section className="s-sec" id="product">
      <h2 className="s-h2">Eén platform.<br /><span className="s-dim">Discover, Build en Manage.</span></h2>
      <p className="s-sub">Swipen is een discovery-mechanisme. Het echte verschil is het ecosysteem eromheen.</p>
      <div className="s-tabs" role="tablist">
        {TABS.map((x, k) => <button key={x.id} role="tab" aria-selected={t === k} onClick={() => setT(k)}><x.icon size={18} />{x.label}</button>)}
      </div>
      <div className="s-split" role="tabpanel">
        <div className="stack s-copy"><span className="s-ico"><cur.icon size={20} /></span><h3>{cur.h}</h3><p className="muted">{cur.p}</p>
          <a className="s-link" href={APP}>Probeer het live <ArrowRight size={14} /></a></div>
        <div className="s-art">{cur.art}</div>
      </div>
    </section>
  );
}

function BuildArt() {
  return (
    <div className="s-mock stack">
      <div className="s-mock-in"><span className="xs muted">Jij schreef</span><p>“UT inspecties uitgevoerd aan offshore jacket.”</p></div>
      <div className="ai-note"><Sparkle size={16} />AI-voorstel — controleer voordat het in je profiel komt</div>
      <div className="s-mock-in stack" style={{ gap: 8 }}>
        <div className="row between"><b>Offshore Jacket Inspection</b><span className="tag">Offshore</span></div>
        <div className="row wrap">{["UT", "NDT", "Weld Inspection", "Offshore"].map((s) => <span key={s} className="chip">{s}</span>)}</div>
        <span className="xs muted">jan 2026 – apr 2026</span>
      </div>
      <div className="row"><span className="btn primary sm"><CheckCircle size={14} />Goedkeuren</span><span className="btn sm">Aanpassen</span></div>
    </div>
  );
}
function ManageArt() {
  return (
    <div className="s-mock stack">
      <div className="row between"><b>Talent</b><span className="xs muted">UT Inspector · Rotterdam · max €65/u</span></div>
      {talent.slice(0, 4).map((x, k) => (
        <div key={x.id} className="s-mock-in row"><span className="avatar">{initials(x.name)}</span>
          <span className="grow"><b>{x.name}</b><br /><span className="xs muted">{x.headline}</span></span><span className="match">{94 - k * 5}%</span></div>
      ))}
    </div>
  );
}
function AgentArt() {
  const rows = [["Compliance Agent", "AI", "Vervaldatum gelezen uit foto Offshore Medical"], ["Workflow", "Regel", "Herinnering 30 dagen voor verloop"], ["Supplier Agent", "AI", "Follow-up na 48 uur zonder kandidaat"], ["Contract Agent", "Mens", "Verlenging goedgekeurd door MSP-beheerder"]];
  return (
    <div className="s-mock stack">
      {rows.map(([a, k, txt]) => <div key={txt} className="s-mock-in row"><span className={`tag ${k === "AI" ? "ai" : k === "Mens" ? "human" : "rule"}`}>{k}</span><span className="sm"><b>{a}</b> — {txt}</span></div>)}
    </div>
  );
}

// ---------------- "Van vraag tot plaatsing" — prompt → tool calls → result ----------------
const FLOWS = [
  { tab: "Aanvraag", prompt: "Ik heb 5 NDT inspecteurs nodig vanaf 2 november in Rotterdam. UT2, VCA, BOSIET.",
    steps: [["requests.create", "Aangemaakt"], ["talent.match", "12 matches"], ["suppliers.notify", "3 leveranciers"]],
    result: (<div className="stack" style={{ gap: 8 }}><div className="row between"><b>5x NDT Inspector</b><span className="tag">Sourcing</span></div>
      <div className="bar"><i style={{ width: "40%" }} /></div><span className="xs muted">2/5 ingevuld · 12 kandidaten · deadline leveranciers 48u</span></div>) },
  { tab: "Compliance", prompt: "Wie mag maandag niet offshore? Check alle certificaten.",
    steps: [["documents.read", "86 verwerkt"], ["compliance.check", "4 medewerkers"], ["notify.workers", "2 herinneringen"]],
    result: (<ul className="reasons"><li><CheckCircle size={18} weight="fill" className="ok" />Youssef — alles geldig</li><li><WarningCircle size={18} weight="fill" className="warn" />Sem — Offshore Medical verloopt over 21 dagen</li><li><WarningCircle size={18} weight="fill" className="no" />Pieter — VCA verlopen, niet inzetbaar</li></ul>) },
  { tab: "Timesheets", prompt: "Controleer de uren van week 41 tegen de contracten.",
    steps: [["timesheets.list", "4 ingediend"], ["rates.compare", "1 afwijking"], ["finance.flag", "Wacht op mens"]],
    result: (<table className="t"><tbody><tr><td>Sem de Snoo</td><td>50u</td><td style={{ color: "var(--ok)" }}>✓ klopt</td></tr><tr><td>Youssef</td><td>46u</td><td className="issue">6 overuren</td></tr><tr><td>Pieter</td><td>32u</td><td className="issue">€75 ≠ €72</td></tr></tbody></table>) },
];
function Flow() {
  const [t, setT] = useState(0);
  const [step, setStep] = useState(0);
  const [ref, seen] = useInView();
  useEffect(() => { setStep(reduced() ? 9 : 0); }, [t]);
  useEffect(() => {
    if (!seen || step > 3) return;
    const id = setTimeout(() => setStep(step + 1), 700);
    return () => clearTimeout(id);
  }, [seen, step]);
  const f = FLOWS[t];
  return (
    <section className="s-sec" id="msp" ref={ref}>
      <h2 className="s-h2">Van vraag tot plaatsing.</h2>
      <p className="s-sub">Stel een vraag in gewone taal. Workstr-agents voeren de stappen uit en laten zien wat ze deden.</p>
      <div className="s-seg" role="tablist">{FLOWS.map((x, k) => <button key={x.tab} role="tab" aria-selected={t === k} onClick={() => setT(k)}>{x.tab}</button>)}</div>
      <div className="s-console">
        <div className="s-prompt"><span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>MSP</span><p>{f.prompt}</p></div>
        <div className="s-steps"><span className="xs muted"><Robot size={14} /> Workstr AI Orchestrator</span>
          <ol>{f.steps.map(([tool, out], k) => (
            <li key={tool} className={step > k ? "on" : ""}><code>{tool}</code><span className="grow" />{step > k ? <span className="badge verified">{out}</span> : <span className="s-spin" aria-hidden />}</li>
          ))}</ol></div>
        <div className={`s-result ${step > 3 ? "on" : ""}`}>{f.result}</div>
      </div>
    </section>
  );
}

function OldNew() {
  const old = ["Vacatures zoeken", "Lange teksten lezen", "Verouderd CV uploaden", "Motivatiebrief schrijven", "Wachten op reactie"];
  const neu = ["Ontdekken in een visuele feed", "Begrijpen waarom het past", "Match zien op skills én certificaten", "Interesse tonen met één tik", "Direct contact met het bedrijf"];
  return (
    <section className="s-sec" id="professionals">
      <h2 className="s-h2"><span className="s-dim">Vacaturebanken</span> zijn verleden tijd.</h2>
      <p className="s-sub">Een statisch CV en een functietitel zeggen weinig. Werk dat je hebt gedaan zegt alles.</p>
      <div className="s-vs">
        <div className="card flat"><span className="tag">De oude manier</span><ol className="s-old">{old.map((x) => <li key={x}>{x}</li>)}</ol></div>
        <div className="card s-new"><span className="tag ai">Met Workstr</span><ol>{neu.map((x) => <li key={x}><CheckCircle size={18} weight="fill" className="ok" />{x}</li>)}</ol></div>
      </div>
    </section>
  );
}

function Admin() {
  const items = [
    [ShieldCheck, "Compliance zonder spreadsheets", "Vervaldatums zijn regels, geen gok. AI leest alleen het document uit.", <code key="c">BOSIET · verloopt over 21 dagen → herinnering</code>],
    [Timer, "Uren die kloppen", "Elke timesheet automatisch tegen het contracttarief gelegd.", <code key="c">46u · 6 overuren niet goedgekeurd</code>],
    [Truck, "Leveranciers die opvolgen", "Geen reactie na 48 uur? De Supplier Agent stuurt een follow-up.", <code key="c">InspectPro · follow-up verstuurd</code>],
    [FileText, "Contracten met een mens erin", "Concepten worden voorbereid. Besluiten neem jij.", <code key="c">Verlenging · wacht op goedkeuring</code>],
  ];
  return (
    <section className="s-sec" id="bedrijven">
      <h2 className="s-h2">Minder administratie.<br /><span className="s-dim">Meer plaatsingen.</span></h2>
      <p className="s-sub">Normale software voor voorspelbare processen. AI voor taal, documenten en uitzonderingen.</p>
      <div className="s-grid4">{items.map(([I, h, p, c]) => <div key={h} className="card stack"><I size={22} /><h3>{h}</h3><p className="muted sm">{p}</p><div className="s-code">{c}</div></div>)}</div>
    </section>
  );
}

function Chart() {
  const pts = [12, 18, 15, 24, 30, 28, 38, 44, 41, 52, 60, 66];
  const w = 600, h = 180, max = 70;
  const d = pts.map((v, k) => `${k ? "L" : "M"}${(k * w) / (pts.length - 1)},${h - (v / max) * h}`).join(" ");
  const [ref, seen] = useInView();
  return (
    <section className="s-sec" ref={ref}>
      <h2 className="s-h2">Elke plaatsing.<br /><span className="s-dim">Meetbaar.</span></h2>
      <p className="s-sub">We optimaliseren niet voor scrolltijd, maar voor gesprekken, plaatsingen en retentie.</p>
      <div className="s-dash card">
        <div className="row between wrap"><b>Plaatsingen per week</b><span className="xs muted">Voorbeelddata · 12 weken</span></div>
        <svg viewBox={`0 0 ${w} ${h}`} className={`s-line ${seen ? "on" : ""}`} role="img" aria-label="Lijngrafiek van plaatsingen die stijgen over 12 weken">
          <path d={`${d} L${w},${h} L0,${h} Z`} className="area" /><path d={d} className="stroke" pathLength="1" />
        </svg>
        <div className="s-kpis">{[["Match → gesprek", "38%"], ["Gesprek → plaatsing", "22%"], ["Time-to-hire", "11 d"], ["Profielcompletion", "81%"]].map(([l, v]) => <div key={l}><span className="xs muted">{l}</span><b>{v}</b></div>)}</div>
      </div>
    </section>
  );
}

function Products() {
  const p = [["App", "Voor professionals", "Work Profile, Discover, matches, chat, automatisch CV.", "#/app"],
    ["Business", "Voor werkgevers", "Vacatures, talent search, berichten en analytics.", "#/business"],
    ["MSP", "Voor enterprise", "Requests, leveranciers, compliance, contracten, uren en agents.", "#/msp"]];
  return (
    <section className="s-sec">
      <h2 className="s-h2">Begin met één.<br /><span className="s-dim">Groei naar alles.</span></h2>
      <p className="s-sub">Hetzelfde ecosysteem, drie interfaces. Simpel voor de kandidaat, krachtig voor de enterprise.</p>
      <div className="s-grid3">{p.map(([n, who, txt, h]) => (
        <a key={n} href={APP + h} className="card s-prod"><span className="xs muted">{who}</span><Logo size={24} sub={n} /><p className="muted sm">{txt}</p><span className="s-link">Open {n} <ArrowRight size={14} /></span></a>
      ))}</div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="s-sec" id="prijzen">
      <h2 className="s-h2">Prijzen</h2>
      <p className="s-sub">Gratis voor professionals. Altijd. Werkgevers betalen voor resultaat-tools.</p>
      <div className="plans">{plans.map((x) => (
        <div key={x.name} className={`card stack ${x.name === "Starter" ? "cur" : ""}`}><div className="row between"><h3>{x.name}</h3>{x.name === "Starter" && <span className="tag ai">Populair</span>}</div>
          <b style={{ fontSize: 36, letterSpacing: "-.03em" }}>{x.price}<span className="sm muted"> /mnd</span></b>
          <ul className="reasons">{x.items.map((i) => <li key={i}><CheckCircle size={18} weight="fill" className="ok" />{i}</li>)}</ul>
          <a className={`btn ${x.name === "Starter" ? "primary" : ""}`} href={`${APP}#/business`}>Start {x.name}</a></div>
      ))}</div>
      <p className="xs muted" style={{ marginTop: 12 }}>MSP: management fee per gewerkt uur of per actieve externe — op aanvraag. Prijzen indicatief tijdens de pilot.</p>
    </section>
  );
}

function Control() {
  return (
    <section className="s-sec">
      <h2 className="s-h2">Schaal zonder<br /><span className="s-dim">de controle te verliezen.</span></h2>
      <p className="s-sub">AI bereidt voor en signaleert. Mensen beslissen over aannemen, contracten en betalingen. Transparant onder AVG en AI Act.</p>
      <div className="s-grid3">{[["Elke agentactie gelogd", "Wie, wat, wanneer — AI, regel of mens."], ["Nooit autonoom uitsluiten", "Elke match is uitlegbaar en corrigeerbaar."], ["Jij bepaalt wat je deelt", "Agents gebruiken alleen data waarvoor toestemming is."]].map(([h, p]) => <div key={h} className="card stack"><ShieldCheck size={22} /><h3>{h}</h3><p className="muted sm">{p}</p></div>)}</div>
    </section>
  );
}

function Faq() {
  const qs = [["Is Workstr een swipe-app?", "Nee. Swipen is één manier om werk te ontdekken. Workstr draait om je Work Profile: projecten, certificaten en skills die meegroeien met je carrière."],
    ["Verzint de AI ervaring in mijn profiel?", "Nooit. AI structureert alleen wat jij schrijft en uploadt. Jij controleert en keurt alles goed."],
    ["Wanneer is een certificaat ‘Verified’?", "Pas na controle bij de uitgever. Een upload krijgt eerst de status Uploaded."],
    ["Wat kost Workstr voor professionals?", "Niets. Werkgevers betalen per abonnement; MSP-klanten via een management fee."],
    ["Voor welke sectoren is Workstr?", "We starten in de technische markt — NDT, QA/QC, welding, offshore en energy — en breiden daarna uit naar bouw, installatie en meer."]];
  return (
    <section className="s-sec s-narrow">
      <h2 className="s-h2">Veelgestelde vragen</h2>
      <div className="s-faq">{qs.map(([q, a]) => <details key={q}><summary>{q}<Plus size={18} /></summary><p className="muted">{a}</p></details>)}</div>
    </section>
  );
}

function Footer() {
  const cols = [["Product", [["App", "#/app"], ["Business", "#/business"], ["MSP", "#/msp"]]], ["Bedrijf", [["Over Workstr", "#top"], ["Pilot", "#top"], ["Contact", "mailto:hello@workstr.ai"]]], ["Juridisch", [["Privacy", "#top"], ["AI-transparantie", "#top"], ["Voorwaarden", "#top"]]]];
  return (<>
    <section className="s-final">
      <h2>Work should find you.</h2>
      <div className="row s-ctas"><a className="btn primary" href={APP}>Probeer de app <ArrowRight size={16} /></a><a className="btn" href="mailto:hello@workstr.ai">Neem contact op</a></div>
    </section>
    <footer className="s-foot">
      <div className="stack"><Logo size={26} /><p className="muted sm">Professional Identity + Job Discovery + Recruitment + Workforce Management.</p></div>
      {cols.map(([h, ls]) => <div key={h} className="stack" style={{ gap: 8 }}><b className="sm">{h}</b>{ls.map(([l, u]) => <a key={l} className="sm muted" href={u.startsWith("#/") ? APP + u : u}>{l}</a>)}</div>)}
      <p className="xs muted s-copy-r">© {new Date().getFullYear()} Workstr · Gemaakt in Nederland</p>
    </footer>
  </>);
}

export default function Site() {
  return (<><Nav /><main><Hero /><Strip /><Product /><Flow /><OldNew /><Admin /><Chart /><Products /><Pricing /><Control /><Faq /></main><Footer /></>);
}
