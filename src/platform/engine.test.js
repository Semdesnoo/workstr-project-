// Run: node --test src/platform/engine.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { runWorkflows, enqueue, processQueue, demoSend, backoffMs, MAX_ATTEMPTS, render } from "./engine.js";

const wfs = [
  { id: "w1", name: "Welkom", on: true, trigger: "candidate.created", when: { minScore: 80 },
    actions: [{ type: "message", channel: "whatsapp", template: "Hoi {voornaam}, {score}% match op {vacature}" }, { type: "stage", to: "Benaderd" }] },
  { id: "w2", name: "Afwijzing", on: true, approval: true, trigger: "stage.changed", when: { stage: "Afgewezen" },
    actions: [{ type: "message", channel: "email", template: "Beste {voornaam}" }] },
  { id: "w3", name: "Uit", on: false, trigger: "candidate.created", actions: [{ type: "task", text: "x" }] },
];

test("render keeps unknown vars", () => assert.equal(render("{a} {b}", { a: 1 }), "1 {b}"));

test("workflow conditions", () => {
  const vars = { voornaam: "Kim", score: 91, vacature: "NDT" };
  const a = runWorkflows(wfs, { id: "e1", type: "candidate.created", score: 91, vars });
  assert.deepEqual(a.map((x) => x.type), ["message", "stage"]);
  assert.equal(a[0].text, "Hoi Kim, 91% match op NDT");
  assert.equal(runWorkflows(wfs, { id: "e2", type: "candidate.created", score: 60 }).length, 0);
  assert.equal(runWorkflows(wfs, { id: "e3", type: "stage.changed", stage: "Gesprek" }).length, 0);
  assert.equal(runWorkflows(wfs, { id: "e4", type: "stage.changed", stage: "Afgewezen", vars })[0].approval, true);
});

test("queue: idempotent, approval gate, retry with backoff, dead-letter, permanent fail", () => {
  let q = enqueue([], { id: "j1", key: "k1", channel: "whatsapp", to: "c1", text: "hi" }, 0);
  q = enqueue(q, { id: "j1b", key: "k1", channel: "whatsapp", to: "c1", text: "hi" }, 0);
  assert.equal(q.length, 1);
  q = enqueue(q, { id: "j2", key: "k2", channel: "email", to: "c1", text: "x", approval: true }, 0);
  assert.equal(q[1].status, "approval");

  const ctx = { contacts: { c1: { phone: "+31", email: "" } }, outage: { whatsapp: true } };
  q = processQueue(q, (j) => demoSend(j, ctx), 0);
  assert.equal(q[0].status, "retry");
  assert.equal(q[0].runAt, backoffMs(1));
  assert.equal(q[1].status, "approval"); // untouched until a human approves
  assert.equal(processQueue(q, (j) => demoSend(j, ctx), 1)[0].attempts, 1); // not due yet

  let t = 0;
  for (let i = 0; i < MAX_ATTEMPTS; i++) { t += 10 ** 9; q = processQueue(q, (j) => demoSend(j, ctx), t); }
  assert.equal(q[0].status, "dead");

  let q2 = enqueue([], { id: "j3", key: "k3", channel: "whatsapp", to: "c1", text: "hi" }, 0);
  q2 = processQueue(q2, (j) => demoSend(j, ctx), 0);
  q2 = processQueue(q2, (j) => demoSend(j, { ...ctx, outage: {} }), backoffMs(1));
  assert.equal(q2[0].status, "sent"); // recovered after outage

  const q3 = processQueue(enqueue([], { id: "j4", key: "k4", channel: "email", to: "c1", text: "x" }, 0), (j) => demoSend(j, ctx), 0);
  assert.equal(q3[0].status, "failed"); // no email address: no pointless retries
});
