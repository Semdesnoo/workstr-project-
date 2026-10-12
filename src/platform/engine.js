// Workstr Engine — layer 1 automation (triggers → workflows → actions) and layer 2
// delivery (durable outbound queue with retries, idempotency and dead-letter).
// Pure functions: the browser demo runs them on a timer; a server worker can run the same code.

export const TRIGGERS = {
  "candidate.created": "Nieuwe kandidaat in CRM",
  "stage.changed": "Fase gewijzigd",
  "interview.scheduled": "Gesprek ingepland",
  "no_reply": "Geen reactie na 48 uur",
  "cert.expiring": "Certificaat verloopt binnen 30 dagen",
};
export const STAGES = ["Nieuw", "Benaderd", "Gescreend", "Gesprek", "Aanbod", "Geplaatst", "Afgewezen"];
export const CHANNELS = { whatsapp: "WhatsApp", email: "E-mail", app: "Workstr app" };

export const render = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));

const matches = (wf, ev) =>
  wf.on && wf.trigger === ev.type &&
  (!wf.when?.stage || wf.when.stage === ev.stage) &&
  (!wf.when?.minScore || (ev.score ?? 0) >= wf.when.minScore) &&
  (!wf.when?.source || wf.when.source === ev.source);

// Returns the concrete actions an event causes. Messages get an idempotency key so a
// re-fired event (double click, webhook replay) never sends twice.
export function runWorkflows(workflows, ev) {
  const out = [];
  for (const wf of workflows.filter((w) => matches(w, ev))) {
    for (const [i, a] of wf.actions.entries()) {
      const base = { workflow: wf.name, approval: !!wf.approval, key: `${wf.id}:${ev.id}:${i}` };
      if (a.type === "message") out.push({ ...base, type: "message", channel: a.channel, text: render(a.template, ev.vars || {}) });
      else if (a.type === "stage") out.push({ ...base, type: "stage", to: a.to });
      else if (a.type === "task") out.push({ ...base, type: "task", text: render(a.text, ev.vars || {}) });
    }
  }
  return out;
}

// ---- Durable outbound queue -------------------------------------------------
// job: { id, key, channel, to, text, status: queued|retry|sent|failed|dead|approval, attempts, runAt, error }
export const MAX_ATTEMPTS = 5;
export const backoffMs = (attempts) => 2 ** attempts * 60_000; // 2, 4, 8, 16 min

export function enqueue(queue, job, now = Date.now()) {
  if (queue.some((j) => j.key === job.key)) return queue; // idempotent
  return [...queue, { status: job.approval ? "approval" : "queued", attempts: 0, runAt: now, ...job, approval: undefined }];
}

// send(job) → { ok: true } | { ok: false, error, transient }
export function processQueue(queue, send, now = Date.now()) {
  return queue.map((j) => {
    if (!["queued", "retry"].includes(j.status) || j.runAt > now) return j;
    const r = send(j);
    const attempts = j.attempts + 1;
    if (r.ok) return { ...j, status: "sent", attempts, sentAt: now, error: undefined };
    if (!r.transient) return { ...j, status: "failed", attempts, error: r.error };
    if (attempts >= MAX_ATTEMPTS) return { ...j, status: "dead", attempts, error: r.error };
    return { ...j, status: "retry", attempts, runAt: now + backoffMs(attempts), error: r.error };
  });
}

// Demo channel provider: permanent error on missing contact data, transient error while
// the provider is "down" (Integrations → simulate outage).
export function demoSend(job, { contacts, outage }) {
  const c = contacts[job.to] || {};
  if (job.channel === "whatsapp" && !c.phone) return { ok: false, error: "Geen telefoonnummer / opt-in", transient: false };
  if (job.channel === "email" && !c.email) return { ok: false, error: "Geen e-mailadres", transient: false };
  if (outage?.[job.channel]) return { ok: false, error: `${CHANNELS[job.channel]} API 503`, transient: true };
  return { ok: true };
}
