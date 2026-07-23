"use client";

import { useState, useEffect, useMemo } from "react";
import { TimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  schoolGrade: string | null;
  classCode: string | null;
  highSchool: string | null;
}

interface Props {
  students: Student[];
}

export function StaffStudentList({ students }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ReturnType<typeof buildTimetableSessions>>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const selected = students.find((s) => s.id === selectedId);

  const grouped = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const key = s.classCode ?? "미배정";
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [students]);

  useEffect(() => {
    if (!selectedId) { setSchedule([]); return; }
    setLoading(true);
    fetch(`/api/student-schedule?studentId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => setSchedule(buildTimetableSessions(data.sessions ?? [])))
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const CLASS_ORDER = ["MK", "MJ", "MW", "ES", "EK", "HM", "HW", "DM", "DW", "KM", "KW"];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">학생 목록</h1>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b bg-gray-50 px-4 py-3 text-sm font-medium">
            반별 학생 ({students.length}명 · {grouped.length}개 반)
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {grouped
              .sort(([a], [b]) => {
                const ai = CLASS_ORDER.indexOf(a);
                const bi = CLASS_ORDER.indexOf(b);
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              })
              .map(([cls, members]) => (
                <div key={cls}>
                  <button
                    onClick={() => setExpandedClass(expandedClass === cls ? null : cls)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium bg-gray-50 border-b hover:bg-gray-100"
                  >
                    <span>{cls}반</span>
                    <span className="text-xs text-gray-400">{members.length}명</span>
                  </button>
                  {expandedClass === cls && members.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                      className={`w-full px-6 py-2 text-left text-sm hover:bg-gray-50 border-b ${selectedId === s.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.highSchool ?? s.schoolGrade}</p>
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>

        <div>
          {selected ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selected.name} 시간표</h2>
                  <p className="text-xs text-gray-500">{selected.classCode}반 · {selected.highSchool ?? selected.schoolGrade}</p>
                </div>
                <a
                  href={`/api/export/schedule?studentId=${selected.id}&studentName=${encodeURIComponent(selected.name)}`}
                  className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  시간표 다운로드
                </a>
              </div>
              {loading ? (
                <div className="rounded-lg border bg-white p-8 text-center shadow-sm text-sm text-gray-400">로딩중...</div>
              ) : schedule.length === 0 ? (
                <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-gray-400">등록된 수업이 없습니다</p>
                </div>
              ) : (
                <TimetableGrid sessions={schedule} />
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-400">반을 펼치고 학생을 선택하면 시간표가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
