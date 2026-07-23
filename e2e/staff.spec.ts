import { test, expect } from "@playwright/test";

const EMAIL = "1234";
const PASSWORD = "1234";

test.describe("Staff Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/\/staff\/offerings/, { timeout: 10000 });
  });

  test("redirects staff to offerings page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("수업 관리");
  });

  test("shows Excel toolbar", async ({ page }) => {
    await expect(page.locator("text=엑셀 내보내기")).toBeVisible();
    await expect(page.locator("text=엑셀 가져오기")).toBeVisible();
  });

  test("shows offering table with data", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible();
  });

  test("navigates to registrations page", async ({ page }) => {
    await page.locator("a:has-text('수강 현황')").click();
    await page.waitForURL(/\/staff\/registrations/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("수강 현황");
  });

  test("navigates to students page", async ({ page }) => {
    await page.locator("a[href='/staff/students']").click();
    await page.waitForURL(/\/staff\/students/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("학생 목록");
  });

  test("can select a student and see schedule download button", async ({ page }) => {
    await page.locator("a[href='/staff/students']").click();
    await page.waitForURL(/\/staff\/students/, { timeout: 10000 });
    await page.locator("text=김민수").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=시간표 다운로드")).toBeVisible();
  });
});
