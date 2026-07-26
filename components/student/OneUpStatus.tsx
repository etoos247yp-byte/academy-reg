"use client";

import { fd, ft, type OneUpRow } from "@/components/student/types";

interface Props {
  rows: OneUpRow[];
}

export function OneUpStatus({ rows }: Props) {
  return (
    <div className="erp-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead><tr className="erp-header"><th className="px-3 py-2">수업명</th><th className="px-3 py-2">담당 선생님</th><th className="px-3 py-2">상태</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.registrationId} className="border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
              <td className="px-3 py-2 font-medium">{r.courseName}</td>
              <td className="px-3 py-2 text-[#666]">{r.teacher ?? "-"}</td>
              <td className="px-3 py-2">
                {r.assignedDate ? (
                  <span className="erp-badge erp-badge-ok">{fd(r.assignedDate)} {ft(r.startTime)}~{ft(r.endTime)}</span>
                ) : (
                  <span className="erp-badge erp-badge-warn">배정 대기</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#999]">원업 수업을 신청하면 담당 선생님이 시간을 배정합니다.</p>}
    </div>
  );
}
