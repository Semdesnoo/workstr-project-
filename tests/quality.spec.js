import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const colorScheme of ["dark", "light"]) {
  test(`${colorScheme}: toegankelijkheid, afbeeldingen, layout en thema`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    for (const section of await page.locator("main section").all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    );
    const errors = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      errors.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every((i) => i.complete && i.naturalWidth > 0),
        ),
    ).toBeTruthy();
    await page.screenshot({
      path: `artifacts/desktop-${colorScheme}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", {
        name: colorScheme === "dark" ? "Lichte modus" : "Donkere modus",
      })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme === "dark" ? "light" : "dark",
    );
  });
}
for (const width of [360, 390, 768, 1024]) {
  test(`responsive ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await expect(
      page
        .getByRole("button", { name: "Ontdek de demo", exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeInViewport();
    if (width < 768) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.getByRole("navigation")).toBeVisible();
      await page.getByRole("navigation").getByText("Voor werkgevers").click();
      await expect(
        page.getByRole("button", { name: "Menu", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/mobile-${width}.png` });
    await page
      .getByRole("button", { name: "Ontdek de demo", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Volgende vacature" }).click();
    await expect(
      dialog.getByRole("heading", { name: "Barista", exact: true }),
    ).toBeInViewport();
    await page.screenshot({ path: `artifacts/feed-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
test("beschadigde lokale opslag breekt de demo niet", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("workstr-saved", "not json"),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ontdek de demo", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("FAQ toont eerlijke productstatus", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("summary")
    .filter({ hasText: "Wanneer verschijnt de app?" })
    .click();
  await expect(
    page.getByText(
      "Een mobiele app staat op de roadmap. Er is nog geen bevestigde releasedatum of App Store-publicatie.",
    ),
  ).toBeVisible();
});
