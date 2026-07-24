"use client";

import { useState, useEffect, useMemo } from "react";
import { createInstructorAction, updateInstructorAction, deleteInstructorAction, createOfferingAction } from "@/lib/actions/admin";

interface Instructor { id: number; name: string; subject: string | null; oneUpCapacity: number; phone: string | null; }
interface Offering { id: number; courseName: string; code: string; category: string; teacher: string | null; capacity: number; status: string; subject: string | null; confirmedCount: number; waitlistCount: number; }
interface Props { instructors: Instructor[]; offerings: Offering[]; }

export function StaffInstructors({ instructors: initialInstructors, offerings }: Props) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", phone: "", oneUpCapacity: 5 });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classForm, setClassForm] = useState({ code: "", courseName: "", category: "NORMAL_SEASON", capacity: 20, room: "" });

  useEffect(() => { setInstructors(initialInstructors); }, [initialInstructors]);
  const selected = instructors.find(i => i.id === selectedId);
  const workload = useMemo(() => selected ? offerings.filter(o => o.teacher === selected.name) : [], [selected, offerings]);

  function openAdd() { setEditing(null); setForm({ name: "", subject: "", phone: "", oneUpCapacity: 5 }); setFormError(""); setShowForm(true); }
  function openEdit(i: Instructor) { setEditing(i); setForm({ name: i.name, subject: i.subject ?? "", phone: i.phone ?? "", oneUpCapacity: i.oneUpCapacity }); setFormError(""); setShowForm(true); }
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setFormLoading(true); setFormError(""); const r = editing ? await updateInstructorAction(editing.id, form) : await createInstructorAction(form); setFormLoading(false); if (r.success) { setShowForm(false); } else if ("error" in r && typeof r.error === "string") { setFormError(r.error); } }
  async function handleDelete(id: number) { if (confirm("정말 삭제하시겠습니까?")) await deleteInstructorAction(id); }
  function openAddClass() { setClassForm({ code: "", courseName: "", category: "NORMAL_SEASON", capacity: 20, room: "" }); setShowClassForm(true); }
  async function handleCreateClass(e: React.FormEvent) { e.preventDefault(); const r = await createOfferingAction({ ...classForm, teacher: selected!.name }); if (r.success) setShowClassForm(false); }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "#2b5797" }}>강사 관리</h1>
        <button onClick={openAdd} className="erp-btn-primary text-sm">+ 강사 추가</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }} onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="w-full max-w-sm erp-card p-6" onClick={e => e.stopPropagation()}>
            <h2 className="mb-3 text-base font-bold border-b border-[#ccc] pb-2">{editing ? "강사 수정" : "강사 추가"}</h2>
            {formError && <div className="mb-3 border border-[#a80000] bg-[#fff0f0] p-2 text-xs text-[#a80000]">{formError}</div>}
            <div className="space-y-2">
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="과목" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="연락처" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" type="number" placeholder="원업 정원" value={form.oneUpCapacity} onChange={e => setForm({...form, oneUpCapacity: Number(e.target.value)})} required />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={formLoading} className="flex-1 erp-btn-primary text-sm">{formLoading ? "처리중..." : editing ? "수정" : "추가"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      {showClassForm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }} onClick={() => setShowClassForm(false)}>
          <form onSubmit={handleCreateClass} className="w-full max-w-sm erp-card p-6" onClick={e => e.stopPropagation()}>
            <h2 className="mb-3 text-base font-bold border-b border-[#ccc] pb-2">{selected.name} 선생님 수업 추가</h2>
            <div className="space-y-2">
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="코드" value={classForm.code} onChange={e => setClassForm({...classForm, code: e.target.value})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="수업명" value={classForm.courseName} onChange={e => setClassForm({...classForm, courseName: e.target.value})} required />
              <select className="w-full border border-[#adadad] px-2 py-1.5 text-sm" value={classForm.category} onChange={e => setClassForm({...classForm, category: e.target.value})}>
                <option value="NORMAL_SEASON">정규</option><option value="ONE_UP">원업</option><option value="SPECIAL">특강</option><option value="ESSAY_SPECIAL">논술</option>
              </select>
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" type="number" placeholder="정원" value={classForm.capacity} onChange={e => setClassForm({...classForm, capacity: Number(e.target.value)})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="강의실" value={classForm.room} onChange={e => setClassForm({...classForm, room: e.target.value})} />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" className="flex-1 erp-btn-primary text-sm">수업 추가</button>
              <button type="button" onClick={() => setShowClassForm(false)} className="erp-btn text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[350px_1fr]">
        <div className="erp-card overflow-hidden h-fit">
          <div className="erp-header px-3 py-2 text-sm">강사 목록 ({instructors.length}명)</div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-[#eee]">
            {instructors.map(i => (
              <div key={i.id} className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-[#f8f8f8] ${selectedId === i.id ? "bg-[#f0f5ff] border-l-2 border-l-[#336699]" : ""}`}>
                <button onClick={() => setSelectedId(selectedId === i.id ? null : i.id)} className="text-left flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-[#666]">{i.subject} · 원업 {i.oneUpCapacity}명</p>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(i)} className="erp-link text-xs">수정</button>
                  <button onClick={() => handleDelete(i.id)} className="text-xs text-[#a80000] hover:underline">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <div>
              <div className="mb-3"><h2 className="text-base font-bold">{selected.name} 선생님</h2><p className="text-sm text-[#666]">{selected.subject} · 원업 정원 {selected.oneUpCapacity}명 · {selected.phone || "연락처 없음"}</p></div>
              <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-[#666]">담당 수업 ({workload.length}개)</h3><button onClick={openAddClass} className="erp-btn-primary text-xs">+ 수업 추가</button></div>
              {workload.length === 0 ? <div className="erp-card p-6 text-center"><p className="text-sm text-[#999]">담당 중인 수업이 없습니다</p></div> : (
                <div className="erp-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="erp-header"><th className="px-3 py-2">코드</th><th className="px-3 py-2">수업명</th><th className="px-3 py-2">유형</th><th className="px-3 py-2">수강</th><th className="px-3 py-2">정원</th><th className="px-3 py-2">상태</th></tr></thead>
                    <tbody>
                      {workload.map(o => (
                        <tr key={o.id} className="border-b border-[#e0e0e0]">
                          <td className="px-3 py-2 text-[#666]">{o.code}</td>
                          <td className="px-3 py-2 font-medium">{o.courseName}</td>
                          <td className="px-3 py-2 text-xs text-[#666]">{o.category === "NORMAL_SEASON" ? "정규" : o.category === "ONE_UP" ? "원업" : o.category === "SPECIAL" ? "특강" : o.category}</td>
                          <td className="px-3 py-2">{o.confirmedCount}/{o.capacity}</td>
                          <td className="px-3 py-2 text-[#666]">{o.capacity}</td>
                          <td className="px-3 py-2">{o.status === "PUBLISHED" ? <span className="erp-badge erp-badge-ok">공개</span> : <span className="erp-badge">임시</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : <div className="erp-card p-8 text-center"><p className="text-sm text-[#999]">강사를 선택하면 담당 수업을 확인할 수 있습니다</p></div>}
        </div>
      </div>
    </div>
  );
}
