# Student Dashboard (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the student page into 홈 · 정규수업 · 특강 · 원업 · 내 수강 목록 tabs, each shaped for its program (spec: `docs/superpowers/specs/2026-07-26-student-dashboard-design.md`).

**Architecture:** Split the oversized `StudentDashboard.tsx` into a tab shell plus per-tab components. Add three read-only query extensions (pricing join, 원업 assignment status, registration history). One new pure domain helper (upcoming dated sessions) built TDD.

**Tech Stack:** Next.js 14 App Router (server components fetch, client components render), Drizzle ORM, vitest, Playwright.

## Global Constraints

- No schema changes; all new queries are read-only.
- No changes to `prepareSelectionAction`/`confirmSelectionAction` or the modal flow.
- No emojis anywhere in UI copy (user preference).
- Tier wording is "CLASS", never "요금제". CLASS A–D applies to NORMAL_SEASON only.
- Missing pricing row renders "가격 문의", never "0원".
- Match the existing ERP visual style (`erp-card`, `erp-btn-primary`, `erp-header`, `erp-badge`, colors #336699/#2b5797/#d83b01/#a80000/#107c10).
- TEST_MODE (Playwright) must render every tab with data.

---

### Task 1: Upcoming-sessions domain helper (TDD)

**Files:**
- Create: `modules/registration/domain/upcoming.ts`
- Test: `modules/registration/domain/upcoming.test.ts`

**Interfaces:**
- Produces: `selectUpcomingSessions(rows: UpcomingInput[], now: Date, limit?: number): UpcomingSession[]`
  where `UpcomingInput = { courseName: string; sessionDate: string | Date | null; startTime: string | null; endTime: string | null; room?: string | null }`
  and `UpcomingSession = { courseName: string; date: Date; startTime: string; endTime: string; room: string | null }`.
  Includes sessions from the start of `now`'s day onward, sorted by date then start time, times truncated to HH:MM, capped at `limit` (default 6).

- [ ] **Step 1: Write the failing test** (`modules/registration/domain/upcoming.test.ts`)

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run modules/registration/domain/upcoming.test.ts`
Expected: FAIL — cannot resolve `./upcoming`

- [ ] **Step 3: Write the implementation** (`modules/registration/domain/upcoming.ts`)

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run modules/registration/domain/upcoming.test.ts`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add modules/registration/domain/upcoming.ts modules/registration/domain/upcoming.test.ts
git commit -m "feat: add upcoming-sessions helper for dated 특강 lists"
```

---

### Task 2: Query layer — pricing join, 원업 status, registration history, mocks

**Files:**
- Modify: `lib/actions/queries.ts` (getStudentOfferings; add getOneUpStatus, getRegistrationHistory)
- Modify: `lib/db/mock-data.ts`, `lib/db/test-mode.ts`
- Modify: `app/student/registration/page.tsx`

**Interfaces:**
- Produces: `getStudentOfferings` rows gain `priceAmountPerSession: number | null; sessionCount: number | null; packageTotal: number | null`.
- Produces: `getOneUpStatus(userId: number)` → `{ registrationId: number; courseName: string; teacher: string | null; status: string; assignedDate: string | null; startTime: string | null; endTime: string | null }[]`
- Produces: `getRegistrationHistory(userId: number)` → `{ batchId: number; createdAt: Date; disclosureText: string | null; items: { courseName: string; status: string }[] }[]` (newest first)

- [ ] **Step 1: Add pricing fields to `getStudentOfferings`** — in the `.select({...})` add:

```ts
      priceAmountPerSession: schema.offeringPricing.priceAmountPerSession,
      sessionCount: schema.offeringPricing.sessionCount,
      packageTotal: schema.offeringPricing.packageTotal,
```

and after the instructors join add:

```ts
    .leftJoin(schema.offeringPricing, eq(schema.offerings.id, schema.offeringPricing.offeringId))
```

- [ ] **Step 2: Add `getOneUpStatus` and `getRegistrationHistory` to `lib/actions/queries.ts`**

```ts
export async function getOneUpStatus(userId: number) {
  if (isTestMode()) return TEST.getOneUpStatus();
  const period = await getActivePeriod();
  if (!period) return [];
  return db
    .select({
      registrationId: schema.registrations.id,
      courseName: schema.courses.name,
      teacher: schema.instructors.name,
      status: schema.registrations.status,
      assignedDate: schema.oneUpAssignments.sessionDate,
      startTime: schema.oneUpAssignments.startTime,
      endTime: schema.oneUpAssignments.endTime,
    })
    .from(schema.registrations)
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .leftJoin(schema.oneUpAssignments, eq(schema.oneUpAssignments.registrationId, schema.registrations.id))
    .where(and(
      eq(schema.registrations.userId, userId),
      eq(schema.offerings.periodId, period.id),
      eq(schema.offerings.category, "ONE_UP"),
      sql`${schema.registrations.status} IN ('CONFIRMED', 'WAITLISTED')`,
    ))
    .orderBy(asc(schema.registrations.enrolledAt));
}

export async function getRegistrationHistory(userId: number) {
  if (isTestMode()) return TEST.getRegistrationHistory();
  const rows = await db
    .select({
      batchId: schema.registrationBatches.id,
      createdAt: schema.registrationBatches.createdAt,
      disclosureText: schema.registrationDisclosures.disclosureText,
      courseName: schema.courses.name,
      status: schema.registrations.status,
    })
    .from(schema.registrationBatches)
    .innerJoin(schema.registrations, eq(schema.registrations.batchId, schema.registrationBatches.id))
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.registrationDisclosures, eq(schema.registrationDisclosures.batchId, schema.registrationBatches.id))
    .where(eq(schema.registrationBatches.userId, userId))
    .orderBy(sql`${schema.registrationBatches.createdAt} DESC`);

  const byBatch = new Map<number, { batchId: number; createdAt: Date; disclosureText: string | null; items: { courseName: string; status: string }[] }>();
  for (const r of rows) {
    let b = byBatch.get(r.batchId);
    if (!b) {
      b = { batchId: r.batchId, createdAt: r.createdAt, disclosureText: r.disclosureText, items: [] };
      byBatch.set(r.batchId, b);
    }
    b.items.push({ courseName: r.courseName, status: r.status });
  }
  return [...byBatch.values()];
}
```

- [ ] **Step 3: Extend mocks.** In `lib/db/mock-data.ts`:
  - Add to every `MOCK_OFFERINGS` entry: `priceAmountPerSession`, `sessionCount`, `packageTotal` — NORMAL_SEASON entries get `null, null, null`; id 1 (SPECIAL) gets `36000, 4, 144000`; ONE_UP entries (ids 2, 4, 7) get `25000, 4, 100000`.
  - Fix `MOCK_REGISTRATIONS` offeringIds to match names: 국어 → `offeringId: 3`, 수학 → `offeringId: 9`.
  - Append a dated SPECIAL row to `MOCK_SCHEDULE_DATA`:

```ts
  { id: 1, courseName: "여름방학 특강", teacher: "김민철", category: "SPECIAL", room: "강당", capacity: 30, status: "PUBLISHED", subject: "종합", sessionDate: "2026-07-28", startTime: "15:00:00", endTime: "17:00:00" },
