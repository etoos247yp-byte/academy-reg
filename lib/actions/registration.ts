"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireAuth, requireRole } from "@/lib/auth/authorization";
import { prepareSelection, confirmSelection } from "@/modules/registration/services/registration-service";
import { revalidateRegistrationPaths } from "./revalidation";
import { DomainError } from "@/modules/registration/domain/errors";

export async function prepareSelectionAction(periodId: number, offeringIds: number[]) {
  const user = requireAuth(await getCurrentUser());
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
  const user = requireAuth(await getCurrentUser());
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
