"use client";

import { useState, useMemo, useEffect } from "react";
import { createOfferingAction, updateOfferingAction, deleteOfferingAction } from "@/lib/actions/admin";

interface Offering { id: number; courseName: string; code: string; category: string; teacher: string | null; capacity: number; status: string; subject: string | null; confirmedCount: number; waitlistCount: number; }
interface Instructor { id: number; name: string; subject: string | null; oneUpCapacity: number; }

interface Props { periodId: number; periodName: string; offerings: Offering[]; instructors: Instructor[]; }

const CAT_FILTERS = [{ key: "all", label: "전체" }, { key: "NORMAL_SEASON", label: "정규" }, { key: "ONE_UP", label: "원업" }, { key: "SPECIAL", label: "특강" }, { key: "ESSAY_SPECIAL", label: "논술" }];
const CAT_LABELS: Record<string, string> = { NORMAL_SEASON: "정규", ONE_UP: "원업", SPECIAL: "특강", ESSAY_SPECIAL: "논술", CUSTOM: "사용자정의" };

export function StaffOfferings({ periodName, offerings: initialOfferings, instructors }: Props) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [form, setForm] = useState({ code: "", courseName: "", category: "NORMAL_SEASON", teacher: "", capacity: 20, status: "PUBLISHED", room: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { setOfferings(initialOfferings); }, [initialOfferings]);
  const filtered = useMemo(() => filter === "all" ? offerings : offerings.filter(o => o.category === filter), [offerings, filter]);

  const stats = useMemo(() => {
    const totalEnrolled = offerings.reduce((s, o) => s + o.confirmedCount, 0);
    const totalWaitlist = offerings.reduce((s, o) => s + o.waitlistCount, 0);
    const mostPopular = [...offerings].sort((a, b) => b.confirmedCount - a.confirmedCount)[0];
    return { totalEnrolled, totalWaitlist, mostPopular, totalCourses: offerings.length };
  }, [offerings]);

  function openAdd() { setEditing(null); setForm({ code: "", courseName: "", category: "NORMAL_SEASON", teacher: "", capacity: 20, status: "PUBLISHED", room: "" }); setFormError(""); setShowForm(true); }
  function openEdit(o: Offering) { setEditing(o); setForm({ code: o.code, courseName: o.courseName, category: o.category, teacher: o.teacher ?? "", capacity: o.capacity, status: o.status, room: "" }); setFormError(""); setShowForm(true); }
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setFormLoading(true); setFormError(""); const r = editing ? await updateOfferingAction(editing.id, form) : await createOfferingAction(form); setFormLoading(false); if (r.success) { setShowForm(false); } else if ("error" in r && typeof r.error === "string") { setFormError(r.error); } }
  async function handleDelete(id: number) { if (confirm("정말 삭제하시겠습니까?")) await deleteOfferingAction(id); }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div><h1 className="text-lg font-bold" style={{ color: "#2b5797" }}>수업 관리</h1><p className="text-sm text-[#666]">{periodName}</p></div>
        <button onClick={openAdd} className="erp-btn-primary text-sm">+ 수업 추가</button>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2">
        {[{ label: "전체 수업", value: `${stats.totalCourses}개`, color: "#336699" }, { label: "수강인원", value: `${stats.totalEnrolled}명`, color: "#107c10" }, { label: "대기인원", value: `${stats.totalWaitlist}명`, color: "#d83b01" }, { label: "최다인기", value: stats.mostPopular?.courseName ?? "-", sub: stats.mostPopular ? `${stats.mostPopular.confirmedCount}/${stats.mostPopular.capacity}명` : "", color: "#333" }].map((s, i) => (
          <div key={i} className="erp-card p-3 text-center">
            <p className="text-xs text-[#666]">{s.label}</p>
            <p className="erp-stat" style={{ color: s.color }}>{s.value}</p>
            {s.sub && <p className="text-xs text-[#999]">{s.sub}</p>}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }} onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="w-full max-w-md erp-card p-6" onClick={e => e.stopPropagation()}>
            <h2 className="mb-3 text-base font-bold border-b border-[#ccc] pb-2">{editing ? "수업 수정" : "수업 추가"}</h2>
            {formError && <div className="mb-3 border border-[#a80000] bg-[#fff0f0] p-2 text-xs text-[#a80000]">{formError}</div>}
            <div className="space-y-2">
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="코드 (예: KOR-01)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" placeholder="수업명" value={form.courseName} onChange={e => setForm({...form, courseName: e.target.value})} required />
              <select className="w-full border border-[#adadad] px-2 py-1.5 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CAT_FILTERS.filter(f => f.key !== "all").map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <select className="w-full border border-[#adadad] px-2 py-1.5 text-sm" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})}>
                <option value="">선생님 선택</option>
                {instructors.map(i => <option key={i.id} value={i.name}>{i.name} ({i.subject})</option>)}
              </select>
              <input className="w-full border border-[#adadad] px-2 py-1.5 text-sm" type="number" placeholder="정원" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} required />
              {editing && (
                <select className="w-full border border-[#adadad] px-2 py-1.5 text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="PUBLISHED">공개</option><option value="DRAFT">임시</option><option value="ARCHIVED">보관</option>
                </select>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={formLoading} className="flex-1 erp-btn-primary text-sm">{formLoading ? "처리중..." : editing ? "수정" : "추가"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-3 flex gap-0">
        {CAT_FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1 text-xs border ${filter === f.key ? "bg-white border-[#336699] text-[#336699] font-semibold" : "bg-[#e1e1e1] border-[#adadad] text-[#333] hover:bg-[#e5f1fb]"}`}>{f.label}</button>
        ))}
      </div>

      <div className="erp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead><tr className="erp-header"><th className="px-3 py-2">코드</th><th className="px-3 py-2">수업명</th><th className="px-3 py-2">유형</th><th className="px-3 py-2">선생님</th><th className="px-3 py-2">상태</th><th className="px-3 py-2 text-right">수강</th><th className="px-3 py-2 text-right">대기</th><th className="px-3 py-2 text-right">정원</th><th className="px-3 py-2"></th></tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
                <td className="px-3 py-2 text-[#666]">{o.code}</td>
                <td className="px-3 py-2 font-medium">{o.courseName}</td>
                <td className="px-3 py-2"><span className="erp-badge">{CAT_LABELS[o.category] ?? o.category}</span></td>
                <td className="px-3 py-2 text-[#666]">{o.teacher ?? "-"}</td>
                <td className="px-3 py-2"><span className={o.status === "PUBLISHED" ? "erp-badge erp-badge-ok" : o.status === "DRAFT" ? "erp-badge erp-badge-warn" : "erp-badge"}>{o.status === "PUBLISHED" ? "공개" : o.status === "DRAFT" ? "임시" : "보관"}</span></td>
                <td className="px-3 py-2 text-right">{o.confirmedCount}</td>
                <td className="px-3 py-2 text-right text-[#d83b01]">{o.waitlistCount}</td>
                <td className="px-3 py-2 text-right text-[#666]">{o.capacity}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => openEdit(o)} className="erp-link text-xs mr-2">수정</button>
                  <button onClick={() => handleDelete(o.id)} className="text-xs text-[#a80000] hover:underline">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#999]">등록된 수업이 없습니다</p>}
      </div>
    </div>
  );
}
