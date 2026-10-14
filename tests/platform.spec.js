// Run: npx playwright test tests/platform.spec.js
// Prototype loop (localStorage) + the parked live ATS (#/ats, real Supabase via .env.local).
import { test, expect } from "@playwright/test";

const fresh = async (page, size = { width: 1440, height: 900 }) => {
  await page.setViewportSize(size);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/app.html#/app");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
};
const errorsOf = (page) => { const e = []; page.on("pageerror", (x) => e.push(x.message)); return e; };

test("de loop: profiel in 4 stappen → project → interesse → bedrijf accepteert → It's a match → chat", async ({ page }) => {
  const errors = errorsOf(page);
  await fresh(page);
  await page.getByRole("button", { name: /Maak je Work Profile/ }).click();
  await expect(page.getByRole("heading", { name: "Zo bouw je een sterk profiel" })).toBeVisible();
  await page.getByRole("button", { name: "Start met stap 1" }).click();
  await page.getByLabel("Naam").fill("Daan Visser");
  await page.getByLabel("Functie of richting").fill("NDT Inspector · UT2");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel("Jaren werkervaring in je vak").fill("6");
  for (const s of ["UT", "NDT", "Weld Inspection", "Offshore"]) await page.getByRole("button", { name: s, exact: true }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  for (const c of ["UT2", "VCA", "BOSIET"]) await page.getByRole("button", { name: c, exact: true }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel("Korte introductie").fill("Inspecteur met offshore-ervaring.");
  await page.getByRole("button", { name: "Profiel afronden" }).click();
  await expect(page.getByRole("img", { name: /% compleet/ })).toBeVisible();
  await expect(page.getByText("Project met foto (nog te doen)")).toBeAttached();
  await page.getByRole("button", { name: "Voeg je eerste project toe" }).click();

  await page.getByLabel("Wat heb je gedaan?").fill("UT gedaan bij jacket project offshore");
  await page.getByRole("button", { name: "Structureer met AI" }).click();
  await expect(page.getByRole("textbox", { name: "Project", exact: true })).toHaveValue("Offshore Jacket Inspection");
  await page.getByRole("button", { name: "Goedkeuren en toevoegen" }).click();

  const card = page.getByRole("article", { name: "NDT Inspector bij Van Oord" });
  await expect(card.locator("video")).toHaveAttribute("src", "./work/vanoord.mp4");
  await expect(card.getByRole("button")).toHaveCount(4); // bedrijf, like, opslaan + infobalk — meer niet
  await card.getByRole("button", { name: "Vind ik leuk" }).click();
  await expect(card.getByRole("button", { name: "Vind ik niet meer leuk" })).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Bewaar" }).click();
  await expect(card.getByRole("button", { name: "Niet meer bewaren" })).toBeVisible();
  await card.getByRole("button", { name: /Bekijk vacature/ }).click();
  await expect(page.getByText("Waarom dit bij jou past")).toBeVisible();
  await page.getByRole("tab", { name: "Bedrijf" }).click();
  await expect(page.getByText(/Marine contractor/)).toBeVisible();
  await page.screenshot({ path: "test-results/proto-detail.png" });
  await page.getByRole("button", { name: "Solliciteer" }).click();
  const sheet = page.getByRole("dialog", { name: "Solliciteren" });
  await sheet.getByLabel("Bericht (optioneel)").fill("Ik kan per direct starten.");
  await sheet.getByRole("button", { name: "Verstuur sollicitatie" }).click();
  await expect(page.getByRole("status")).toContainText("Sollicitatie verstuurd — Van Oord ziet nu je Work Profile");

  // Business side (same browser, shared prototype store)
  await page.getByRole("link", { name: "Business" }).click();
  await page.getByRole("button", { name: "Bekijk demo als Van Oord" }).click();
  await expect(page.getByRole("heading", { name: "Goedemorgen, Van Oord" })).toBeVisible();
  await page.screenshot({ path: "test-results/proto-biz-dashboard.png" });
  await page.getByRole("button", { name: /Daan Visser/ }).first().click();
  await expect(page.getByText("Offshore Jacket Inspection")).toBeVisible();
  await expect(page.getByText("“Ik kan per direct starten.”")).toBeVisible();
  await page.screenshot({ path: "test-results/proto-biz-profile.png" });
  await page.getByRole("button", { name: "Accepteer en start chat" }).click();
  await page.getByRole("button", { name: "Open chat" }).click();
  await page.getByLabel("Bericht").fill("We zouden graag kennis met je maken. Ben je donderdag beschikbaar?");
  await page.getByRole("button", { name: "Verstuur" }).click();

  // back in the app: match modal → chat → reply
  await page.getByRole("link", { name: "App", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "It's a match" })).toBeVisible();
  await page.screenshot({ path: "test-results/proto-match.png" });
  await page.getByRole("button", { name: "Start gesprek" }).click();
  const chat = page.getByRole("dialog", { name: "Chat met Van Oord" });
  await expect(chat.getByText("Ben je donderdag beschikbaar?")).toBeVisible();
  await page.getByLabel("Bericht").fill("Ja, vanaf 15:00.");
  await page.getByRole("button", { name: "Verstuur" }).click();
  await expect(chat.getByText("Ja, vanaf 15:00.")).toBeVisible();
  await page.screenshot({ path: "test-results/proto-chat.png" });

  await page.getByRole("link", { name: "Business" }).click();
  await page.getByRole("button", { name: /^Berichten/ }).click();
  await expect(page.locator(".msgs").getByText("Ja, vanaf 15:00.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("bedrijf eerst: vacature plaatsen → matches → interesse → professional accepteert → chat", async ({ page }) => {
  const errors = errorsOf(page);
  await fresh(page);
  await page.goto("/app.html#/business");
  await page.getByRole("button", { name: "Bekijk demo als Van Oord" }).click();
  await page.getByRole("button", { name: /^Vacatures/ }).click();
  await page.getByRole("button", { name: "Vacature plaatsen" }).click();
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Zet in velden" }).click();
  await page.getByRole("button", { name: "Publiceer" }).click();
  await expect(page.getByRole("heading", { name: "NDT Inspector Monopiles" })).toBeVisible();
  await page.screenshot({ path: "test-results/proto-biz-vacancy.png", fullPage: true });
  const row = page.getByRole("row", { name: /Youssef El Amrani/ });
  await row.getByRole("button", { name: "Interesse tonen" }).click();
  await expect(row.getByRole("button", { name: "Chat" })).toBeVisible({ timeout: 5000 });
  await row.getByRole("button", { name: "Chat" }).click();
  await expect(page.getByText(/Leuk dat jullie interesse hebben/)).toBeVisible();
  // the published vacancy is visible to professionals in Discover
  await page.getByRole("link", { name: "App", exact: true }).click();
  await page.getByRole("button", { name: "Bekijk met demoprofiel (Sem)" }).click();
  await expect(page.getByRole("article", { name: "NDT Inspector Monopiles bij Van Oord" })).toBeAttached();
  expect(errors).toEqual([]);
});

test("bedrijf wil jou spreken: accepteren vanuit Matches + harde poort zichtbaar", async ({ page }) => {
  await fresh(page, { width: 390, height: 844 });
  await page.getByRole("button", { name: "Bekijk met demoprofiel (Sem)" }).click();
  await page.getByRole("button", { name: /^Matches/ }).click();
  await expect(page.getByText("Bedrijven die jou willen spreken")).toBeVisible();
  await page.screenshot({ path: "test-results/proto-mobile-matches.png" });
  await page.getByRole("button", { name: "Accepteer" }).click();
  await expect(page.getByRole("dialog", { name: "It's a match" })).toBeVisible();
  await page.getByRole("button", { name: "Later" }).click();
  // gated job: Sem lacks CSWIP 3.1 → never above 59%, reason shown
  await page.getByRole("button", { name: /^Discover/ }).click();
  const welding = page.getByRole("article", { name: /Welding Inspector/ });
  await expect(welding.getByText("59% match")).toBeAttached();
  await expect(welding.getByText(/CSWIP 3.1 ontbreekt/)).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("desktop: app in iPhone-frame, mobiel schermvullend", async ({ page }) => {
  await fresh(page);
  await page.getByRole("button", { name: "Bekijk met demoprofiel (Sem)" }).click();
  const phone = await page.locator(".iphone").boundingBox();
  expect(phone.width).toBe(393);
  const nav = await page.getByRole("navigation", { name: "Hoofdmenu" }).boundingBox();
  expect(nav.y).toBeGreaterThan(phone.y + phone.height - 120); // pill nav at the bottom of the phone
  await page.screenshot({ path: "test-results/proto-iphone.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  const full = await page.locator(".iphone").boundingBox();
  expect(full.width).toBe(390);
  await expect(page.locator(".statusbar")).toBeHidden();
});

test("bedrijf onboarding: account → profiel → contactpersoon → vacature → zichtbaar in de app", async ({ page }) => {
  const errors = errorsOf(page);
  await fresh(page, { width: 390, height: 844 });
  await page.getByRole("button", { name: /Ik zoek personeel/ }).click();
  await expect(page.getByRole("heading", { name: "Start met Workstr Business" })).toBeVisible();
  await page.screenshot({ path: "test-results/proto-biz-onb.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Maak bedrijfsaccount" }).click();
  await page.getByLabel("Bedrijfsnaam").fill("Noordzee Inspectie BV");
  await page.getByLabel("KvK-nummer (optioneel)").fill("123");
  await page.getByRole("button", { name: "Staalbouw" }).click();
  await expect(page.getByText("Een KvK-nummer heeft 8 cijfers.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Volgende" })).toBeDisabled();
  await page.getByLabel("KvK-nummer (optioneel)").fill("");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel("Over het bedrijf").fill("Inspectiebedrijf voor staalconstructies en offshore wind in de Rotterdamse haven.");
  await page.getByLabel("Pluspunt 1").fill("Dagdienst, vaste ploeg");
  await page.screenshot({ path: "test-results/proto-biz-onb-profile.png" });
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByLabel("Naam contactpersoon").fill("Eva de Wit");
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Zet in velden" }).click();
  await page.locator("input[type=file]").setInputFiles("public/work/vanoord.mp4");
  await expect(page.getByRole("button", { name: "Verwijder vacaturebeeld" }).locator("video")).toBeAttached();
  await page.getByRole("button", { name: /Publiceer en bekijk matches/ }).click();
  await expect(page.getByRole("heading", { name: "Goedemorgen, Noordzee Inspectie BV" })).toBeVisible();
  await expect(page.getByText("Maak je bedrijfsprofiel af")).toBeVisible(); // only 1 pluspunt
  await page.screenshot({ path: "test-results/proto-biz-onb-done.png" });
  await page.getByRole("link", { name: "App", exact: true }).click();
  await page.getByRole("button", { name: "Bekijk met demoprofiel (Sem)" }).click();
  const card = page.getByRole("article", { name: "NDT Inspector Monopiles bij Noordzee Inspectie BV" });
  await expect(card.locator("video")).toHaveAttribute("src", /^blob:/); // uploaded video, read back from IndexedDB
  await card.getByRole("button", { name: /Bekijk vacature/ }).click();
  await page.getByRole("tab", { name: "Bedrijf" }).click();
  await expect(page.getByText("Eva de Wit · Recruiter")).toBeVisible();
  expect(errors).toEqual([]);
});

test("business: website- en app-weergave delen dezelfde data", async ({ page }) => {
  await fresh(page);
  await page.goto("/app.html#/business");
  await page.getByRole("button", { name: "Bekijk demo als Van Oord" }).click();
  await expect(page.getByRole("navigation", { name: "Business menu" })).toBeVisible();
  await page.getByRole("link", { name: "Mobiele app" }).click();
  const phone = await page.locator(".iphone").boundingBox();
  expect(phone.width).toBe(393);
  await expect(page.getByRole("heading", { name: "Goedemorgen, Van Oord" })).toBeVisible();
  const nav = await page.getByRole("navigation", { name: "Business menu" }).boundingBox();
  expect(nav.y).toBeGreaterThan(phone.y + phone.height - 120); // pill nav onderin de telefoon
  await page.getByRole("button", { name: /^Vacatures/ }).click();
  await expect(page.getByRole("button", { name: "Vacature plaatsen" })).toBeVisible();
  await page.screenshot({ path: "test-results/proto-biz-app.png" });
  await page.getByRole("link", { name: "Website" }).click();
  await expect(page.getByRole("heading", { name: "Goedemorgen, Van Oord" })).toBeVisible();
  await expect(page.locator(".iphone")).toHaveCount(0);
});

test("managed blijft werken", async ({ page }) => {
  await page.goto("/app.html#/managed");
  await page.getByRole("button", { name: /Timesheets/ }).click();
  await expect(page.getByText(/overuren niet goedgekeurd/)).toBeVisible();
});

test("geparkeerde ATS (#/ats, live Supabase): registreren → bedrijf → opslaan → herladen", async ({ page }) => {
  test.setTimeout(120000);
  const errors = errorsOf(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app.html#/ats");
  await page.getByRole("button", { name: "Nog geen account? Maak er een aan" }).click();
  await page.getByLabel("E-mail").fill(`workstr-e2e-${Date.now()}@mailinator.com`);
  await page.getByLabel("Wachtwoord").fill(`E2e-${crypto.randomUUID()}`);
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.getByLabel("Bedrijfsnaam").fill("E2E Techniek BV");
  await page.getByRole("button", { name: "Aanmaken" }).click();
  await expect(page.getByRole("heading", { name: /E2E Techniek BV/ })).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /^Pipeline/ }).click();
  await page.getByLabel("Vacature").selectOption({ label: "NDT Inspector — Rotterdam" });
  const write = page.waitForResponse((r) => r.url().includes("/rest/v1/applications") && (r.request().postData() || "").includes("Aanbod"));
  await page.getByLabel("Verplaats Youssef El Amrani").selectOption("Aanbod");
  expect((await write).ok()).toBeTruthy();
  await expect(page.getByRole("status").filter({ hasText: /Opgeslagen|Opslaan/ })).toHaveText("✓ Opgeslagen", { timeout: 15000 });
  await page.reload();
  await expect(page.getByRole("heading", { name: /E2E Techniek BV/ })).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /^Pipeline/ }).click();
  await page.getByLabel("Vacature").selectOption({ label: "NDT Inspector — Rotterdam" });
  await expect(page.getByLabel("Verplaats Youssef El Amrani")).toHaveValue("Aanbod");
  expect(errors).toEqual([]);
});
