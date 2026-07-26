"use client";

import { useState } from "react";
import { CAT_LABELS, fd, ft, formatPrice, type Offering, type ScheduleRow } from "@/components/student/types";

interface Props {
  offerings: Offering[];
  registeredIds: Set<number>;
  selected: Set<number>;
  loading: boolean;
  showPrice: boolean;
  scheduleByOffering: Map<number, ScheduleRow[]>;
  onToggle: (id: number) => void;
  emptyText: string;
}

export function ProgramCatalog({ offerings, registeredIds, selected, loading, showPrice, scheduleByOffering, onToggle, emptyText }: Props) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = offerings.filter(o => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return o.courseName.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) || (o.teacher ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-3">
        <input type="text" placeholder="수업명, 코드, 선생님으로 검색" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-[#adadad] px-3 py-1.5 text-sm outline-none focus:border-[#336699]" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map(o => {
          const isReg = registeredIds.has(o.id);
          const isSel = selected.has(o.id);
          const full = o.confirmedCount >= o.capacity;
          const seats = o.capacity - o.confirmedCount;
          const isExpanded = expandedId === o.id;
          const scheds = scheduleByOffering.get(o.id) ?? [];
          const ratio = o.confirmedCount / Math.max(o.capacity, 1);
          const seatColor = ratio >= 1 ? "#a80000" : ratio >= 0.8 ? "#d83b01" : "#107c10";

          return (
            <div key={o.id} className={`erp-card p-3 ${isSel ? "border-[#336699] border-2" : ""} ${isReg ? "opacity-60" : "cursor-pointer hover:border-[#336699]"}`}>
              <div onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-[#666]">{o.code}</span>
                      <span className="erp-badge text-xs">{CAT_LABELS[o.category] ?? o.category}</span>
                    </div>
                    <h3 className="font-semibold text-sm truncate">{o.courseName}</h3>
                    <p className="text-xs text-[#666]">{o.teacher ?? "미정"}{o.subject ? ` · ${o.subject}` : ""}</p>
                    {showPrice && <p className="text-xs font-semibold" style={{ color: "#2b5797" }}>{formatPrice(o)}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); onToggle(o.id); }} disabled={loading}
                    className={`ml-2 shrink-0 px-3 py-1 text-xs border ${isReg ? "bg-[#eee] text-[#999] border-[#ccc] cursor-not-allowed" : isSel ? "bg-[#336699] text-white border-[#2b5797]" : full ? "bg-white text-[#d83b01] border-[#d83b01] hover:bg-[#fff8f0]" : "bg-[#e1e1e1] border-[#adadad] text-[#333] hover:bg-[#e5f1fb]"}`}>
                    {isReg ? "수강중" : isSel ? "선택됨" : full ? "대기신청" : "선택"}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 border border-[#ccc] bg-[#eee]">
                    <div className="h-full" style={{ width: `${Math.min(ratio*100, 100)}%`, background: seatColor }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: seatColor }}>{seats <= 0 ? "마감" : `${seats}석`}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-2 border-t border-[#ccc] pt-2">
                  {scheds.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead><tr className="erp-header"><th className="p-1 text-left">날짜</th><th className="p-1 text-left">시간</th><th className="p-1 text-left">강의실</th></tr></thead>
                      <tbody>
                        {scheds.filter(s => s.sessionDate).map((s, i) => (
                          <tr key={i}><td className="p-1">{fd(s.sessionDate)}</td><td className="p-1">{ft(s.startTime)} ~ {ft(s.endTime)}</td><td className="p-1 text-[#666]">{s.room ?? "-"}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="text-xs text-[#999]">일정 정보 없음</p>}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-[#999] col-span-2 py-8 text-center">{search ? "검색 결과가 없습니다" : emptyText}</p>}
      </div>
    </div>
  );
}
