import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const theme of ["dark", "light"]) {
  test(`site ${theme}: a11y, geen overflow, interacties`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((t) => localStorage.setItem("workstr.theme", t), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Less searching");
    await page.getByRole("tab", { name: "Build" }).click();
    await expect(page.getByText("Offshore Jacket Inspection")).toBeVisible();
    await page.getByRole("tab", { name: "Compliance" }).click();
    await expect(page.getByText(/VCA verlopen/)).toBeVisible();
    await page.getByRole("link", { name: /Open MSP/ }).hover();
  await expect(page.locator(".s-layer li.off")).toHaveCount(0);
  await page.getByRole("link", { name: /Open App/ }).hover();
  await expect(page.locator(".s-layer li.off")).toHaveCount(5);
  await page.getByText("Verzint de AI ervaring in mijn profiel?").click();
    await expect(page.getByText(/AI structureert alleen wat jij schrijft/)).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("iframe").analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/site-${theme}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("site mobiel: menu + geen overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("navigation", { name: "Hoofdnavigatie" }).getByText("Prijzen").click();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({ path: "test-results/site-mobile.png", fullPage: true });
});
