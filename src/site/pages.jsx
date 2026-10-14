import React from "react";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { flows, faq, trust, pages } from "./content.js";
import { Eyebrow, Reveal, Faq, FinalCta, Steps, PageHero, Phone } from "./ui.jsx";
import { SCREENS } from "./screens.jsx";
import LeadForm from "./forms.jsx";
import { href, track, useInView } from "./lib.js";
import {
  HeroVisual, OldNew, Story, Gallery, ProjectDemo, MatchDemo, ChatDemo, Morph, BusinessDemo, CompanyProfile,
  MspFlow, MspDashboard, ComplianceDemo, Agents, Orchestration, AiCapabilities, Industries, Roadmap, Flywheel,
} from "./demos.jsx";

const Head = ({ eyebrow, title, text, center }) => (
  <Reveal className={`head ${center ? "center" : ""}`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="h2">{title[0]}{title[1] && <><br /><span className="dim">{title[1]}</span></>}</h2>
    {text && <p className="lead">{text}</p>}
  </Reveal>
);

const Viewed = ({ event, className, children, id }) => { const [ref] = useInView(0.2, event); return <section ref={ref} id={id} className={className}>{children}</section>; };

export function Home() {
  return (<>
    <section className="hero">
      <Eyebrow>The new way to work</Eyebrow>
      <h1 className="display">Work should<br />find you.</h1>
      <p className="lead">Ontdek echte bedrijven, laat zien wat je kunt en kom direct in contact met kansen die bij je passen. Workstr verbindt professionals en bedrijven op meer dan een functietitel.</p>
      <div className="ctas">
        <a className="btn primary lg" href="#hoe-het-werkt" onClick={() => track("hero_professional_cta")}>Ontdek Workstr</a>
        <a className="btn lg" href={href("business/")} onClick={() => track("hero_business_cta")}>Voor bedrijven <ArrowRight size={16} /></a>
      </div>
      <p className="status"><span className="live" aria-hidden /> In ontwikkeling · early access open</p>
      <HeroVisual />
    </section>

    <section className="sec">
      <Head title={["Werk zoeken zit vast", "in het verleden."]} text="Lange teksten, een cv dat nooit actueel is, een motivatiebrief en dan wachten. Het kan korter." />
      <OldNew />
    </section>

    <Viewed event="professional_section_viewed" className="sec" id="hoe-het-werkt">
      <Head eyebrow="Workstr App" title={["Eén app.", "Vier schermen."]} text="Scroll verder en zie hoe een professional van ontdekken naar gesprek gaat." />
      <Story />
    </Viewed>

    <section className="sec bleed">
      <Head eyebrow="Show your work" title={["Laat zien wat je", "daadwerkelijk hebt gedaan."]} />
      <Gallery />
    </section>

    <section className="sec split">
      <Head eyebrow="Work Profile" title={["Je cv hoort met je", "mee te groeien."]} text="Een foto en één zin. Workstr maakt er een project van, herkent je skills en werkt je cv bij. Jij controleert alles voordat het in je profiel komt." />
      <ProjectDemo />
    </section>

    <section className="sec split rev">
      <Head eyebrow="Matching" title={["Geen zwarte doos.", "Zie waarom iets past."]} text="Een percentage zonder uitleg zegt weinig. Workstr laat zien welke ervaring, voorkeuren en eisen de match bepalen." />
      <MatchDemo />
    </section>

    <section className="sec split">
      <Head eyebrow="Direct contact" title={["Van match naar gesprek.", "Zonder onnodige stappen."]} text="Wederzijdse interesse opent de chat. Geen formulier, geen motivatiebrief." />
      <ChatDemo />
    </section>

    <section className="statement">
      <Reveal as="h2" className="huge">Wat voor professionals simpel voelt,<br /><span className="dim">is voor bedrijven krachtig.</span></Reveal>
      <Morph />
    </section>

    <Viewed event="business_section_viewed" className="sec">
      <Head eyebrow="Workstr Business" title={["Recruitment zonder", "onnodig werk."]} text="Vacature maken, matches bekijken, talent zoeken en direct in gesprek. Klik door de demo." />
      <BusinessDemo start="vacancy" />
      <div className="split mt">
        <Head title={["Laat zien waarom iemand", "bij je wil werken."]} text="Projecten, team, werkplek en video op één bedrijfsprofiel. Professionals zien het zodra ze op je vacature tikken." />
        <CompanyProfile />
      </div>
    </Viewed>

    <section className="sec enterprise">
      <Head eyebrow="Workstr Managed Services · Enterprise roadmap" title={["Van recruitment naar", "volledige workforce."]} text="Voor organisaties die verder willen dan vacatures: aanvragen, leveranciers, compliance, contracten en uren vanuit één omgeving. In ontwikkeling." />
      <MspFlow />
      <MspDashboard />
      <a className="btn" href={href("managed-services/")}>Bekijk Managed Services <ArrowRight size={16} /></a>
    </section>

    <section className="sec">
      <Head eyebrow="AI die werk doet" title={["Minder administratie.", "Meer aandacht voor mensen."]} />
      <Agents />
      <div className="split mt">
        <Head title={["Human when", "it matters."]} text="Agents doen het standaardwerk. Bij twijfel of een belangrijke beslissing beslist een mens. Altijd." />
        <Orchestration />
      </div>
    </section>

    <section className="sec bleed">
      <Head title={["Gebouwd voor", "echt werk."]} text="We beginnen in de technische sectoren, waar certificaten, projecten en vakmanschap het verschil maken." />
      <Industries />
    </section>

    <section className="sec">
      <Head eyebrow="Your profile. Your control." title={["Jouw profiel.", "Jouw regie."]} />
      <ul className="trust">{trust.map(([t, d], i) => <Reveal as="li" key={t} delay={(i % 3) * 60}><Check size={18} weight="bold" aria-hidden /><b>{t}</b><span className="muted">{d}</span></Reveal>)}</ul>
    </section>

    <section className="sec split">
      <Head eyebrow="Designed for the next generation of work" title={["Gebouwd met professionals.", "Stap voor stap."]} text="Eerst bewijzen dat de kern werkt. Daarna bouwen we verder." />
      <Roadmap />
    </section>

    <FinalCta />
  </>);
}

export function Professionals() {
  return (<>
    <PageHero eyebrow="Workstr App" title={["Laat zien wat je kunt.", "Werk vindt jou."]} text="Ontdek werk met beeld van de echte werkplek, bouw een profiel dat met je meegroeit en kom direct in contact met bedrijven.">
      <div className="ctas"><a className="btn primary lg" href={href("early-access/")} onClick={() => track("early_access_started", { from: "professionals" })}>Krijg early access</a>
        <a className="btn lg" href={href("app.html#/app")}>Probeer het prototype <ArrowRight size={16} /></a></div>
    </PageHero>
    <Viewed event="professional_section_viewed" className="sec">
      <Steps items={flows.professionals} render={([, , k]) => { const S = SCREENS[k]; return <Phone label={`App-scherm`}><S /></Phone>; }} />
    </Viewed>
    <section className="sec split"><Head eyebrow="Work Profile" title={["Meer dan een cv."]} text="Projecten met foto, skills, certificaten met status en je beschikbaarheid." /><ProjectDemo /></section>
    <section className="sec split rev"><Head eyebrow="Matching" title={["Zie waarom", "het past."]} /><MatchDemo /></section>
    <section className="sec"><Head title={["Veelgestelde vragen"]} /><Faq items={faq.professionals} /></section>
    <FinalCta title={["Show your work.", "Find your future."]} />
  </>);
}

export function Business() {
  return (<>
    <PageHero eyebrow="Workstr Business" title={["Vind mensen die echt", "bij het werk passen."]} text="Vacatures die zichzelf structureren, matches met uitleg, talent zoeken op projecten en certificaten, en direct contact.">
      <div className="ctas"><a className="btn primary lg" href={href("contact/")} onClick={() => track("demo_started", { from: "business" })}>Vraag een demo aan</a>
        <a className="btn lg" href={href("app.html#/business")}>Open het prototype <ArrowRight size={16} /></a></div>
    </PageHero>
    <Viewed event="business_section_viewed" className="sec"><BusinessDemo /></Viewed>
    <section className="sec"><Head title={["Van vacature", "tot plaatsing."]} /><Steps items={flows.business} /></section>
    <section className="sec split"><Head eyebrow="Bedrijfsprofiel" title={["Laat zien hoe het is", "om bij jullie te werken."]} /><CompanyProfile /></section>
    <section className="sec"><Head title={["Veelgestelde vragen"]} /><Faq items={faq.business} /></section>
    <FinalCta title={["Recruitment zonder", "onnodig werk."]} text="We zoeken pilotpartners in de technische sector. Plan een kennismaking." />
  </>);
}

export function Managed() {
  return (<>
    <PageHero eyebrow="Workstr Managed Services · Voor enterprise · In ontwikkeling" title={["Je volledige externe", "workforce. Eén omgeving."]} text="Workstr combineert software met managed services: wij beheren aanvragen, leveranciers, compliance, contracten en uren — met agents voor het standaardwerk en mensen voor de beslissingen.">
      <div className="ctas"><a className="btn primary lg" href={href("contact/")} onClick={() => track("demo_started", { from: "managed" })}>Praat met Workstr</a></div>
    </PageHero>
    <Viewed event="msp_section_viewed" className="sec enterprise"><MspFlow /><MspDashboard /></Viewed>
    <section className="sec"><Head title={["Van aanvraag", "tot rapportage."]} /><Steps items={flows.managed} /></section>
    <section className="sec split"><Head eyebrow="Software + service" title={["Straks gebruiken we het zelf.", "Elke dag."]} text="Ons eigen MSP-team gaat in Workstr werken. Wat daar knelt, verbeteren we in de software. Zo wordt de dienst efficiënter en de software beter." /><ComplianceDemo /></section>
    <FinalCta title={["Meer grip.", "Minder administratie."]} text="Managed Services is in ontwikkeling. We bouwen het samen met de eerste enterprise-partners." />
  </>);
}

export function Ai() {
  return (<>
    <PageHero eyebrow="AI bij Workstr" title={["Geen hype.", "Werk dat gewoon gebeurt."]} text="Normale software voor wat voorspelbaar is. AI voor taal, documenten, uitzonderingen en uitleg. En een mens voor elke belangrijke beslissing." />
    <Viewed event="ai_section_viewed" className="sec"><AiCapabilities /></Viewed>
    <section className="sec"><Head title={["Agents die samenwerken."]} text="Elke agent heeft één taak. Alles wordt gelogd en is terug te zien." /><Agents /></section>
    <section className="sec split"><Head title={["Human when", "it matters."]} text="Contracten, betalingen en aannamebeslissingen gaan nooit zonder akkoord van een mens." /><Orchestration /></section>
    <FinalCta title={["AI als assistent.", "Niet als magie."]} />
  </>);
}

export function About() {
  return (<>
    <PageHero eyebrow="Over Workstr" title={["People are more than a CV.", "Work is more than a job title."]} text={pages.about.mission} />
    <section className="sec"><ul className="principles">{pages.about.principles.map(([t, d], i) => <Reveal as="li" key={t} delay={i * 80}><h3>{t}</h3><p className="muted">{d}</p></Reveal>)}</ul></section>
    <section className="sec split"><Head eyebrow="Flywheel" title={["Hoe beter je profiel,", "hoe beter het werk."]} /><Flywheel /></section>
    <section className="sec split rev"><Head eyebrow="Roadmap" title={["Eerst de kern.", "Dan de rest."]} text="We starten in de technische arbeidsmarkt in Nederland. Daarna Benelux en Europa." /><Roadmap /></section>
    <FinalCta />
  </>);
}

export function Contact() {
  return (
    <section className="formpage">
      <div><Eyebrow>Contact</Eyebrow><h1 className="display sm">Praat met Workstr.</h1><p className="lead">Plan een demo of word pilotpartner. We reageren persoonlijk.</p>
        <ul className="checks"><li><Check size={16} /> Demo van Workstr Business</li><li><Check size={16} /> Pilot in de technische sector</li><li><Check size={16} /> Gesprek over Managed Services</li></ul></div>
      <LeadForm kind="company" lockKind source="contact" />
    </section>
  );
}

export function EarlyAccess() {
  const kind = new URLSearchParams(location.search).get("type") === "company" ? "company" : "professional";
  return (
    <section className="formpage">
      <div><Eyebrow>Early access</Eyebrow><h1 className="display sm">Wees er als eerste bij.</h1><p className="lead">Workstr is in ontwikkeling. Meld je aan en we laten het je weten zodra we opengaan in jouw vakgebied.</p>
        <Phone className="mini" label="Work Profile in de app"><SCREENS.profile /></Phone></div>
      <LeadForm kind={kind} source="early-access" />
    </section>
  );
}

const Legal = ({ title, children }) => (
  <article className="legal"><Eyebrow>Concept · wordt juridisch gecontroleerd vóór lancering</Eyebrow><h1 className="display sm">{title}</h1>{children}</article>
);

export const Privacy = () => (
  <Legal title="Privacyverklaring">
    <p>Workstr is in ontwikkeling. Deze verklaring beschrijft hoe we nu met gegevens omgaan op deze website. De volledige verklaring voor het platform volgt bij lancering.</p>
    <h2>Welke gegevens</h2><p>Als je het early-access- of demoformulier invult: naam, e-mailadres en wat je zelf invult (zoals bedrijf, werkgebied of telefoonnummer).</p>
    <h2>Waarvoor</h2><p>Alleen om contact met je op te nemen over Workstr. We verkopen niets door en sturen geen nieuwsbrief zonder je toestemming.</p>
    <h2>Bewaren en verwijderen</h2><p>Bewaartermijnen leggen we vast vóór de lancering. Tot die tijd verwijderen we je gegevens zodra je daarom vraagt. Inzage, correctie of verwijdering vraag je aan via het contactformulier.</p>
    <h2>Opslag</h2><p>Aanmeldingen worden opgeslagen bij onze databaseleverancier Supabase. Bezoekers kunnen eerder ingestuurde gegevens niet teruglezen.</p>
    <h2 id="cookies">Cookies en meten</h2><p>Deze website plaatst geen tracking-cookies en laadt geen analytics zonder toestemming. Voorkeuren in de demo-app worden alleen lokaal in je eigen browser bewaard.</p>
    <h2>Matching en AI</h2><p>Workstr neemt geen geautomatiseerde aannamebeslissingen. Matches worden uitgelegd en belangrijke beslissingen liggen altijd bij een mens.</p>
  </Legal>
);

export const Terms = () => (
  <Legal title="Voorwaarden">
    <p>Deze website en de demo-omgeving zijn een preview van Workstr, dat in ontwikkeling is. De voorwaarden voor het platform volgen bij lancering.</p>
    <h2>Demo en prototype</h2><p>Alle bedrijven, personen, vacatures en cijfers in de demo's zijn fictief. Aan de demo kunnen geen rechten worden ontleend.</p>
    <h2>Beschikbaarheid</h2><p>Functies met het label ‘in ontwikkeling’, ‘early access’ of ‘enterprise roadmap’ zijn nog niet commercieel beschikbaar.</p>
    <h2>Intellectueel eigendom</h2><p>Merk, ontwerp en software van Workstr mogen niet zonder toestemming worden hergebruikt.</p>
    <h2>Contact</h2><p>Vragen over deze voorwaarden? Neem contact op via de <a href={href("contact/")}>contactpagina</a>.</p>
  </Legal>
);

export const NotFound = () => (
  <PageHero eyebrow="404" title={["Deze pagina bestaat niet."]} text="Misschien zoek je dit:"><div className="ctas"><a className="btn primary lg" href={href()}>Naar home</a></div></PageHero>
);

export const PAGES = { home: Home, professionals: Professionals, business: Business, "managed-services": Managed, ai: Ai, about: About, contact: Contact, "early-access": EarlyAccess, privacy: Privacy, terms: Terms };
