import { describe, it, expect } from "vitest";
import { selectUpcomingSessions } from "./upcoming";

const now = new Date(2026, 6, 26, 10, 0); // 2026-07-26 local

describe("selectUpcomingSessions", () => {
  it("keeps today's and future sessions, drops past ones", () => {
    const out = selectUpcomingSessions([
      { courseName: "지난특강", sessionDate: "2026-07-20", startTime: "10:00:00", endTime: "11:00:00" },
      { courseName: "오늘특강", sessionDate: "2026-07-26", startTime: "15:00:00", endTime: "16:00:00" },
      { courseName: "다음특강", sessionDate: "2026-07-28", startTime: "09:00:00", endTime: "10:00:00" },
    ], now);
    expect(out.map(s => s.courseName)).toEqual(["오늘특강", "다음특강"]);
  });

  it("sorts by date then start time and truncates times to HH:MM", () => {
    const out = selectUpcomingSessions([
      { courseName: "B", sessionDate: "2026-07-28", startTime: "13:00:00", endTime: "14:00:00" },
      { courseName: "A", sessionDate: "2026-07-28", startTime: "09:00:00", endTime: "10:00:00" },
    ], now);
    expect(out.map(s => s.courseName)).toEqual(["A", "B"]);
    expect(out[0].startTime).toBe("09:00");
    expect(out[0].endTime).toBe("10:00");
  });

  it("accepts Date objects, skips null dates, respects the limit", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      courseName: `S${i}`, sessionDate: new Date(2026, 6, 27 + i), startTime: "10:00:00", endTime: "11:00:00",
    }));
    const out = selectUpcomingSessions([{ courseName: "무날짜", sessionDate: null, startTime: null, endTime: null }, ...rows], now, 3);
    expect(out).toHaveLength(3);
    expect(out[0].courseName).toBe("S0");
  });

  it("carries room through, defaulting to null", () => {
    const out = selectUpcomingSessions([
      { courseName: "특강", sessionDate: "2026-07-28", startTime: "10:00:00", endTime: "11:00:00", room: "201호" },
    ], now);
    expect(out[0].room).toBe("201호");
  });
});
