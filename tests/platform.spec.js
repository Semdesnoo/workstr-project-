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
  await page.getByRole("button", { name: /Vacancies/ }).click();
  await page.getByRole("button", { name: "Nieuwe vacature" }).click();
  await page.getByRole("button", { name: "Voorbeeld plakken" }).click();
  await page.getByRole("button", { name: "Structureer" }).click();
  await page.getByRole("button", { name: "Publiceer in Discover" }).click();
  await expect(page.getByRole("cell", { name: "NDT Inspector Monopiles" })).toBeVisible();
  await page.screenshot({ path: "test-results/platform-business.png" });

  await page.goto("/app.html#/msp");
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

test("mobile app fills the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app.html");
  await page.getByRole("button", { name: "Start met je Work Profile" }).click();
  await expect(page.getByRole("navigation", { name: "Hoofdmenu" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/platform-mobile.png" });
});
