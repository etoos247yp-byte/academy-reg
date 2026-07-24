"use client";

import { useState, useEffect, useMemo } from "react";
import { TimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";
import { createStudentAction, updateStudentAction, deleteStudentAction } from "@/lib/actions/admin";

interface Student { id: number; name: string; email: string; phone: string | null; schoolGrade: string | null; classCode: string | null; highSchool: string | null; }
interface Props { students: Student[]; }

const CLASS_ORDER = ["MK", "MJ", "MW", "ES", "EK", "HM", "HW", "DM", "DW", "KM", "KW"];

export function StaffStudentList({ students: initialStudents }: Props) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ReturnType<typeof buildTimetableSessions>>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>("MK");
  const [studentSearch, setStudentSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", schoolGrade: "고3", classCode: "MK", highSchool: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { setStudents(initialStudents); }, [initialStudents]);
  const selected = students.find(s => s.id === selectedId);

  const grouped = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const map = new Map<string, Student[]>();
    for (const s of students) {
      if (q) { if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) && !(s.highSchool ?? "").toLowerCase().includes(q)) continue; }
      map.set(s.classCode ?? "미배정", [...(map.get(s.classCode ?? "미배정") ?? []), s]);
    }
    return [...map.entries()].sort(([a], [b]) => { const ai = CLASS_ORDER.indexOf(a); const bi = CLASS_ORDER.indexOf(b); return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi); });
  }, [students, studentSearch]);

  useEffect(() => { if (!selectedId) { setSchedule([]); return; } setLoading(true); fetch(`/api/student-schedule?studentId=${selectedId}`).then(r => r.json()).then(d => setSchedule(buildTimetableSessions(d.sessions ?? []))).catch(() => setSchedule([])).finally(() => setLoading(false)); }, [selectedId]);

  function openAdd() { setEditing(null); setForm({ name: "", email: "", phone: "", schoolGrade: "고3", classCode: "MK", highSchool: "" }); setFormError(""); setShowForm(true); }
  function openEdit(s: Student) { setEditing(s); setForm({ name: s.name, email: s.email, phone: s.phone ?? "", schoolGrade: s.schoolGrade ?? "고3", classCode: s.classCode ?? "MK", highSchool: s.highSchool ?? "" }); setFormError(""); setShowForm(true); }
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setFormLoading(true); setFormError(""); const r = editing ? await updateStudentAction(editing.id, form) : await createStudentAction(form); setFormLoading(false); if (r.success) { setShowForm(false); } else if ("error" in r && typeof r.error === "string") { setFormError(r.error); } }
  async function handleDelete(id: number) { if (confirm("정말 삭제하시겠습니까?")) await deleteStudentAction(id); }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "#2b5797" }}>학생 목록</h1>
        <button onClick={openAdd} className="erp-btn-primary text-sm">+ 학생 추가</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }} onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="w-full max-w-md erp-card p-6" onClick={e => e.stopPropagation()}>
            <h2 className="mb-3 text-base font-bold border-b border-[#ccc] pb-2">{editing ? "학생 수정" : "학생 추가"}</h2>
            {formError && <div className="mb-3 border border-[#a80000] bg-[#fff0f0] p-2 text-xs text-[#a80000]">{formError}</div>}
            <div className="space-y-2">
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="이메일" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="연락처" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="출신학교" value={form.highSchool} onChange={e => setForm({...form, highSchool: e.target.value})} />
              <select className="w-full border border-[#adadad] px-2 py-1.5 text-sm" value={form.schoolGrade} onChange={e => setForm({...form, schoolGrade: e.target.value})}>
                <option>고1</option><option>고2</option><option>고3</option><option>재수</option>
              </select>
              <select className="w-full border border-[#adadad] px-2 py-1.5 text-sm" value={form.classCode} onChange={e => setForm({...form, classCode: e.target.value})}>
                {CLASS_ORDER.map(c => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={formLoading} className="flex-1 erp-btn-primary text-sm">{formLoading ? "처리중..." : editing ? "수정" : "추가"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="erp-card overflow-hidden h-fit">
          <div className="erp-header px-3 py-2 text-sm">반별 학생 ({students.length}명 · {grouped.length}개 반)</div>
          <div className="px-2 py-1 border-b border-[#ccc]">
            <input type="text" placeholder="이름, 이메일, 학교 검색" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
              className="w-full border border-[#adadad] px-2 py-1 text-xs outline-none focus:border-[#336699]" />
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {grouped.map(([cls, members]) => (
              <div key={cls}>
                <button onClick={() => setExpandedClass(expandedClass === cls ? null : cls)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left text-sm font-medium border-b border-[#ddd] bg-[#eee] hover:bg-[#e5e5e5]">
                  <span>{cls}반</span><span className="text-xs text-[#666]">{members.length}명</span>
                </button>
                {expandedClass === cls && members.map(s => (
                  <div key={s.id} className={`flex items-center justify-between px-3 py-1.5 text-sm border-b border-[#eee] hover:bg-[#f8f8f8] ${selectedId === s.id ? "bg-[#f0f5ff] border-l-2 border-l-[#336699]" : ""}`}>
                    <button onClick={() => setSelectedId(selectedId === s.id ? null : s.id)} className="text-left flex-1">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-[#666]">{s.highSchool ?? s.schoolGrade}</p>
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="erp-link text-xs">수정</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-[#a80000] hover:underline">삭제</button>
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
              <div className="mb-3 flex items-center justify-between">
                <div><h2 className="text-base font-bold">{selected.name} 시간표</h2><p className="text-xs text-[#666]">{selected.classCode}반 · {selected.highSchool ?? selected.schoolGrade}</p></div>
                <a href={`/api/export/schedule?studentId=${selected.id}&studentName=${encodeURIComponent(selected.name)}`} className="erp-btn text-xs">시간표 다운로드</a>
              </div>
              {loading ? <div className="erp-card p-8 text-center text-sm text-[#999]">로딩중...</div>
              : schedule.length === 0 ? <div className="erp-card p-8 text-center"><p className="text-sm text-[#999]">등록된 수업이 없습니다</p></div>
              : <TimetableGrid sessions={schedule} />}
            </div>
          ) : <div className="erp-card p-8 text-center"><p className="text-sm text-[#999]">반을 펼치고 학생을 선택하면 시간표가 표시됩니다</p></div>}
        </div>
      </div>
    </div>
  );
}
