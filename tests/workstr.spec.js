import { test, expect } from "@playwright/test";
test("bezoeker opent een scrollbare feed en wisselt van vacature", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Jouw toekomst.",
  );
  await page
    .getByRole("button", { name: "Ontdek de demo", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Brand designer", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Volgende vacature" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Barista", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
