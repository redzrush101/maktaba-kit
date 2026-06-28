import { expect, test } from "@playwright/test";

test("home page renders the search interface", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Search the library/ })).toBeVisible();
  await expect(page.getByPlaceholder("Search libraries...")).toBeVisible();
});

test("search page displays live source results", async ({ page }) => {
  await page.goto("/search?q=%D8%A7%D9%84%D8%AD%D9%85%D8%AF&source=ablibrary");
  await expect(page.getByRole("heading", { name: /Search results/ })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible({ timeout: 45_000 });
  await expect(page.locator("article").first()).toContainText("ablibrary");
});

test("eshia reader separates footnotes from main text", async ({ page }) => {
  await page.goto("/read/eshia/11005/1/2");
  await expect(page.getByRole("heading", { name: "Footnotes" })).toBeVisible({ timeout: 45_000 });
  await expect(page.locator("article")).toContainText("بِسْمِ اللَّهِ الرَّحْمنِ الرَّحِيمِ");
  await expect(page.locator("article")).toContainText("[1]");
});
