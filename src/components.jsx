import React, { useEffect, useRef, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  X,
  Play,
  MapPin,
  Clock,
  Sparkle,
  ChatCircleDots,
  FileArrowUp,
  Check,
  DeviceMobile,
  BookmarkSimple,
  Sun,
  Moon,
  List,
  Buildings,
} from "@phosphor-icons/react";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "./styles.css";

const jobs = [
  {
    id: "design",
    title: "Brand designer",
    company: "Studio Noord",
    location: "Rotterdam",
    time: "32 - 40 uur",
    salary: "€ 3.200 - € 4.200",
    category: "Creatief",
    image: "creative",
    description:
      "Bouw merken met een team dat net zo nieuwsgierig is als jij. Van de eerste schets tot een campagne die je op straat tegenkomt.",
    skills: ["Figma", "Branding", "Samenwerken"],
  },
  {
    id: "coffee",
    title: "Barista",
    company: "Koffie Collectief",
    location: "Amsterdam",
    time: "24 - 32 uur",
    salary: "€ 2.500 - € 2.900",
    category: "Hospitality",
    image: "barista",
    description:
      "Maak de ochtend van je gasten. Ontdek specialty coffee, leer van je team en geef een buurtcafé jouw eigen energie.",
    skills: ["Gastvrijheid", "Koffie", "Teamwork"],
  },
  {
    id: "code",
    title: "Frontend developer",
    company: "Forma Digital",
    location: "Utrecht",
    time: "32 - 40 uur",
    salary: "€ 3.500 - € 4.800",
    category: "Tech",
    image: "developer",
    description:
      "Maak digitale producten waar mensen graag mee werken. Je bouwt toegankelijke interfaces in een klein, betrokken productteam.",
    skills: ["React", "CSS", "Toegankelijkheid"],
  },
];
function Reveal({ children, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
function Logo() {
  return (
    <img
      className="logo"
      src="./logo.png"
      alt="Workstr"
      width="157"
      height="49"
    />
  );
}
function JobVisual({ job, compact = false }) {
  return (
    <>
      <img
        className="job-photo"
        src={`./${job.image}.webp`}
        alt={
          job.image === "creative"
            ? "Creatief team aan het werk in een studio"
            : job.image === "barista"
              ? "Koffie op de werkbank in een café"
              : "Laptop op een werkplek"
        }
        fetchPriority={compact ? "high" : "auto"}
      />
      <div className="photo-shade" />
      <div className="job-top">
        <span className="company-mark">{job.company.charAt(0)}</span>
        <span>
          {job.company}
          <small>Voorbeeldwerkgever</small>
        </span>
        <ArrowUpRight size={20} />
      </div>
      <div className="job-copy">
        <span className="job-category">{job.category}</span>
        <h3>{job.title}</h3>
        <div className="job-meta">
          <span>
            <MapPin size={14} />
            {job.location}
          </span>
          <span>
            <Clock size={14} />
            {job.time}
          </span>
        </div>
        <p className="salary">
          {job.salary}
          <small> bruto / maand</small>
        </p>
        {!compact && (
          <>
            <p className="job-description">{job.description}</p>
            <div className="skill-tags">
              {job.skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
function Feed({ open, onClose, startId = "design" }) {
  const ref = useRef(null),
    track = useRef(null);
  const reduce = useReducedMotion();
  const [view, setView] = useState("all");
  const [notice, setNotice] = useState("");
  const [query,setQuery]=useState("");
  const [sector,setSector]=useState("Alle sectoren");
  const [saved, setSaved] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem("workstr-saved") || "[]");
      return Array.isArray(value)
        ? value.filter((id) => jobs.some((j) => j.id === id))
        : [];
    } catch {
      return [];
    }
  });
  const shown = jobs.filter(j => (view !== "saved" || saved.includes(j.id)) && (sector === "Alle sectoren" || j.category === sector) && `${j.title} ${j.location} ${j.company} ${j.skills.join(" ")}`.toLocaleLowerCase("nl").includes(query.trim().toLocaleLowerCase("nl")));
  function resetFilters(){setQuery("");setSector("Alle sectoren");track.current?.scrollTo({top:0,behavior:"instant"});}
  useEffect(()=>{track.current?.scrollTo({top:0,behavior:"instant"});},[query,sector]);
  useEffect(() => {
    if (open) {
      ref.current.showModal();
      setView("all");
      setQuery("");
      setSector("Alle sectoren");
      requestAnimationFrame(() => {
        const index = jobs.findIndex((j) => j.id === startId);
        track.current?.scrollTo({
          top: Math.max(0, index) * track.current.clientHeight,
          behavior: "instant",
        });
      });
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    } else if (ref.current.open) ref.current.close();
  }, [open, startId]);
  function move(direction) {
    const el = track.current;
    el.scrollBy({
      top: direction * el.clientHeight,
      behavior: reduce ? "instant" : "smooth",
    });
  }
  function toggleSave(job) {
    const next = saved.includes(job.id)
      ? saved.filter((id) => id !== job.id)
      : [...saved, job.id];
    setSaved(next);
    try {
      localStorage.setItem("workstr-saved", JSON.stringify(next));
      setNotice(
        next.includes(job.id)
          ? "Bewaard op dit apparaat. Geen sollicitatie verstuurd."
          : "Vacature verwijderd uit bewaard.",
      );
    } catch {
      setNotice(
        "Opslag niet beschikbaar. Je selectie blijft alleen in deze sessie bewaard.",
      );
    }
  }
  function changeView(next) {
    setView(next);
    setNotice("");
    track.current?.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <dialog
      className="feed-dialog"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="feed-title"
    >
      <div className="feed-shell">
        <header className="feed-header">
          <div>
            <h2 id="feed-title">Jouw volgende move.</h2>
            <p>Conceptdemo · fictieve vacatures</p>
          </div>
          <button
            className="icon-button"
            aria-label="Sluiten"
            onClick={onClose}
          >
            <X size={23} />
          </button>
        </header>
        <div className="feed-tabs" aria-label="Vacatureselectie">
          <button
            aria-pressed={view === "all"}
            onClick={() => changeView("all")}
          >
            Voor jou
          </button>
          <button
            aria-pressed={view === "saved"}
            onClick={() => changeView("saved")}
          >
            Bewaard
          </button>
          <span>Foto-demo</span>
        </div>
        <div className="feed-search"><label>Zoek functie of plaats<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Bijv. designer of Utrecht" /></label><label>Sector<select value={sector} onChange={e=>setSector(e.target.value)}>{["Alle sectoren",...jobs.map(j=>j.category)].map(s=><option key={s}>{s}</option>)}</select></label></div>
        <div
          className="feed-track"
          ref={track}
          tabIndex={0}
          aria-label="Vacaturefeed, scroll voor de volgende vacature"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              move(e.key === "ArrowDown" ? 1 : -1);
            }
          }}
        >
          {shown.length ? (
            shown.map((job) => (
              <article className="feed-job" key={job.id}>
                <JobVisual job={job} />
                <button
                  className={`save-job ${saved.includes(job.id)?"is-saved":""}`}
                  onClick={() => toggleSave(job)}
                  aria-label={`${saved.includes(job.id) ? "Verwijder" : "Bewaar"} ${job.title}`}
                  aria-pressed={saved.includes(job.id)}
                >
                  <BookmarkSimple
                    weight={saved.includes(job.id) ? "fill" : "regular"}
                    size={24}
                  />
                </button>
              </article>
            ))
          ) : (
            <div className="empty-feed">
              <BookmarkSimple size={42} weight="light" />
              <h3>{query||sector!=="Alle sectoren"?"Nog geen klik met deze filters.":"Nog geen banen bewaard."}</h3>
              <p>
                {query||sector!=="Alle sectoren"?"Probeer een andere zoekterm of ontdek alle drie de voorbeeldvacatures.":"Ontdek de feed en tik op het bladwijzer-icoon bij een baan die je aanspreekt."}
              </p>
              <button
                className="button small"
                onClick={() => {resetFilters();changeView("all");}}
              >
                {query||sector!=="Alle sectoren"?"Wis filters":"Bekijk de feed"} <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
        <p className="feed-notice" role="status">
          {notice || "Je selectie wordt alleen op dit apparaat bewaard."}
        </p>
        <footer className="feed-footer">
          <span>{shown.length} {shown.length===1?"voorbeeldvacature":"voorbeeldvacatures"} · scroll om te ontdekken</span>
          <button
            className="icon-button"
            aria-label="Vorige vacature"
            disabled={!shown.length}
            onClick={() => move(-1)}
          >
            <ArrowUp size={21} />
          </button>
          <button
            className="icon-button"
            aria-label="Volgende vacature"
            disabled={!shown.length}
            onClick={() => move(1)}
          >
            <ArrowDown size={21} />
          </button>
        </footer>
      </div>
    </dialog>
  );
}

export { jobs, Reveal, Logo, JobVisual, Feed };
