import React from "react";
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
