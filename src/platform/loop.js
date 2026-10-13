// The Workstr core loop: interest from either side → mutual interest = match → chat.
// One record per (vacancy, person). Pure functions on the store, shared by App and Business.
export const uid = () => crypto.randomUUID();
export const isMatch = (i) => !!(i && i.cand && i.co);
export const findInterest = (s, job, person) => (s.interests || []).find((i) => i.job === job && i.person === person);

export function showInterest(s, job, person, side, at = new Date().toISOString()) {
  const list = s.interests || [];
  const ex = findInterest(s, job, person);
  if (ex?.[side]) return s; // idempotent
  const i = ex ? { ...ex, [side]: true, declined: undefined } : { id: uid(), job, person, cand: side === "cand", co: side === "co", at };
  let chats = s.chats || {};
  if (isMatch(i)) chats = { ...chats, [i.id]: [{ from: "sys", text: "It's a match — jullie kunnen nu direct met elkaar praten.", at }] };
  return { ...s, interests: ex ? list.map((x) => (x === ex ? i : x)) : [...list, i], chats };
}

// "Niet interessant" on an incoming interest: hidden for the side that declined, nothing sent.
export const decline = (s, id, side) => ({ ...s, interests: s.interests.map((i) => (i.id === id ? { ...i, declined: side } : i)) });

export function sendMessage(s, id, from, text, at = new Date().toISOString()) {
  const t = text.trim();
  const i = s.interests.find((x) => x.id === id);
  if (!t || !isMatch(i)) return s; // chat only after mutual interest
  const other = from === "cand" ? "unreadCo" : "unreadCand";
  return { ...s, chats: { ...s.chats, [id]: [...(s.chats[id] || []), { from, text: t, at }] },
    interests: s.interests.map((x) => (x.id === id ? { ...x, [other]: (x[other] || 0) + 1 } : x)) };
}

export const markRead = (s, id, side) => ({ ...s, interests: s.interests.map((i) => (i.id === id ? { ...i, [side === "cand" ? "unreadCand" : "unreadCo"]: 0, [side === "cand" ? "seenCand" : "seenCo"]: true } : i)) });
