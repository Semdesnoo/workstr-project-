import React, { useEffect, useRef, useState } from "react";
import { List, X, CaretDown, ArrowRight, Plus } from "@phosphor-icons/react";
import { nav, footer } from "./content.js";
import { href, track, useInView, reduced } from "./lib.js";

export const Logo = () => <span className="logo">workstr<i>.</i></span>;

export function Header() {
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const here = document.body.dataset.page;
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <header className="hdr">
      <a href={href()} className="hdr-logo" aria-label="Workstr home"><Logo /></a>
      <nav aria-label="Hoofdnavigatie" className="hdr-nav">
        <div className="drop" onMouseEnter={() => setDrop(true)} onMouseLeave={() => setDrop(false)}>
          <button aria-expanded={drop} aria-controls="drop-product" onClick={() => setDrop(!drop)}>Product <CaretDown size={12} weight="bold" /></button>
          <div id="drop-product" className="drop-panel" hidden={!drop}>
            {nav[0].items.map((i) => <a key={i.href} href={href(i.href)}><b>{i.label}</b><span>{i.text}</span></a>)}
          </div>
        </div>
        {nav.slice(1).map((n) => <a key={n.href} href={href(n.href)} aria-current={here === n.href.replace("/", "") ? "page" : undefined}>{n.label}</a>)}
      </nav>
      <div className="hdr-end">
        <a className="hdr-login" href={href("app.html#/app")}>Inloggen</a>
        <a className="btn primary" href={href("early-access/")} onClick={() => track("early_access_started", { from: "header" })}>Krijg early access</a>
        <button className="burger" aria-label="Menu" aria-expanded={open} aria-controls="drawer" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <List size={22} />}</button>
      </div>
      <div id="drawer" className="drawer" hidden={!open}>
        <nav aria-label="Mobiel menu">
          {nav[0].items.map((i) => <a key={i.href} href={href(i.href)}>{i.label}<span>{i.text}</span></a>)}
          <a href={href("about/")}>Over Workstr</a>
          <a href={href("contact/")}>Contact</a>
          <a href={href("app.html#/app")}>Inloggen</a>
        </nav>
        <a className="btn primary block" href={href("early-access/")}>Krijg early access</a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr-top">
        <div className="stack"><Logo /><p className="muted">Less searching. More working.</p></div>
        {footer.map(([h, links]) => <nav key={h} aria-label={h}><h2>{h}</h2>{links.map(([p, l]) => <a key={l} href={href(p)}>{l}</a>)}</nav>)}
      </div>
      <div className="ftr-bottom"><span>© {new Date().getFullYear()} Workstr. In ontwikkeling.</span>
        <a href="https://www.linkedin.com/" rel="noopener">LinkedIn</a></div>
    </footer>
  );
}

// Fade/slide in once. Content is in the DOM from the start (no JS = visible, see .js .rv in CSS).
export function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const [ref, seen] = useInView(0.15);
  return <Tag ref={ref} className={`rv ${seen ? "in" : ""} ${className}`} style={{ "--d": `${delay}ms` }} {...rest}>{children}</Tag>;
}

export const Pic = ({ src, alt = "", className, eager }) => (
  <picture className={className}>
    <source type="image/webp" srcSet={href(src.replace(/\.jpg$/, ".webp"))} />
    <img src={href(src)} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
  </picture>
);

// Video that only loads near the viewport, pauses off-screen and never autoplays for reduced motion.
export function Video({ m, portrait, className = "", eager, label }) {
  const ref = useRef(null);
  const [load, setLoad] = useState(!!eager);
  useEffect(() => {
    const v = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setLoad(true); if (!reduced()) v.play().catch(() => {}); } else v.pause();
    }, { rootMargin: "200px" });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={ref} className={className} muted loop playsInline preload={eager ? "auto" : "none"} autoPlay={eager && !reduced()}
      poster={href(portrait && matchMedia("(max-width: 700px)").matches ? portrait.poster : m.poster)} aria-label={label} onPlay={() => track("video_played", { video: label })}>
      {load && portrait && <source media="(max-width: 700px)" src={href(portrait.mp4)} type="video/mp4" />}
      {load && m.webm && <source src={href(m.webm)} type="video/webm" />}
      {load && <source src={href(m.mp4)} type="video/mp4" />}
    </video>
  );
}

export const Phone = ({ children, className = "", label }) => (
  <div className={`phone ${className}`} role="figure" aria-label={label}>
    <span className="phone-island" aria-hidden />
    <div className="phone-screen">{children}</div>
  </div>
);

export const Eyebrow = ({ children }) => <p className="eyebrow">{children}</p>;

export function Faq({ items }) {
  return (
    <div className="faq">
      {items.map(([q, a]) => <details key={q}><summary>{q}<Plus size={18} aria-hidden /></summary><p>{a}</p></details>)}
    </div>
  );
}

export function FinalCta({ title = ["Minder zoeken.", "Meer werken."], text = "Workstr is in ontwikkeling. Doe mee als professional of als pilotpartner." }) {
  return (
    <section className="final">
      <Reveal as="h2" className="huge">{title[0]}<br /><span className="dim">{title[1]}</span></Reveal>
      <p className="lead">{text}</p>
      <div className="ctas">
        <a className="btn primary lg" href={href("early-access/")} onClick={() => track("early_access_started", { from: "final" })}>Krijg early access</a>
        <a className="btn lg" href={href("contact/")} onClick={() => track("demo_started", { from: "final" })}>Praat met Workstr <ArrowRight size={16} /></a>
      </div>
    </section>
  );
}

// Numbered process strip used on the product pages.
export function Steps({ items, render }) {
  return (
    <ol className="steps">
      {items.map((it, i) => (
        <Reveal as="li" key={it[0]} delay={(i % 4) * 60}>
          {render && <div className="step-visual">{render(it, i)}</div>}
          <span className="step-n">{String(i + 1).padStart(2, "0")}</span>
          <h3>{it[0]}</h3><p className="muted">{it[1]}</p>
        </Reveal>
      ))}
    </ol>
  );
}

export const PageHero = ({ eyebrow, title, text, children }) => (
  <section className="phero">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h1 className="display">{title[0]}{title[1] && <><br /><span className="dim">{title[1]}</span></>}</h1>
    <p className="lead">{text}</p>
    {children}
  </section>
);
