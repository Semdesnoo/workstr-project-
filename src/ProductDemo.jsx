import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from "motion/react";
import {
  X, FileArrowUp, Sparkle, ArrowRight, ArrowLeft, Heart, Check,
  ChatCircleDots, MapPin, Clock, Buildings, User, PaperPlaneRight,
  Lightning, ThumbsUp, ThumbsDown, CaretLeft, Star,
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

// --- Small UI atoms ----------------------------------------------------------

function Typing() {
  return (
    <span className="pd-typing" aria-label="AI is bezig">
      <span /><span /><span />
    </span>
  );
}

function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="pd-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pd-ring-track)" strokeWidth="6" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pd-accent)" strokeWidth="6"
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDasharray: c, strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * score) / 100 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

// --- Swipe card stack (Tinder swipe + TikTok full-bleed feel) ----------------

function SwipeCard({ item, kind, top, onDecision, matchInfo }) {
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
  return (
    <motion.div
      className={`pd-card ${top ? "is-top" : "is-back"}`}
      style={top ? { x, rotate } : undefined}
      drag={top && !reduce ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={end}
      initial={top ? false : { scale: 0.94, y: 14, opacity: 0.85 }}
      animate={top ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.94, y: 14, opacity: 0.85 }}
    >
      <img className="pd-card-photo" src={`./${item.image}.webp`} alt="" draggable="false" />
      <div className="pd-card-shade" />

      {matchInfo && (
        <div className="pd-match-badge">
          <ScoreRing score={matchInfo.score} />
          <b>{matchInfo.score}%</b>
          <span>match</span>
        </div>
      )}

      {top && (
        <>
          <motion.div className="pd-stamp pd-stamp-like" style={{ opacity: likeOpacity }}>INTERESSE</motion.div>
          <motion.div className="pd-stamp pd-stamp-nope" style={{ opacity: nopeOpacity }}>LATER</motion.div>
        </>
      )}

      <div className="pd-card-body">
        <span className="pd-card-tag">{isJob ? item.category : item.role}</span>
        <h3>{isJob ? item.title : item.name}</h3>
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
        <p className="pd-card-blurb">{item.blurb}</p>
        {isJob && <p className="pd-card-salary">{item.salary}<small> bruto / mnd</small></p>}
        <div className="pd-card-skills">
          {item.skills.slice(0, 4).map((s) => (
            <span key={s} className={matchInfo?.shared?.includes(s) ? "is-shared" : ""}>{s}</span>
          ))}
        </div>
        {matchInfo && (
          <p className="pd-card-reason"><Sparkle size={13} weight="fill" /> {matchInfo.reasons[0]}</p>
        )}
      </div>
    </motion.div>
  );
}

// --- Chat after match --------------------------------------------------------

