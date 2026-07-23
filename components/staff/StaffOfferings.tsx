"use client";

import { useState, useMemo, useEffect } from "react";
import { createOfferingAction, updateOfferingAction, deleteOfferingAction } from "@/lib/actions/admin";

interface Offering {
  id: number; courseName: string; code: string; category: string;
  teacher: string | null; capacity: number; status: string; subject: string | null;
  confirmedCount: number; waitlistCount: number;
}
interface Instructor { id: number; name: string; subject: string | null; oneUpCapacity: number; }
interface Props { periodId: number; periodName: string; offerings: Offering[]; instructors: Instructor[]; }

const CAT_FILTERS = [
  { key: "all", label: "전체" }, { key: "NORMAL_SEASON", label: "정규" },
  { key: "ONE_UP", label: "원업" }, { key: "SPECIAL", label: "특강" }, { key: "ESSAY_SPECIAL", label: "논술" },
];
const CAT_LABELS: Record<string, string> = { NORMAL_SEASON: "정규", ONE_UP: "원업", SPECIAL: "특강", ESSAY_SPECIAL: "논술", CUSTOM: "사용자정의" };

export function StaffOfferings({ periodName, offerings: initialOfferings, instructors }: Props) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [form, setForm] = useState({ code: "", courseName: "", category: "NORMAL_SEASON", teacher: "", capacity: 20, status: "PUBLISHED", room: "" });

  useEffect(() => { setOfferings(initialOfferings); }, [initialOfferings]);

  const filtered = useMemo(() => filter === "all" ? offerings : offerings.filter(o => o.category === filter), [offerings, filter]);

  function openAdd() { setEditing(null); setForm({ code: "", courseName: "", category: "NORMAL_SEASON", teacher: "", capacity: 20, status: "PUBLISHED", room: "" }); setShowForm(true); }
  function openEdit(o: Offering) { setEditing(o); setForm({ code: o.code, courseName: o.courseName, category: o.category, teacher: o.teacher ?? "", capacity: o.capacity, status: o.status, room: "" }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); const r = editing ? await updateOfferingAction(editing.id, form) : await createOfferingAction(form); if (r.success) setShowForm(false); }
  async function handleDelete(id: number) { if (confirm("정말 삭제하시겠습니까?")) await deleteOfferingAction(id); }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div><h1 className="text-xl font-bold">수업 관리</h1><p className="text-sm text-gray-500">{periodName}</p></div>
        <button onClick={openAdd} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">수업 추가</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">{editing ? "수업 수정" : "수업 추가"}</h2>
            <div className="space-y-3">
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="코드 (예: KOR-01)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
              <input className="w-full rounded border px-3 py-2 text-sm" placeholder="수업명" value={form.courseName} onChange={e => setForm({...form, courseName: e.target.value})} required />
              <select className="w-full rounded border px-3 py-2 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CAT_FILTERS.filter(f => f.key !== "all").map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <select className="w-full rounded border px-3 py-2 text-sm" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})}>
                <option value="">선생님 선택</option>
                {instructors.map(i => <option key={i.id} value={i.name}>{i.name} ({i.subject})</option>)}
              </select>
              <input className="w-full rounded border px-3 py-2 text-sm" type="number" placeholder="정원" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} required />
              {editing && (
                <select className="w-full rounded border px-3 py-2 text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="PUBLISHED">공개</option><option value="DRAFT">임시</option><option value="ARCHIVED">보관</option>
                </select>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{editing ? "수정" : "추가"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {CAT_FILTERS.map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-4 py-1 text-sm font-medium ${filter === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f.label}</button>)}
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 font-medium">코드</th><th className="px-4 py-3 font-medium">수업명</th><th className="px-4 py-3 font-medium">유형</th><th className="px-4 py-3 font-medium">선생님</th><th className="px-4 py-3 font-medium">상태</th><th className="px-4 py-3 font-medium text-right">수강</th><th className="px-4 py-3 font-medium text-right">대기</th><th className="px-4 py-3 font-medium text-right">정원</th><th className="px-4 py-3 font-medium"></th></tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{o.code}</td>
                <td className="px-4 py-3 font-medium">{o.courseName}</td>
                <td className="px-4 py-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{CAT_LABELS[o.category] ?? o.category}</span></td>
                <td className="px-4 py-3 text-gray-600">{o.teacher ?? "-"}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${o.status === "PUBLISHED" ? "bg-green-100 text-green-700" : o.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>{o.status === "PUBLISHED" ? "공개" : o.status === "DRAFT" ? "임시" : "보관"}</span></td>
                <td className="px-4 py-3 text-right">{o.confirmedCount}</td>
                <td className="px-4 py-3 text-right text-yellow-600">{o.waitlistCount}</td>
                <td className="px-4 py-3 text-right text-gray-500">{o.capacity}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(o)} className="text-xs text-blue-600 hover:underline mr-2">수정</button>
                  <button onClick={() => handleDelete(o.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">등록된 수업이 없습니다</p>}
      </div>
    </div>
  );
}