```

  - Add:

```ts
export const MOCK_ONEUP_STATUS = [
  { registrationId: 90, courseName: "국어 원업", teacher: "김민철", status: "CONFIRMED", assignedDate: null, startTime: null, endTime: null },
];

export const MOCK_HISTORY = [
  { batchId: 1, createdAt: new Date("2026-07-01T09:00:00"), disclosureText: "정규수업 2과목 신청 기준 CLASS A (1~3과목)에 해당하며, 추가 비용이 발생하지 않습니다.", items: [ { courseName: "국어", status: "CONFIRMED" }, { courseName: "수학", status: "CONFIRMED" } ] },
];
```

  In `lib/db/test-mode.ts` import the two new mocks and add to `TEST`:

```ts
  getOneUpStatus: () => MOCK_ONEUP_STATUS,
  getRegistrationHistory: () => MOCK_HISTORY,
```

- [ ] **Step 4: Fetch in the page.** In `app/student/registration/page.tsx` import and call after `lockStatus`:

```ts
  const oneUpStatus = await getOneUpStatus(user.id);
  const history = await getRegistrationHistory(user.id);
```

and pass `oneUpStatus={oneUpStatus} history={history}` to `<StudentDashboard>` (props added in Task 4).

- [ ] **Step 5: Typecheck** (page prop will fail until Task 4 — defer `tsc` to end of Task 4; run `npx vitest run` only)

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/actions/queries.ts lib/db/mock-data.ts lib/db/test-mode.ts app/student/registration/page.tsx
git commit -m "feat: pricing fields, one-up status and registration history queries"
```

