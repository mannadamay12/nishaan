import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require authentication
    // For CI, you'd set up a test user with auth storage state
    await page.goto("/login");
  });

  test("should open search with Cmd+K shortcut", async ({ page }) => {
    // First login (in real tests, use storage state)
    await page.goto("/dashboard");

    // If redirected to login, we can't test dashboard
    // This test will pass when auth is mocked or storage state is set
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Search bookmarks...")).toBeVisible();
  });

  test("should close search with Escape", async ({ page }) => {
    await page.goto("/dashboard");

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Search bookmarks...")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Search bookmarks...")).not.toBeVisible();
  });

  test("search trigger button should open search dialog", async ({ page }) => {
    await page.goto("/dashboard");

    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await page.getByRole("button", { name: /search/i }).click();
    await expect(page.getByPlaceholder("Search bookmarks...")).toBeVisible();
  });
});
