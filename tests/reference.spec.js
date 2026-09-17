import { test, expect } from "@playwright/test";
test("Workstr functies wisselen via interactieve tabs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("tab", { name: "Slimme matching" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Ontdek waarom het past.",
  );
  await page.getByRole("tab", { name: "Direct contact" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Van klik naar gesprek.",
  );
});
test("showcase kan met pijlen wisselen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page.locator("#ontdek");
  await expect(section.locator(".showcase-title")).toContainText(
    "Brand designer",
  );
  await section.getByRole("button", { name: "Volgende sector" }).click();
  await expect(section.locator(".showcase-title")).toContainText("Barista");
});
test("contactformulier maakt een emailconcept, verstuurt niets", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByLabel("Je naam").fill("Test Gebruiker");
  await page.getByLabel("Je e-mailadres").fill("test@example.com");
  await page.getByRole("button", { name: "Maak e-mailconcept" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Je concept is klaar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in je mailapp" }),
  ).toHaveAttribute("href", /^mailto:info@workstr.com/);
});
