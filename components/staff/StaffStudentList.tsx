"use client";

import { useState, useEffect } from "react";
import { TimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  schoolGrade: string | null;
}

interface Props {
  students: Student[];
}

export function StaffStudentList({ students }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ReturnType<typeof buildTimetableSessions>>([]);
  const [loading, setLoading] = useState(false);

  const selected = students.find((s) => s.id === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setSchedule([]);
      return;
    }
    setLoading(true);
    fetch(`/api/student-schedule?studentId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => setSchedule(buildTimetableSessions(data.sessions ?? [])))
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">학생 목록</h1>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b bg-gray-50 px-4 py-3 text-sm font-medium">학생 ({students.length}명)</div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${selectedId === s.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
                <p className="text-xs text-gray-400">{s.schoolGrade} · {s.phone}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selected.name} 시간표</h2>
                  <p className="text-xs text-gray-500">{selected.email} · {selected.schoolGrade}</p>
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
              <p className="text-sm text-gray-400">왼쪽에서 학생을 선택하면 시간표가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
