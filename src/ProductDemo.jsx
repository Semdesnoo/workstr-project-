import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from "motion/react";
import {
  X, FileArrowUp, Sparkle, ArrowRight, Heart, Check, ChatCircleDots,
  MapPin, Clock, Buildings, User, PaperPlaneRight, Lightning, ThumbsUp,
  ThumbsDown, CaretLeft, Star, Cards, ChatCircle, UserCircle, CaretRight,
  SignOut, Envelope, Lock, AppleLogo, GoogleLogo, WifiHigh, CellSignalFull,
  BatteryFull, Eye, EyeSlash, ShieldCheck, Timer, CalendarCheck,
} from "@phosphor-icons/react";
import { analyzeCV, optimizeJob, matchScore, icebreaker, isLiveAI } from "./ai.js";
import "./product.css";

// --- Demo data ---------------------------------------------------------------

const DEMO_JOBS = [
  {
    id: "j-design", title: "Brand Designer", company: "Studio Noord",
    location: "Rotterdam", time: "32-40 uur", salary: "€ 3.200 - € 4.200",
    image: "creative", category: "Creatief",
    blurb: "Bouw merken met een nieuwsgierig team. Van eerste schets tot campagne op straat.",
    skills: ["Figma", "Branding", "Samenwerken", "Adobe Suite"],
  },
  {
    id: "j-dev", title: "Frontend Developer", company: "Forma Digital",
    location: "Utrecht", time: "32-40 uur", salary: "€ 3.500 - € 4.800",
    image: "developer", category: "Tech",
    blurb: "Maak toegankelijke interfaces in een klein, betrokken productteam.",
    skills: ["React", "TypeScript", "Samenwerken", "Nauwkeurigheid"],
  },
  {
    id: "j-coffee", title: "Barista", company: "Koffie Collectief",
    location: "Amsterdam", time: "24-32 uur", salary: "€ 2.500 - € 2.900",
    image: "barista", category: "Hospitality",
    blurb: "Maak de ochtend van je gasten. Specialty coffee in een buurtcafé met karakter.",
    skills: ["Gastvrijheid", "Koffie", "Klantcontact", "Samenwerken"],
  },
];

const DEMO_CANDIDATES = [
  {
    id: "c-1", name: "Sanne de Vries", role: "Brand Designer", location: "Rotterdam",
    image: "creative", experience: "6 jaar", available: "Per direct",
    blurb: "Ontwerpt merken die blijven hangen. Houdt van strak werk en heldere concepten.",
    skills: ["Figma", "Branding", "Adobe Suite", "Samenwerken"],
  },
  {
    id: "c-2", name: "Youssef El Amrani", role: "Frontend Developer", location: "Utrecht",
    image: "developer", experience: "4 jaar", available: "Binnen 1 maand",
    blurb: "Bouwt snelle, toegankelijke interfaces. Denkt in componenten en gebruikers.",
    skills: ["React", "TypeScript", "Nauwkeurigheid", "Samenwerken"],
  },
  {
    id: "c-3", name: "Lisa Bakker", role: "Hospitality Professional", location: "Amsterdam",
    image: "barista", experience: "3 jaar", available: "Per direct",
    blurb: "Maakt van elke gast een terugkerende gast. Energie en oog voor detail.",
    skills: ["Gastvrijheid", "Koffie", "Klantcontact", "Samenwerken"],
  },
];

const titleOf = (it, kind) => (kind === "job" ? it.title : it.name);
const subtitleOf = (it, kind) => (kind === "job" ? it.company : it.role);

// --- Small UI atoms ----------------------------------------------------------

function Typing() {
  return <span className="pd-typing" aria-label="AI is bezig"><span /><span /><span /></span>;
}

function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="pd-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--u-ring-track)" strokeWidth="6" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--u-accent)" strokeWidth="6"
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDasharray: c, strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * score) / 100 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

// --- Swipe card --------------------------------------------------------------

