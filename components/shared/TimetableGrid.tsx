"use client";

const DAYS = ["월", "화", "수", "목", "금"];
const START_HOUR = 9;
const END_HOUR = 18;
const SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => i);

function slotLabel(slot: number): string {
  const totalMin = (START_HOUR * 60) + slot * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface SessionCell {
  courseName: string;
  teacher: string;
  category: string;
  room: string;
  startTime: string;
  endTime: string;
  startSlot: number;
  slotSpan: number;
  col: number;
}

interface Props {
  sessions: SessionCell[];
}

export function TimetableGrid({ sessions }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "50px repeat(5, 1fr)" }}>
        <div className="border-b border-r bg-gray-50 py-2 text-center text-xs font-medium text-gray-600">
          시간
        </div>
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={`border-b border-r py-2 text-center text-xs font-medium ${i === 4 ? "border-r-0" : ""} ${day === "금" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-600"}`}
          >
            {day}요일
          </div>
        ))}

        {SLOTS.map((slot) => {
          const cellSessions = sessions.filter(
            (s) => s.col >= 0 && slot >= s.startSlot && slot < s.startSlot + s.slotSpan,
          );
          return <TimetableSlot key={slot} slot={slot} sessions={cellSessions} />;
        })}
      </div>
    </div>
  );
}

function TimetableSlot({ slot, sessions }: { slot: number; sessions: SessionCell[] }) {
  const isHour = (slot * 30) % 60 === 0;

  return (
    <>
      <div
        className={`border-b border-r bg-gray-50 text-center text-[9px] text-gray-500 leading-[20px] ${isHour ? "font-medium" : ""}`}
        style={{ minHeight: "20px" }}
      >
        {isHour ? slotLabel(slot) : ""}
      </div>
      {[0, 1, 2, 3, 4].map((col) => {
        const atStart = sessions.filter((s) => s.col === col && slot === s.startSlot);
        return (
          <div key={col} className="border-b border-r relative" style={{ minHeight: "20px" }}>
            {atStart.map((s, idx) => (
              <div
                key={idx}
                className="mx-0.5 rounded bg-blue-100 p-0.5 text-[9px] leading-tight"
                style={{
                  minHeight: `${s.slotSpan * 20}px`,
                }}
              >
                <p className="font-semibold text-blue-800 truncate">{s.courseName}</p>
                <p className="text-blue-600">{s.startTime}~{s.endTime}</p>
                <p className="text-gray-500 truncate">{s.teacher} · {s.room}</p>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

export function buildTimetableSessions(
  rawSessions: {
    courseName: string;
    teacher: string | null;
    category: string;
    room: string | null;
    sessionDate: string | Date | null;
    startTime: string | null;
    endTime: string | null;
  }[],
): SessionCell[] {
  const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };

  return rawSessions
    .filter((s) => s.sessionDate && s.startTime && s.endTime)
    .map((s) => {
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
        courseName: s.courseName,
        teacher: s.teacher ?? "",
        category: s.category,
        room: s.room ?? "",
        startTime: (s.startTime ?? "").substring(0, 5),
        endTime: (s.endTime ?? "").substring(0, 5),
        startSlot,
        slotSpan,
        col,
      };
    })
    .filter((s) => s.col >= 0 && s.col < 5);
}
