// Run: npx playwright test tests/platform.spec.js
import { test, expect } from "@playwright/test";

test("candidate app: onboarding → match uitleg → interesse → business inbox", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/app.html");
  await page.getByRole("button", { name: "Start met je Work Profile" }).click();
  await page.getByRole("button", { name: "Bekijk functie" }).first().click();
  await expect(page.getByText("Waarom dit bij jou past")).toBeVisible();
  await page.screenshot({ path: "test-results/platform-detail.png" });
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
  await page.screenshot({ path: "test-results/platform-profile.png" });

  await page.goto("/app.html#/business");
  await page.getByRole("button", { name: /^Vacatures/ }).click();
  await page.getByRole("button", { name: "Nieuwe vacature" }).click();
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Structureer" }).click();
  await page.getByRole("button", { name: "Publiceer in Discover" }).click();
  await expect(page.getByRole("cell", { name: "NDT Inspector Monopiles" })).toBeVisible();
  await page.screenshot({ path: "test-results/platform-business.png" });

  await page.goto("/app.html#/managed");
  await page.getByRole("button", { name: /Timesheets/ }).click();
  await expect(page.getByText(/overuren niet goedgekeurd/)).toBeVisible();
  await page.getByRole("button", { name: /AI Agents/ }).click();
  await page.getByRole("button", { name: "Goedkeuren" }).first().click();
  await expect(page.getByText(/Goedgekeurd: Verlenging/)).toBeVisible();
  await page.getByRole("button", { name: "Nieuwe agent" }).click();
  await page.getByRole("button", { name: "Talent outreach" }).click();
  await page.getByRole("button", { name: "Zet live" }).click();
  await expect(page.getByText(/Nieuwe agent live: Talent outreach/)).toBeVisible();
  await page.screenshot({ path: "test-results/platform-msp.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("business: 8 agents draaien de volledige flow met human approval", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app.html#/business");
  await page.getByRole("button", { name: /^AI Agents/ }).click();
  for (const a of ["Vacancy Agent", "Matching Agent", "Talent Agent", "Outreach Agent", "Screening Agent", "Compliance Agent", "Human Approval", "Interview Agent"])
    await expect(page.getByRole("region", { name: a, exact: true })).toBeVisible();

  // Vacancy Agent → new vacancy becomes the flow target
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Run Vacancy Agent" }).click();
  await expect(page.getByLabel("Vacature voor agents")).toHaveValue(/^j/);
  await expect(page.getByLabel("Vacature voor agents").locator("option:checked")).toHaveText(/QA\/QC Inspector Offshore Wind/);

  await page.getByRole("button", { name: "Start volledige flow" }).click();
  await expect(page.getByRole("button", { name: "Start volledige flow" })).toBeEnabled({ timeout: 10000 });
  const log = page.getByRole("region", { name: "Agent-log" }).or(page.locator("section", { hasText: "Agent-log" }).last());
  await expect(log).toContainText(/Interview/);
  await expect(log).toContainText(/Outreach/);
  await page.screenshot({ path: "test-results/business-agents.png", fullPage: true });

  // worker delivers queued messages in the background
  await page.getByRole("button", { name: /^Achtergrondtaken/ }).click();
  await expect(page.getByText("Verzonden").first()).toBeVisible({ timeout: 6000 });

  await page.getByRole("button", { name: /^Agenda/ }).click();
  await page.getByRole("button", { name: "Volgende →" }).click();
  await page.getByRole("button", { name: "Deze week" }).click();
  await page.getByRole("button", { name: /^Pipeline/ }).click();
  await expect(page.locator(".lane").first()).toBeVisible();
  await page.getByRole("button", { name: /^Kandidaten/ }).click();
  await expect(page.getByRole("button", { name: "Sem de Snoo" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile app fills the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app.html");
  await page.getByRole("button", { name: "Start met je Work Profile" }).click();
  await expect(page.getByRole("navigation", { name: "Hoofdmenu" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/platform-mobile.png" });
});