---

### Task 3: Extracted presentational components

**Files:**
- Create: `components/student/ProgramCatalog.tsx`
- Create: `components/student/SpecialSchedule.tsx`
- Create: `components/student/OneUpStatus.tsx`
- Create: `components/student/MyRegistrations.tsx`
- Create: `components/student/HomeTab.tsx`
- Create: `components/student/types.ts`

**Interfaces:**
- Produces (types.ts — single source for the shell and tabs):

```ts
export interface Offering { id: number; courseName: string; code: string; category: string; teacher: string | null; capacity: number; status: string; subject: string | null; confirmedCount: number; priceAmountPerSession: number | null; sessionCount: number | null; packageTotal: number | null; }
export interface Registration { id: number; offeringId: number; status: string; courseName: string; category: string; teacher: string | null; waitlistSequence: number | null; }
export interface ScheduleRow { id: number; courseName: string; teacher: string | null; category: string; room: string | null; status: string; subject: string | null; capacity: number; sessionDate: string | Date | null; startTime: string | null; endTime: string | null; }
export interface LockStatus { isLocked: boolean; lockedAt: Date | null; lockedTierLabel: string; lockedTierSurcharge: number; lockedNormalCount: number; currentNormalCount: number; lockDays: number; }
export interface OneUpRow { registrationId: number; courseName: string; teacher: string | null; status: string; assignedDate: string | null; startTime: string | null; endTime: string | null; }
export interface HistoryBatch { batchId: number; createdAt: string | Date; disclosureText: string | null; items: { courseName: string; status: string }[]; }
export const CAT_LABELS: Record<string, string> = { NORMAL_SEASON: "정규", ONE_UP: "원업", SPECIAL: "특강", ESSAY_SPECIAL: "논술", CUSTOM: "사용자정의" };
export function formatPrice(o: Offering): string { if (!o.packageTotal || !o.sessionCount) return "가격 문의"; const per = o.priceAmountPerSession ? ` (회당 ${o.priceAmountPerSession.toLocaleString()}원)` : ""; return `${o.packageTotal.toLocaleString()}원 · ${o.sessionCount}회${per}`; }
```

