import { db, schema } from "@/lib/db/connection";
import { eq, and, inArray, sql } from "drizzle-orm";
import { validateSelection } from "@/modules/registration/domain/registration";
import { DomainError } from "@/modules/registration/domain/errors";
import { isRegistrationOpen } from "@/modules/registration/repositories/offering-repo";
import { createSeed, composeToken, parseToken } from "@/modules/registration/services/review-token";
import type {
  SelectionReview,
  ConfirmRequest,
  OfferingView,
  RegistrationItem,
  DatedSession,
} from "@/modules/registration/domain/types";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";

type TxOrDb = typeof db | ReturnType<typeof db.transaction> extends Promise<infer R> ? R : never;

async function findOfferingsByIdsTx(
  client: typeof db,
  ids: number[],
): Promise<Map<number, OfferingView>> {
  if (ids.length === 0) return new Map();

  const rows = await client
    .select({
      id: schema.offerings.id,
      courseName: schema.courses.name,
      category: schema.offerings.category,
      teacher: schema.instructors.name,
      capacity: schema.offerings.capacity,
      isPublished: sql<boolean>`${schema.offerings.status} = 'PUBLISHED'`,
      sessionDate: schema.offeringSessions.sessionDate,
      sessionStart: schema.offeringSessions.startTime,
      sessionEnd: schema.offeringSessions.endTime,
      confirmedCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'CONFIRMED'
      ), 0)`,
      waitlistCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'WAITLISTED'
      ), 0)`,
      priceAmountPerSession: schema.offeringPricing.priceAmountPerSession,
      sessionCountP: schema.offeringPricing.sessionCount,
      packageTotal: schema.offeringPricing.packageTotal,
    })
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .leftJoin(schema.offeringSessions, eq(schema.offerings.id, schema.offeringSessions.offeringId))
    .leftJoin(schema.offeringPricing, eq(schema.offerings.id, schema.offeringPricing.offeringId))
    .where(inArray(schema.offerings.id, ids))
    .orderBy(schema.offerings.id, schema.offeringSessions.sessionDate);

  const map = new Map<number, OfferingView>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        courseName: row.courseName,
        category: row.category as OfferingView["category"],
        teacher: row.teacher ?? "",
        capacity: row.capacity,
        confirmedCount: Number(row.confirmedCount),
        waitlistCount: Number(row.waitlistCount),
        sessions: [],
        priceAmount: Number(row.priceAmountPerSession ?? 0),
        priceModelType: (row.priceAmountPerSession ?? 0) > 0 && (row.packageTotal ?? 0) === (row.priceAmountPerSession ?? 0) * (row.sessionCountP ?? 1)
          ? "PER_SESSION" : "FIXED_PACKAGE",
        sessionCount: Number(row.sessionCountP ?? 1),
        packageTotal: Number(row.packageTotal ?? 0),
        isPublished: Boolean(row.isPublished),
      });
    }
    if (row.sessionDate) {
      const v = map.get(row.id)!;
      v.sessions.push({
        date: new Date(row.sessionDate as string),
        startTime: String(row.sessionStart).substring(0, 5),
        endTime: String(row.sessionEnd).substring(0, 5),
      });
    }
  }
  return map;
}

async function findStudentRegistrationsTx(
  client: typeof db,
  userId: number,
): Promise<RegistrationItem[]> {
  const rows = await client
    .select({
      offeringId: schema.registrations.offeringId,
      status: schema.registrations.status,
      category: schema.offerings.category,
    })
    .from(schema.registrations)
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .where(
      and(
        eq(schema.registrations.userId, userId),
        inArray(schema.registrations.status, ["CONFIRMED", "WAITLISTED"]),
      ),
    );

  const offeringIds = [...new Set(rows.map((r) => r.offeringId))];
  const offerings = await findOfferingsByIdsTx(client, offeringIds);

  return rows.map((row) => ({
    offeringId: row.offeringId,
    status: row.status as RegistrationItem["status"],
    offering: offerings.get(row.offeringId)!,
  }));
}

export async function prepareSelection(
  userId: number,
  periodId: number,
  offeringIds: number[],
): Promise<SelectionReview> {
  const open = await isRegistrationOpen(periodId);
  const existing = await findStudentRegistrationsTx(db, userId);
  const offerings = await findOfferingsByIdsTx(db, offeringIds);

  const seed = createSeed(userId, periodId);

  const review = validateSelection({
    offerings,
    existingRegistrations: existing,
    selection: offeringIds.map((id) => ({ offeringId: id })),
    registrationWindowOpen: open,
    reviewToken: seed,
  });

  return { ...review, reviewToken: composeToken(seed, review.reviewToken) };
}

export async function confirmSelection(
  userId: number,
  periodId: number,
  request: ConfirmRequest,
): Promise<
  { success: true; batchId: number } | { success: false; review: SelectionReview }
