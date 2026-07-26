export interface UpcomingInput {
  courseName: string;
  sessionDate: string | Date | null;
  startTime: string | null;
  endTime: string | null;
  room?: string | null;
}

export interface UpcomingSession {
  courseName: string;
  date: Date;
  startTime: string;
  endTime: string;
  room: string | null;
}

function toLocalDate(d: string | Date): Date {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const [y, m, day] = d.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function selectUpcomingSessions(
  rows: UpcomingInput[],
  now: Date,
  limit = 6,
): UpcomingSession[] {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return rows
    .filter((r) => r.sessionDate && r.startTime && r.endTime)
    .map((r) => ({
      courseName: r.courseName,
      date: toLocalDate(r.sessionDate as string | Date),
      startTime: (r.startTime as string).substring(0, 5),
      endTime: (r.endTime as string).substring(0, 5),
      room: r.room ?? null,
    }))
    .filter((r) => r.date.getTime() >= todayStart.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime))
    .slice(0, limit);
}
