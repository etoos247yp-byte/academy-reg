"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/authorization";
import { prepareSelection, confirmSelection } from "@/modules/registration/services/registration-service";
import { revalidateRegistrationPaths } from "./revalidation";
import { DomainError } from "@/modules/registration/domain/errors";
import crypto from "crypto";

function isTest() { return process.env.TEST_MODE === "true"; }

export async function prepareSelectionAction(periodId: number, offeringIds: number[]) {
  const user = requireRole(await getCurrentUser(), ["STUDENT"]);

  if (isTest()) {
    // Mock review for test mode — all items confirmed, no pricing
    return {
      data: {
        reviewToken: crypto.randomBytes(16).toString("hex"),
        items: offeringIds.map((id) => ({
          offeringId: id,
          outcome: "CONFIRMED" as const,
          courseName: `수업 #${id}`,
          priceAmount: 0,
          message: "수강신청 가능 (테스트 모드)",
        })),
        normalCount: 0,
        normalTierLabel: "무료 (테스트)",
        normalTierMonthlySurcharge: 0,
        disclosureText: "테스트 모드: 추가 비용 없음",
      },
    };
  }

  try {
    const review = await prepareSelection(user.id, periodId, offeringIds);
    return { data: review };
  } catch (e) {
    if (e instanceof DomainError) {
      return { error: { code: e.code, message: e.message } };
    }
    throw e;
  }
}

export async function confirmSelectionAction(periodId: number, reviewToken: string, offeringIds: number[]) {
  const user = requireRole(await getCurrentUser(), ["STUDENT"]);

  if (isTest()) {
    revalidateRegistrationPaths();
    return { data: { batchId: Date.now() } };
  }

  try {
    const result = await confirmSelection(user.id, periodId, { reviewToken, offeringIds });
    if (result.success) {
      revalidateRegistrationPaths();
      return { data: { batchId: result.batchId } };
    }
    return { review: result.review };
  } catch (e) {
    if (e instanceof DomainError) {
      return { error: { code: e.code, message: e.message } };
    }
    throw e;
  }
}
