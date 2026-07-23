"use client";

import { useState, useRef } from "react";
import { importCoursesAction } from "@/lib/actions/excel";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

export function ExcelToolbar() {
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImportError("");
    setImportSuccess("");
    const formData = new FormData(e.currentTarget);
    const result = await importCoursesAction(formData);
    if (result.error) {
      setImportError(result.error);
    } else {
      setImportSuccess(`${result.imported}개의 수업을 가져왔습니다`);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Export */}
      <a
        href="/api/export/courses"
        className="flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
        download
      >
        <Download className="h-4 w-4" />
        수업 목록 내보내기
      </a>
      <a
        href="/api/export/enrollments"
        className="flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
        download
      >
        <Download className="h-4 w-4" />
        수강 내역 내보내기
      </a>

      {/* Import */}
      <form onSubmit={handleImport} className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".xlsx,.xls"
          className="text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          가져오기
        </button>
      </form>

      {importError && <span className="text-sm text-red-600">{importError}</span>}
      {importSuccess && <span className="text-sm text-green-600">{importSuccess}</span>}
    </div>
  );
}