function SwipeCard({ item, kind, top, onDecision, matchInfo, blind }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-30, -140], [0, 1]);

  function end(_, info) {
    if (!top) return;
    if (info.offset.x > 120) onDecision(item, true);
    else if (info.offset.x < -120) onDecision(item, false);
  }

  const isJob = kind === "job";
  // Blind mode = employer swipes on candidates without name/photo (bias-free).
  const hideIdentity = blind && !isJob;
  const displayName = hideIdentity ? "Anonieme kandidaat" : (isJob ? item.title : item.name);
  return (
    <motion.div
      className={`pd-card ${top ? "is-top" : "is-back"} ${hideIdentity ? "is-blind" : ""}`}
      style={top ? { x, rotate } : undefined}
      drag={top && !reduce ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={end}
      animate={top ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.94, y: 14, opacity: 0.85 }}
    >
      {hideIdentity ? (
        <div className="pd-card-blindbg">
          <ShieldCheck size={54} weight="thin" />
        </div>
      ) : (
        <img className="pd-card-photo" src={`./${item.image}.webp`} alt="" draggable="false" />
      )}
      <div className="pd-card-shade" />
      {matchInfo && (
        <div className="pd-match-badge">
          <ScoreRing score={matchInfo.score} />
          <b>{matchInfo.score}%</b><span>match</span>
        </div>
      )}
      {top && (
        <>
          <motion.div className="pd-stamp pd-stamp-like" style={{ opacity: likeOpacity }}>INTERESSE</motion.div>
          <motion.div className="pd-stamp pd-stamp-nope" style={{ opacity: nopeOpacity }}>LATER</motion.div>
        </>
      )}
      <div className="pd-card-body">
        {hideIdentity && (
          <span className="pd-card-blindtag"><ShieldCheck size={13} weight="fill" /> Bias-vrij · naam &amp; foto verborgen</span>
        )}
        <span className="pd-card-tag">{isJob ? item.category : item.role}</span>
        <h3>{displayName}</h3>
        <div className="pd-card-meta">
          {isJob ? (
            <>
              <span><Buildings size={14} weight="fill" />{item.company}</span>
              <span><MapPin size={14} weight="fill" />{item.location}</span>
              <span><Clock size={14} weight="fill" />{item.time}</span>
            </>
          ) : (
            <>
              <span><MapPin size={14} weight="fill" />{item.location}</span>
              <span><Star size={14} weight="fill" />{item.experience}</span>
              <span><Lightning size={14} weight="fill" />{item.available}</span>
            </>
          )}
        </div>
        {!hideIdentity && <p className="pd-card-blurb">{item.blurb}</p>}
        {isJob && <p className="pd-card-salary">{item.salary}<small> bruto / mnd</small></p>}
        <div className="pd-card-skills">
          {item.skills.slice(0, 4).map((s) => (
            <span key={s} className={matchInfo?.shared?.includes(s) ? "is-shared" : ""}>{s}</span>
          ))}
        </div>
        {matchInfo && (
          <div className="pd-card-reasons">
            <span className="pd-reasons-title"><Sparkle size={12} weight="fill" /> Waarom jullie matchen</span>
            {matchInfo.reasons.slice(0, 3).map((r, idx) => (
              <span key={idx} className="pd-reason-line"><Check size={12} weight="bold" /> {r}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Swipe deck (Ontdek tab) -------------------------------------------------

function SwipeDeck({ items, kind, scores, onMatch, blind, onToggleBlind }) {
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(null);

  function decide(item, liked) {
    setFlash(liked ? "like" : "nope");
    setTimeout(() => setFlash(null), 260);
    if (liked) {
      setTimeout(() => { onMatch(item); setIndex((i) => i + 1); }, 300);
      return;
    }
    setTimeout(() => setIndex((i) => i + 1), 220);
  }

  const remaining = items.slice(index, index + 2);
  const done = index >= items.length;

  return (
    <div className="pd-deck">
      {kind === "candidate" ? (
        <button className={`pd-blind-toggle ${blind ? "is-on" : ""}`} onClick={onToggleBlind}>
          {blind ? <EyeSlash size={16} weight="fill" /> : <Eye size={16} />}
          {blind ? "Bias-vrij aan · namen verborgen" : "Bias-vrij uit · namen zichtbaar"}
        </button>
      ) : (
        <div className="pd-deck-hint"><ThumbsDown size={15} /> Veeg voor je keuze <ThumbsUp size={15} /></div>
      )}
      <div className="pd-stack">
        {done ? (
          <div className="pd-deck-empty">
            <Check size={40} weight="light" />
            <p>Je hebt alles bekeken.</p>
            <small>In de echte app ververst je feed automatisch.</small>
          </div>
        ) : (
          remaining.map((item, i) => (
            <SwipeCard key={item.id} item={item} kind={kind} top={i === 0}
              matchInfo={scores[item.id]} onDecision={decide} blind={blind} />
          )).reverse()
        )}
        {flash && <div className={`pd-flash pd-flash-${flash}`} />}
      </div>
      {!done && (
        <div className="pd-deck-controls">
          <button className="pd-round pd-round-nope" onClick={() => decide(items[index], false)} aria-label="Later"><X size={26} weight="bold" /></button>
          <button className="pd-round pd-round-like" onClick={() => decide(items[index], true)} aria-label="Interesse"><Heart size={26} weight="fill" /></button>
        </div>
      )}
    </div>
  );
}

// --- Match bottom sheet ------------------------------------------------------

function MatchSheet({ item, kind, score, wasBlind, onChat, onClose }) {
  return (
    <div className="pd-sheet-scrim" onClick={onClose}>
      <motion.div className="pd-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}>
        <div className="pd-sheet-grip" />
        {wasBlind && (
          <motion.span className="pd-reveal-tag"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <ShieldCheck size={13} weight="fill" /> Identiteit onthuld na wederzijdse interesse
          </motion.span>
        )}
        <motion.img className="pd-sheet-photo" src={`./${item.image}.webp`} alt=""
          initial={wasBlind ? { filter: "blur(18px)", scale: 1.1, opacity: 0.6 } : false}
          animate={{ filter: "blur(0px)", scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }} />
        <span className="pd-sheet-score"><Sparkle size={15} weight="fill" /> {score}% match</span>
        <h3>Het is een match!</h3>
        <p>Jij en {titleOf(item, kind)} toonden allebei interesse. Start het gesprek binnen 48 uur.</p>
        <button className="pd-primary" onClick={onChat}><ChatCircleDots size={18} weight="fill" /> Stuur een bericht</button>
        <button className="pd-secondary" onClick={onClose}>Verder swipen</button>
      </motion.div>
    </div>
  );
}

// --- Chat overlay ------------------------------------------------------------

function MatchChat({ match, kind, onBack }) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(match.messages.length === 0);
  const [messages, setMessages] = useState(match.messages);
  const scroller = useRef(null);
  const name = titleOf(match.item, kind);

  useEffect(() => {
    if (match.messages.length > 0) return;
    let alive = true;
    (async () => {
      const line = await icebreaker({
        profileRole: kind === "job" ? "kandidaat" : match.item.role,
        jobTitle: kind === "job" ? match.item.title : match.item.role,
        company: name,
      });
      if (!alive) return;
      const seeded = [{ from: "them", text: line, ai: true }];
      match.messages = seeded;
      setMessages([...seeded]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [...messages, { from: "me", text }];
    match.messages = next;
    setMessages(next);
    setDraft("");
    setTimeout(() => {
      const reply = [...match.messages, { from: "them", text: "Top! Ik plan een korte kennismaking in. Schikt woensdag 15:00 of donderdag 10:00?" }];
      match.messages = reply;
      setMessages([...reply]);
    }, 1400);
  }

  return (
    <motion.div className="pd-chat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}>
      <header className="pd-chat-head">
        <button className="pd-icon" onClick={onBack} aria-label="Terug"><CaretLeft size={20} /></button>
        <span className="pd-avatar">{name.charAt(0)}</span>
        <div><b>{name}</b><small>{subtitleOf(match.item, kind)} · online</small></div>
      </header>
      <div className="pd-chat-scroll" ref={scroller}>
        <div className="pd-match-banner"><Heart size={16} weight="fill" /> Match · {match.score}%</div>
        <div className="pd-urgency-chip"><Timer size={13} weight="fill" /> Reageer binnen 48 uur, anders vervalt de match</div>
        {messages.map((m, i) => (
          <div key={i} className={`pd-bubble pd-bubble-${m.from}`}>
            {m.ai && <span className="pd-ai-tag"><Sparkle size={11} weight="fill" /> AI-ijsbreker</span>}
            {m.text}
          </div>
        ))}
        {loading && <div className="pd-bubble pd-bubble-them"><Typing /></div>}
      </div>
      <form className="pd-chat-input" onSubmit={send}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Schrijf een bericht…" maxLength={400} />
        <button type="submit" aria-label="Versturen" disabled={!draft.trim()}><PaperPlaneRight size={18} weight="fill" /></button>
      </form>
    </motion.div>
  );
}

// --- List tabs (Matches / Berichten) -----------------------------------------

function MatchList({ matches, kind, onOpen, emptyIcon, emptyTitle, emptyText, showLast }) {
  if (matches.length === 0) {
    return (
      <div className="pd-empty">
        {emptyIcon}
        <b>{emptyTitle}</b>
        <span>{emptyText}</span>
      </div>
    );
  }
  return (
    <div className="pd-list">
      {matches.map((m) => {
        const last = m.messages[m.messages.length - 1];
        return (
          <button key={m.item.id} className="pd-row" onClick={() => onOpen(m)}>
            <img className="pd-row-photo" src={`./${m.item.image}.webp`} alt="" />
            <div className="pd-row-txt">
              <b>{titleOf(m.item, kind)}</b>
              <small>{showLast && last ? last.text : subtitleOf(m.item, kind)}</small>
            </div>
            {!showLast && <span className="pd-row-score">{m.score}%</span>}
            <CaretRight size={18} />
          </button>
        );
      })}
    </div>
  );
}

// --- Profile tab -------------------------------------------------------------

function ProfileTab({ profile, kind, onExit }) {
  const isJob = kind === "job";
  return (
    <div className="pd-proftab">
      <div className="pd-profile-head">
        <span className="pd-avatar pd-avatar-lg">{(profile.name || profile.title || "W").charAt(0)}</span>
        <div>
          <h2>{profile.name || profile.title}</h2>
          <span className="pd-profile-role">{profile.role || profile.tone}</span>
          {profile.location && <small><MapPin size={12} weight="fill" /> {profile.location}</small>}
        </div>
      </div>
      <span className="pd-ai-tag"><Sparkle size={11} weight="fill" /> {isJob ? "Automatisch uit je cv" : "Geoptimaliseerd door AI"}</span>
      <p className="pd-profile-summary">{profile.summary || profile.optimizedText}</p>
      {profile.skills && (<><h4>Skills</h4><div className="pd-chips">{profile.skills.map((s) => <span key={s}>{s}</span>)}</div></>)}
      {profile.suggestedSkills && (<><h4>Gevraagde skills</h4><div className="pd-chips">{profile.suggestedSkills.map((s) => <span key={s}>{s}</span>)}</div></>)}
      {profile.certificates && (<><h4>Certificaten</h4><div className="pd-chips">{profile.certificates.map((s) => <span key={s} className="pd-chip-cert">{s}</span>)}</div></>)}
      <button className="pd-secondary" onClick={onExit}><SignOut size={17} /> Wissel van rol</button>
    </div>
  );
}

// --- The app shell (after onboarding) ----------------------------------------

function AppShell({ kind, profile, feedItems, onExit }) {
  const [tab, setTab] = useState("discover");
  const [scores, setScores] = useState({});
  const [matches, setMatches] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [chat, setChat] = useState(null);
  // Bias-free swipe: employer sees candidates without name/photo until a mutual match.
  const [blind, setBlind] = useState(true);

  const profileSkills = profile.skills || profile.suggestedSkills || [];

  useEffect(() => {
    let alive = true;
    (async () => {
      const out = {};
      for (const it of feedItems) {
        const res = await matchScore({ profileSkills, jobSkills: it.skills || [] });
        out[it.id] = { ...res, shared: profileSkills.filter((s) => (it.skills || []).includes(s)) };
      }
      if (alive) setScores(out);
    })();
    return () => { alive = false; };
  }, []);

  function registerMatch(item) {
    const info = scores[item.id] || { score: 80, reasons: [] };
    const entry = { item, score: info.score, reasons: info.reasons, messages: [] };
    setMatches((m) => (m.some((x) => x.item.id === item.id) ? m : [...m, entry]));
    setSheet(entry);
  }

  const withMessages = matches.filter((m) => m.messages.length > 0);

  return (
    <div className="pd-app">
      <div className="pd-app-body">
        <AnimatePresence mode="wait">
          {tab === "discover" && (
            <motion.div key="discover" className="pd-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="pd-tab-head">
                <h3>{kind === "job" ? "Ontdek banen" : "Ontdek talent"}</h3>
                <p>Swipe of tik. Bij interesse van beide kanten: match.</p>
              </div>
              <SwipeDeck items={feedItems} kind={kind} scores={scores} onMatch={registerMatch}
                blind={blind} onToggleBlind={() => setBlind((b) => !b)} />
            </motion.div>
          )}
          {tab === "matches" && (
            <motion.div key="matches" className="pd-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="pd-tab-head"><h3>Matches</h3><p>{matches.length} {matches.length === 1 ? "match" : "matches"}</p></div>
              <MatchList matches={matches} kind={kind} onOpen={(m) => setChat(m)}
                emptyIcon={<Cards size={40} weight="light" />} emptyTitle="Nog geen matches"
                emptyText="Ga naar Ontdek en toon interesse in wie bij je past." />
            </motion.div>
          )}
          {tab === "messages" && (
            <motion.div key="messages" className="pd-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="pd-tab-head"><h3>Berichten</h3><p>Gesprekken met je matches</p></div>
              <MatchList matches={withMessages} kind={kind} onOpen={(m) => setChat(m)} showLast
                emptyIcon={<ChatCircle size={40} weight="light" />} emptyTitle="Nog geen gesprekken"
                emptyText="Open een match en stuur het eerste bericht." />
            </motion.div>
          )}
          {tab === "profile" && (
            <motion.div key="profile" className="pd-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="pd-tab-head"><h3>{kind === "job" ? "Mijn profiel" : "Mijn vacature"}</h3><p>Gemaakt door AI</p></div>
              <ProfileTab profile={profile} kind={kind} onExit={onExit} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sheet && !chat && (
            <MatchSheet key="sheet" item={sheet.item} kind={kind} score={sheet.score}
              wasBlind={blind && kind === "candidate"}
              onChat={() => { setChat(sheet); setSheet(null); }} onClose={() => setSheet(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {chat && <MatchChat key="chat" match={chat} kind={kind} onBack={() => setChat(null)} />}
        </AnimatePresence>
      </div>

      <nav className="pd-nav">
        <button className={tab === "discover" ? "is-active" : ""} onClick={() => setTab("discover")}>
          <Cards size={23} weight={tab === "discover" ? "fill" : "regular"} /> Ontdek
        </button>
        <button className={tab === "matches" ? "is-active" : ""} onClick={() => setTab("matches")}>
          <Heart size={23} weight={tab === "matches" ? "fill" : "regular"} />
          {matches.length > 0 && <span className="pd-badge">{matches.length}</span>} Matches
        </button>
        <button className={tab === "messages" ? "is-active" : ""} onClick={() => setTab("messages")}>
          <ChatCircle size={23} weight={tab === "messages" ? "fill" : "regular"} /> Berichten
        </button>
        <button className={tab === "profile" ? "is-active" : ""} onClick={() => setTab("profile")}>
          <UserCircle size={23} weight={tab === "profile" ? "fill" : "regular"} /> Profiel
        </button>
      </nav>
    </div>
  );
}

// --- Onboarding: candidate ---------------------------------------------------

// Standard questions for the "no CV yet" guided flow. Each builds part of the profile.
const FIELD_OPTIONS = [
  { label: "Creatief & Design", role: "Creatief Professional", skills: ["Figma", "Adobe Suite", "Branding", "Illustratie", "UX/UI", "Fotografie"] },
  { label: "Tech & IT", role: "IT Professional", skills: ["React", "JavaScript", "Python", "SQL", "IT-support", "Data-analyse"] },
  { label: "Hospitality", role: "Hospitality Professional", skills: ["Gastvrijheid", "Koffie", "Bediening", "Voorraadbeheer", "Klantcontact"] },
  { label: "Sales & Commercieel", role: "Commercieel Talent", skills: ["Sales", "Onderhandelen", "Accountbeheer", "Klantcontact", "Presenteren"] },
  { label: "Bouw & Techniek", role: "Technisch Vakman", skills: ["Lassen", "Montage", "VCA", "Techniek", "Kwaliteitscontrole"] },
  { label: "Zorg & Welzijn", role: "Zorgprofessional", skills: ["Verzorging", "EHBO", "Communicatie", "Planning", "Empathie"] },
  { label: "Administratie", role: "Administratief Talent", skills: ["Excel", "Planning", "Administratie", "Nauwkeurigheid", "Communicatie"] },
  { label: "Iets anders", role: "Veelzijdige Professional", skills: ["Samenwerken", "Communicatie", "Plannen", "Klantcontact", "Nederlands", "Engels"] },
];
const EXP_OPTIONS = ["Starter (0-1 jaar)", "1-3 jaar", "3-6 jaar", "6+ jaar"];
const HOURS_OPTIONS = ["Tot 16 uur", "16-24 uur", "24-32 uur", "32-40 uur"];
const AVAIL_OPTIONS = ["Per direct", "Binnen 1 maand", "1-3 maanden"];
const EDU_OPTIONS = ["VMBO", "MBO", "HBO", "WO", "Anders"];
const CERT_OPTIONS = ["VCA", "Rijbewijs B", "EHBO/BHV", "Heftruckcertificaat", "Taalcertificaat", "Geen"];

function buildProfileFromAnswers(a) {
  const field = FIELD_OPTIONS.find((f) => f.label === a.field) || FIELD_OPTIONS[FIELD_OPTIONS.length - 1];
  const skills = (a.skills || []).length ? a.skills : field.skills.slice(0, 4);
  const certs = (a.certs || []).filter((c) => c !== "Geen");
  return {
    name: a.name || "Nieuw talent",
    role: field.role,
    location: a.location || "Nederland",
    headline: `${field.role} met ${a.experience || "ervaring"}.`,
    summary:
      `${a.name || "Deze kandidaat"} zoekt werk in ${field.label.toLowerCase()} ` +
      `(${a.hours || "flexibel"}, ${(a.availability || "beschikbaar").toLowerCase()}). ` +
      (a.about ? a.about : "Profiel opgebouwd via de begeleide vragenlijst, zonder cv."),
    skills,
    experience: [{ title: field.role, org: a.education ? `Opleiding: ${a.education}` : "Werkervaring", period: a.experience || "" }],
    certificates: certs.length ? certs : ["Nog geen certificaten opgegeven"],
  };
}

function ChipGroup({ options, value, onChange, multi }) {
  function toggle(opt) {
    if (multi) {
      const set = new Set(value || []);
      set.has(opt) ? set.delete(opt) : set.add(opt);
      onChange([...set]);
    } else {
      onChange(opt);
    }
  }
  const isOn = (opt) => (multi ? (value || []).includes(opt) : value === opt);
  return (
    <div className="pd-wiz-chips">
      {options.map((opt) => (
        <button key={opt} type="button" className={`pd-wiz-chip ${isOn(opt) ? "is-on" : ""}`} onClick={() => toggle(opt)}>
          {isOn(opt) && <Check size={14} weight="bold" />} {opt}
        </button>
      ))}
    </div>
  );
}

function CvBuilderWizard({ onComplete, onCancel }) {
  const [i, setI] = useState(0);
  const [a, setA] = useState({ name: "", location: "", field: "", experience: "", skills: [], hours: "", availability: "", education: "", certs: [], about: "" });
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));

  const field = FIELD_OPTIONS.find((f) => f.label === a.field);
  const skillPool = field ? field.skills : [];

  const steps = [
    {
      title: "Hoe heet je?", sub: "We bouwen samen je profiel op, ook zonder cv.",
      valid: () => a.name.trim().length > 1,
      body: (
        <input className="pd-wiz-input" autoFocus value={a.name} maxLength={60}
          onChange={(e) => set("name", e.target.value)} placeholder="Voor- en achternaam" />
      ),
    },
    {
      title: "Waar woon je?", sub: "Zo vinden we banen bij jou in de buurt.",
      valid: () => a.location.trim().length > 1,
      body: (
        <input className="pd-wiz-input" autoFocus value={a.location} maxLength={60}
          onChange={(e) => set("location", e.target.value)} placeholder="Bijv. Utrecht" />
      ),
    },
    {
      title: "Welk werk zoek je?", sub: "Kies de richting die het beste past.",
      valid: () => !!a.field,
      body: <ChipGroup options={FIELD_OPTIONS.map((f) => f.label)} value={a.field} onChange={(v) => { set("field", v); set("skills", []); }} />,
    },
    {
      title: "Hoeveel werkervaring heb je?", sub: "Een grove inschatting is prima.",
      valid: () => !!a.experience,
      body: <ChipGroup options={EXP_OPTIONS} value={a.experience} onChange={(v) => set("experience", v)} />,
    },
    {
      title: "Wat zijn je sterkste punten?", sub: "Kies er een paar. Meerdere mag.",
      valid: () => (a.skills || []).length > 0,
      body: <ChipGroup options={skillPool} value={a.skills} onChange={(v) => set("skills", v)} multi />,
    },
    {
      title: "Hoeveel uur wil je werken?", sub: "",
      valid: () => !!a.hours,
      body: <ChipGroup options={HOURS_OPTIONS} value={a.hours} onChange={(v) => set("hours", v)} />,
    },
    {
      title: "Wanneer kun je starten?", sub: "",
      valid: () => !!a.availability,
      body: <ChipGroup options={AVAIL_OPTIONS} value={a.availability} onChange={(v) => set("availability", v)} />,
    },
    {
      title: "Wat is je opleidingsniveau?", sub: "",
      valid: () => !!a.education,
      body: <ChipGroup options={EDU_OPTIONS} value={a.education} onChange={(v) => set("education", v)} />,
    },
    {
      title: "Heb je certificaten?", sub: "Kies wat je hebt. Meerdere mag.",
      valid: () => (a.certs || []).length > 0,
      body: <ChipGroup options={CERT_OPTIONS} value={a.certs} onChange={(v) => set("certs", v)} multi />,
    },
    {
      title: "Vertel kort iets over jezelf", sub: "Optioneel. Dit komt in je profiel.",
      valid: () => true,
      body: (
        <textarea className="pd-wiz-textarea" value={a.about} maxLength={280} rows={4}
          onChange={(e) => set("about", e.target.value)} placeholder="Bijv. Ik werk graag in een team en leer snel nieuwe dingen." />
      ),
    },
  ];

  const cur = steps[i];
  const last = i === steps.length - 1;
  const pct = Math.round(((i + 1) / steps.length) * 100);

  function next() {
    if (!cur.valid()) return;
    if (last) { onComplete(buildProfileFromAnswers(a)); return; }
    setI((n) => n + 1);
  }
  function back() { i === 0 ? onCancel() : setI((n) => n - 1); }

  return (
    <div className="pd-wiz">
      <div className="pd-wiz-top">
        <div className="pd-wiz-progress"><span style={{ width: `${pct}%` }} /></div>
        <span className="pd-wiz-count">Vraag {i + 1} van {steps.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} className="pd-wiz-body"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
          <h2>{cur.title}</h2>
          {cur.sub && <p className="pd-wiz-sub">{cur.sub}</p>}
          <div className="pd-wiz-field">{cur.body}</div>
        </motion.div>
      </AnimatePresence>
      <div className="pd-wiz-footer">
        <button className="pd-wiz-back" onClick={back} aria-label="Vorige"><CaretLeft size={20} /></button>
        <button className="pd-primary" onClick={next} disabled={!cur.valid()}>
          {last ? "Maak mijn profiel" : "Volgende"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function CandidateOnboarding({ onReady }) {
  const [step, setStep] = useState("upload");
  const [fileName, setFileName] = useState("");

  async function run(text, name) {
    setStep("analyzing");
    const result = await analyzeCV({ text, fileName: "cv.pdf", name });
    onReady(result);
  }

  function finishWizard(profile) {
    setStep("building");
    setTimeout(() => onReady(profile), 2000);
  }

  if (step === "upload") {
    return (
      <div className="pd-screen pd-upload">
        <div className="pd-upload-art"><FileArrowUp size={44} weight="thin" /></div>
        <h2>Begin bij jouw cv.</h2>
        <p>Upload je cv. Onze AI maakt er automatisch een sterk, visueel profiel van.</p>
        <label className="pd-primary">
          <FileArrowUp size={18} /> Upload je cv
          <input type="file" accept=".pdf,.doc,.docx,.txt" hidden
            onChange={(e) => { const f = e.target.files?.[0]; setFileName(f?.name || ""); run(f?.name || "", ""); }} />
        </label>
        <button className="pd-secondary" onClick={() => setStep("build")}>Ik heb nog geen cv</button>
        <button className="pd-ghost" onClick={() => run("figma branding design", "Sanne de Vries")}>Of gebruik een voorbeeld-cv</button>
        <span className="pd-fineprint">Demo: je bestand blijft op je apparaat en wordt niet verstuurd.</span>
      </div>
    );
  }

  if (step === "build") {
    return <CvBuilderWizard onComplete={finishWizard} onCancel={() => setStep("upload")} />;
  }

  if (step === "building") {
    return (
      <div className="pd-screen pd-analyzing">
        <motion.div className="pd-scan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}><Sparkle size={40} weight="fill" /></motion.div>
        <h2>We bouwen je profiel…</h2>
        <ul className="pd-steps">
          <li><Check size={15} weight="bold" /> Je antwoorden verwerken</li>
          <li><Check size={15} weight="bold" /> Skills en voorkeuren ordenen</li>
          <li><Typing /> Je matches klaarzetten</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="pd-screen pd-analyzing">
      <motion.div className="pd-scan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}><Sparkle size={40} weight="fill" /></motion.div>
      <h2>AI leest je cv…</h2>
      {fileName && <p>{fileName}</p>}
      <ul className="pd-steps">
        <li><Check size={15} weight="bold" /> Ervaring herkennen</li>
        <li><Check size={15} weight="bold" /> Skills en certificaten ordenen</li>
        <li><Typing /> Profiel opbouwen</li>
      </ul>
    </div>
  );
}

// --- Onboarding: employer ----------------------------------------------------

function EmployerOnboarding({ onReady }) {
  const [step, setStep] = useState("paste");
  const [text, setText] = useState("");

  async function run() {
    setStep("optimizing");
    const r = await optimizeJob({ text: text || "designer gezocht voor ons team" });
    onReady(r);
  }

  if (step === "paste") {
    return (
      <div className="pd-screen pd-paste">
        <div className="pd-upload-art"><Buildings size={40} weight="thin" /></div>
        <h2>Plaats je vacature.</h2>
        <p>Plak je ruwe vacaturetekst. De AI maakt de functie helderder en vindt betere matches.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1200}
          placeholder="Bijv. Wij zoeken een designer voor branding en social. Fulltime, Rotterdam…" />
        <button className="pd-primary" onClick={run}><Sparkle size={18} weight="fill" /> Optimaliseer met AI</button>
        <button className="pd-ghost" onClick={() => setText("Wij zoeken een brand designer voor merk en campagnes. 32-40 uur, Rotterdam.")}>Vul een voorbeeld in</button>
      </div>
    );
  }
  return (
    <div className="pd-screen pd-analyzing">
      <motion.div className="pd-scan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}><Sparkle size={40} weight="fill" /></motion.div>
      <h2>AI verscherpt je vacature…</h2>
      <ul className="pd-steps">
        <li><Check size={15} weight="bold" /> Rol en verwachtingen verhelderen</li>
        <li><Check size={15} weight="bold" /> Toon uitnodigend maken</li>
        <li><Typing /> Passende skills bepalen</li>
      </ul>
    </div>
  );
}

// --- Device chrome + login ---------------------------------------------------

function detectPlatform() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "ios"; // default preview
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function StatusBar({ platform }) {
  const time = useClock();
  return (
    <div className={`pd-os-statusbar pd-os-${platform}`}>
      <span className="pd-os-time">{time}</span>
      {platform === "ios" ? <span className="pd-os-island" /> : <span className="pd-os-punch" />}
      <span className="pd-os-icons">
        <CellSignalFull size={15} weight="fill" />
        <WifiHigh size={16} weight="fill" />
        <BatteryFull size={22} weight="fill" />
      </span>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  return (
    <motion.div className="pd-slide pd-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pd-login-hero">
        <img className="pd-login-hero-img" src="./creative.webp" alt="" />
        <div className="pd-login-hero-shade" />
        <div className="pd-login-hero-content">
          <span className="pd-login-logo-chip"><img src="./logo.png" alt="Workstr" /></span>
          <h2>Vind werk dat<br />bij je past.</h2>
          <p>Scroll. Match. Praat. Zo simpel.</p>
        </div>
      </div>
      <div className="pd-login-sheet">
        <form className="pd-login-form" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <label className="pd-field">
            <Envelope size={18} />
            <input type="email" name="email" autoComplete="email" placeholder="E-mailadres" defaultValue="demo@workstr.com" />
          </label>
          <label className="pd-field">
            <Lock size={18} />
            <input type="password" name="password" autoComplete="off" placeholder="Wachtwoord" defaultValue="demo" />
          </label>
          <button className="pd-primary pd-login-cta" type="submit">Inloggen <ArrowRight size={18} /></button>
          <div className="pd-or"><span>of ga verder met</span></div>
          <div className="pd-oauth-row">
            <button className="pd-oauth" type="button" onClick={onLogin} aria-label="Doorgaan met Apple"><AppleLogo size={22} weight="fill" /></button>
            <button className="pd-oauth" type="button" onClick={onLogin} aria-label="Doorgaan met Google"><GoogleLogo size={20} weight="bold" /></button>
          </div>
          <p className="pd-login-note">Nog geen account? <b>Gratis aanmelden</b></p>
          <p className="pd-login-demo">Voorbeeld: elke knop gaat direct door.</p>
        </form>
      </div>
    </motion.div>
  );
}

// --- Shared phone content ----------------------------------------------------

function PhoneShell({ onClose, standalone, platform: platformProp }) {
  const [detected] = useState(detectPlatform);
  const platform = platformProp || detected;
  const [authed, setAuthed] = useState(false);
  const [mode, setMode] = useState(null);
  const [profile, setProfile] = useState(null);
  function reset() { setMode(null); setProfile(null); }
  const inApp = mode && profile;

  return (
    <div className={`pd-phone pd-frame-${platform} ${standalone ? "is-standalone" : ""}`}>
      <StatusBar platform={platform} />

      {!authed ? (
        <div className="pd-viewport">
          <AnimatePresence mode="wait">
            <LoginScreen key="login" onLogin={() => setAuthed(true)} />
          </AnimatePresence>
        </div>
      ) : (
        <>
          <div className="pd-topbar">
            <span className="pd-brand">workstr</span>
            <span className={`pd-tag ${isLiveAI ? "pd-live" : ""}`}>{isLiveAI ? "live AI" : "demo"}</span>
            {standalone ? (
              <button className="pd-close" onClick={() => setAuthed(false)} aria-label="Uitloggen"><SignOut size={18} /></button>
            ) : (
              <button className="pd-close" onClick={onClose} aria-label="Sluiten"><X size={18} /></button>
            )}
          </div>

          <div className="pd-viewport">
            <AnimatePresence mode="wait">
              {inApp ? (
                <motion.div key="app" className="pd-slide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AppShell
                    kind={mode === "candidate" ? "job" : "candidate"}
                    profile={profile}
                    feedItems={mode === "candidate" ? DEMO_JOBS : DEMO_CANDIDATES}
                    onExit={reset}
                  />
                </motion.div>
              ) : !mode ? (
                <motion.div key="choose" className="pd-slide pd-choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2>Wie ben jij vandaag?</h2>
                  <p>Ervaar beide kanten van Workstr.</p>
                  <button className="pd-choice" onClick={() => setMode("candidate")}>
                    <span className="pd-choice-ic"><User size={24} weight="regular" /></span>
                    <span className="pd-choice-txt"><b>Ik zoek werk</b><small>Upload je cv, ontdek je matches</small></span>
                    <ArrowRight size={18} />
                  </button>
                  <button className="pd-choice" onClick={() => setMode("employer")}>
                    <span className="pd-choice-ic"><Buildings size={24} weight="regular" /></span>
                    <span className="pd-choice-txt"><b>Ik zoek talent</b><small>Plaats een vacature, vind kandidaten</small></span>
                    <ArrowRight size={18} />
                  </button>
                  <span className="pd-fineprint">Interactieve demo met fictieve data.</span>
                </motion.div>
              ) : (
                <motion.div key={mode} className="pd-slide" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                  <button className="pd-back" onClick={reset}><CaretLeft size={16} /> Terug</button>
                  {mode === "candidate"
                    ? <CandidateOnboarding onReady={setProfile} />
                    : <EmployerOnboarding onReady={setProfile} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <div className={`pd-homebar pd-home-${platform}`} aria-hidden="true" />
    </div>
  );
}

// --- Root: dialog embedded in the marketing website --------------------------

export default function ProductDemo({ open, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog className="pd-dialog" ref={ref} onCancel={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && <PhoneShell onClose={onClose} />}
    </dialog>
  );
}

// --- Root: standalone full-screen app (its own page) -------------------------

export function StandaloneApp() {
  const [platform, setPlatform] = useState("ios");
  return (
    <div className={`pd-standalone-root pd-stage-${platform}`}>
      <PhoneShell standalone platform={platform} />
      <div className="pd-os-toggle" role="group" aria-label="Toestel">
        <button className={platform === "ios" ? "is-on" : ""} onClick={() => setPlatform("ios")}>
          <AppleLogo size={15} weight="fill" /> iOS
        </button>
        <button className={platform === "android" ? "is-on" : ""} onClick={() => setPlatform("android")}>
          <GoogleLogo size={14} weight="bold" /> Android
        </button>
      </div>
    </div>
  );
}
