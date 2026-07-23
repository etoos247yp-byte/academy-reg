import { z } from "zod";

export const OFFERING_CATEGORIES = [
  "NORMAL_SEASON",
  "ONE_UP",
  "SPECIAL",
  "ESSAY_SPECIAL",
  "CUSTOM",
] as const;
export type OfferingCategory = (typeof OFFERING_CATEGORIES)[number];

export const PRICE_MODEL_TYPES = ["PER_SESSION", "FIXED_PACKAGE"] as const;
export type PriceModelType = (typeof PRICE_MODEL_TYPES)[number];

export const pricingTemplateSchema = z.object({
  category: z.enum(OFFERING_CATEGORIES),
  priceModelType: z.enum(PRICE_MODEL_TYPES),
  defaultAmountPerSession: z.number().int().min(0),
  defaultSessionCount: z.number().int().min(1),
  defaultPackageTotal: z.number().int().min(0),
  label: z.string(),
});

export type PricingTemplate = z.infer<typeof pricingTemplateSchema>;

export const PRICING_TEMPLATES: Record<OfferingCategory, PricingTemplate> = {
  NORMAL_SEASON: {
    category: "NORMAL_SEASON",
    priceModelType: "PER_SESSION",
    defaultAmountPerSession: 0,
    defaultSessionCount: 1,
    defaultPackageTotal: 0,
    label: "일반 정규수업",
  },

  ONE_UP: {
    category: "ONE_UP",
    priceModelType: "PER_SESSION",
    defaultAmountPerSession: 25_000,
    defaultSessionCount: 4,
    defaultPackageTotal: 100_000,
    label: "원업 (1:1 수업)",
  },

  SPECIAL: {
    category: "SPECIAL",
    priceModelType: "FIXED_PACKAGE",
    defaultAmountPerSession: 36_000,
    defaultSessionCount: 4,
    defaultPackageTotal: 144_000,
    label: "특강",
  },

  ESSAY_SPECIAL: {
    category: "ESSAY_SPECIAL",
    priceModelType: "FIXED_PACKAGE",
    defaultAmountPerSession: 80_000,
    defaultSessionCount: 4,
    defaultPackageTotal: 320_000,
    label: "논술특강",
  },

  CUSTOM: {
    category: "CUSTOM",
    priceModelType: "PER_SESSION",
    defaultAmountPerSession: 0,
    defaultSessionCount: 1,
    defaultPackageTotal: 0,
    label: "사용자 정의",
  },
};
