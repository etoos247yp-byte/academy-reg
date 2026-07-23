import type { DatedSession } from "./types";

function toMinutes(timeString: string): number {
  const [h, m] = timeString.split(":").map(Number);
  return h * 60 + m;
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function hasScheduleConflict(a: DatedSession[], b: DatedSession[]): boolean {
  const byDate = new Map<string, DatedSession[]>();

  for (const s of a) {
    const key = dateKey(s.date);
    const list = byDate.get(key);
    if (list) {
      list.push(s);
    } else {
      byDate.set(key, [s]);
    }
  }

  for (const s of b) {
    const key = dateKey(s.date);
    const existing = byDate.get(key);
    if (!existing) continue;

    const bStart = toMinutes(s.startTime);
    const bEnd = toMinutes(s.endTime);

    for (const es of existing) {
      const aStart = toMinutes(es.startTime);
      const aEnd = toMinutes(es.endTime);

      if (bStart < aEnd && bEnd > aStart) {
        return true;
      }
    }
  }

  return false;
}

export function mergeSessions(...sessionArrays: DatedSession[][]): DatedSession[] {
  return sessionArrays.flat();
}
