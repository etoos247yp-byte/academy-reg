"use client";

import { useState } from "react";
import { importOfferingsAction, importStudentsAction, importRegistrationsAction } from "@/lib/actions/excel";

export function ExcelToolbar() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImportOfferings(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setMessage(""); const fd = new FormData(); fd.set("file", file);
    try { const res = await importOfferingsAction(fd); if (res.error) setMessage(res.error); else if (res.data) setMessage(`${res.data.imported}건 가져오기 완료${res.data.errors.length ? ` (오류 ${res.data.errors.length}건)` : ""}`); }
    catch { setMessage("가져오기 실패"); } finally { setLoading(false); e.target.value = ""; }
  }
  async function handleImportStudents(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setMessage(""); const fd = new FormData(); fd.set("file", file);
    try { const res = await importStudentsAction(fd); if (res.error) setMessage(res.error); else if (res.data) setMessage(`${res.data.imported}명 가져오기 완료${res.data.errors.length ? ` (오류 ${res.data.errors.length}건)` : ""}`); }
    catch { setMessage("가져오기 실패"); } finally { setLoading(false); e.target.value = ""; }
  }
  async function handleImportRegistrations(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setMessage(""); const fd = new FormData(); fd.set("file", file);
    try { const res = await importRegistrationsAction(fd); if (res.error) setMessage(res.error); else if (res.data) setMessage(`${res.data.imported}건 가져오기 완료${res.data.errors?.length ? ` (오류 ${res.data.errors.length}건)` : ""}`); }
    catch { setMessage("가져오기 실패"); } finally { setLoading(false); e.target.value = ""; }
  }

  const btn = "border border-[#adadad] bg-[#e1e1e1] px-3 py-1 text-xs hover:bg-[#e5f1fb] hover:border-[#336699] cursor-pointer";
  const exportBtn = "border border-[#107c10] bg-white text-[#107c10] px-3 py-1 text-xs hover:bg-[#f0fff0] cursor-pointer";

  return (
    <div className="erp-card p-3 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[#333]">엑셀 내보내기</span>
        <a href="/api/export/offerings" className={exportBtn}>수업 목록</a>
        <a href="/api/export/students" className={exportBtn}>학생 목록</a>
        <a href="/api/export/registrations" className={exportBtn}>수강신청 내역</a>
        <span className="ml-2 text-sm font-medium text-[#333]">엑셀 가져오기</span>
        <label className={btn}>수업 가져오기<input type="file" accept=".xlsx,.xls" onChange={handleImportOfferings} className="hidden" disabled={loading} /></label>
        <label className={btn}>학생 가져오기<input type="file" accept=".xlsx,.xls" onChange={handleImportStudents} className="hidden" disabled={loading} /></label>
        <label className={btn}>수강신청 가져오기<input type="file" accept=".xlsx,.xls" onChange={handleImportRegistrations} className="hidden" disabled={loading} /></label>
      </div>
      {message && <p className={`mt-2 text-xs ${message.includes("실패") || message.includes("오류") ? "text-[#a80000]" : "text-[#107c10]"}`}>{message}</p>}
    </div>
  );
}
