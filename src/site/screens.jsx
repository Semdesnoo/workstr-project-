// HTML/CSS mockups of the Workstr app screens (same look as the real prototype in app.html).
import React, { useEffect, useRef, useState } from "react";
import { House, Sparkle, Plus, ChatCircle, User, Heart, BookmarkSimple, CheckCircle, WarningCircle, XCircle, MapPin, FilePdf, PaperPlaneRight } from "@phosphor-icons/react";
import { jobs, person, chat } from "./content.js";
import { Pic } from "./ui.jsx";
import { reduced, track } from "./lib.js";

const initials = (s) => s.split(" ").map((w) => w[0]).slice(0, 2).join("");
const Icon = { ok: CheckCircle, warn: WarningCircle, no: XCircle };
export const Reason = ({ r: [type, text], i = 0 }) => { const I = Icon[type]; return <li className={`rs ${type}`} style={{ "--i": i }}><I size={16} weight="fill" aria-hidden /><span>{text}</span></li>; };

export const TabBar = ({ active = "discover" }) => (
  <div className="tabbar" aria-hidden>
    {[["discover", House, "Discover"], ["matches", Sparkle], ["create", Plus], ["inbox", ChatCircle], ["profile", User]].map(([k, I, l]) => (
      <span key={k} className={k === active ? "on" : ""}><I size={15} weight={k === active ? "fill" : "regular"} />{k === active && (l || k[0].toUpperCase() + k.slice(1))}</span>))}
  </div>
);

// Discover feed. auto = scrolls itself (hero); otherwise the visitor scrolls it.
export function Feed({ auto, onPick }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!auto || reduced()) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % jobs.length), 2800);
    return () => clearInterval(t);
  }, [auto]);
  useEffect(() => { if (auto) ref.current?.scrollTo({ top: i * ref.current.clientHeight, behavior: "smooth" }); }, [i, auto]);
  return (
    <div className="scr feed">
      <div className={`feed-list ${auto ? "auto" : ""}`} ref={ref} tabIndex={auto ? undefined : 0} aria-label="Vacatures, scroll voor de volgende"
        onScroll={auto ? undefined : () => track("job_demo_interaction", { action: "scroll" })}>
        {jobs.map((j) => (
          <article key={j.id} className="feed-item">
            <Pic src={j.photo} />
            <div className="rail" aria-hidden><span className="rail-co">{initials(j.co)}</span><span><Heart size={22} weight="fill" />Like</span><span><BookmarkSimple size={20} weight="fill" />Opslaan</span></div>
            <button className="infobar" tabIndex={onPick ? 0 : -1} onClick={() => onPick?.(j)}>
              <span className="ib-row"><b className="ib-co">{j.co}</b><span className="match">{j.score}% match</span></span>
              <b className="ib-title">{j.title}</b>
              <span className="ib-meta">{j.city} · {j.rate} · {j.type}</span>
            </button>
          </article>
        ))}
      </div>
      <TabBar />
    </div>
  );
}

export const MatchesScreen = () => (
  <div className="scr light">
    <b className="scr-h">Matches</b>
    <p className="scr-sub">3 kansen die echt passen</p>
    {jobs.slice(0, 3).map((j) => (
      <div key={j.id} className="mrow"><Pic src={j.photo} /><span><b>{j.title}</b><small>{j.co}</small></span><span className="match">{j.score}%</span></div>
    ))}
    <div className="mcard"><b>Waarom NDT Inspector past</b><ul>{jobs[0].reasons.slice(0, 4).map((r) => <Reason key={r[1]} r={r} />)}</ul></div>
    <TabBar active="matches" />
  </div>
);

export const ProfileScreen = () => (
  <div className="scr light">
    <div className="prof-head"><Pic src={person.photo} className="avatar" /><span><b>{person.name}</b><small>{person.role}</small><small><MapPin size={11} /> {person.city}</small></span></div>
    <div className="bar"><i style={{ width: "88%" }} /></div><small className="scr-sub">Work Profile 88% compleet</small>
    <div className="chips">{person.skills.map((s) => <span key={s}>{s}</span>)}</div>
    <div className="proj"><Pic src={jobs[0].photo} /><span><b>{person.project.title}</b><small>{person.project.period}</small></span></div>
    <div className="certs">{person.certs.map(([c, s]) => <span key={c}><b>{c}</b><em className={s === "Verified" ? "ok" : ""}>{s}</em></span>)}</div>
    <TabBar active="profile" />
  </div>
);

