import { test, expect } from "@playwright/test";

test.describe("AI URL Extraction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Skip if not authenticated
    if (page.url().includes("/login")) {
      test.skip();
    }
  });

  test("should open text extractor dialog", async ({ page }) => {
    await page.getByRole("button", { name: /extract from text/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Extract URLs from Text")).toBeVisible();
    await expect(page.getByPlaceholder(/paste your text/i)).toBeVisible();
  });

  test("should open screenshot extractor dialog", async ({ page }) => {
    await page.getByRole("button", { name: /extract from screenshot/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Extract URLs from Screenshot")).toBeVisible();
  });

  test("should close extractor dialogs with cancel button", async ({ page }) => {
    await page.getByRole("button", { name: /extract from text/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("text extractor should have extract button disabled when empty", async ({ page }) => {
    await page.getByRole("button", { name: /extract from text/i }).click();

    const extractButton = page.getByRole("button", { name: /extract urls/i });
    await expect(extractButton).toBeDisabled();
  });

  test("text extractor should enable extract button when text is entered", async ({ page }) => {
    await page.getByRole("button", { name: /extract from text/i }).click();

    await page.getByPlaceholder(/paste your text/i).fill("Check out https://example.com");

    const extractButton = page.getByRole("button", { name: /extract urls/i });
    await expect(extractButton).toBeEnabled();
  });
});
