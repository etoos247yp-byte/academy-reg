import { test, expect } from "@playwright/test";

const EMAIL = "12345";
const PASSWORD = "12345";

test.describe("Student Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/\/student\/registration/, { timeout: 10000 });
  });

  test("displays course catalog after login", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("수강신청");
    await expect(page.locator("button:has-text('정규수업')")).toBeVisible();
    await expect(page.locator("button:has-text('원업')")).toBeVisible();
    await expect(page.locator("button:has-text('특강')")).toBeVisible();
    await expect(page.locator("text=국어").first()).toBeVisible();
  });

  test("can filter by category tab", async ({ page }) => {
    await page.locator("button:has-text('원업')").click();
    await page.waitForTimeout(500);
    await expect(page.locator("button:has-text('선택')").first()).toBeVisible();
  });

  test("shows apply button", async ({ page }) => {
    const btn = page.locator("button:has-text('신청하기')");
    await expect(btn).toBeVisible();
  });

  test("can select a course", async ({ page }) => {
    const selectBtn = page.locator("button:has-text('선택')").first();
    await selectBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=선택됨").first()).toBeVisible();
  });

  test("has timetable tab visible", async ({ page }) => {
    await page.locator("button:has-text('내 시간표')").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=월요일")).toBeVisible();
    await expect(page.locator("text=금요일")).toBeVisible();
  });

  test("has my registrations tab", async ({ page }) => {
    await page.locator("button:has-text('내 수강 목록')").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=국어")).toBeVisible();
    await expect(page.locator("text=수학")).toBeVisible();
  });
});
