"use client";

const DAYS = ["월", "화", "수", "목", "금"];
const START_HOUR = 9;
const END_HOUR = 18;
const SLOT_HEIGHT = 28; // px per 30-minute slot
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;
const TIME_COL_WIDTH = 52;
const HEADER_HEIGHT = 30;

function slotToMin(slot: number): number {
  return (START_HOUR * 60) + slot * 30;
}

function formatTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface SessionCell {
  courseName: string; teacher: string; category: string; room: string;
  startTime: string; endTime: string; startSlot: number; slotSpan: number; col: number;
}

interface Props { sessions: SessionCell[]; }

const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  NORMAL_SEASON: { bg: "#f0f5ff", border: "#336699", text: "#2b5797" },
  ONE_UP: { bg: "#fff8f0", border: "#d83b01", text: "#d83b01" },
  SPECIAL: { bg: "#f0fff0", border: "#107c10", text: "#107c10" },
  ESSAY_SPECIAL: { bg: "#fff0f5", border: "#a800a0", text: "#a800a0" },
};

function getCatColors(cat: string) {
  return CAT_COLORS[cat] ?? { bg: "#f8f8f8", border: "#666", text: "#333" };
}

export function TimetableGrid({ sessions }: Props) {
  const gridWidth = TIME_COL_WIDTH + (5 * 200); // time col + 5 day cols
  const gridHeight = HEADER_HEIGHT + (TOTAL_SLOTS * SLOT_HEIGHT);
  const colWidth = 200;

  // For overlapping sessions in same slot, stagger horizontally
  const positioned = buildPositions(sessions, colWidth);

  return (
    <div className="overflow-auto" style={{ border: "1px solid #bbb", background: "#fff", maxHeight: "80vh" }}>
      <div style={{ width: gridWidth, height: gridHeight, position: "relative", minWidth: 850 }}>

        {/* Column headers */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: HEADER_HEIGHT,
          display: "flex", borderBottom: "1px solid #999", background: "#ddd", zIndex: 2,
        }}>
          <div style={{
            width: TIME_COL_WIDTH, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, color: "#333", borderRight: "1px solid #bbb",
          }}>시간</div>
          {DAYS.map((day, i) => (
            <div key={day} style={{
              width: colWidth, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, borderRight: i < 4 ? "1px solid #bbb" : "none",
              color: day === "금" ? "#336699" : "#333",
              background: day === "금" ? "#f0f5ff" : "#ddd",
            }}>{day}요일</div>
          ))}
        </div>

        {/* Time labels + grid lines */}
        {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
          const isHour = slot % 2 === 0;
          const top = HEADER_HEIGHT + slot * SLOT_HEIGHT;
          return (
            <div key={slot}>
              {/* Time label */}
              <div style={{
                position: "absolute", top, left: 0, width: TIME_COL_WIDTH, height: SLOT_HEIGHT,
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 6, fontSize: 10, color: isHour ? "#333" : "#999",
                fontWeight: isHour ? 500 : 400,
                borderRight: "1px solid #ccc",
                borderBottom: isHour ? "1px solid #bbb" : "1px solid #eee",
                background: isHour ? "#f5f5f5" : "#fafafa",
                zIndex: 1,
              }}>
                {isHour ? formatTimeLabel(slotToMin(slot)) : ""}
              </div>
              {/* Day column grid lines */}
              {DAYS.map((_, col) => (
                <div key={col} style={{
                  position: "absolute", top, left: TIME_COL_WIDTH + col * colWidth,
                  width: colWidth, height: SLOT_HEIGHT,
                  borderRight: col < 4 ? "1px solid #eee" : "none",
                  borderBottom: isHour ? "1px solid #eee" : "1px solid #f5f5f5",
                  zIndex: 1,
                }} />
              ))}
            </div>
          );
        })}

        {/* Session blocks — absolutely positioned */}
        {positioned.map((s, idx) => {
          const colors = getCatColors(s.category);
          const top = HEADER_HEIGHT + s.startSlot * SLOT_HEIGHT;
          const height = s.slotSpan * SLOT_HEIGHT - 1;
          const left = TIME_COL_WIDTH + s.col * colWidth + s.offsetX;
          const width = s.width;
          const isSmall = s.slotSpan <= 1;

          return (
            <div key={idx} style={{
              position: "absolute", top, left, height, width,
              background: colors.bg, border: `1px solid ${colors.border}`,
              padding: isSmall ? "1px 3px" : "2px 4px",
              overflow: "hidden", zIndex: 3,
              cursor: "default",
            }}>
              <p style={{
                fontSize: isSmall ? 9 : 10, fontWeight: 700, color: colors.text,
                lineHeight: 1.2, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{s.courseName}</p>
              {!isSmall && (
                <>
                  <p style={{ fontSize: 9, color: colors.text, margin: 0, lineHeight: 1.3 }}>
                    {s.startTime}~{s.endTime}
                  </p>
                  <p style={{ fontSize: 8, color: "#666", margin: 0, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.teacher}{s.room ? ` · ${s.room}` : ""}
                  </p>
                </>
              )}
            </div>
          );
        })}

        {/* Right border */}
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 1, background: "#ccc", zIndex: 0 }} />
        {/* Bottom border */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "#ccc", zIndex: 0 }} />

      </div>
    </div>
  );
}

interface MiniProps {
  sessions: SessionCell[];
  pendingSessions: SessionCell[];
}

