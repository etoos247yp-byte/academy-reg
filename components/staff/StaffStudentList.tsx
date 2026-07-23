"use client";

import { useState, useEffect, useMemo } from "react";
import { TimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";
import { createStudentAction, updateStudentAction, deleteStudentAction, enrollStudentAction } from "@/lib/actions/admin";

interface Student {
  id: number; name: string; email: string; phone: string | null;
  schoolGrade: string | null; classCode: string | null; highSchool: string | null;
}

interface Props { students: Student[]; }

const CLASS_ORDER = ["MK", "MJ", "MW", "ES", "EK", "HM", "HW", "DM", "DW", "KM", "KW"];

export function StaffStudentList({ students: initialStudents }: Props) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ReturnType<typeof buildTimetableSessions>>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>("MK");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", schoolGrade: "고3", classCode: "MK", highSchool: "" });

  useEffect(() => { setStudents(initialStudents); }, [initialStudents]);

  const selected = students.find((s) => s.id === selectedId);

  const grouped = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students) map.set(s.classCode ?? "미배정", [...(map.get(s.classCode ?? "미배정") ?? []), s]);
    return [...map.entries()].sort(([a], [b]) => { const ai = CLASS_ORDER.indexOf(a); const bi = CLASS_ORDER.indexOf(b); return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi); });
  }, [students]);

  useEffect(() => {
    if (!selectedId) { setSchedule([]); return; }
    setLoading(true);
    fetch(`/api/student-schedule?studentId=${selectedId}`).then(r => r.json()).then(d => setSchedule(buildTimetableSessions(d.sessions ?? []))).catch(() => setSchedule([])).finally(() => setLoading(false));
  }, [selectedId]);

  function openAdd() { setEditing(null); setForm({ name: "", email: "", phone: "", schoolGrade: "고3", classCode: "MK", highSchool: "" }); setShowForm(true); }
  function openEdit(s: Student) { setEditing(s); setForm({ name: s.name, email: s.email, phone: s.phone ?? "", schoolGrade: s.schoolGrade ?? "고3", classCode: s.classCode ?? "MK", highSchool: s.highSchool ?? "" }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); const r = editing ? await updateStudentAction(editing.id, form) : await createStudentAction(form); if (r.success) setShowForm(false); }

  async function handleDelete(id: number) { if (confirm("정말 삭제하시겠습니까?")) await deleteStudentAction(id); }

  const CAT_OPTIONS = ["NORMAL_SEASON","ONE_UP","SPECIAL"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">학생 목록</h1>
        <button onClick={openAdd} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">학생 추가</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">{editing ? "학생 수정" : "학생 추가"}</h2>
            <div className="space-y-3">
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="이메일" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="연락처" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="출신학교" value={form.highSchool} onChange={e => setForm({...form, highSchool: e.target.value})} />
              <select className="w-full rounded border px-3 py-2 text-sm" value={form.schoolGrade} onChange={e => setForm({...form, schoolGrade: e.target.value})}>
                <option>고1</option><option>고2</option><option>고3</option><option>재수</option>
              </select>
              <select className="w-full rounded border px-3 py-2 text-sm" value={form.classCode} onChange={e => setForm({...form, classCode: e.target.value})}>
                {CLASS_ORDER.map(c => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{editing ? "수정" : "추가"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b bg-gray-50 px-4 py-3 text-sm font-medium">반별 학생 ({students.length}명 · {grouped.length}개 반)</div>
          <div className="max-h-[600px] overflow-y-auto">
            {grouped.map(([cls, members]) => (
              <div key={cls}>
                <button onClick={() => setExpandedClass(expandedClass === cls ? null : cls)} className="w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium bg-gray-50 border-b hover:bg-gray-100">
                  <span>{cls}반</span><span className="text-xs text-gray-400">{members.length}명</span>
                </button>
                {expandedClass === cls && members.map((s) => (
                  <div key={s.id} className={`flex items-center justify-between px-4 py-2 text-sm border-b hover:bg-gray-50 ${selectedId === s.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                    <button onClick={() => setSelectedId(selectedId === s.id ? null : s.id)} className="text-left flex-1">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.highSchool ?? s.schoolGrade}</p>
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="text-xs text-blue-600 hover:underline">수정</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="text-lg font-bold">{selected.name} 시간표</h2><p className="text-xs text-gray-500">{selected.classCode}반 · {selected.highSchool ?? selected.schoolGrade}</p></div>
                <a href={`/api/export/schedule?studentId=${selected.id}&studentName=${encodeURIComponent(selected.name)}`} className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">시간표 다운로드</a>
              </div>
              {loading ? <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">로딩중...</div>
              : schedule.length === 0 ? <div className="rounded-lg border bg-white p-8 text-center"><p className="text-sm text-gray-400">등록된 수업이 없습니다</p></div>
              : <TimetableGrid sessions={schedule} />}
            </div>
          ) : <div className="rounded-lg border bg-white p-8 text-center shadow-sm"><p className="text-sm text-gray-400">반을 펼치고 학생을 선택하면 시간표가 표시됩니다</p></div>}
        </div>
      </div>
    </div>
  );
}