- Produces component signatures:
  - `ProgramCatalog({ offerings, registeredIds, selected, loading, showPrice, scheduleByOffering, onToggle, emptyText })` — card grid with local search box; card body identical to the current catalog card (code/badge/name/teacher/seat bar/expandable schedule table) plus, when `showPrice`, a price line `formatPrice(o)` under the teacher line in `text-xs font-semibold` color `#2b5797`.
  - `SpecialSchedule({ scheduleData })` — feeds `scheduleData.filter(s => s.category === "SPECIAL" || s.category === "ESSAY_SPECIAL")` through `selectUpcomingSessions(rows, new Date(), 50)` and renders an `erp-card` table (날짜 · 시간 · 수업명 · 강의실). Empty state: "신청한 특강이 없습니다. 특강 카탈로그에서 신청해주세요."
  - `OneUpStatus({ rows })` — `erp-card` table (수업명 · 담당 선생님 · 상태). 상태 cell: if `assignedDate` → `fd(assignedDate) ft(startTime)~ft(endTime)` badge `erp-badge-ok`; else "배정 대기" badge `erp-badge-warn`. Empty state: "원업 수업을 신청하면 담당 선생님이 시간을 배정합니다."
  - `MyRegistrations({ registrations, history })` — current table + 유형 badge column, followed by an `erp-card` "신청 내역" section listing each `HistoryBatch`: date (`toLocaleDateString("ko-KR")`), item list "수업명 — 확정/대기/취소", and the `disclosureText` in a bordered `#f0f5ff` box. Empty state: "신청 내역이 없습니다."
  - `HomeTab({ registrations, scheduleData, windowClosesAt, lockStatus, normalCount, oneUpRows, onGoTab })` — renders:
    1. Alert strip: D-day (`Math.ceil((closes - Date.now())/86400000)`) as `신청 마감 D-${n}` (red `#a80000` when n ≤ 3 else `#2b5797`; omit when null); lock line when `lockStatus.isLocked`; one line per WAITLISTED registration: `대기중: ${courseName} (대기 ${waitlistSequence}번)`.
    2. 나의 CLASS card (same meter markup as current sidebar, driven by `computeNormalTier(normalCount)` — confirmed only, no selection preview on 홈).
    3. 이번 주 시간표 card: `MiniTimetableGrid` with `buildTimetableSessions(scheduleData.filter(s => s.category === "NORMAL_SEASON"))`, `pendingSessions={[]}`; empty state links via `onGoTab("normal")` button "정규수업 카탈로그 보기".
    4. 다가오는 특강 card: `selectUpcomingSessions` over SPECIAL/ESSAY_SPECIAL scheduleData, limit 6; rows `M/D(요일) HH:MM~HH:MM 수업명`; empty state button `onGoTab("special")` "특강 카탈로그 보기".
    5. 원업 현황 card: same rows as `OneUpStatus`; empty state button `onGoTab("oneup")` "원업 카탈로그 보기".
    Layout: `grid gap-3 md:grid-cols-2` with the alert strip full-width above.
- Consumes: `MiniTimetableGrid`, `buildTimetableSessions` from `components/shared/TimetableGrid`; `computeNormalTier`, `NORMAL_TIERS` from `modules/pricing/tiers`; `selectUpcomingSessions` from Task 1. The `fd`/`ft` date/time formatters move into `types.ts` and are imported everywhere they're used.

- [ ] **Step 1: Create `types.ts`** with the interfaces, `CAT_LABELS`, `formatPrice`, and the `fd`/`ft` helpers copied from `StudentDashboard.tsx`.
- [ ] **Step 2: Create the five components** exactly as specified in Interfaces. Card markup for `ProgramCatalog` is lifted verbatim from the current catalog block of `StudentDashboard.tsx` (lines ~205–272) with `catFilter` removed (parent pre-filters) and the price line added.
- [ ] **Step 3: Typecheck** — Run `npx tsc --noEmit`. Expected: clean (components not yet wired).
- [ ] **Step 4: Commit**

```bash
git add components/student/types.ts components/student/ProgramCatalog.tsx components/student/SpecialSchedule.tsx components/student/OneUpStatus.tsx components/student/MyRegistrations.tsx components/student/HomeTab.tsx
git commit -m "feat: per-program student tab components"
```

---

### Task 4: Rewrite StudentDashboard shell