/** Compact sidebar week view: confirmed sessions solid, pending (selected) dashed. */
export function MiniTimetableGrid({ sessions, pendingSessions }: MiniProps) {
  const TIME_COL = 26;
  const COL_W = 49;
  const SLOT_H = 13;
  const HDR = 20;
  const height = HDR + TOTAL_SLOTS * SLOT_H;
  const width = TIME_COL + 5 * COL_W;

  const all = [
    ...sessions.map((s) => ({ ...s, pending: false })),
    ...pendingSessions.map((s) => ({ ...s, pending: true })),
  ];
  const positioned = buildPositions(all, COL_W) as (PositionedSession & { pending: boolean })[];

  return (
    <div style={{ border: "1px solid #bbb", background: "#fff", overflow: "hidden" }}>
      <div style={{ width, height, position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: HDR,
          display: "flex", borderBottom: "1px solid #999", background: "#ddd",
        }}>
          <div style={{ width: TIME_COL, flexShrink: 0, borderRight: "1px solid #bbb" }} />
          {DAYS.map((day, i) => (
            <div key={day} style={{
              width: COL_W, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600, color: "#333",
              borderRight: i < 4 ? "1px solid #bbb" : "none",
            }}>{day}</div>
          ))}
        </div>

        {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
          const isHour = slot % 2 === 0;
          const showLabel = isHour && slot % 4 === 0;
          const top = HDR + slot * SLOT_H;
          return (
            <div key={slot}>
              <div style={{
                position: "absolute", top, left: 0, width: TIME_COL, height: SLOT_H,
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 3, fontSize: 8, color: "#999",
                borderRight: "1px solid #ccc",
                borderBottom: isHour ? "1px solid #eee" : "none",
                background: "#fafafa",
              }}>
                {showLabel ? String(START_HOUR + slot / 2).padStart(2, "0") : ""}
              </div>
              {DAYS.map((_, col) => (
                <div key={col} style={{
                  position: "absolute", top, left: TIME_COL + col * COL_W,
                  width: COL_W, height: SLOT_H,
                  borderRight: col < 4 ? "1px solid #f0f0f0" : "none",
                  borderBottom: isHour ? "1px solid #f0f0f0" : "none",
                }} />
              ))}
            </div>
          );
        })}

        {positioned.map((s, idx) => {
          const colors = getCatColors(s.category);
          const top = HDR + s.startSlot * SLOT_H;
          const blockH = s.slotSpan * SLOT_H - 1;
          const left = TIME_COL + s.col * COL_W + s.offsetX;
          return (
            <div key={idx}
              title={`${s.courseName} ${s.startTime}~${s.endTime}${s.teacher ? ` · ${s.teacher}` : ""}`}
              style={{
                position: "absolute", top, left, height: blockH, width: s.width,
                background: colors.bg,
                border: `1px ${s.pending ? "dashed" : "solid"} ${colors.border}`,
                opacity: s.pending ? 0.75 : 1,
                overflow: "hidden", zIndex: 2,
              }}>
              {s.slotSpan >= 2 && (
                <p style={{
                  fontSize: 8, fontWeight: 700, color: colors.text, margin: 0,
                  padding: "1px 2px", lineHeight: 1.2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{s.courseName}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Stagger overlapping sessions in the same column to avoid complete overlap */
interface PositionedSession extends SessionCell {
  offsetX: number;
  width: number;
}

function buildPositions(sessions: SessionCell[], colWidth: number): PositionedSession[] {
  // Group by column
  const byCol = new Map<number, SessionCell[]>();
  for (const s of sessions) {
    if (s.col < 0 || s.col >= 5) continue;
    const list = byCol.get(s.col);
    if (list) list.push(s);
    else byCol.set(s.col, [s]);
  }

  const result: PositionedSession[] = [];

  for (const [col, colSessions] of byCol) {
    // Sort by start slot
    colSessions.sort((a, b) => a.startSlot - b.startSlot);

    // Find overlaps
    const groups: SessionCell[][] = [];
    for (const s of colSessions) {
      let placed = false;
      for (const group of groups) {
        const lastInGroup = group[group.length - 1];
        if (s.startSlot >= lastInGroup.startSlot + lastInGroup.slotSpan) {
          group.push(s);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([s]);
    }

    // For each overlapping group, stagger horizontally
    for (const group of groups) {
      const n = group.length;
      const w = Math.floor((colWidth - 4) / n);
      group.forEach((s, i) => {
        result.push({ ...s, offsetX: i * w + 2, width: w - 2 });
      });
    }
  }

  return result;
}

export function buildTimetableSessions(rawSessions: {
  courseName: string; teacher: string | null; category: string; room: string | null;
  sessionDate: string | Date | null; startTime: string | null; endTime: string | null;
}[]): SessionCell[] {
  const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
  return rawSessions
    .filter(s => s.sessionDate && s.startTime && s.endTime)
    .map(s => {
      const dateStr = typeof s.sessionDate === "string" ? s.sessionDate : s.sessionDate!.toISOString().split("T")[0];
      const [y, m, d] = dateStr.split("-").map(Number);
      const local = new Date(y, m - 1, d);
      const dayName = local.toLocaleDateString("en-US", { weekday: "short" });
      const col = dayMap[dayName] ?? -1;
      const [sh, sm] = (s.startTime ?? "00:00").substring(0, 5).split(":").map(Number);
      const [eh, em] = (s.endTime ?? "00:00").substring(0, 5).split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const duration = Math.max(endMin - startMin, 30);
      const startSlot = Math.floor((startMin - START_HOUR * 60) / 30);
      const slotSpan = Math.max(Math.ceil(duration / 30), 1);
      return {
        courseName: s.courseName, teacher: s.teacher ?? "", category: s.category, room: s.room ?? "",
        startTime: (s.startTime ?? "").substring(0, 5), endTime: (s.endTime ?? "").substring(0, 5),
        startSlot, slotSpan, col,
      };
    })
    .filter(s => s.col >= 0 && s.col < 5);
}
