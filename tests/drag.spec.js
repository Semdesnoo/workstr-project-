import { test, expect } from "@playwright/test";
test("slepen wisselt de showcase zonder dialoog te openen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const c = page.locator(".showcase-card.selected");
  await c.scrollIntoViewIfNeeded();
  const b = await c.boundingBox();
  await page.mouse.move(b.x + b.width * 0.75, b.y + b.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.25, b.y + b.height * 0.5, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(page.locator(".showcase-title")).toContainText("Barista");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
