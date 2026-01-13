import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to login when accessing dashboard unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("should show login page with email input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "nish.aan" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
  });

  test("should redirect to verify page after submitting email", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("test@example.com");

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL("/verify", { timeout: 10000 }),
      page.getByRole("button", { name: "Send magic link" }).click(),
    ]);

    await expect(page.getByText("Check your email")).toBeVisible();
  });
});
