"use client";

import { selectUpcomingSessions } from "@/modules/registration/domain/upcoming";
import { fd, type ScheduleRow } from "@/components/student/types";

interface Props {
  scheduleData: ScheduleRow[];
}

export function SpecialSchedule({ scheduleData }: Props) {
  const rows = scheduleData.filter(s => s.category === "SPECIAL" || s.category === "ESSAY_SPECIAL");
  const upcoming = selectUpcomingSessions(rows, new Date(), 50);

  return (
    <div className="erp-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead><tr className="erp-header"><th className="px-3 py-2">날짜</th><th className="px-3 py-2">시간</th><th className="px-3 py-2">수업명</th><th className="px-3 py-2">강의실</th></tr></thead>
        <tbody>
          {upcoming.map((s, i) => (
            <tr key={i} className="border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
              <td className="px-3 py-2">{fd(s.date)}</td>
              <td className="px-3 py-2">{s.startTime} ~ {s.endTime}</td>
              <td className="px-3 py-2 font-medium">{s.courseName}</td>
              <td className="px-3 py-2 text-[#666]">{s.room ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {upcoming.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#999]">신청한 특강이 없습니다. 특강 카탈로그에서 신청해주세요.</p>}
    </div>
  );
}