export const ChatScreen = ({ n = 3 }) => (
  <div className="scr light chat">
    <div className="chat-head"><span className="rail-co">NE</span><b>Northshore Engineering</b></div>
    <div className="sys">It's a match · NDT Inspector</div>
    {chat.slice(0, n).map(([who, t]) => <p key={t} className={`bub ${who}`}>{t}</p>)}
    <div className="composer" aria-hidden><span>Bericht</span><PaperPlaneRight size={14} weight="fill" /></div>
  </div>
);

export const ProjectScreen = () => (
  <div className="scr light">
    <b className="scr-h">Project toevoegen</b>
    <div className="upl"><Pic src={jobs[0].photo} /><small>{person.project.file}</small></div>
    <p className="quote">“{person.project.text}”</p>
    <div className="mcard"><b>{person.project.title}</b><div className="chips">{person.project.skills.map((s) => <span key={s}>{s}</span>)}</div></div>
    <span className="pill-btn">Goedkeuren en toevoegen</span>
  </div>
);

export const CertsScreen = () => (
  <div className="scr light">
    <b className="scr-h">Certificaten</b>
    {[["UT2", "Verified", "ok", "geldig tot 03-2028"], ["BOSIET", "Verloopt binnenkort", "warn", "geldig tot 12-2026"], ["VCA", "Uploaded", "", "geldig tot 08-2027"], ["CSWIP 3.1", "Missing", "no", "nog niet toegevoegd"]].map(([c, s, k, d]) => (
      <div key={c} className="crow"><span><b>{c}</b><small>{d}</small></span><em className={k}>{s}</em></div>))}
    <TabBar active="profile" />
  </div>
);

export const AvailabilityScreen = () => (
  <div className="scr light">
    <b className="scr-h">Beschikbaarheid</b>
    <div className="chips sel">{["Per direct", "Over 2 weken", "Over 1 maand", "Vanaf datum"].map((s, i) => <span key={s} className={i === 0 ? "on" : ""}>{s}</span>)}</div>
    <small className="scr-sub">Contractvorm</small>
    <div className="chips sel">{["Freelance", "Project", "Vast"].map((s, i) => <span key={s} className={i < 2 ? "on" : ""}>{s}</span>)}</div>
    <small className="scr-sub">Reisafstand: 80 km · min. €45 p/u</small>
    <div className="bar"><i style={{ width: "40%" }} /></div>
    <TabBar active="profile" />
  </div>
);

export const CvScreen = () => (
  <div className="scr light">
    <div className="cvdoc"><b>{person.name}</b><small>{person.role} · {person.city}</small><hr /><small>PROJECTEN</small><span>{person.project.title}</span><small>CERTIFICATEN</small><span>UT2 · BOSIET · VCA</span><small>SKILLS</small><span>{person.skills.join(" · ")}</span></div>
    <span className="pill-btn"><FilePdf size={14} weight="fill" /> Generate my CV</span>
  </div>
);

export const DetailScreen = ({ j = jobs[0] }) => (
  <div className="scr light detail">
    <Pic src={j.photo} className="det-hero" />
    <div className="det-sheet"><b className="det-t">{j.title}</b><small>{j.co} · {j.city}</small>
      <div className="mcard"><b>Waarom dit bij jou past</b><ul>{j.reasons.map((r) => <Reason key={r[1]} r={r} />)}</ul></div>
      <span className="pill-btn">Solliciteer</span></div>
  </div>
);

export const SCREENS = { discover: () => <Feed />, matches: MatchesScreen, profile: ProfileScreen, project: ProjectScreen, certs: CertsScreen, availability: AvailabilityScreen, chat: ChatScreen, cv: CvScreen, detail: DetailScreen };
