import { describe, it, expect } from "vitest";
import { computeNormalTier, NORMAL_TIERS, billingExample, type NormalTier } from "./tiers";

describe("NORMAL_TIERS", () => {
  it("defines 4 tiers", () => {
    expect(NORMAL_TIERS).toHaveLength(4);
  });

  it("tier 0-3 is free", () => {
    expect(NORMAL_TIERS[0]).toMatchObject({ min: 0, max: 3, monthlySurcharge: 0 });
  });

  it("tier 4-6 costs 100,000", () => {
    expect(NORMAL_TIERS[1]).toMatchObject({ min: 4, max: 6, monthlySurcharge: 100_000 });
  });

  it("tier 7-9 costs 200,000", () => {
    expect(NORMAL_TIERS[2]).toMatchObject({ min: 7, max: 9, monthlySurcharge: 200_000 });
  });

  it("tier 10+ costs 300,000", () => {
    expect(NORMAL_TIERS[3]).toMatchObject({ min: 10, max: Infinity, monthlySurcharge: 300_000 });
  });

  it("names tiers CLASS A through D with their course ranges", () => {
    expect(NORMAL_TIERS[0].name).toBe("CLASS A");
    expect(NORMAL_TIERS[1].name).toBe("CLASS B");
    expect(NORMAL_TIERS[2].name).toBe("CLASS C");
    expect(NORMAL_TIERS[3].name).toBe("CLASS D");
    expect(NORMAL_TIERS[0].label).toBe("CLASS A (1~3과목) · 무료");
    expect(NORMAL_TIERS[1].label).toBe("CLASS B (4~6과목) · 월 100,000원");
    expect(NORMAL_TIERS[2].label).toBe("CLASS C (7~9과목) · 월 200,000원");
    expect(NORMAL_TIERS[3].label).toBe("CLASS D (10과목 이상) · 월 300,000원");
  });
});

describe("computeNormalTier", () => {
  it("returns free tier for 0 confirmed normal classes", () => {
    const tier = computeNormalTier(0);
    expect(tier.monthlySurcharge).toBe(0);
    expect(tier.label).toContain("무료");
  });

  it("returns free tier for 3 confirmed normal classes", () => {
    const tier = computeNormalTier(3);
    expect(tier.monthlySurcharge).toBe(0);
  });

  it("returns 100,000 tier for 4 classes", () => {
    const tier = computeNormalTier(4);
    expect(tier.monthlySurcharge).toBe(100_000);
  });

  it("returns 100,000 tier for 6 classes", () => {
    const tier = computeNormalTier(6);
    expect(tier.monthlySurcharge).toBe(100_000);
  });

  it("returns 200,000 tier for 7 classes", () => {
    const tier = computeNormalTier(7);
    expect(tier.monthlySurcharge).toBe(200_000);
  });

  it("returns 200,000 tier for 9 classes", () => {
    const tier = computeNormalTier(9);
    expect(tier.monthlySurcharge).toBe(200_000);
  });

  it("returns 300,000 tier for 10 classes", () => {
    const tier = computeNormalTier(10);
    expect(tier.monthlySurcharge).toBe(300_000);
  });

  it("returns 300,000 tier for 15 classes", () => {
    const tier = computeNormalTier(15);
    expect(tier.monthlySurcharge).toBe(300_000);
  });

  it("has a Korean label", () => {
    const tier = computeNormalTier(5);
    expect(tier.label).toBeTruthy();
    expect(tier.label).toMatch(/[가-힣]/);
  });

  it("provides the billing divisor of 29.4", () => {
    const tier = computeNormalTier(5);
    expect(tier.billingDivisor).toBe(29.4);
  });

  it("documents the academy billing example: 8 classes, 60 days = 408,120", () => {
    const tier = computeNormalTier(8);
    const result = billingExample(tier, 60);
    expect(result.dailyRate).toBe(6802);
    expect(result.semesterTotal).toBe(408_120);
  });
});
