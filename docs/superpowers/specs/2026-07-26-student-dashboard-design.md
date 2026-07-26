# Student Dashboard Restructure — Phase 1 Design

**Date:** 2026-07-26
**Status:** Approved by user (structure + added features)

## Problem

정규수업, 특강 (SPECIAL/ESSAY_SPECIAL), and 원업 (ONE_UP) are separate programs
with different pricing models, but the student page mixes them into one catalog,
one timetable, and one tier meter. Students cannot see program-specific
information (특강 prices/dates, 원업 assignment status) or their total cost.

CLASS A–D tier pricing applies **only** to 정규수업. 특강 and 원업 are priced
per offering via `offering_pricing` (package total / per-session).

## Scope

Phase 1 of 3. UI restructure only — **no schema changes, no staff-page changes,
no registration-flow changes**. Phase 2 = per-program registration windows.
Phase 3 = admin pricing management.

## Page structure

Route stays `/student/registration`. Top-level tabs:

| Tab | Contents |
|---|---|
| 홈 | Summary dashboard (landing tab) |
| 정규수업 | NORMAL_SEASON catalog + CLASS meter + weekly mini timetable with selection preview |
| 특강 | SPECIAL + ESSAY_SPECIAL catalog with prices + dated session list |
| 원업 | ONE_UP catalog with prices + teacher/배정 status |
| 내 수강 목록 | Cross-program registration table (adds program column) + 신청 내역 |

The previous 수강 카탈로그 / 내 시간표 / 내 수강 목록 tabs are replaced.
The full-page timetable lives inside 정규수업.

### 홈 tab (landing)

- **Alert strip** (top): registration deadline D-day (red when ≤ 3 days),
  lock-period status if locked, waitlisted courses with queue position.
- **나의 CLASS card**: A–D segment meter, 정규 confirmed count, monthly
  surcharge. Counts NORMAL_SEASON registrations only.
- **비용 요약 card**: CLASS 월 비용 + sum of registered 특강/논술 package
  totals + sum of registered 원업 package totals = 예상 총 비용. Reads
  `offering_pricing` for non-정규 amounts; 정규 amount is the tier surcharge.
- **이번 주 시간표**: mini weekly grid, 정규수업 sessions only.
- **다가오는 특강**: next dated sessions of registered 특강/논술, as a date
  list (dated events, not weekly-recurring).
- **원업 현황**: per ONE_UP registration — teacher, then 배정 대기 or the
  assigned date/time from `one_up_assignments`.

### Program tabs

Each tab = catalog (filtered to its categories) + program-shaped "my" view.
Selection basket and 신청하기 are shared across tabs (unchanged server flow:
`prepareSelectionAction` → acknowledgment modal when surcharge > 0 →
`confirmSelectionAction`).

- **정규수업**: current card grid; sidebar keeps 선택한 수업, CLASS meter,
  mini timetable with dashed selection preview and conflict flagging.
- **특강**: cards show package price and per-session price
  (e.g. "320,000원 · 4회 (회당 80,000원)") and the session dates. My-view:
  dated schedule list of registered 특강.
- **원업**: cards show teacher, seats, package price. My-view: assignment
  status list. No timetable (schedule exists only after teacher assignment).

### 내 수강 목록 tab

- Existing table + program column (정규/특강/논술/원업 badge).
- **신청 내역** section: past registration batches (date, course names,
  outcome) with the exact accepted disclosure text from
  `registration_disclosures`. Read-only receipt/audit view.

### Empty states

Every tab/section states the next action (e.g. 원업: "원업 수업을 신청하면
담당 선생님이 시간을 배정합니다 — 원업 카탈로그 보기"), never a bare
"없습니다".

## Data flow

New/extended server queries (all read-only, in `lib/actions/queries.ts`):

- `getStudentDashboardData(userId)` — or compose existing queries:
  registrations joined with `offering_pricing` (price fields added to the
  existing registration/offering queries), `one_up_assignments` for 원업
  status, `registration_batches` + `registration_disclosures` for 신청 내역.
- Offering queries gain `priceAmountPerSession`, `sessionCount`,
  `packageTotal` via LEFT JOIN on `offering_pricing` (already the pattern in
  `offering-repo.ts`).

Client: `StudentDashboard.tsx` is split — it has grown too large. New
components under `components/student/`:

- `StudentDashboard.tsx` — tab shell + shared selection state (kept)
- `HomeTab.tsx` — 홈 cards
- `ProgramCatalog.tsx` — reusable card grid (category filter prop, price display)
- `SpecialSchedule.tsx` — dated 특강 list
- `OneUpStatus.tsx` — 원업 assignment list
- `MyRegistrations.tsx` — table + 신청 내역

TEST_MODE mock data gains pricing/assignment fields as needed so Playwright
e2e still renders every tab.

## Error handling

- Missing `offering_pricing` row → price area shows "가격 문의" (never 0원).
- No `one_up_assignments` row → 배정 대기 (normal state, not an error).
- All new queries return [] on failure like existing ones; cards render empty
  states.

## Testing

- Unit: price-summary computation (tier + package sums) as a pure function
  with vitest; date-list grouping helper.
- e2e (TEST_MODE): tabs render, 홈 shows CLASS meter and 비용 요약, 특강 tab
  shows prices, catalog selection still reaches the confirm flow.
- Manual live check against Supabase before push (established practice).

## Out of scope (later phases)

- Per-program registration windows/deadlines (Phase 2)
- Staff UI for creating pricing packages; 원업 multi-session package
  assignments (Phase 3)
- Student-initiated cancellation
