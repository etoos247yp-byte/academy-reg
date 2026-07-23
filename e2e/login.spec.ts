import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "nobody@test.kr");
    await page.fill("#password", "wrongpass");
    await page.locator("button[type='submit']").click();
    await expect(page.locator("text=이메일 또는 비밀번호가 일치하지 않습니다")).toBeVisible();
  });

  test("student login redirects to registration page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "12345");
    await page.fill("#password", "12345");
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/\/student\/registration/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("수강신청");
  });

  test("admin login redirects to offerings page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "1234");
    await page.fill("#password", "1234");
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/\/staff\/offerings/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("수업 관리");
  });
});
