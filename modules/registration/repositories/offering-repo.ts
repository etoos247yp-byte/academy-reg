import { db, schema } from "@/lib/db/connection";
import { eq, and, inArray, sql } from "drizzle-orm";
import type { OfferingView, RegistrationItem } from "@/modules/registration/domain/types";

async function assembleOfferingView(
  rows: {
    id: number;
    courseName: string;
    category: string;
    teacher: string | null;
    capacity: number;
    isPublished: boolean;
    sessionDate: string | Date | null;
    sessionStart: string | null;
    sessionEnd: string | null;
    confirmedCount: number;
    waitlistCount: number;
    priceAmountPerSession: number | null;
    sessionCount: number | null;
    packageTotal: number | null;
  }[],
): Promise<Map<number, OfferingView>> {
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
        priceModelType: (row.priceAmountPerSession ?? 0) > 0 && (row.packageTotal ?? 0) === (row.priceAmountPerSession ?? 0) * (row.sessionCount ?? 1)
          ? "PER_SESSION" : "FIXED_PACKAGE",
        sessionCount: Number(row.sessionCount ?? 1),
        packageTotal: Number(row.packageTotal ?? 0),
        isPublished: Boolean(row.isPublished),
      });
    }
    if (row.sessionDate) {
      const v = map.get(row.id)!;
      v.sessions.push({
        date: new Date(String(row.sessionDate)),
        startTime: String(row.sessionStart).substring(0, 5),
        endTime: String(row.sessionEnd).substring(0, 5),
      });
    }
  }
  return map;
}

const PRICING_SELECT = {
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
  sessionCount: schema.offeringPricing.sessionCount,
  packageTotal: schema.offeringPricing.packageTotal,
};

export async function findOfferingById(id: number): Promise<OfferingView | null> {
  const rows = await db
    .select(PRICING_SELECT)
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .leftJoin(schema.offeringSessions, eq(schema.offerings.id, schema.offeringSessions.offeringId))
    .leftJoin(schema.offeringPricing, eq(schema.offerings.id, schema.offeringPricing.offeringId))
    .where(eq(schema.offerings.id, id));

  if (rows.length === 0) return null;
  const map = await assembleOfferingView(rows);
  return map.get(id) ?? null;
}

export async function findOfferingsByIds(ids: number[]): Promise<Map<number, OfferingView>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select(PRICING_SELECT)
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .leftJoin(schema.offeringSessions, eq(schema.offerings.id, schema.offeringSessions.offeringId))
    .leftJoin(schema.offeringPricing, eq(schema.offerings.id, schema.offeringPricing.offeringId))
    .where(inArray(schema.offerings.id, ids))
    .orderBy(schema.offerings.id, schema.offeringSessions.sessionDate);

  return assembleOfferingView(rows);
}

export async function findStudentRegistrations(userId: number): Promise<RegistrationItem[]> {
  const rows = await db
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
  const offerings = await findOfferingsByIds(offeringIds);

  return rows.map((row) => ({
    offeringId: row.offeringId,
    status: row.status as RegistrationItem["status"],
    offering: offerings.get(row.offeringId)!,
  }));
}

export async function getActiveWindow(periodId: number) {
  const [window] = await db
    .select()
    .from(schema.registrationWindows)
    .where(
      and(
        eq(schema.registrationWindows.periodId, periodId),
        sql`${schema.registrationWindows.opensAt} <= now()`,
      ),
    )
    .limit(1);

  return window ?? null;
}

export async function isRegistrationOpen(periodId: number): Promise<boolean> {
  const [window] = await db
    .select()
    .from(schema.registrationWindows)
    .where(
      and(
        eq(schema.registrationWindows.periodId, periodId),
        sql`${schema.registrationWindows.opensAt} <= now()`,
        sql`${schema.registrationWindows.closesAt} >= now()`,
      ),
    )
    .limit(1);
  return !!window;
}
