import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("app a11y (licht thema)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/app.html#/app");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const scan = async (label) => {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude(".jcard").exclude(".dhero").exclude(".onb-art").analyze();
    return r.violations.map((v) => `${label} ${v.id}: ${v.nodes.slice(0, 4).map((n) => n.target).join(" | ")}`);
  };
  const out = [...await scan("splash")];
  await page.getByRole("button", { name: "Maak je Work Profile" }).click();
  out.push(...await scan("wizard"));
  await page.getByRole("button", { name: "Terug" }).click();
  await page.getByRole("button", { name: "Bekijk met demoprofiel (Sem)" }).click();
  out.push(...await scan("discover"));
  await page.getByRole("button", { name: /^Matches/ }).click();
  out.push(...await scan("matches"));
  await page.getByRole("button", { name: /^Profile/ }).click();
  out.push(...await scan("profile"));
  console.log(out.join("\n"));
  expect(out).toEqual([]);
});
