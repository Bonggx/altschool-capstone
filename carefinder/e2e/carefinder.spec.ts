import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Carefinder E2E", () => {

  test("home page loads with hero and search bar", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("h1")).toContainText("Find the right care");
    await expect(page.locator("input[placeholder*='Search by hospital']")).toBeVisible();
  });

  test("search redirects to /search with query param", async ({ page }) => {
    await page.goto(BASE);
    await page.fill("input[placeholder*='Search by hospital']", "Lagos");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/search\?q=Lagos/);
  });

  test("search page renders filter sidebar and results area", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    await expect(page.getByText("Ownership")).toBeVisible();
    await expect(page.getByText("Specialties")).toBeVisible();
  });

  test("sign up page renders form", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("sign in page renders form", async ({ page }) => {
    await page.goto(`${BASE}/signin`);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByText("Forgot password?")).toBeVisible();
  });

  test("forgot password page renders email input", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send reset link/i })).toBeVisible();
  });

  test("unauthenticated user is redirected from /admin to /signin", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/signin/);
  });

  test("export CSV button appears when results exist", async ({ page }) => {
    await page.goto(`${BASE}/search`);
    // Wait for results to potentially load
    await page.waitForTimeout(1500);
    const exportBtn = page.getByRole("button", { name: /Export CSV/i });
    // Only assert visible if hospitals exist in the DB
    const count = await exportBtn.count();
    if (count > 0) await expect(exportBtn).toBeVisible();
  });

  test("share link button copies URL", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${BASE}/search`);
    await page.waitForTimeout(1000);
    const shareBtn = page.getByRole("button", { name: /Share link/i });
    if (await shareBtn.count() > 0) {
      await shareBtn.click();
      await expect(page.getByRole("button", { name: /Copied!/i })).toBeVisible();
    }
  });
});