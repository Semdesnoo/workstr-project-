// Run: node --test src/platform/loop.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { showInterest, sendMessage, markRead, decline, isMatch, findInterest } from "./loop.js";

const base = () => ({ interests: [], chats: {} });

test("interest → match in either order, idempotent", () => {
  let s = showInterest(base(), "j1", "me", "cand");
  assert.equal(s.interests.length, 1);
  assert.ok(!isMatch(s.interests[0]));
  assert.equal(showInterest(s, "j1", "me", "cand"), s, "same side twice is a no-op");
  assert.equal(sendMessage(s, s.interests[0].id, "cand", "hoi"), s, "no chat before match");
  s = showInterest(s, "j1", "me", "co");
  const i = findInterest(s, "j1", "me");
  assert.ok(isMatch(i));
  assert.equal(s.interests.length, 1);
  assert.equal(s.chats[i.id].length, 1, "match opens chat with one system line");

  let t = showInterest(base(), "j2", "c2", "co");
  t = showInterest(t, "j2", "c2", "cand");
  assert.ok(isMatch(t.interests[0]));
});

test("messages + unread per side", () => {
  let s = showInterest(showInterest(base(), "j1", "me", "cand"), "j1", "me", "co");
  const id = s.interests[0].id;
  s = sendMessage(s, id, "co", "Donderdag beschikbaar?");
  s = sendMessage(s, id, "co", "  ");
  assert.equal(s.chats[id].length, 2);
  assert.equal(s.interests[0].unreadCand, 1);
  s = sendMessage(s, id, "cand", "Ja, vanaf 15:00.");
  assert.equal(s.interests[0].unreadCo, 1);
  s = markRead(s, id, "cand");
  assert.equal(s.interests[0].unreadCand, 0);
  assert.ok(s.interests[0].seenCand);
});

test("decline hides, later interest revives", () => {
  let s = showInterest(base(), "j1", "me", "co");
  s = decline(s, s.interests[0].id, "cand");
  assert.equal(s.interests[0].declined, "cand");
  s = showInterest(s, "j1", "me", "cand");
  assert.ok(isMatch(s.interests[0]) && !s.interests[0].declined);
});
