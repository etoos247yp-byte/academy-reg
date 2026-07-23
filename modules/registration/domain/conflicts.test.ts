import { describe, it, expect } from "vitest";
import { hasScheduleConflict, mergeSessions } from "./conflicts";
import type { DatedSession } from "./types";

function session(date: string, startTime: string, endTime: string): DatedSession {
  return { date: new Date(date), startTime, endTime };
}

describe("hasScheduleConflict", () => {
  it("returns false for empty inputs", () => {
    expect(hasScheduleConflict([], [])).toBe(false);
  });

  it("returns false when sessions are on different days", () => {
    const a = [session("2026-03-02", "10:00", "11:30")];
    const b = [session("2026-03-03", "10:00", "11:30")];
    expect(hasScheduleConflict(a, b)).toBe(false);
  });

  it("returns false when same day but no time overlap", () => {
    const a = [session("2026-03-02", "10:00", "11:00")];
    const b = [session("2026-03-02", "11:00", "12:00")];
    expect(hasScheduleConflict(a, b)).toBe(false);
  });

  it("returns true when sessions overlap on same day", () => {
    const a = [session("2026-03-02", "10:00", "12:00")];
    const b = [session("2026-03-02", "11:00", "13:00")];
    expect(hasScheduleConflict(a, b)).toBe(true);
  });

  it("returns true when one session is fully inside another", () => {
    const a = [session("2026-03-02", "09:00", "15:00")];
    const b = [session("2026-03-02", "10:00", "11:00")];
    expect(hasScheduleConflict(a, b)).toBe(true);
  });

  it("returns false when sessions spanning different weeks", () => {
    const a = [session("2026-03-02", "10:00", "11:30")];
    const b = [session("2026-03-09", "10:00", "11:30")];
    expect(hasScheduleConflict(a, b)).toBe(false);
  });

  it("detects conflict among multiple sessions", () => {
    const a = [
      session("2026-03-02", "10:00", "11:30"),
      session("2026-03-04", "14:00", "15:30"),
    ];
    const b = [
      session("2026-03-02", "11:00", "12:00"),
      session("2026-03-04", "15:00", "16:30"),
    ];
    expect(hasScheduleConflict(a, b)).toBe(true);
  });
});

describe("mergeSessions", () => {
  it("merges two session arrays", () => {
    const a = [session("2026-03-02", "10:00", "11:00")];
    const b = [session("2026-03-03", "14:00", "15:00")];
    expect(mergeSessions(a, b)).toHaveLength(2);
  });

  it("returns empty array for empty inputs", () => {
    expect(mergeSessions([], [])).toHaveLength(0);
  });
});
