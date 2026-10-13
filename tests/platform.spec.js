// Run: npx playwright test tests/platform.spec.js
// Business tests run against the real Supabase project from .env.local (public URL + anon key):
// each run signs up a fresh throwaway account + company with fictional demo data.
import { test, expect } from "@playwright/test";

async function signUpCompany(page) {
  await page.goto("/app.html#/business");
  await page.getByRole("button", { name: "Nog geen account? Maak er een aan" }).click();
  await page.getByLabel("E-mail").fill(`workstr-e2e-${Date.now()}@mailinator.com`);
  await page.getByLabel("Wachtwoord").fill(`E2e-${crypto.randomUUID()}`);
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.getByLabel("Bedrijfsnaam").fill("E2E Techniek BV");
  await page.getByRole("button", { name: "Aanmaken" }).click();
  await expect(page.getByRole("heading", { name: /E2E Techniek BV/ })).toBeVisible({ timeout: 20000 });
}
const saved = (page) => expect(page.getByRole("status").filter({ hasText: /Opgeslagen|Opslaan/ })).toHaveText("✓ Opgeslagen", { timeout: 15000 });

test("candidate app: onboarding → match uitleg → interesse → project", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/app.html");
  await page.getByRole("button", { name: "Start met je Work Profile" }).click();
  await page.getByRole("button", { name: "Bekijk functie" }).first().click();
  await expect(page.getByText("Waarom dit bij jou past")).toBeVisible();
  await page.getByRole("button", { name: "Interesse tonen" }).click();
  await expect(page.getByRole("status")).toContainText("Interesse verstuurd");
  await page.getByRole("button", { name: /Create/ }).click();
  await page.getByRole("button", { name: /Project toevoegen/ }).click();
  await page.getByLabel("Wat heb je gedaan?").fill("UT inspecties uitgevoerd aan offshore jacket.");
  await page.getByRole("button", { name: "Structureer met AI" }).click();
  await expect(page.getByRole("textbox", { name: "Project", exact: true })).toHaveValue("Offshore Jacket Inspection");
  await page.getByRole("button", { name: "Goedkeuren en toevoegen" }).click();
  await page.getByRole("button", { name: /Profile/ }).click();
  await expect(page.getByText("Offshore Jacket Inspection").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("managed: timesheets + agent center", async ({ page }) => {
  await page.goto("/app.html#/managed");
  await page.getByRole("button", { name: /Timesheets/ }).click();
  await expect(page.getByText(/overuren niet goedgekeurd/)).toBeVisible();
  await page.getByRole("button", { name: /AI Agents/ }).click();
  await page.getByRole("button", { name: "Goedkeuren" }).first().click();
  await expect(page.getByText(/Goedgekeurd: Verlenging/)).toBeVisible();
});

test("business (live Supabase): registreren → bedrijf → agents → alles blijft bewaard na herladen", async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signUpCompany(page);

  // vacancy via the form
  await page.getByRole("button", { name: /^Vacatures/ }).click();
  await page.getByRole("button", { name: "Nieuwe vacature" }).click();
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Structureer" }).click();
  await page.getByRole("button", { name: "Publiceer in Discover" }).click();
  await expect(page.getByRole("cell", { name: "NDT Inspector Monopiles" })).toBeVisible();

  // all 8 agents + full flow
  await page.getByRole("button", { name: /^AI Agents/ }).click();
  for (const a of ["Vacancy Agent", "Matching Agent", "Talent Agent", "Outreach Agent", "Screening Agent", "Compliance Agent", "Human Approval", "Interview Agent"])
    await expect(page.getByRole("region", { name: a, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Run Vacancy Agent" }).click();
  await expect(page.getByLabel("Vacature voor agents").locator("option:checked")).toHaveText(/QA\/QC Inspector Offshore Wind/);
  await page.getByRole("button", { name: "Start volledige flow" }).click();
  await expect(page.getByRole("button", { name: "Start volledige flow" })).toBeEnabled({ timeout: 15000 });
  const log = page.locator("section", { hasText: "Agent-log" }).last();
  await expect(log).toContainText(/Outreach/);
  await saved(page);
  await page.screenshot({ path: "test-results/business-agents.png", fullPage: true });

  // pipeline: move a candidate, wait for save
  await page.getByRole("button", { name: /^Pipeline/ }).click();
  await page.getByLabel("Vacature").selectOption({ label: "NDT Inspector — Rotterdam" });
  const write = page.waitForResponse((r) => r.url().includes("/rest/v1/applications") && (r.request().postData() || "").includes("Aanbod"));
  await page.getByLabel("Verplaats Youssef El Amrani").selectOption("Aanbod");
  expect((await write).ok()).toBeTruthy();
  await saved(page);

  // reload: everything comes back from the database
  await page.reload();
  await expect(page.getByRole("heading", { name: /E2E Techniek BV/ })).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /^Pipeline/ }).click();
  await page.getByLabel("Vacature").selectOption({ label: "NDT Inspector — Rotterdam" });
  await expect(page.getByLabel("Verplaats Youssef El Amrani")).toHaveValue("Aanbod");
  await page.getByRole("button", { name: /^Vacatures/ }).click();
  await expect(page.getByRole("cell", { name: "NDT Inspector Monopiles" })).toBeVisible();
  await page.getByRole("button", { name: /^AI Agents/ }).click();
  await expect(page.locator("section", { hasText: "Agent-log" }).last()).toContainText(/Outreach/);
  await page.getByRole("button", { name: /^Kandidaten/ }).click();
  await expect(page.getByRole("button", { name: "Sem de Snoo" })).toBeVisible();

  await page.getByRole("button", { name: "Uitloggen" }).click();
  await expect(page.getByRole("heading", { name: "Inloggen" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile app fills the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app.html");
  await page.getByRole("button", { name: "Start met je Work Profile" }).click();
  await expect(page.getByRole("navigation", { name: "Hoofdmenu" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
