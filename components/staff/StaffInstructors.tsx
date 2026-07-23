"use client";

import { useState, useEffect, useMemo } from "react";
import { createInstructorAction, updateInstructorAction, deleteInstructorAction } from "@/lib/actions/admin";

interface Instructor { id: number; name: string; subject: string | null; oneUpCapacity: number; phone: string | null; }
interface Offering { id: number; courseName: string; code: string; category: string; teacher: string | null; capacity: number; status: string; subject: string | null; confirmedCount: number; waitlistCount: number; }

interface Props { instructors: Instructor[]; offerings: Offering[]; }

export function StaffInstructors({ instructors: initialInstructors, offerings }: Props) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", phone: "", oneUpCapacity: 5 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => { setInstructors(initialInstructors); }, [initialInstructors]);

  const selected = instructors.find((i) => i.id === selectedId);

  const workload = useMemo(() => {
    return selected ? offerings.filter((o) => o.teacher === selected.name) : [];
  }, [selected, offerings]);

  function openAdd() { setEditing(null); setForm({ name: "", subject: "", phone: "", oneUpCapacity: 5 }); setShowForm(true); }
  function openEdit(i: Instructor) { setEditing(i); setForm({ name: i.name, subject: i.subject ?? "", phone: i.phone ?? "", oneUpCapacity: i.oneUpCapacity }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); const r = editing ? await updateInstructorAction(editing.id, form) : await createInstructorAction(form); if (r.success) setShowForm(false); }
  async function handleDelete(id: number) { if (confirm("정말 삭제하시겠습니까?")) await deleteInstructorAction(id); }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">강사 관리</h1>
        <button onClick={openAdd} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">강사 추가</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">{editing ? "강사 수정" : "강사 추가"}</h2>
            <div className="space-y-3">
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="과목 (예: 국어, 수학)" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="연락처" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input className="w-full rounded border px-3 py-2 text-sm" type="number" placeholder="원업 정원" value={form.oneUpCapacity} onChange={e => setForm({...form, oneUpCapacity: Number(e.target.value)})} required />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{editing ? "수정" : "추가"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b bg-gray-50 px-4 py-3 text-sm font-medium">강사 목록 ({instructors.length}명)</div>
          <div className="max-h-[600px] overflow-y-auto divide-y">
            {instructors.map((i) => (
              <div key={i.id} className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 ${selectedId === i.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}>
                <button onClick={() => setSelectedId(selectedId === i.id ? null : i.id)} className="text-left flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-gray-500">{i.subject} · 원업 {i.oneUpCapacity}명</p>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(i)} className="text-xs text-blue-600 hover:underline">수정</button>
                  <button onClick={() => handleDelete(i.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold">{selected.name} 선생님</h2>
                <p className="text-sm text-gray-500">{selected.subject} · 원업 정원 {selected.oneUpCapacity}명 · {selected.phone || "연락처 없음"}</p>
              </div>
              <h3 className="mb-2 text-sm font-medium text-gray-600">담당 수업 ({workload.length}개)</h3>
              {workload.length === 0 ? (
                <div className="rounded-lg border bg-white p-6 text-center"><p className="text-sm text-gray-400">담당 중인 수업이 없습니다</p></div>
              ) : (
                <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50"><tr><th className="px-4 py-2 font-medium">코드</th><th className="px-4 py-2 font-medium">수업명</th><th className="px-4 py-2 font-medium">유형</th><th className="px-4 py-2 font-medium">수강</th><th className="px-4 py-2 font-medium">정원</th><th className="px-4 py-2 font-medium">상태</th></tr></thead>
                    <tbody>
                      {workload.map((o) => (
                        <tr key={o.id} className="border-b last:border-0">
                          <td className="px-4 py-2 text-gray-500">{o.code}</td>
                          <td className="px-4 py-2 font-medium">{o.courseName}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{o.category === "NORMAL_SEASON" ? "정규" : o.category === "ONE_UP" ? "원업" : o.category === "SPECIAL" ? "특강" : o.category}</td>
                          <td className="px-4 py-2">{o.confirmedCount}/{o.capacity}</td>
                          <td className="px-4 py-2 text-gray-500">{o.capacity}</td>
                          <td className="px-4 py-2">{o.status === "PUBLISHED" ? "공개" : "임시"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm"><p className="text-sm text-gray-400">강사를 선택하면 담당 수업을 확인할 수 있습니다</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
