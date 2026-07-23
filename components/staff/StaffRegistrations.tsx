"use client";

import { useState, useEffect } from "react";
import { cancelRegistrationAction, enrollStudentAction } from "@/lib/actions/admin";

interface Registration {
  id: number; userId: number; studentName: string; studentEmail: string;
  offeringId: number; status: string; enrolledAt: string | Date; courseName: string;
  category: string; waitlistSequence: number | null;
}

interface Props { registrations: Registration[]; }

export function StaffRegistrations({ registrations: initialRegistrations }: Props) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ email: "", offeringId: "" });

  useEffect(() => { setRegistrations(initialRegistrations); }, [initialRegistrations]);

  async function handleCancel(id: number) {
    if (!confirm("수강을 취소하시겠습니까?")) return;
    await cancelRegistrationAction(id);
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    const r = await enrollStudentAction(enrollForm.email, Number(enrollForm.offeringId));
    if (r.success) { setShowEnroll(false); setEnrollForm({ email: "", offeringId: "" }); }
    else alert(r.error);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">수강 현황</h1>
        <button onClick={() => setShowEnroll(true)} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">수강 등록</button>
      </div>

      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowEnroll(false)}>
          <form onSubmit={handleEnroll} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">수강 등록</h2>
            <input className="w-full rounded border px-3 py-2 text-sm mb-3" placeholder="학생 이메일" value={enrollForm.email} onChange={e => setEnrollForm({...enrollForm, email: e.target.value})} required />
            <input className="w-full rounded border px-3 py-2 text-sm mb-4" placeholder="수업 ID" type="number" value={enrollForm.offeringId} onChange={e => setEnrollForm({...enrollForm, offeringId: e.target.value})} required />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">등록</button>
              <button type="button" onClick={() => setShowEnroll(false)} className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 font-medium">학생</th><th className="px-4 py-3 font-medium">이메일</th><th className="px-4 py-3 font-medium">수업</th><th className="px-4 py-3 font-medium">상태</th><th className="px-4 py-3 font-medium">대기순번</th><th className="px-4 py-3 font-medium">신청일</th><th className="px-4 py-3 font-medium"></th></tr></thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.studentName}</td>
                <td className="px-4 py-3 text-gray-500">{r.studentEmail}</td>
                <td className="px-4 py-3">{r.courseName}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${r.status === "CONFIRMED" ? "bg-green-100 text-green-700" : r.status === "WAITLISTED" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>{r.status === "CONFIRMED" ? "확정" : r.status === "WAITLISTED" ? "대기" : r.status}</span></td>
                <td className="px-4 py-3 text-gray-500">{r.waitlistSequence ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(r.enrolledAt).toLocaleDateString("ko-KR")}</td>
                <td className="px-4 py-3"><button onClick={() => handleCancel(r.id)} className="text-xs text-red-500 hover:underline">취소</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">수강신청 내역이 없습니다</p>}
      </div>
    </div>
  );
}
