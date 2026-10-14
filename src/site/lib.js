import { useEffect, useRef, useState } from "react";

// Each page's HTML sets <body data-root="../"> so links work from any depth on GitHub Pages.
export const ROOT = (typeof document !== "undefined" && document.body.dataset.root) || "./";
export const href = (p = "") => (/^(https?:|mailto:|#)/.test(p) ? p : ROOT + p);
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Analytics-ready events. Nothing leaves the browser: no tracker is loaded until there is consent.
// A consent-gated analytics script can subscribe with addEventListener("workstr:track", ...).
export function track(name, props = {}) {
  (window.workstrEvents ||= []).push({ name, ...props, at: Date.now() });
  window.dispatchEvent(new CustomEvent("workstr:track", { detail: { name, ...props } }));
}

// Reveal once when scrolled into view; optional one-time event.
export function useInView(threshold = 0.25, event) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setSeen(true);
      if (event) track(event);
      io.disconnect();
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, event]);
  return [ref, seen];
}

// ---- Lead forms: validation + submit adapter ----------------------------------
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FREEMAIL = /@(gmail|hotmail|outlook|live|yahoo|icloud|me|ziggo|kpnmail|planet)\./i;

export function validateLead(kind, d) {
  const e = {};
  if ((d.name || "").trim().length < 2) e.name = "Vul je naam in.";
  if (!EMAIL.test((d.email || "").trim())) e.email = "Vul een geldig e-mailadres in.";
  else if (kind === "company" && FREEMAIL.test(d.email)) e.email = "Gebruik je zakelijke e-mailadres.";
  if (kind === "company" && (d.company || "").trim().length < 2) e.company = "Vul je bedrijfsnaam in.";
  if (kind === "company" && !d.size) e.size = "Kies het aantal medewerkers.";
  if (kind === "professional" && !d.role) e.role = "Kies wat het beste bij je past.";
  if (d.phone && !/^[+()\d\s-]{8,20}$/.test(d.phone)) e.phone = "Dit telefoonnummer klopt niet.";
  return e;
}

// Supabase REST insert into public.leads (insert-only via RLS). Returns only after the server said yes.
export async function submitLead(row) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Aanmelden is op deze omgeving nog niet gekoppeld. Er is niets verstuurd.");
  const res = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error("Versturen is niet gelukt. Probeer het zo nog eens.");
}
