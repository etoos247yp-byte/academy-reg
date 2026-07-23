"use client";

import { useState, useMemo } from "react";

interface Offering {
  id: number;
  courseName: string;
  code: string;
  category: string;
  teacher: string | null;
  capacity: number;
  status: string;
  subject: string | null;
  confirmedCount: number;
  waitlistCount: number;
}

interface Instructor {
  id: number;
  name: string;
  subject: string | null;
  oneUpCapacity: number;
}

interface Props {
  periodId: number;
  periodName: string;
  offerings: Offering[];
  instructors: Instructor[];
}

const CAT_FILTERS = [
  { key: "all", label: "전체" },
  { key: "NORMAL_SEASON", label: "정규" },
  { key: "ONE_UP", label: "원업" },
  { key: "SPECIAL", label: "특강" },
  { key: "ESSAY_SPECIAL", label: "논술" },
];

const CAT_LABELS: Record<string, string> = {
  NORMAL_SEASON: "정규",
  ONE_UP: "원업",
  SPECIAL: "특강",
  ESSAY_SPECIAL: "논술",
  CUSTOM: "사용자정의",
};

export function StaffOfferings({ periodName, offerings }: Props) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return filter === "all" ? offerings : offerings.filter((o) => o.category === filter);
  }, [offerings, filter]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">수업 관리</h1>
      <p className="mb-4 text-sm text-gray-500">{periodName}</p>

      <div className="mb-4 flex gap-2">
        {CAT_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium">코드</th>
              <th className="px-4 py-3 font-medium">수업명</th>
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">선생님</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">수강</th>
              <th className="px-4 py-3 font-medium text-right">대기</th>
              <th className="px-4 py-3 font-medium text-right">정원</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{o.code}</td>
                <td className="px-4 py-3 font-medium">{o.courseName}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                    {CAT_LABELS[o.category] ?? o.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{o.teacher ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      o.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : o.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {o.status === "PUBLISHED" ? "공개" : o.status === "DRAFT" ? "임시" : "보관"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{o.confirmedCount}</td>
                <td className="px-4 py-3 text-right text-yellow-600">{o.waitlistCount}</td>
                <td className="px-4 py-3 text-right text-gray-500">{o.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">등록된 수업이 없습니다</p>
        )}
      </div>
    </div>
  );
}
