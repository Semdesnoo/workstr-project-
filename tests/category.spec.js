import { test, expect } from "@playwright/test";
test("categorie opent de gekozen voorbeeldvacature", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Bekijk Tech in de demo", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Frontend developer", exact: true }),
  ).toBeInViewport();
});
