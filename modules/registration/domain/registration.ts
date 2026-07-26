import { DomainError } from "./errors";
import { hasScheduleConflict } from "./conflicts";
import { computeNormalTier } from "@/modules/pricing/tiers";
import type { OfferingView, RegistrationItem, SelectionRequest, SelectionReview, ReviewItem, DatedSession } from "./types";
import crypto from "crypto";

interface ValidateInput {
  offerings: Map<number, OfferingView>;
  existingRegistrations: RegistrationItem[];
  selection: SelectionRequest[];
  registrationWindowOpen: boolean;
  reviewToken?: string;
}

export function validateSelection(input: ValidateInput): SelectionReview {
  if (!input.registrationWindowOpen) {
    throw new DomainError("REGISTRATION_WINDOW_CLOSED", "수강신청 기간이 아닙니다");
  }

  const allSessions = new Map<number, DatedSession[]>();
  const items: ReviewItem[] = [];

  for (const existing of input.existingRegistrations) {
    if (existing.status !== "CONFIRMED") continue;
    allSessions.set(existing.offeringId, existing.offering.sessions);
  }

  const knownIds = new Set(input.existingRegistrations.map((r) => r.offeringId));

  for (const req of input.selection) {
    const offering = input.offerings.get(req.offeringId);

    if (!offering) {
      throw new DomainError("OFFERING_NOT_FOUND", `수업을 찾을 수 없습니다: ${req.offeringId}`);
    }

    if (!offering.isPublished) {
      throw new DomainError("OFFERING_NOT_PUBLISHED", `비공개 수업입니다: ${offering.courseName}`);
    }

    if (knownIds.has(req.offeringId)) {
      throw new DomainError("DUPLICATE_REGISTRATION", `이미 신청한 수업입니다: ${offering.courseName}`);
    }

    if (offering.category === "ONE_UP") {
      items.push({
        offeringId: offering.id,
        outcome: "SCHEDULE_PENDING",
        courseName: offering.courseName,
        priceAmount: offering.priceAmount,
        message: "담당 선생님 선택 후 시간이 배정됩니다",
      });
      continue;
    }

    let conflicted = false;

    for (const [existingId, sessions] of allSessions) {
      if (hasScheduleConflict(sessions, offering.sessions)) {
        const conflictOffering = input.existingRegistrations.find((r) => r.offeringId === existingId);
        items.push({
          offeringId: offering.id,
          outcome: "CONFLICT",
          courseName: offering.courseName,
          priceAmount: offering.priceAmount,
          message: `시간이 겹칩니다: ${conflictOffering?.offering.courseName ?? "기존 수업"}`,
        });
        conflicted = true;
        break;
      }
    }
    if (conflicted) continue;

    for (const other of items) {
      if (other.outcome !== "CONFIRMED" && other.outcome !== "WAITLISTED") continue;
      const otherOffering = input.offerings.get(other.offeringId);
      if (otherOffering && hasScheduleConflict(offering.sessions, otherOffering.sessions)) {
        items.push({
          offeringId: offering.id,
          outcome: "CONFLICT",
          courseName: offering.courseName,
          priceAmount: offering.priceAmount,
          message: `선택한 다른 수업과 시간이 겹칩니다: ${other.courseName}`,
        });
        conflicted = true;
        break;
      }
    }
    if (conflicted) continue;

    const available = offering.confirmedCount < offering.capacity;
    if (!available) {
      items.push({
        offeringId: offering.id,
        outcome: "WAITLISTED",
        courseName: offering.courseName,
        priceAmount: offering.priceAmount,
        message: "정원이 마감되어 대기 등록됩니다",
      });
      allSessions.set(offering.id, offering.sessions);
      continue;
    }

    items.push({
      offeringId: offering.id,
      outcome: "CONFIRMED",
      courseName: offering.courseName,
      priceAmount: offering.priceAmount,
      message: "수강신청 가능",
    });
    allSessions.set(offering.id, offering.sessions);
  }

  const confirmedNormalCount = input.existingRegistrations.filter((r) => {
    if (r.status !== "CONFIRMED") return false;
    return r.offering.category === "NORMAL_SEASON";
  }).length;

  const newNormalCount = items.filter((i) => {
    if (i.outcome !== "CONFIRMED") return false;
    const offering = input.offerings.get(i.offeringId);
    return offering?.category === "NORMAL_SEASON";
  }).length;

  const totalNormalCount = confirmedNormalCount + newNormalCount;
  const tier = computeNormalTier(totalNormalCount);

  const tokenSeed = input.reviewToken ?? crypto.randomBytes(32).toString("hex");

  const fingerprint = crypto
    .createHash("sha256")
    .update(tokenSeed)
    .update(
      items
        .map((i) => `${i.offeringId}:${i.outcome}`)
        .sort()
        .join("|"),
    )
    .digest("hex");

  return {
    reviewToken: fingerprint,
    items,
    normalCount: confirmedNormalCount,
    normalTierLabel: tier.label,
    normalTierMonthlySurcharge: tier.monthlySurcharge,
    disclosureText: buildDisclosureText(totalNormalCount, tier),
  };
}

function buildDisclosureText(totalNormalCount: number, tier: ReturnType<typeof computeNormalTier>): string {
  if (tier.monthlySurcharge === 0) {
    return `정규수업 ${totalNormalCount}과목 신청 기준 ${tier.name} (${tier.rangeLabel}) 요금제가 적용되어 추가 비용이 발생하지 않습니다.`;
  }
  return `정규수업 ${totalNormalCount}과목 신청 기준 ${tier.name} (${tier.rangeLabel}) 요금제가 적용됩니다. 추가 비용은 월 ${tier.monthlySurcharge.toLocaleString()}원을 기준으로 일할 계산되며, 시즌 전체 수강 기간에 해당하는 금액이 일괄 청구될 예정입니다.`;
}
