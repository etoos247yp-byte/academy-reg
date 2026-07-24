"use client";

import { useState, useEffect } from "react";
import { cancelRegistrationAction, enrollStudentAction } from "@/lib/actions/admin";

interface Registration { id: number; userId: number; studentName: string; studentEmail: string; offeringId: number; status: string; enrolledAt: string | Date; courseName: string; category: string; waitlistSequence: number | null; }
interface Props { registrations: Registration[]; }

export function StaffRegistrations({ registrations: initialRegistrations }: Props) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ email: "", offeringId: "" });
  const [enrollError, setEnrollError] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);

  useEffect(() => { setRegistrations(initialRegistrations); }, [initialRegistrations]);

  async function handleCancel(id: number) { if (!confirm("수강을 취소하시겠습니까?")) return; await cancelRegistrationAction(id); }
  async function handleEnroll(e: React.FormEvent) { e.preventDefault(); setEnrollLoading(true); setEnrollError(""); const r = await enrollStudentAction(enrollForm.email, Number(enrollForm.offeringId)); setEnrollLoading(false); if (r.success) { setShowEnroll(false); setEnrollForm({ email: "", offeringId: "" }); } else setEnrollError(r.error ?? "오류가 발생했습니다"); }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "#2b5797" }}>수강 현황</h1>
        <button onClick={() => setShowEnroll(true)} className="erp-btn-primary text-sm">+ 수강 등록</button>
      </div>

      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }} onClick={() => setShowEnroll(false)}>
          <form onSubmit={handleEnroll} className="w-full max-w-sm erp-card p-6" onClick={e => e.stopPropagation()}>
            <h2 className="mb-3 text-base font-bold border-b border-[#ccc] pb-2">수강 등록</h2>
            {enrollError && <div className="mb-3 border border-[#a80000] bg-[#fff0f0] p-2 text-xs text-[#a80000]">{enrollError}</div>}
            <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm mb-2" placeholder="학생 이메일" value={enrollForm.email} onChange={e => setEnrollForm({...enrollForm, email: e.target.value})} required />
            <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm mb-3" placeholder="수업 ID" type="number" value={enrollForm.offeringId} onChange={e => setEnrollForm({...enrollForm, offeringId: e.target.value})} required />
            <div className="flex gap-2">
              <button type="submit" disabled={enrollLoading} className="flex-1 erp-btn-primary text-sm">{enrollLoading ? "처리중..." : "등록"}</button>
              <button type="button" onClick={() => setShowEnroll(false)} className="erp-btn text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="erp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead><tr className="erp-header"><th className="px-3 py-2">학생</th><th className="px-3 py-2">이메일</th><th className="px-3 py-2">수업</th><th className="px-3 py-2">상태</th><th className="px-3 py-2">대기순번</th><th className="px-3 py-2">신청일</th><th className="px-3 py-2"></th></tr></thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r.id} className="border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
                <td className="px-3 py-2 font-medium">{r.studentName}</td>
                <td className="px-3 py-2 text-[#666]">{r.studentEmail}</td>
                <td className="px-3 py-2">{r.courseName}</td>
                <td className="px-3 py-2"><span className={r.status === "CONFIRMED" ? "erp-badge erp-badge-ok" : r.status === "WAITLISTED" ? "erp-badge erp-badge-warn" : "erp-badge"}>{r.status === "CONFIRMED" ? "확정" : r.status === "WAITLISTED" ? "대기" : r.status}</span></td>
                <td className="px-3 py-2 text-[#666]">{r.waitlistSequence ?? "-"}</td>
                <td className="px-3 py-2 text-[#666]">{new Date(r.enrolledAt).toLocaleDateString("ko-KR")}</td>
                <td className="px-3 py-2"><button onClick={() => handleCancel(r.id)} className="text-xs text-[#a80000] hover:underline">취소</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#999]">수강신청 내역이 없습니다</p>}
      </div>
    </div>
  );
}
