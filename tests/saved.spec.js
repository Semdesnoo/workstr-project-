import { test, expect } from "@playwright/test";
test("bewaren blijft lokaal beschikbaar en heeft een lege staat", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ontdek de demo", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Bewaard", exact: true }).click();
  await expect(dialog.getByText("Nog geen banen bewaard.")).toBeVisible();
  await dialog.getByRole("button", { name: "Voor jou", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Bewaar Brand designer", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Ontdek de demo", exact: true })
    .first()
    .click();
  await dialog.getByRole("button", { name: "Bewaard", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Brand designer", exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Verwijder Brand designer", exact: true })
    .click();
  await expect(dialog.getByText("Nog geen banen bewaard.")).toBeVisible();
});