**Files:**
- Modify: `components/student/StudentDashboard.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: `StudentDashboard` props extended with `oneUpStatus: OneUpRow[]; history: HistoryBatch[]`.

- [ ] **Step 1: Rewrite the shell.** Keep from the current file: all state, `toggleOffering`, `handlePrepare`, `doConfirm`, the header/deadline/lock lines, result/error banners, and the acknowledgment modal — unchanged. Replace `TABS` with:

```ts
const TABS = [
  { key: "home", label: "홈" },
  { key: "normal", label: "정규수업" },
  { key: "special", label: "특강" },
  { key: "oneup", label: "원업" },
  { key: "my", label: "내 수강 목록" },
];
```

Default tab `"home"`. Remove `catFilter` and the search input/state (search now lives in `ProgramCatalog`). Tab bodies:

- `home`: `<HomeTab registrations scheduleData windowClosesAt lockStatus normalCount={confirmedNormalCount} oneUpRows={oneUpStatus} onGoTab={setTab} />` where `confirmedNormalCount = registrations.filter(r => r.status === "CONFIRMED" && r.category === "NORMAL_SEASON").length`.
- `normal`: two-column grid (`lg:grid-cols-[1fr_300px]`). Left: view toggle buttons `카탈로그` / `전체 시간표`; catalog view renders `<ProgramCatalog offerings={offerings.filter(o => o.category === "NORMAL_SEASON")} showPrice={false} ... />`; timetable view renders full `<TimetableGrid sessions={normalSessions} />` where `normalSessions` = current `sessions` memo restricted to `category === "NORMAL_SEASON"` rows before `buildTimetableSessions`. Right sidebar: 선택한 수업 basket card, 나의 CLASS meter card, 주간 시간표 미리보기 card (filter both `confirmedCells`/`pendingCells` inputs to NORMAL_SEASON), 신청 확인 review card — all moved verbatim from the current sidebar.
- `special`: two-column grid. Left: `<ProgramCatalog offerings={offerings.filter(o => o.category === "SPECIAL" || o.category === "ESSAY_SPECIAL")} showPrice ... />` then `<SpecialSchedule scheduleData={scheduleData} />` below. Right sidebar: basket card + review card only.
- `oneup`: two-column grid. Left: `<ProgramCatalog offerings={offerings.filter(o => o.category === "ONE_UP")} showPrice ... />` then `<OneUpStatus rows={oneUpStatus} />`. Right sidebar: basket card + review card only.
- `my`: `<MyRegistrations registrations={registrations} history={history} />`.

To avoid duplicating the basket/review cards, extract them inside this file as local components `BasketCard` and `ReviewCard` (not exported).

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit`. Expected: clean.
- [ ] **Step 3: Run unit tests** — `npx vitest run`. Expected: all pass.
- [ ] **Step 4: Commit**

```bash
git add components/student/StudentDashboard.tsx
git commit -m "feat: program-tabbed student dashboard shell"
```

---

### Task 5: e2e updates

**Files:**
- Modify: `e2e/student-registration.spec.ts`

- [ ] **Step 1: Update the spec file** — replace the five affected tests:

```ts
  test("displays home dashboard after login", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("수강신청");
    await expect(page.locator("button:has-text('정규수업')")).toBeVisible();
    await expect(page.locator("button:has-text('특강')").first()).toBeVisible();
    await expect(page.locator("button:has-text('원업')").first()).toBeVisible();
    await expect(page.locator("text=나의 CLASS")).toBeVisible();
    await expect(page.locator("text=원업 현황")).toBeVisible();
  });

  test("normal tab shows catalog with courses", async ({ page }) => {
    await page.locator("button:has-text('정규수업')").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=국어").first()).toBeVisible();
    await expect(page.locator("button:has-text('신청하기')")).toBeVisible();
  });

  test("special tab shows prices", async ({ page }) => {
    await page.locator("button:has-text('특강')").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=144,000원").first()).toBeVisible();
  });

  test("can select a course from normal tab", async ({ page }) => {
    await page.locator("button:has-text('정규수업')").click();
    await page.waitForTimeout(300);
    const selectBtn = page.locator("button:has-text('선택')").first();
    await selectBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=선택됨").first()).toBeVisible();
  });

  test("normal tab full timetable view", async ({ page }) => {
    await page.locator("button:has-text('정규수업')").click();
    await page.locator("button:has-text('전체 시간표')").click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=월요일")).toBeVisible();
  });
```

Keep the `내 수강 목록` test as-is (still valid) and update the old "shows apply button" test to click 정규수업 first (or fold into "normal tab shows catalog" as above and delete the old one).

- [ ] **Step 2: Run e2e** — `npx playwright test` (dev server must not already occupy port 3000). Expected: all pass.
- [ ] **Step 3: Commit**

```bash
git add e2e/student-registration.spec.ts
git commit -m "test: e2e for program-tabbed dashboard"
```

---

### Task 6: Live verification and push

- [ ] **Step 1:** `npx vitest run` + `npx tsc --noEmit` — all green.
- [ ] **Step 2:** Start `npm run dev`; with Playwright MCP log in as `12345`/`12345` against the real Supabase DB. Verify: 홈 shows CLASS meter/시간표/특강/원업 cards; 정규수업 tab catalog + sidebar; 특강 tab shows real prices from `offering_pricing`; 원업 tab list; 내 수강 목록 shows 신청 내역 with disclosure text. Screenshot for the user.
- [ ] **Step 3:** Push:

```bash
git push
```