function MatchChat({ partner, kind, onBack }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const scroller = useRef(null);
  const name = kind === "job" ? partner.company : partner.name;

  useEffect(() => {
    let alive = true;
    (async () => {
      const line = await icebreaker({
        profileRole: kind === "job" ? "kandidaat" : partner.role,
        jobTitle: kind === "job" ? partner.title : partner.role,
        company: name,
      });
      if (!alive) return;
      setMessages([{ from: "them", text: line, ai: true }]);
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
    setMessages((m) => [...m, { from: "me", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [...m, {
        from: "them",
        text: "Top! Ik plan een korte kennismaking in. Schikt woensdag 15:00 of donderdag 10:00?",
      }]);
    }, 1400);
  }

  return (
    <div className="pd-chat">
      <header className="pd-chat-head">
        <button className="pd-icon" onClick={onBack} aria-label="Terug"><CaretLeft size={20} /></button>
        <span className="pd-avatar">{name.charAt(0)}</span>
        <div>
          <b>{name}</b>
          <small>{kind === "job" ? partner.title : partner.role} · online</small>
        </div>
      </header>
      <div className="pd-chat-scroll" ref={scroller}>
        <div className="pd-match-banner">
          <Heart size={16} weight="fill" /> Het is een match! Jullie toonden allebei interesse.
        </div>
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
    </div>
  );
}

// --- Swipe deck orchestration ------------------------------------------------

function SwipeDeck({ items, kind, profileSkills, onMatch }) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const out = {};
      for (const it of items) {
        const jobSkills = it.skills || [];
        const res = await matchScore({ profileSkills, jobSkills });
        out[it.id] = { ...res, shared: profileSkills.filter((s) => jobSkills.includes(s)) };
      }
      if (alive) setScores(out);
    })();
    return () => { alive = false; };
  }, []);

  function decide(item, liked) {
    setFlash(liked ? "like" : "nope");
    setTimeout(() => setFlash(null), 260);
    if (liked) {
      // Mutual interest in the demo: a like always becomes a match.
      setTimeout(() => onMatch(item), 320);
      return;
    }
    setTimeout(() => setIndex((i) => i + 1), 220);
  }

  const remaining = items.slice(index, index + 2);
  const done = index >= items.length;

  return (
    <div className="pd-deck">
      <div className="pd-deck-hint">
        <ThumbsDown size={15} /> Veeg voor je keuze <ThumbsUp size={15} />
      </div>
      <div className="pd-stack">
        <AnimatePresence>
          {done ? (
            <motion.div className="pd-deck-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Check size={40} weight="light" />
              <p>Je hebt alle {kind === "job" ? "vacatures" : "kandidaten"} bekeken.</p>
              <small>In de echte app blijft je feed zich verversen.</small>
            </motion.div>
          ) : (
            remaining.map((item, i) => (
              <SwipeCard
                key={item.id}
                item={item}
                kind={kind}
                top={i === 0}
                matchInfo={scores[item.id]}
                onDecision={decide}
              />
            )).reverse()
          )}
        </AnimatePresence>
        {flash && <div className={`pd-flash pd-flash-${flash}`} />}
      </div>
      {!done && (
        <div className="pd-deck-controls">
          <button className="pd-round pd-round-nope" onClick={() => decide(items[index], false)} aria-label="Later">
            <X size={26} weight="bold" />
          </button>
          <button className="pd-round pd-round-like" onClick={() => decide(items[index], true)} aria-label="Interesse">
            <Heart size={26} weight="fill" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- Candidate flow ----------------------------------------------------------

function CandidateFlow({ onMatch }) {
  const [step, setStep] = useState("upload"); // upload | analyzing | profile | swipe
  const [profile, setProfile] = useState(null);
  const [fileName, setFileName] = useState("");

  async function handleFile(e) {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : "voorbeeld-cv.pdf");
    setStep("analyzing");
    const result = await analyzeCV({ text: f ? f.name : "", fileName: f ? f.name : "cv.pdf" });
    setProfile(result);
    setStep("profile");
  }

  async function useSample() {
    setFileName("sanne-de-vries-cv.pdf");
    setStep("analyzing");
    const result = await analyzeCV({ text: "figma branding design", fileName: "cv.pdf", name: "Sanne de Vries" });
    setProfile(result);
    setStep("profile");
  }

  if (step === "upload") {
    return (
      <div className="pd-screen pd-upload">
        <div className="pd-upload-art"><FileArrowUp size={44} weight="thin" /></div>
        <h2>Begin bij jouw cv.</h2>
        <p>Upload je cv. Onze AI maakt er automatisch een sterk, visueel profiel van.</p>
        <label className="pd-primary">
          <FileArrowUp size={18} /> Upload je cv
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} hidden />
        </label>
        <button className="pd-ghost" onClick={useSample}>Of gebruik een voorbeeld-cv</button>
        <span className="pd-fineprint">Demo: je bestand blijft op je apparaat en wordt niet verstuurd.</span>
      </div>
    );
  }

  if (step === "analyzing") {
    return (
      <div className="pd-screen pd-analyzing">
        <motion.div className="pd-scan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <Sparkle size={40} weight="fill" />
        </motion.div>
        <h2>AI leest je cv…</h2>
        <p>{fileName}</p>
        <ul className="pd-steps">
          <li><Check size={15} weight="bold" /> Ervaring herkennen</li>
          <li><Check size={15} weight="bold" /> Skills en certificaten ordenen</li>
          <li><Typing /> Profiel opbouwen</li>
        </ul>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="pd-screen pd-profile">
        <div className="pd-profile-head">
          <span className="pd-avatar pd-avatar-lg">{profile.name.charAt(0)}</span>
          <div>
            <h2>{profile.name}</h2>
            <span className="pd-profile-role">{profile.role}</span>
            <small><MapPin size={12} weight="fill" /> {profile.location}</small>
          </div>
        </div>
        <span className="pd-ai-tag"><Sparkle size={11} weight="fill" /> Automatisch gegenereerd uit je cv</span>
        <p className="pd-profile-summary">{profile.summary}</p>
        <h4>Skills</h4>
        <div className="pd-chips">{profile.skills.map((s) => <span key={s}>{s}</span>)}</div>
        <h4>Certificaten</h4>
        <div className="pd-chips">{profile.certificates.map((s) => <span key={s} className="pd-chip-cert">{s}</span>)}</div>
        <button className="pd-primary" onClick={() => setStep("swipe")}>
          Ontdek je matches <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <SwipeDeck items={DEMO_JOBS} kind="job" profileSkills={profile.skills} onMatch={(job) => onMatch(job, "job")} />
  );
}

// --- Employer flow -----------------------------------------------------------

function EmployerFlow({ onMatch }) {
  const [step, setStep] = useState("paste"); // paste | optimizing | posting | swipe
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  async function optimize() {
    setStep("optimizing");
    const r = await optimizeJob({ text: text || "designer gezocht voor ons team" });
    setResult(r);
    setStep("posting");
  }

  if (step === "paste") {
    return (
      <div className="pd-screen pd-paste">
        <div className="pd-upload-art"><Buildings size={40} weight="thin" /></div>
        <h2>Plaats je vacature.</h2>
        <p>Plak je ruwe vacaturetekst. De AI maakt de functie helderder en vindt betere matches.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1200}
          placeholder="Bijv. Wij zoeken een designer voor branding en social. Fulltime, Rotterdam…"
        />
        <button className="pd-primary" onClick={optimize}>
          <Sparkle size={18} weight="fill" /> Optimaliseer met AI
        </button>
        <button className="pd-ghost" onClick={() => { setText("Wij zoeken een brand designer voor merk en campagnes. 32-40 uur, Rotterdam."); }}>
          Vul een voorbeeld in
        </button>
      </div>
    );
  }

  if (step === "optimizing") {
    return (
      <div className="pd-screen pd-analyzing">
        <motion.div className="pd-scan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <Sparkle size={40} weight="fill" />
        </motion.div>
        <h2>AI verscherpt je vacature…</h2>
        <ul className="pd-steps">
          <li><Check size={15} weight="bold" /> Rol en verwachtingen verhelderen</li>
          <li><Check size={15} weight="bold" /> Toon uitnodigend maken</li>
          <li><Typing /> Passende skills bepalen</li>
        </ul>
      </div>
    );
  }

  if (step === "posting") {
    return (
      <div className="pd-screen pd-profile">
        <h2>{result.title}</h2>
        <span className="pd-ai-tag"><Sparkle size={11} weight="fill" /> Geoptimaliseerd · {result.tone}</span>
        <p className="pd-profile-summary">{result.optimizedText}</p>
        <h4>Wat de AI verbeterde</h4>
        <ul className="pd-improve">
          {result.highlights.map((h) => <li key={h}><Check size={14} weight="bold" /> {h}</li>)}
        </ul>
        <h4>Voorgestelde skills</h4>
        <div className="pd-chips">{result.suggestedSkills.map((s) => <span key={s}>{s}</span>)}</div>
        <button className="pd-primary" onClick={() => setStep("swipe")}>
          Bekijk kandidaten <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <SwipeDeck items={DEMO_CANDIDATES} kind="candidate" profileSkills={result.suggestedSkills}
      onMatch={(cand) => onMatch(cand, "candidate")} />
  );
}

// --- Root demo modal ---------------------------------------------------------

export default function ProductDemo({ open, onClose }) {
  const ref = useRef(null);
  const [mode, setMode] = useState(null); // null | candidate | employer
  const [match, setMatch] = useState(null); // { partner, kind }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setMode(null);
      setMatch(null);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    if (!open && el.open) el.close();
  }, [open]);

  function reset() { setMode(null); setMatch(null); }

  return (
    <dialog className="pd-dialog" ref={ref} onCancel={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="pd-phone">
        <div className="pd-statusbar">
          <span>workstr</span>
          {isLiveAI ? <em className="pd-live">live AI</em> : <em>demo</em>}
          <button className="pd-icon pd-close" onClick={onClose} aria-label="Sluiten"><X size={18} /></button>
        </div>

        <div className="pd-viewport">
          <AnimatePresence mode="wait">
            {match ? (
              <motion.div key="chat" className="pd-slide"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <MatchChat partner={match.partner} kind={match.kind} onBack={reset} />
              </motion.div>
            ) : !mode ? (
              <motion.div key="choose" className="pd-slide pd-choose"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2>Wie ben jij vandaag?</h2>
                <p>Ervaar beide kanten van Workstr.</p>
                <button className="pd-choice" onClick={() => setMode("candidate")}>
                  <User size={26} weight="light" />
                  <span><b>Ik zoek werk</b><small>Upload je cv, ontdek je matches</small></span>
                  <ArrowRight size={18} />
                </button>
                <button className="pd-choice" onClick={() => setMode("employer")}>
                  <Buildings size={26} weight="light" />
                  <span><b>Ik zoek talent</b><small>Plaats een vacature, vind kandidaten</small></span>
                  <ArrowRight size={18} />
                </button>
                <span className="pd-fineprint">Interactieve demo met fictieve data.</span>
              </motion.div>
            ) : (
              <motion.div key={mode} className="pd-slide"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <button className="pd-back" onClick={reset}><CaretLeft size={16} /> Terug</button>
                {mode === "candidate"
                  ? <CandidateFlow onMatch={(p, k) => setMatch({ partner: p, kind: k })} />
                  : <EmployerFlow onMatch={(p, k) => setMatch({ partner: p, kind: k })} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </dialog>
  );
}
