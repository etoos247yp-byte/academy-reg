"use client";

import { CAT_LABELS, type Registration, type HistoryBatch } from "@/components/student/types";

interface Props {
  registrations: Registration[];
  history: HistoryBatch[];
}

function itemStatusLabel(status: string): string {
  if (status === "CONFIRMED") return "확정";
  if (status === "WAITLISTED") return "대기";
  if (status === "CANCELLED") return "취소";
  return status;
}

export function MyRegistrations({ registrations, history }: Props) {
  return (
    <div className="space-y-3">
      <div className="erp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead><tr className="erp-header"><th className="px-3 py-2">수업명</th><th className="px-3 py-2">선생님</th><th className="px-3 py-2">유형</th><th className="px-3 py-2">상태</th><th className="px-3 py-2">대기순번</th></tr></thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r.id} className="border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
                <td className="px-3 py-2 font-medium">{r.courseName}</td>
                <td className="px-3 py-2 text-[#666]">{r.teacher ?? "-"}</td>
                <td className="px-3 py-2"><span className="erp-badge text-xs">{CAT_LABELS[r.category] ?? r.category}</span></td>
                <td className="px-3 py-2"><span className={r.status === "CONFIRMED" ? "erp-badge erp-badge-ok" : "erp-badge erp-badge-warn"}>{r.status === "CONFIRMED" ? "확정" : "대기"}</span></td>
                <td className="px-3 py-2 text-[#666]">{r.waitlistSequence ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#999]">수강 내역이 없습니다. 정규수업, 특강, 원업 탭에서 수업을 신청해주세요.</p>}
      </div>

      <div className="erp-card p-3">
        <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>신청 내역</h3>
        {history.length === 0 ? (
          <p className="text-sm text-[#999] py-4 text-center">신청 내역이 없습니다. 수업을 신청하면 신청 기록과 비용 안내가 이곳에 남습니다.</p>
        ) : (
          <ul className="space-y-3">
            {history.map(batch => (
              <li key={batch.batchId} className="border-b border-[#eee] pb-3 last:border-b-0 last:pb-0">
                <p className="text-xs text-[#666]">{new Date(batch.createdAt).toLocaleDateString("ko-KR")}</p>
                <ul className="mt-1 space-y-0.5">
                  {batch.items.map((item, i) => (
                    <li key={i} className="text-sm">{item.courseName} — {itemStatusLabel(item.status)}</li>
                  ))}
                </ul>
                {batch.disclosureText && (
                  <div className="mt-2 border border-[#336699] p-2 text-xs text-[#336699]" style={{ background: "#f0f5ff" }}>
                    {batch.disclosureText}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
