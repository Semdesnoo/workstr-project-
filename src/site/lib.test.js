import test from "node:test";
import assert from "node:assert/strict";
import { validateLead } from "./lib.js";

test("lead validation", () => {
  assert.deepEqual(Object.keys(validateLead("professional", {})).sort(), ["email", "name", "role"]);
  assert.deepEqual(validateLead("professional", { name: "Ann", email: "a@b.nl", role: "Werkzoekend" }), {});
  assert.equal(validateLead("company", { name: "Ann", email: "ann@gmail.com", company: "X BV", size: "1–10" }).email, "Gebruik je zakelijke e-mailadres.");
  assert.deepEqual(validateLead("company", { name: "Ann", email: "ann@xbv.nl", company: "X BV", size: "1–10" }), {});
  assert.ok(validateLead("professional", { name: "Ann", email: "a@b.nl", role: "x", phone: "abc" }).phone);
});
