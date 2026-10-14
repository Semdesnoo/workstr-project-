// Run: npx playwright test tests/site.spec.js
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["", "professionals/", "business/", "managed-services/", "ai/", "about/", "contact/", "early-access/", "privacy/", "terms/"];
const watch = (page) => { const e = []; page.on("pageerror", (x) => e.push(x.message)); page.on("console", (m) => m.type() === "error" && e.push(m.text())); return e; };

for (const [tag, size] of [["desktop", { width: 1440, height: 900 }], ["mobiel", { width: 390, height: 844 }]]) {
  test(`alle pagina's ${tag}: SEO-head, a11y, geen overflow, geen fouten`, async ({ page }) => {
    test.setTimeout(240000);
    const errors = watch(page);
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const p of PAGES) {
      await page.goto("/" + p);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.title()).toMatch(/Workstr/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://semdesnoo.github.io/workstr-project-/${p}`);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(axe.violations.map((v) => `${p} ${v.id}: ${v.nodes.slice(0, 3).map((n) => `${n.target} ${n.any[0]?.message || ""}`).join(" | ")}`)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow op /${p}`).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });
}

test("geen kapotte interne links", async ({ page, request }) => {
  test.setTimeout(120000);
  const seen = new Set();
  for (const p of PAGES) {
    await page.goto("/" + p);
    for (const h of await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.href))) {
      const u = new URL(h);
      if (u.origin !== new URL(page.url()).origin || seen.has(u.pathname)) continue;
      seen.add(u.pathname);
      expect((await request.get(u.pathname)).status(), u.pathname).toBe(200);
      if (u.hash && u.pathname === new URL(page.url()).pathname) await expect(page.locator(u.hash)).toHaveCount(1);
    }
  }
  expect(seen.size).toBeGreaterThan(8);
});

test("hero-video speelt, demo's werken", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/");
  await expect.poll(() => page.locator(".hero-video").evaluate((v) => !v.paused && v.currentTime > 0), { timeout: 10000 }).toBeTruthy();
  // match demo
  await page.getByRole("tab", { name: /Mechanical Engineer/ }).click();
  await expect(page.getByText("6 jaar rotating equipment")).toBeVisible();
  await expect(page.locator(".ring b")).toHaveText("87%");
  // project demo: wait for the AI suggestion, approve
  await page.locator(".pdemo").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Goedkeuren en toevoegen" }).click({ timeout: 15000 });
  await expect(page.getByText("Toegevoegd aan Work Profile")).toBeVisible();
  // business: vacancy parsing + shortlist
  await page.getByRole("button", { name: "Zet in velden" }).click();
  await expect(page.getByText("Uit jouw document gehaald.")).toBeVisible();
  await page.getByRole("tab", { name: "Talent zoeken" }).click();
  await page.getByRole("button", { name: /Ilse Bakker/ }).click();
  await expect(page.getByText("Medical verloopt over 40 dagen")).toBeVisible();
  await page.getByRole("listitem").filter({ hasText: "Ilse Bakker" }).getByRole("button", { name: "Shortlist" }).click();
  await expect(page.getByText("1 op je shortlist")).toBeVisible();
  // compliance: upload is not verification
  await page.getByRole("button", { name: "Simuleer upload client induction" }).click();
  await expect(page.getByText(/Geüpload, nog niet gecontroleerd/)).toBeVisible();
  // orchestration waits for a human
  await page.locator(".orch").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Keur goed" }).click({ timeout: 15000 });
  await expect(page.getByText("Goedgekeurd door een mens. Klaar voor onboarding.")).toBeVisible();
  const events = await page.evaluate(() => window.workstrEvents.map((e) => e.name));
  expect(events).toEqual(expect.arrayContaining(["video_played", "job_demo_interaction", "demo_completed", "profile_demo_interaction"]));
  expect(errors).toEqual([]);
});

test("mobiel menu opent, sluit met Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const burger = page.getByRole("button", { name: "Menu" });
  await burger.click();
  await expect(page.getByRole("navigation", { name: "Mobiel menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(burger).toHaveAttribute("aria-expanded", "false");
  await burger.click();
  await page.getByRole("navigation", { name: "Mobiel menu" }).getByRole("link", { name: /Workstr Business/ }).click();
  await expect(page).toHaveURL(/\/business\/$/);
});

test("formulieren: validatie + echte aanmelding", async ({ page }) => {
  await page.goto("/early-access/");
  await page.getByRole("button", { name: "Krijg early access" }).last().click();
  await expect(page.getByText("Vul je naam in.")).toBeVisible();
  await expect(page.getByLabel("Naam")).toBeFocused();
  await page.getByRole("radio", { name: "Bedrijf" }).click();
  await page.getByLabel("Naam").fill("E2E Test");
  await page.getByLabel("Zakelijk e-mailadres").fill("test@gmail.com");
  await page.getByRole("button", { name: "Vraag demo aan" }).click();
  await expect(page.getByText("Gebruik je zakelijke e-mailadres.")).toBeVisible();
  await page.getByRole("radio", { name: "Professional" }).click();
  await page.getByLabel("E-mail").fill(`workstr-e2e-${Date.now()}@mailinator.com`);
  await page.getByLabel("Ik ben").selectOption("Freelancer / zzp'er");
  await page.getByLabel("Werkgebied").fill("E2E — NDT");
  const write = page.waitForResponse((r) => r.url().includes("/rest/v1/leads"));
  await page.getByRole("button", { name: "Krijg early access" }).last().click();
  expect((await write).status()).toBe(201);
  await expect(page.getByRole("status")).toContainText("Je staat op de lijst.");
});
