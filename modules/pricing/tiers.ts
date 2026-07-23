export interface NormalTier {
  min: number;
  max: number;
  monthlySurcharge: number;
  label: string;
  billingDivisor: number;
}

export const BILLING_DIVISOR = 29.4;

export const NORMAL_TIERS: NormalTier[] = [
  { min: 0, max: 3, monthlySurcharge: 0, label: "무료 (0~3과목)", billingDivisor: BILLING_DIVISOR },
  {
    min: 4,
    max: 6,
    monthlySurcharge: 100_000,
    label: "월 100,000원 (4~6과목)",
    billingDivisor: BILLING_DIVISOR,
  },
  {
    min: 7,
    max: 9,
    monthlySurcharge: 200_000,
    label: "월 200,000원 (7~9과목)",
    billingDivisor: BILLING_DIVISOR,
  },
  {
    min: 10,
    max: Infinity,
    monthlySurcharge: 300_000,
    label: "월 300,000원 (10과목 이상)",
    billingDivisor: BILLING_DIVISOR,
  },
];

export function computeNormalTier(confirmedNormalCount: number): NormalTier {
  const clamped = Math.max(0, Math.floor(confirmedNormalCount));
  const tier = NORMAL_TIERS.find((t) => clamped >= t.min && clamped <= t.max);
  return tier ?? NORMAL_TIERS[0];
}

export function billingExample(tier: NormalTier, seasonDays: number): {
  dailyRate: number;
  semesterTotal: number;
} {
  const dailyRate = Math.floor(tier.monthlySurcharge / BILLING_DIVISOR);
  return { dailyRate, semesterTotal: dailyRate * seasonDays };
}
