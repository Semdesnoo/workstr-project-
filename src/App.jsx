import React, { useState, useRef, useEffect } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  Plus,
  Minus,
  Check,
  Sun,
  Moon,
  List,
  X,
  Sparkle,
  FileArrowUp,
  ChatCircleDots,
  DeviceMobile,
  BookmarkSimple,
  Play,
  Pause,
} from "@phosphor-icons/react";
import { jobs, Reveal, Logo, JobVisual, Feed } from "./components.jsx";
import "./reference.css";
import WorkVibe from "./WorkVibe.jsx";
import "./playful.css";

const features = [
  {
    label: "De banenfeed",
    title: "Minder zoeken. Meer ontdekken.",
    text: "Ontdek banen, teams en werkplekken in een verticale feed. Probeer het zelf met onze fictieve voorbeeldvacatures.",
    status: "Interactieve foto-demo",
    icon: Play,
  },
  {
    label: "Jouw profiel",
    title: "Je verhaal begint bij jou.",
    text: "Het plan: je cv vormt de basis. AI helpt je ervaring en skills te vertalen naar een persoonlijk, visueel profiel.",
    status: "Op de productroadmap",
    icon: FileArrowUp,
  },
  {
    label: "Slimme matching",
    title: "Ontdek waarom het past.",
    text: "We ontwikkelen matching op basis van relevante skills en voorkeuren, met een begrijpelijke uitleg. Geen willekeurige matchpercentages.",
    status: "Op de productroadmap",
    icon: Sparkle,
  },
  {
    label: "Direct contact",
    title: "Van klik naar gesprek.",
    text: "Bij wederzijdse interesse willen we direct contact mogelijk maken, met een slimme ijsbreker als begin van het gesprek.",
    status: "Op de productroadmap",
    icon: ChatCircleDots,
  },
  {
    label: "Jouw favorieten",
    title: "Een goede kans? Bewaar hem.",
    text: "Bewaar een voorbeeldvacature en bekijk hem later opnieuw. Je selectie blijft lokaal op dit apparaat. Er wordt niets verstuurd.",
    status: "Werkt in de demo",
    icon: BookmarkSimple,
  },
  {
    label: "De Workstr-app",
    title: "Je volgende stap gaat mee.",
    text: "Eerst een sterk platform. Daarna een mobiele app, met de App Store op de roadmap. Een releasedatum volgt later.",
    status: "Op de productroadmap",
    icon: DeviceMobile,
  },
];
function FeatureExplorer({ launch }) {
  const [active, setActive] = useState(0);
  const selected = features[active],
    Icon = selected.icon;
  const tabs = useRef([]);
  function keyTab(e, i) {
    let n;
    if (e.key === "ArrowDown" || e.key === "ArrowRight")
      n = (i + 1) % features.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft")
      n = (i + features.length - 1) % features.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = features.length - 1;
    if (n !== undefined) {
      e.preventDefault();
      setActive(n);
      tabs.current[n].focus();
    }
  }
  return (
    <section className="explorer section-wrap" id="hoe-het-werkt">
      <Reveal>
        <div className="eyebrow">WERK VINDEN, OPNIEUW BEDACHT</div>
        <h2>
          Jij kiest je richting.
          <br />
          <span>Workstr opent de deur.</span>
        </h2>
        <p className="section-intro">
          Ontdek het platform. Klik op een functie en kijk wat er mogelijk
          wordt.
        </p>
      </Reveal>
      <div className="explorer-grid">
        <div
          className="feature-tabs"
          role="tablist"
          aria-label="Workstr functies"
          aria-orientation="vertical"
        >
          {features.map((f, i) => (
            <button
              key={f.label}
              role="tab"
              id={`feature-${i}`}
              ref={(el) => (tabs.current[i] = el)}
              aria-controls="feature-panel"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onKeyDown={(e) => keyTab(e, i)}
              onClick={() => setActive(i)}
            >
              <span className="tab-index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {f.label}
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div
          className="feature-panel"
          role="tabpanel"
          id="feature-panel"
          aria-labelledby={`feature-${active}`}
          tabIndex={0}
        >
          <div className="panel-heading">
            <div>
              <span className="functional-label">{selected.status}</span>
              <h3>{selected.title}</h3>
              <p>{selected.text}</p>
            </div>
            <Icon size={31} weight="light" />
          </div>
          <div className={`feature-stage feature-stage-${active}`}>
            {active === 0 || active === 4 ? (
              <div className="mini-feed">
                <button
                  className="mini-job"
                  onClick={() => launch("design")}
                >
                  <JobVisual job={jobs[0]} compact />
                  <span className="mini-open">
                    Open de feed <ArrowUpRight size={20} />
                  </span>
                </button>
                <div className="stage-aside">
                  <Icon size={38} weight="light" />
                  <p>
                    {active === 4
                      ? "Zie je het zitten?\nBewaar die baan."
                      : "Jouw feed.\nJouw volgende move."}
                  </p>
                  <button
                    className="underlined"
                    onClick={() => launch("design")}
                  >
                    Ontdek de demo <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="feature-story"
              >
                <div className="story-icon">
                  <Icon size={80} weight="thin" />
                </div>
                <h4>
                  {active === 1
                    ? "Ervaring. Skills. Persoonlijkheid."
                    : active === 2
                      ? "De juiste skills. De juiste klik."
                      : active === 3
                        ? "Eerst interesse. Dan een gesprek."
                        : "Gebouwd voor onderweg."}
                </h4>
                <p>
                  {active === 1
                    ? "Meer dan een document. Een eerste indruk die bij je past."
                    : active === 2
                      ? "Geen beloftes over perfecte matches. Wel de ambitie om beter uit te leggen waarom."
                      : active === 3
                        ? "Menselijk contact staat centraal. Technologie helpt het gesprek op gang."
                        : "Van desktop naar mobiel, met één herkenbare Workstr-ervaring."}
                </p>
                <span className="roadmap-note">
                  Conceptvisualisatie, nog geen werkende{" "}
                  {active === 1
                    ? "cv-verwerking"
                    : active === 2
                      ? "AI-matching"
                      : active === 3
                        ? "chat"
                        : "app"}
                  .
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
function Showcase({ launch }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const touch = useRef(null),
    dragged = useRef(false);
  function move(d) {
    setActive((i) => (i + d + jobs.length) % jobs.length);
  }
  return (
    <section id="ontdek" className="showcase section-wrap">
      <Reveal>
        <h2>
          Andere banen.
          <br />
          <span>Nieuwe werelden.</span>
        </h2>
        <p className="section-intro">
          Verken drie voorbeeldvacatures. Sleep de kaarten of gebruik de pijlen.
        </p>
      </Reveal>
      <div
        className="coverflow"
        onPointerDown={(e) => {
          touch.current = e.clientX;
          dragged.current = false;
        }}
        onPointerUp={(e) => {
          if (
            touch.current !== null &&
            Math.abs(e.clientX - touch.current) > 45
          ) {
            dragged.current = true;
            move(e.clientX < touch.current ? 1 : -1);
          }
          touch.current = null;
        }}
        onPointerCancel={() => {
          touch.current = null;
        }}
      >
        {jobs.map((job, i) => {
          const offset = (i - active + jobs.length) % jobs.length;
          const pos = offset === 2 ? -1 : offset;
          return (
            <motion.button
              className={`showcase-card ${i === active ? "selected" : ""}`}
              key={job.id}
              aria-label={`Bekijk ${job.category} in de demo`}
              onClick={(e) => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                launch(job.id);
              }}
              animate={{
                x: `${pos * 78}%`,
                scale: i === active ? 1 : 0.84,
                rotateY: pos * -27,
                opacity: i === active ? 1 : 0.48,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 170, damping: 24 }
              }
              style={{ zIndex: i === active ? 3 : 1 }}
            >
              <img
                src={`./${job.image}.webp`}
                alt={
                  job.category === "Creatief"
                    ? "Collega’s in een creatieve studio"
                    : job.category === "Hospitality"
                      ? "Koffiebar en espressomachine"
                      : "Laptop op een digitale werkplek"
                }
                loading="lazy"
                draggable="false"
              />
              <span className="showcase-card-caption">
                <span>{job.category}</span>
                <ArrowUpRight size={22} />
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="showcase-controls">
        <button
          className="icon-button"
          aria-label="Vorige sector"
          onClick={() => move(-1)}
        >
          <ArrowLeft size={21} />
        </button>
        <div aria-live="polite">
          <h3 className="showcase-title">{jobs[active].title}</h3>
          <span>{jobs[active].location} · Fictieve vacature</span>
        </div>
        <button
          className="icon-button"
          aria-label="Volgende sector"
          onClick={() => move(1)}
        >
          <ArrowRight size={21} />
        </button>
      </div>
    </section>
  );
}
function Contact() {
  const [draft, setDraft] = useState(null);
  function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = `Hoi Workstr,\n\nIk ben ${data.get("name")}${data.get("company") ? ` van ${data.get("company")}` : ""}.\nIk heb interesse als ${data.get("role")}.\nMijn e-mailadres is ${data.get("email")}.\n\n${data.get("message") || ""}`;
    setDraft(
      `mailto:info@workstr.com?subject=${encodeURIComponent("Kennismaken met Workstr")}&body=${encodeURIComponent(body)}`,
    );
  }
  return (
    <section className="contact color-block" id="contact">
      <div className="section-wrap">
        <Reveal>
          <div className="eyebrow">BOUW MEE AAN WORKSTR</div>
          <h2>
            Een nieuwe manier van werk.
            <br />
            <span>Begint met een gesprek.</span>
          </h2>
        </Reveal>
        <form onSubmit={submit} onChange={() => setDraft(null)}>
          <div className="conversational-form">
            <span>Hoi Workstr, ik ben</span>
            <label>
              <span>Je naam</span>
              <input
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="jouw naam"
              />
            </label>
            <span>van</span>
            <label>
              <span>Bedrijf (optioneel)</span>
              <input
                name="company"
                maxLength={150}
                autoComplete="organization"
                placeholder="jouw bedrijf"
              />
            </label>
            <span>en ik wil meedoen als</span>
            <label>
              <span>Je interesse</span>
              <select name="role">
                <option>werkzoekende</option>
                <option>launchpartner</option>
                <option>werkgever</option>
              </select>
            </label>
            <span>. Je bereikt me op</span>
            <label className="email-label">
              <span>Je e-mailadres</span>
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="naam@bedrijf.nl"
              />
            </label>
            <span>.</span>
          </div>
          <label className="message-label">
            Wat wil je ons vertellen? (optioneel)
            <textarea
              name="message"
              rows={2}
              maxLength={2000}
              placeholder="Vertel ons waar je naar op zoek bent."
            />
          </label>
          <p className="form-note">
            Dit maakt alleen een e-mailconcept. Er wordt hier niets verstuurd of
            opgeslagen. Je verstuurt zelf vanuit je mailapp.
          </p>
          <button className="button" type="submit">
            Maak e-mailconcept <ArrowUpRight size={19} />
          </button>
          {draft && (
            <div className="draft-ready">
              <p role="status">
                <Check size={19} />
                Je concept is klaar. Controleer het in je mailapp voordat je het
                verstuurt.
              </p>
              <a className="underlined" href={draft}>
                Open in je mailapp <ArrowUpRight size={18} />
              </a>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
const faq = [
  [
    "Kan ik al solliciteren via Workstr?",
    "Nog niet. Dit is een interactieve conceptdemo met fictieve werkgevers, salarissen en vacatures. Je kunt de feed ervaren en banen lokaal bewaren; er worden geen sollicitaties verstuurd.",
  ],
  [
    "Hoe gaat AI-matching werken?",
    "We willen relevante skills en voorkeuren gebruiken om banen voor te stellen, met een begrijpelijke uitleg. De matching moet nog worden ontwikkeld en gevalideerd.",
  ],
  [
    "Kan mijn bedrijf alvast meedoen?",
    "Ja. Via het contactblok kun je een e-mailconcept maken om je interesse als launchpartner te bespreken. We zoeken bedrijven die de eerste versie samen met ons willen vormgeven.",
  ],
  [
    "Wat wordt er opgeslagen?",
    "Alleen de vacatures die je zelf bewaart komen in de lokale opslag van je browser. Er zijn geen accounts, trackingcookies of externe analytics in deze conceptwebsite.",
  ],
  [
    "Wanneer verschijnt de app?",
    "Een mobiele app staat op de roadmap. Er is nog geen bevestigde releasedatum of App Store-publicatie.",
  ],
];
export default function App() {
  const [open, setOpen] = useState(false),
    [startId, setStartId] = useState("design"),
    [menu, setMenu] = useState(false),
    [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  function launch(id = "design") {
    setStartId(typeof id === "string" ? id : "design");
    setOpen(true);
  }
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">
        Naar inhoud
      </a>
      <div className="opening color-block">
        <header className="site-header">
          <a href="#" aria-label="Workstr home">
            <Logo />
          </a>
          <nav
            className={menu ? "nav open" : "nav"}
            aria-label="Hoofdnavigatie"
          >
            <a href="#hoe-het-werkt" onClick={() => setMenu(false)}>
              Het platform
            </a>
            <a href="#ontdek" onClick={() => setMenu(false)}>
              Ontdek banen
            </a>
            <a href="#werkgevers" onClick={() => setMenu(false)}>
              Voor werkgevers
            </a>
          </nav>
          <div className="nav-actions">
            <button
              className="theme-toggle icon-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Lichte modus" : "Donkere modus"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <a className="button small nav-cta" href="#contact">
              Bouw mee <ArrowUpRight size={15} />
            </a>
            <button
              className="menu-toggle icon-button"
              aria-expanded={menu}
              aria-label="Menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={23} /> : <List size={23} />}
            </button>
          </div>
        </header>
        <section className="reference-hero section-wrap" id="main">
          <Reveal className="reference-hero-content">
            <div
              className={`brand-sculpture ${paused ? "paused" : ""}`}
              aria-hidden="true"
            >
              <span className="chrome-orbit orbit-a" />
              <span className="chrome-orbit orbit-b" />
              <span className="chrome-orbit orbit-c" />
            </div>
            <img
              className="hero-wordmark"
              src="./logo.png"
              alt="Workstr"
              width="750"
              height="234"
              fetchPriority="high"
            />
            <h1>Jouw toekomst. In je feed.</h1>
            <p>
              Ontdek banen zoals je content ontdekt.
              <br />
              Scroll, voel de klik en vind werk dat bij je past.
            </p>
            <div className="hero-actions">
              <button className="button" onClick={() => launch()}>
                Ontdek de demo <ArrowUpRight size={19} />
              </button>
              <a className="button outline" href="#hoe-het-werkt">
                Bekijk het platform <ArrowDown size={17} />
              </a>
            </div>
          </Reveal>
          <button
            className="motion-toggle"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Start animatie" : "Pauzeer animatie"}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </section>
      </div>
      <main>
        <div className="category-strip">
          <span>Jouw talent.</span>
          <span>Jouw tempo.</span>
          <span>Jouw volgende stap.</span>
          <ArrowUpRight size={18} />
        </div>
        <FeatureExplorer launch={launch} />
        <WorkVibe launch={launch} />
        <section className="manifesto section-wrap">
          <Reveal>
            <h2>
              WERK ZOEKEN
              <br />
              MAG OOK <span>GOED VOELEN.</span>
            </h2>
            <p>
              Minder formulieren. Meer persoonlijkheid. Ontdek de mensen, de
              plek en het werk voordat je de volgende stap zet.
            </p>
          </Reveal>
        </section>
        <section className="dual-story">
          <Reveal className="story-talent">
            <span className="functional-label">VOOR TALENT</span>
            <h2>
              Niet eindeloos zoeken.
              <br />
              Wel iets <span>voelen.</span>
            </h2>
            <p>
              Een nieuwe baan begint niet bij een functie-eis. Het begint bij
              een plek waar je jezelf ziet werken.
            </p>
            <button className="underlined" onClick={() => launch()}>
              Ontdek de demo <ArrowUpRight size={19} />
            </button>
          </Reveal>
          <Reveal className="story-employer">
            <span className="functional-label">VOOR WERKGEVERS</span>
            <h2>
              Laat je team zien.
              <br />
              Niet alleen je vacature.
            </h2>
            <p>
              Geef talent een gevoel bij jullie werkplek. Zodat een eerste
              gesprek met echte interesse begint.
            </p>
            <a className="underlined" href="#contact">
              Bouw mee <ArrowUpRight size={19} />
            </a>
          </Reveal>
        </section>
        <Showcase launch={launch} />
        <section id="werkgevers" className="employer-reference color-block">
          <div className="section-wrap">
            <Reveal>
              <div className="eyebrow">SAMEN BOUWEN, SAMEN GROEIEN</div>
              <h2>
                Jullie mensen.
                <br />
                <span>Jullie verhaal.</span>
              </h2>
              <p className="section-intro">
                Van een eerste vacature tot een groeiend team. We ontwikkelen
                een model dat met je meebeweegt.
              </p>
            </Reveal>
            <div className="partner-rows">
              {[
                [
                  "Launchpartner",
                  "Help de eerste versie vormgeven.",
                  "Geef feedback, laat je werkplek zien en denk mee over de eerste ervaringen. We spreken de pilotvoorwaarden samen af.",
                ],
                [
                  "Per actieve vacature",
                  "Een helder model, zonder verrassingen.",
                  "Onze productvisie: een vast maandbedrag per actieve vacature. De definitieve pakketten en tarieven zijn nog niet vastgesteld.",
                ],
                [
                  "Grotere teams",
                  "Ruimte voor jullie ambities.",
                  "Maatwerk voor organisaties met meerdere vacatures en teams. Bespreek je wensen; integraties en ondersteuning worden apart afgestemd.",
                ],
              ].map(([title, short, long]) => (
                <details key={title}>
                  <summary>
                    <span>{title}</span>
                    <span className="row-description">{short}</span>
                    <Plus size={22} />
                  </summary>
                  <p>{long}</p>
                  <a className="underlined" href="#contact">
                    Bouw mee <ArrowUpRight size={17} />
                  </a>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="app-reference section-wrap" id="app">
          <Reveal>
            <DeviceMobile size={48} weight="thin" />
            <h2>
              Vandaag een platform.
              <br />
              <span>Straks in je broekzak.</span>
            </h2>
            <p>
              De Workstr-app staat op onze roadmap. Ontworpen voor een generatie
              die scrollt, met de App Store als volgende bestemming.
            </p>
            <span className="availability">
              In ontwikkeling. Nog niet te downloaden.
            </span>
          </Reveal>
        </section>
        <section className="faq section-wrap">
          <Reveal>
            <h2>Even helder.</h2>
            <div className="faq-list">
              {faq.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span className="faq-plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>
        <Contact />
      </main>
      <footer className="site-footer">
        <div className="section-wrap">
          <a className="footer-statement" href="#contact">
            Maak werk
            <br />
            van <span>jouw toekomst.</span>
            <ArrowUpRight weight="light" />
          </a>
          <div className="footer-columns">
            <div>
              <Logo />
              <p>
                Recruitment for the
                <br />
                swiping generation.
              </p>
            </div>
            <div>
              <h3>Platform</h3>
              <a href="#hoe-het-werkt">Zo werkt het</a>
              <a href="#ontdek">Ontdek banen</a>
              <a href="#app">De app</a>
            </div>
            <div>
              <h3>Workstr</h3>
              <a href="#werkgevers">Voor werkgevers</a>
              <a href="#contact">Bouw mee</a>
              <a href="mailto:info@workstr.com">info@workstr.com</a>
            </div>
            <div>
              <h3>Goed om te weten</h3>
              <p>
                Conceptwebsite met fictieve vacatures.
                <br />
                Geen live AI, accounts of sollicitaties.
              </p>
              <p>Geen tracking. Favorieten blijven lokaal.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Workstr. Een nieuwe kijk op werk.</span>
            <span>Gebaseerd op de Workstr-productvisie.</span>
          </div>
        </div>
      </footer>
      <Feed open={open} onClose={() => setOpen(false)} startId={startId} />
    </MotionConfig>
  );
}
