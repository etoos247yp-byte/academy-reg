export interface Offering { id: number; courseName: string; code: string; category: string; teacher: string | null; capacity: number; status: string; subject: string | null; confirmedCount: number; priceAmountPerSession: number | null; sessionCount: number | null; packageTotal: number | null; }
export interface Registration { id: number; offeringId: number; status: string; courseName: string; category: string; teacher: string | null; waitlistSequence: number | null; }
export interface ScheduleRow { id: number; courseName: string; teacher: string | null; category: string; room: string | null; status: string; subject: string | null; capacity: number; sessionDate: string | Date | null; startTime: string | null; endTime: string | null; }
export interface LockStatus { isLocked: boolean; lockedAt: Date | null; lockedTierLabel: string; lockedTierSurcharge: number; lockedNormalCount: number; currentNormalCount: number; lockDays: number; }
export interface OneUpRow { registrationId: number; courseName: string; teacher: string | null; status: string; assignedDate: string | null; startTime: string | null; endTime: string | null; }
export interface HistoryBatch { batchId: number; createdAt: string | Date; disclosureText: string | null; items: { courseName: string; status: string }[]; }

export const CAT_LABELS: Record<string, string> = { NORMAL_SEASON: "정규", ONE_UP: "원업", SPECIAL: "특강", ESSAY_SPECIAL: "논술", CUSTOM: "사용자정의" };

export function formatPrice(o: Offering): string { if (!o.packageTotal || !o.sessionCount) return "가격 문의"; const per = o.priceAmountPerSession ? ` (회당 ${o.priceAmountPerSession.toLocaleString()}원)` : ""; return `${o.packageTotal.toLocaleString()}원 · ${o.sessionCount}회${per}`; }

export function ft(t: string | null) { if (!t) return ""; return t.length >= 5 ? t.substring(0, 5) : t; }
export function fd(d: string | Date | null) { if (!d) return ""; const dt = typeof d === "string" ? new Date(d) : d; const days = ["일","월","화","수","목","금","토"]; return `${dt.getMonth()+1}/${dt.getDate()}(${days[dt.getDay()]})`; }