> {
  const parsed = parseToken(request.reviewToken, userId, periodId);

  if (!parsed) {
    throw new DomainError(
      "INVALID_REVIEW_TOKEN",
      "유효하지 않은 신청 토큰입니다. 다시 시도해주세요.",
    );
  }

  return db.transaction(async (tx) => {
    const open = await isRegistrationOpen(periodId);

    // Lock user row first to prevent concurrent registrations by same student
    await tx
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .for("update");

    const sortedIds = [...request.offeringIds].sort((a, b) => a - b);

    // Lock offerings in stable ID order
    const locked = await tx
      .select({ id: schema.offerings.id })
      .from(schema.offerings)
      .where(inArray(schema.offerings.id, sortedIds))
      .orderBy(schema.offerings.id)
      .for("update");

    if (locked.length !== new Set(sortedIds).size) {
      throw new DomainError("OFFERING_NOT_FOUND", "일부 수업을 찾을 수 없습니다");
    }

    // Re-read state inside transaction for correct counts
    const existing = await findStudentRegistrationsTx(tx, userId);
    const offerings = await findOfferingsByIdsTx(tx, sortedIds);

    const review = validateSelection({
      offerings,
      existingRegistrations: existing,
      selection: sortedIds.map((id) => ({ offeringId: id })),
      registrationWindowOpen: open,
      reviewToken: parsed.seed,
    });

    // Same seed + unchanged outcomes → same fingerprint. A mismatch means the
    // state the student reviewed has changed; hand back a fresh review/token.
    const changed = review.reviewToken !== parsed.fingerprint;
    if (changed) {
      const newSeed = createSeed(userId, periodId);
      const reissued = validateSelection({
        offerings,
        existingRegistrations: existing,
        selection: sortedIds.map((id) => ({ offeringId: id })),
        registrationWindowOpen: open,
        reviewToken: newSeed,
      });
      return {
        success: false,
        review: { ...reissued, reviewToken: composeToken(newSeed, reissued.reviewToken) },
      };
    }

    // Reject if any item has CONFLICT outcome
    const hasConflict = review.items.some((i) => i.outcome === "CONFLICT");
    if (hasConflict) {
      throw new DomainError(
        "SCHEDULE_CONFLICT",
        "시간이 충돌하는 수업이 있습니다. 선택을 다시 확인해주세요.",
      );
    }

    // Reject if any item is not CONFIRMED, WAITLISTED, or SCHEDULE_PENDING
    const unsupported = review.items.some(
      (i) => i.outcome !== "CONFIRMED" && i.outcome !== "WAITLISTED" && i.outcome !== "SCHEDULE_PENDING",
    );
    if (unsupported) {
      throw new DomainError(
        "REVIEW_REQUIRED",
        "일부 수업을 확정할 수 없습니다. 신청 내용을 다시 확인해주세요.",
      );
    }

    const [window] = await tx
      .select({ id: schema.registrationWindows.id })
      .from(schema.registrationWindows)
      .where(eq(schema.registrationWindows.periodId, periodId))
      .limit(1);

    if (!window) {
      throw new DomainError("OFFERING_NOT_FOUND", "수강신청 기간을 찾을 수 없습니다.");
    }

    const [batch] = await tx
      .insert(schema.registrationBatches)
      .values({ userId, windowId: window.id, reviewToken: request.reviewToken })
      .returning({ id: schema.registrationBatches.id });

    for (const item of review.items) {
      const count = item.outcome === "WAITLISTED"
        ? (
            await tx
              .select({ c: sql<number>`COUNT(*)` })
              .from(schema.registrations)
              .where(
                and(
                  eq(schema.registrations.offeringId, item.offeringId),
                  eq(schema.registrations.status, "WAITLISTED"),
                ),
              )
              .then((r) => Number(r[0].c))
          )
        : 0;

      const [inserted] = await tx
        .insert(schema.registrations)
        .values({
          batchId: batch.id,
          userId,
          offeringId: item.offeringId,
          status: item.outcome === "SCHEDULE_PENDING" ? "CONFIRMED" : item.outcome,
          waitlistSequence: item.outcome === "WAITLISTED" ? count + 1 : null,
        })
        .returning({ id: schema.registrations.id });

      await tx.insert(schema.registrationEvents).values({
        registrationId: inserted.id,
        actorId: userId,
        action: item.outcome === "CONFIRMED" ? "ENROLL" : "WAITLIST",
        newState: { status: item.outcome, offeringId: item.offeringId },
      });
    }

    await tx.insert(schema.registrationDisclosures).values({
      batchId: batch.id,
      disclosureText: review.disclosureText,
      normalCount: review.normalCount,
      tierMonthlySurcharge: review.normalTierMonthlySurcharge,
    });

    return { success: true, batchId: batch.id };
  }) as Promise<
    { success: true; batchId: number } | { success: false; review: SelectionReview }
  >;
}
