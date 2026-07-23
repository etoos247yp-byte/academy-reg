import type { OfferingCategory } from "@/modules/pricing/templates";

export const REGISTRATION_STATUSES = ["CONFIRMED", "WAITLISTED", "CANCELLED"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export interface DatedSession {
  date: Date;
  startTime: string;
  endTime: string;
}

export interface OfferingView {
  id: number;
  courseName: string;
  category: OfferingCategory;
  teacher: string;
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  sessions: DatedSession[];
  priceAmount: number;
  priceModelType: string;
  sessionCount: number;
  packageTotal: number;
  isPublished: boolean;
}

export interface RegistrationItem {
  offeringId: number;
  status: RegistrationStatus;
  offering: OfferingView;
}

export interface SelectionRequest {
  offeringId: number;
}

export interface SelectionReview {
  reviewToken: string;
  items: ReviewItem[];
  normalCount: number;
  normalTierLabel: string;
  normalTierMonthlySurcharge: number;
  disclosureText: string;
}

export interface ReviewItem {
  offeringId: number;
  outcome: "CONFIRMED" | "WAITLISTED" | "SCHEDULE_PENDING" | "CONFLICT";
  courseName: string;
  priceAmount: number;
  message: string;
}

export interface ConfirmRequest {
  reviewToken: string;
  offeringIds: number[];
}
