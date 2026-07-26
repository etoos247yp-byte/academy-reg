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

  test("displays home dashboard after login", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("수강신청");
    await expect(page.locator("button:has-text('정규수업')")).toBeVisible();
    await expect(page.locator("button:has-text('특강')").first()).toBeVisible();
    await expect(page.locator("button:has-text('원업')").first()).toBeVisible();
    await expect(page.locator("text=나의 CLASS")).toBeVisible();
    await expect(page.locator("text=원업 현황")).toBeVisible();
  });

  test("normal tab shows catalog with courses", async ({ page }) => {
    await page.locator("button:has-text('정규수업')").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=국어").first()).toBeVisible();
    await expect(page.locator("button:has-text('신청하기')")).toBeVisible();
  });

  test("special tab shows prices", async ({ page }) => {
    await page.locator("button:has-text('특강')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=144,000원").first()).toBeVisible();
  });

  test("can select a course from normal tab", async ({ page }) => {
    await page.locator("button:has-text('정규수업')").click();
    await page.waitForTimeout(300);
    const selectBtn = page.locator("button:has-text('선택')").first();
    await selectBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=선택됨").first()).toBeVisible();
  });

  test("normal tab full timetable view", async ({ page }) => {
    await page.locator("button:has-text('정규수업')").click();
    await page.locator("button:has-text('전체 시간표')").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=월요일")).toBeVisible();
  });

  test("has my registrations tab", async ({ page }) => {
    await page.locator("button:has-text('내 수강 목록')").click();
    await page.waitForTimeout(300);
    await expect(page.locator("table tbody tr", { hasText: "국어" }).first()).toBeVisible();
    await expect(page.locator("table tbody tr", { hasText: "수학" }).first()).toBeVisible();
  });
});
