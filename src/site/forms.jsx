import React, { useRef, useState } from "react";
import { Check, WarningCircle } from "@phosphor-icons/react";
import { validateLead, submitLead, track, href } from "./lib.js";

const ROLES = ["Professional in loondienst", "Freelancer / zzp'er", "Werkzoekend", "Student / starter"];
const SIZES = ["1–10", "11–50", "51–250", "251–1000", "1000+"];
const INTERESTS = ["Recruitment", "Talent zoeken", "Managed Services (MSP)", "AI-automatisering"];

function Field({ id, label, error, children, hint }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <small className="muted" id={`${id}-h`}>{hint}</small>}
      {error && <small className="err" id={`${id}-e`}><WarningCircle size={14} weight="fill" aria-hidden /> {error}</small>}
    </div>
  );
}

export default function LeadForm({ kind: initial = "professional", lockKind, source }) {
  const [kind, setKind] = useState(initial);
  const [d, setD] = useState({ interests: [] });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState("idle"); // idle | sending | ok | error
  const [msg, setMsg] = useState("");
  const started = useRef(false);
  const form = useRef(null);
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const touch = () => { if (!started.current) { started.current = true; track(kind === "company" ? "demo_started" : "early_access_started", { from: "form" }); } };
  const inv = (k) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `${k}-e` : undefined });

  const send = async (e) => {
    e.preventDefault();
    if (d.website) return; // honeypot: bots fill hidden fields
    const errs = validateLead(kind, d);
    setErrors(errs);
    if (Object.keys(errs).length) { form.current.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus(); return; }
    setState("sending");
    try {
      await submitLead({ kind, name: d.name.trim(), email: d.email.trim(), company: d.company?.trim() || null, role: kind === "company" ? d.jobtitle || null : d.role,
        phone: d.phone?.trim() || null, size: d.size || null, interests: d.interests, message: d.message?.trim() || null, source: source || document.body.dataset.page });
      setState("ok");
      track(kind === "company" ? "demo_completed" : "early_access_completed");
    } catch (x) { setState("error"); setMsg(x.message); }
  };

  if (state === "ok") return (
    <div className="form-ok" role="status"><span className="okdot"><Check size={22} weight="bold" /></span>
      <h2>{kind === "company" ? "Bedankt. We nemen contact op." : "Je staat op de lijst."}</h2>
      <p className="muted">{kind === "company" ? "We plannen een kennismaking en laten zien wat Workstr voor jullie kan doen." : "Zodra Workstr opengaat in jouw vakgebied, hoor je het als eerste."}</p></div>
  );
  return (
    <form ref={form} className="lead" noValidate onSubmit={send} onFocus={touch}>
      {!lockKind && <div className="kind" role="radiogroup" aria-label="Type account">
        {[["professional", "Professional"], ["company", "Bedrijf"]].map(([k, l]) => <button type="button" role="radio" key={k} aria-checked={kind === k} onClick={() => { setKind(k); setErrors({}); }}>{l}</button>)}
      </div>}
      <div className="grid2">
        <Field id="name" label="Naam" error={errors.name}><input id="name" name="name" autoComplete="name" maxLength={120} value={d.name || ""} onChange={set("name")} {...inv("name")} /></Field>
        <Field id="email" label={kind === "company" ? "Zakelijk e-mailadres" : "E-mail"} error={errors.email}><input id="email" name="email" type="email" autoComplete="email" maxLength={200} value={d.email || ""} onChange={set("email")} {...inv("email")} /></Field>
        {kind === "company" ? <>
          <Field id="company" label="Bedrijf" error={errors.company}><input id="company" name="company" autoComplete="organization" maxLength={160} value={d.company || ""} onChange={set("company")} {...inv("company")} /></Field>
          <Field id="size" label="Aantal medewerkers" error={errors.size}><select id="size" name="size" value={d.size || ""} onChange={set("size")} {...inv("size")}><option value="">Kies…</option>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </> : <>
          <Field id="role" label="Ik ben" error={errors.role}><select id="role" name="role" value={d.role || ""} onChange={set("role")} {...inv("role")}><option value="">Kies…</option>{ROLES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field id="area" label="Werkgebied" hint="Bijv. NDT, welding, onderhoud"><input id="area" name="area" maxLength={120} value={d.message || ""} onChange={set("message")} /></Field>
        </>}
        <Field id="phone" label="Telefoon (optioneel)" error={errors.phone}><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20} value={d.phone || ""} onChange={set("phone")} {...inv("phone")} /></Field>
      </div>
      {kind === "company" && <>
        <fieldset className="interests"><legend>Waar ben je in geïnteresseerd?</legend>
          {INTERESTS.map((x) => <label key={x}><input type="checkbox" checked={d.interests.includes(x)} onChange={() => setD({ ...d, interests: d.interests.includes(x) ? d.interests.filter((y) => y !== x) : [...d.interests, x] })} />{x}</label>)}
        </fieldset>
        <Field id="message" label="Bericht (optioneel)"><textarea id="message" name="message" rows={3} maxLength={1000} value={d.message || ""} onChange={set("message")} /></Field>
      </>}
      <input className="hp" tabIndex={-1} autoComplete="off" name="website" aria-hidden value={d.website || ""} onChange={set("website")} />
      {state === "error" && <p className="err" role="alert"><WarningCircle size={16} weight="fill" aria-hidden /> {msg}</p>}
      <button className="btn primary lg" disabled={state === "sending"}>{state === "sending" ? "Versturen…" : kind === "company" ? "Vraag demo aan" : "Krijg early access"}</button>
      <small className="muted">We gebruiken je gegevens alleen om contact op te nemen over Workstr. Zie de <a href={href("privacy/")}>privacyverklaring</a>.</small>
    </form>
  );
}
