// Run: npx playwright test tests/live.spec.js
// The real loop on real Supabase (.env.local): two separate browsers = two devices, two accounts.
// Company signs up + publishes a vacancy with a video → professional signs up via the wizard, applies →
// company accepts → both chat → both delete their account (AVG, and keeps the database clean).
import { test, expect } from "@playwright/test";
import { purge } from "./purge.js";

const errorsOf = (page) => { const e = []; page.on("pageerror", (x) => e.push(x.message)); return e; };
const POLL = { timeout: 30000 }; // the other side shows up on the next 8 s poll

test("live: bedrijf + professional op twee apparaten → sollicitatie → match → chat → account verwijderen", async ({ browser }) => {
  test.setTimeout(240000);
  const ts = Date.now(), coName = `Noordzee Inspectie ${ts}`, who = `Daan Live ${ts}`;
  const coCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const proCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", isMobile: true, hasTouch: true });
  const co = await coCtx.newPage(), pro = await proCtx.newPage();
  const coErr = errorsOf(co), proErr = errorsOf(pro);
  for (const p of [co, pro]) p.on("dialog", (d) => d.accept());
  const coAcct = [`workstr-e2e-co-${ts}@mailinator.com`, `E2e-${crypto.randomUUID()}`], proAcct = [`workstr-e2e-pro-${ts}@mailinator.com`, `E2e-${crypto.randomUUID()}`];
  try {

  // ---- bedrijf: account + profiel + eerste vacature met video (→ Supabase Storage)
  await co.goto("/app.html#/business");
  await co.getByRole("button", { name: "Maak bedrijfsaccount" }).click();
  await co.getByLabel("Bedrijfsnaam").fill(coName);
  await co.getByRole("button", { name: "Staalbouw" }).click();
  await co.getByRole("button", { name: "Volgende" }).click();
  await co.getByLabel("Over het bedrijf").fill("Inspectiebedrijf voor staalconstructies en offshore wind in de Rotterdamse haven.");
  await co.getByLabel("Pluspunt 1").fill("Dagdienst, vaste ploeg");
  await co.getByRole("button", { name: "Volgende" }).click();
  await co.getByLabel("Naam contactpersoon").fill("Eva de Wit");
  await expect(co.getByRole("button", { name: "Volgende" })).toBeDisabled(); // account nog niet ingevuld
  await co.getByLabel("Zakelijk e-mailadres (om in te loggen)").fill(coAcct[0]);
  await co.getByLabel("Wachtwoord").fill(coAcct[1]);
  await co.getByRole("button", { name: "Volgende" }).click();
  await co.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await co.getByRole("button", { name: "Zet in velden" }).click();
  await co.locator("input[type=file]").setInputFiles("public/work/vanoord.mp4");
  await expect(co.getByRole("button", { name: "Verwijder vacaturebeeld" }).locator("video")).toBeAttached();
  await co.getByRole("button", { name: /Publiceer en bekijk matches/ }).click();
  await expect(co.getByRole("heading", { name: `Goedemorgen, ${coName}` })).toBeVisible({ timeout: 60000 });
  await expect(co.getByRole("button", { name: "Uitloggen" })).toBeVisible();

  // ---- professional: wizard → account → ziet de echte vacatuere (video uit Storage)
  await pro.goto("/app.html#/app");
  await pro.getByRole("button", { name: /Maak je Work Profile/ }).click();
  await pro.getByRole("button", { name: "Start met stap 1" }).click();
  await pro.getByLabel("Naam").fill(who);
  await pro.getByLabel("Functie of richting").fill("NDT Inspector · UT2");
  await pro.getByRole("button", { name: "Volgende" }).click();
  await pro.getByLabel("Jaren werkervaring in je vak").fill("6");
  for (const s of ["UT", "PAUT", "NDT"]) await pro.getByRole("button", { name: s, exact: true }).click();
  await pro.getByRole("button", { name: "Volgende" }).click();
  for (const c of ["UT2", "VCA", "BOSIET"]) await pro.getByRole("button", { name: c, exact: true }).click();
  await pro.getByRole("button", { name: "Volgende" }).click();
  await pro.getByRole("button", { name: "Volgende" }).click();
  await pro.getByLabel("Korte introductie").fill("Inspecteur met offshore-ervaring.");
  await pro.getByRole("button", { name: "Profiel afronden" }).click();
  await pro.getByLabel("E-mail").fill(proAcct[0]);
  await pro.getByLabel("Wachtwoord").fill(proAcct[1]);
  await pro.getByRole("button", { name: "Account maken en bewaren" }).click();
  const card = pro.getByRole("article", { name: `NDT Inspector Monopiles bij ${coName}` });
  await expect(card).toBeAttached({ timeout: 60000 });
  await expect(card.locator("video")).toHaveAttribute("src", /\/storage\/v1\/object\/public\/media\//);
  await expect(pro.getByRole("article", { name: "NDT Inspector bij Van Oord" })).toHaveCount(0); // geen demo-data in live
  await card.getByRole("button", { name: /Bekijk vacature/ }).click();
  await pro.getByRole("button", { name: "Solliciteer" }).click();
  await pro.getByRole("dialog", { name: "Solliciteren" }).getByLabel("Bericht (optioneel)").fill("Ik kan per direct starten.");
  await pro.getByRole("button", { name: "Verstuur sollicitatie" }).click();
  await expect(pro.getByRole("status")).toContainText(`Sollicitatie verstuurd — ${coName} ziet nu je Work Profile`);

  // ---- bedrijf: ziet de sollicitatie (ander apparaat) en accepteert
  const applicant = co.getByRole("button", { name: `DL ${who}` }); // "Sollicitaties ontvangen"
  await expect(applicant).toBeVisible(POLL);
  await applicant.click();
  await expect(co.getByText("“Ik kan per direct starten.”")).toBeVisible();
  await co.getByRole("button", { name: "Accepteer en start chat" }).click();
  await co.getByRole("button", { name: "Open chat" }).click(POLL);
  await co.getByLabel("Bericht").fill("Welkom! Ben je donderdag beschikbaar?");
  await co.getByRole("button", { name: "Verstuur" }).click();

  // ---- professional: It's a match → gesprek → antwoord
  await pro.getByRole("button", { name: "Start gesprek" }).click(POLL);
  const chat = pro.getByRole("dialog", { name: `Chat met ${coName}` });
  await expect(chat.getByText("Welkom! Ben je donderdag beschikbaar?")).toBeVisible(POLL);
  await pro.getByLabel("Bericht").fill("Ja, vanaf 15:00.");
  await pro.getByRole("button", { name: "Verstuur" }).click();
  await expect(co.locator(".msg").filter({ hasText: "Ja, vanaf 15:00." })).toBeVisible(POLL);

  // ---- na herladen staat alles er nog (geen localStorage-wereld meer)
  await pro.reload();
  await expect(pro.getByRole("navigation", { name: "Hoofdmenu" })).toBeVisible({ timeout: 30000 });

  // ---- beide accounts verwijderen (AVG) → bedrijf, vacature en gesprek zijn weg
  await co.getByRole("button", { name: "Account verwijderen" }).click();
  await expect(co.getByRole("button", { name: "Maak bedrijfsaccount" })).toBeVisible({ timeout: 30000 });
  await pro.getByRole("button", { name: "Profile" }).click();
  await pro.getByRole("button", { name: "Account verwijderen" }).click();
  await expect(pro.getByRole("button", { name: /Maak je Work Profile/ })).toBeVisible({ timeout: 30000 });

  expect(coErr).toEqual([]);
  expect(proErr).toEqual([]);
  } finally {
    await coCtx.close(); await proCtx.close();
    await purge(...coAcct); await purge(...proAcct);
  }
});
