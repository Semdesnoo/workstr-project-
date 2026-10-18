import React, { useEffect, useState } from "react";
import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";

export const initials = (n) => n.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

export function Logo({ size = 22, sub }) {
  return <span className="logo" style={{ fontSize: size }}>workstr<i>.</i>{sub && <small>{sub}</small>}</span>;
}

const STATUS = { verified: "Verified", uploaded: "Uploaded", expiring: "Expiring soon", expired: "Expired", missing: "Missing" };
export const StatusBadge = ({ status }) => <span className={`badge ${status}`}>{STATUS[status]}</span>;

export function Reasons({ reasons }) {
  const Icon = { ok: CheckCircle, warn: WarningCircle, no: XCircle };
  return (
    <ul className="reasons">
      {reasons.map((r) => { const I = Icon[r.type]; return <li key={r.text}><I size={18} weight="fill" className={r.type} /><span>{r.text}</span></li>; })}
    </ul>
  );
}

// ---- Media: a work photo or a company video. Uploaded videos live in IndexedDB (too big for localStorage).
export const isVideo = (src = "") => /^idb:|^data:video|\.(mp4|webm|mov)$/i.test(src);
const mediaDb = () => new Promise((ok, no) => {
  const r = indexedDB.open("workstr-media", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("m");
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
export const MAX_VIDEO_MB = 60;
export async function saveMedia(file) {
  if (file.type.startsWith("image/")) return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(file); });
  if (!file.type.startsWith("video/")) throw new Error(`${file.name} is geen foto of video`);
  if (file.size > MAX_VIDEO_MB * 1e6) throw new Error(`${file.name} is groter dan ${MAX_VIDEO_MB} MB`);
  const id = `idb:${crypto.randomUUID()}`;
  const db = await mediaDb();
  await new Promise((ok, no) => { const t = db.transaction("m", "readwrite"); t.objectStore("m").put(file, id); t.oncomplete = ok; t.onerror = () => no(t.error); });
  return id;
}
export function Media({ src = "", alt = "", ...rest }) {
  const [url, setUrl] = useState(src.startsWith("idb:") ? "" : src);
  useEffect(() => {
    if (!src.startsWith("idb:")) { setUrl(src); return undefined; }
    let u, live = true;
    mediaDb().then((db) => { const r = db.transaction("m").objectStore("m").get(src); r.onsuccess = () => { if (live && r.result) setUrl((u = URL.createObjectURL(r.result))); }; });
    return () => { live = false; if (u) URL.revokeObjectURL(u); };
  }, [src]);
  if (!isVideo(src)) return <img src={url} alt={alt} {...rest} />;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  return url ? <video src={url} autoPlay={!still} controls={still} muted loop playsInline aria-label={alt || "Bedrijfsvideo"} {...rest} /> : <span className="media-loading" />;
}

// E-mail + wachtwoord. onDone(mode, email, password) does the work and throws a readable error.
export function AuthForm({ mode: start = "signup", onDone, submit }) {
  const [mode, setMode] = useState(start);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await onDone(mode, email.trim(), pw); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <form className="authbox" onSubmit={go}>
      <label className="f">E-mail<input className="in" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="f">Wachtwoord<input className="in" type="password" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} />
        {mode === "signup" && <span className="xs muted">Minstens 8 tekens.</span>}</label>
      {mode === "signup" && <p className="xs muted">Met een account ga je akkoord met de <a href="./terms/">voorwaarden</a> en de <a href="./privacy/">privacyverklaring</a>.</p>}
      {err && <p className="sm err" role="alert">{err}</p>}
      <button className="btn primary block" disabled={busy}>{busy ? "Even geduld…" : mode === "signup" ? submit || "Account maken" : "Inloggen"}</button>
      <button type="button" className="btn ghost block" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(""); }}>{mode === "signup" ? "Ik heb al een account" : "Nieuw account maken"}</button>
    </form>
  );
}
