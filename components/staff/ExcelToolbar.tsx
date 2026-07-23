"use client";

import { useState } from "react";
import { importOfferingsAction, importStudentsAction, importRegistrationsAction } from "@/lib/actions/excel";

export function ExcelToolbar() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImportOfferings(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    const fd = new FormData();
    fd.set("file", file);
    try {
      const res = await importOfferingsAction(fd);
      if (res.error) { setMessage(res.error); }
      else if (res.data) {
        setMessage(`${res.data.imported}건 가져오기 완료${res.data.errors.length ? ` (오류 ${res.data.errors.length}건)` : ""}`);
      }
    } catch {
      setMessage("가져오기 실패");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleImportStudents(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    const fd = new FormData();
    fd.set("file", file);
    try {
      const res = await importStudentsAction(fd);
      if (res.error) { setMessage(res.error); }
      else if (res.data) {
        setMessage(`${res.data.imported}명 가져오기 완료${res.data.errors.length ? ` (오류 ${res.data.errors.length}건)` : ""}`);
      }
    } catch {
      setMessage("가져오기 실패");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleImportRegistrations(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    const fd = new FormData();
    fd.set("file", file);
    try {
      const res = await importRegistrationsAction(fd);
      if (res.error) { setMessage(res.error); }
      else if (res.data) {
        setMessage(`${res.data.imported}건 가져오기 완료${res.data.errors?.length ? ` (오류 ${res.data.errors.length}건)` : ""}`);
      }
    } catch {
      setMessage("가져오기 실패");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">엑셀 내보내기</span>
        <a
          href="/api/export/offerings"
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          수업 목록 다운로드
        </a>
        <a
          href="/api/export/students"
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          학생 목록 다운로드
        </a>
        <a
          href="/api/export/registrations"
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          수강신청 내역 다운로드
        </a>
        <span className="ml-4 text-sm font-medium text-gray-700">엑셀 가져오기</span>
        <label className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          수업 가져오기
          <input type="file" accept=".xlsx,.xls" onChange={handleImportOfferings} className="hidden" disabled={loading} />
        </label>
        <label className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          학생 가져오기
          <input type="file" accept=".xlsx,.xls" onChange={handleImportStudents} className="hidden" disabled={loading} />
        </label>
        <label className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          수강신청 가져오기
          <input type="file" accept=".xlsx,.xls" onChange={handleImportRegistrations} className="hidden" disabled={loading} />
        </label>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.includes("실패") || message.includes("오류") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
