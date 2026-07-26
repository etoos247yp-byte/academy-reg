"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { prepareSelectionAction, confirmSelectionAction } from "@/lib/actions/registration";
import type { SelectionReview } from "@/modules/registration/domain/types";
import { TimetableGrid, MiniTimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";
import { computeNormalTier, NORMAL_TIERS } from "@/modules/pricing/tiers";

interface Offering { id: number; courseName: string; code: string; category: string; teacher: string | null; capacity: number; status: string; subject: string | null; confirmedCount: number; }
interface Registration { id: number; offeringId: number; status: string; courseName: string; category: string; teacher: string | null; waitlistSequence: number | null; }
interface ScheduleRow { id: number; courseName: string; teacher: string | null; category: string; room: string | null; status: string; subject: string | null; capacity: number; sessionDate: string | Date | null; startTime: string | null; endTime: string | null; }
interface LockStatus { isLocked: boolean; lockedAt: Date | null; lockedTierLabel: string; lockedTierSurcharge: number; lockedNormalCount: number; currentNormalCount: number; lockDays: number; }
interface OneUpStatus { registrationId: number; courseName: string; teacher: string | null; status: string; assignedDate: string | null; startTime: string | null; endTime: string | null; }
interface HistoryBatch { batchId: number; createdAt: string | Date; disclosureText: string | null; items: { courseName: string; status: string }[]; }
interface Props { userId: number; periodId: number; offerings: Offering[]; registrations: Registration[]; scheduleData: ScheduleRow[]; periodName: string; windowClosesAt: Date | null; offeringSchedules: ScheduleRow[]; lockStatus: LockStatus; oneUpStatus: OneUpStatus[]; history: HistoryBatch[]; }

const TABS = [{ key: "catalog", label: "수강 카탈로그" }, { key: "timetable", label: "내 시간표" }, { key: "my", label: "내 수강 목록" }];
const CAT_FILTERS = [{ key: "all", label: "전체" }, { key: "NORMAL_SEASON", label: "정규수업" }, { key: "ONE_UP", label: "원업" }, { key: "SPECIAL", label: "특강" }, { key: "ESSAY_SPECIAL", label: "논술" }];
const CAT_LABELS: Record<string, string> = { NORMAL_SEASON: "정규", ONE_UP: "원업", SPECIAL: "특강", ESSAY_SPECIAL: "논술", CUSTOM: "사용자정의" };

function ft(t: string | null) { if (!t) return ""; return t.length >= 5 ? t.substring(0, 5) : t; }
function fd(d: string | Date | null) { if (!d) return ""; const dt = typeof d === "string" ? new Date(d) : d; const days = ["일","월","화","수","목","금","토"]; return `${dt.getMonth()+1}/${dt.getDate()}(${days[dt.getDay()]})`; }

export function StudentDashboard({ userId, periodId, offerings, registrations, scheduleData, periodName, windowClosesAt, offeringSchedules, lockStatus, oneUpStatus, history }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("catalog");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<SelectionReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAck, setShowAck] = useState(false); // acknowledgment modal

  const registeredIds = useMemo(() => new Set(registrations.map(r => r.offeringId)), [registrations]);
  const scheduleByOffering = useMemo(() => {
    const m = new Map<number, ScheduleRow[]>();
    for (const s of offeringSchedules) { const l = m.get(s.id); if (l) l.push(s); else m.set(s.id, [s]); }
    return m;
  }, [offeringSchedules]);

  // Count how many NORMAL_SEASON are currently selected (for lock check)
  const selectedNormalCount = useMemo(() => {
    return [...selected].filter(id => {
      const o = offerings.find(x => x.id === id);
      return o?.category === "NORMAL_SEASON";
    }).length;
  }, [selected, offerings]);

  const currentNormalInSelection = useMemo(() => {
    return registrations.filter(r => {
      if (r.status !== "CONFIRMED") return false;
      return r.category === "NORMAL_SEASON";
    }).length + selectedNormalCount;
  }, [registrations, selectedNormalCount]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offerings.filter(o => {
      if (o.status !== "PUBLISHED") return false;
      if (catFilter !== "all" && o.category !== catFilter) return false;
      if (q) { if (!o.courseName.toLowerCase().includes(q) && !o.code.toLowerCase().includes(q) && !(o.teacher ?? "").toLowerCase().includes(q)) return false; }
      return true;
    });
  }, [offerings, catFilter, search]);

  // Merge confirmed schedule + selected (pending) offerings for live timetable preview
  const sessions = useMemo(() => {
    const merged = [...scheduleData];
    for (const id of selected) {
      const scheds = scheduleByOffering.get(id);
      if (scheds) merged.push(...scheds);
    }
    return buildTimetableSessions(merged);
  }, [scheduleData, selected, scheduleByOffering]);

  // Sidebar mini timetable: confirmed sessions vs selected-but-unconfirmed sessions
  const confirmedCells = useMemo(() => buildTimetableSessions(scheduleData), [scheduleData]);
  const pendingCells = useMemo(() => {
    const rows = [...selected].flatMap((id) => scheduleByOffering.get(id) ?? []);
    return buildTimetableSessions(rows);
  }, [selected, scheduleByOffering]);

  const currentTier = useMemo(() => computeNormalTier(currentNormalInSelection), [currentNormalInSelection]);

  function toggleOffering(id: number) {
    if (registeredIds.has(id)) {
      // Prevent removing if locked and would drop below locked tier
      if (lockStatus.isLocked) {
        const offering = offerings.find(o => o.id === id);
        if (offering?.category === "NORMAL_SEASON") {
          const newNormalCount = lockStatus.currentNormalCount - 1;
          if (newNormalCount < lockStatus.lockedNormalCount) {
            setError(`수강확정기간입니다. ${lockStatus.lockedTierLabel} 미만으로 변경할 수 없습니다. (현재 ${lockStatus.lockedTierLabel}, ${lockStatus.lockedNormalCount}과목 고정)`);
            return;
          }
        }
      }
      return; // already registered — skip toggle
    }
    setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    setReview(null); setError(""); setResult(null);
  }

  // Step 1: validate and check for surcharge acknowledgment
  async function handlePrepare() {
    if (selected.size === 0) { setError("수업을 하나 이상 선택해주세요"); return; }
    if (loading) return;
    setLoading(true); setError("");
    try {
      const r = await prepareSelectionAction(periodId, [...selected]);
      if (r.error) { setError(r.error.message); setLoading(false); return; }
      if (!r.data) { setError("신청 중 오류가 발생했습니다"); setLoading(false); return; }
      setReview(r.data);
      setLoading(false);

      if (r.data.items.some(i => i.outcome === "CONFLICT")) {
        setError("일부 수업에 시간 충돌이 있습니다. 선택을 조정한 후 다시 신청해주세요.");
        return;
      }

      // If surcharge > 0, require explicit acknowledgment
      if (r.data.normalTierMonthlySurcharge > 0) {
        setShowAck(true);
        return;
      }

      // Free tier — confirm immediately
      await doConfirm(r.data.reviewToken);
    } catch { setError("신청 중 오류가 발생했습니다"); setLoading(false); }
  }

  // Step 2: confirm after acknowledgment
  async function doConfirm(reviewToken: string) {
    setLoading(true); setShowAck(false);
    try {
      const c = await confirmSelectionAction(periodId, reviewToken, [...selected]);
      if (c.error) { setError(c.error.message); return; }
      if ("data" in c && c.data) {
        setResult("수강신청이 완료되었습니다");
        setSelected(new Set()); setReview(null);
        router.refresh();
      } else if ("review" in c && c.review) {
        setReview(c.review);
        setError("상태가 변경되어 다시 확인이 필요합니다");
      }
    } catch { setError("신청 중 오류가 발생했습니다"); }
    finally { setLoading(false); }
  }

  const deadlineText = windowClosesAt ? `신청 마감: ${new Date(windowClosesAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ${new Date(windowClosesAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}까지` : null;

  const lockText = lockStatus.isLocked ? `수강확정 · ${lockStatus.lockedTierLabel} (${lockStatus.lockedNormalCount}과목 고정, 추가만 가능)` : null;

  const tabBtn = (k: string, l: string) => (
    <button key={k} onClick={() => { setTab(k); setResult(null); }}
      className={`px-4 py-1 text-sm border ${tab === k ? "bg-white border-[#336699] text-[#336699] font-semibold" : "bg-[#e1e1e1] border-[#adadad] text-[#333] hover:bg-[#e5f1fb]"}`}>{l}</button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <h1 className="text-lg font-bold" style={{ color: "#2b5797" }}>수강신청</h1>
      <p className="text-sm text-[#666]">{periodName}</p>
      {deadlineText && <p className="text-sm font-medium text-[#d83b01] mt-1">{deadlineText}</p>}
      {lockText && (
        <p className="text-sm font-medium mt-1" style={{ color: "#2b5797" }}>
          {lockText} · 잠금일: {lockStatus.lockedAt!.toLocaleDateString("ko-KR")}
        </p>
      )}

      {result && <div className="my-3 border border-[#107c10] bg-[#f0fff0] p-3 text-sm text-[#107c10]">{result}</div>}
      {error && <div className="my-3 border border-[#a80000] bg-[#fff0f0] p-3 text-sm text-[#a80000]">{error}</div>}

      {/* Acknowledgment modal for surcharge */}
      {showAck && review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="w-full max-w-md erp-card p-6">
            <h2 className="text-base font-bold mb-3 border-b border-[#ccc] pb-2" style={{ color: "#2b5797" }}>추가 비용 안내</h2>
            <div className="mb-3 border border-[#d83b01] bg-[#fff8f0] p-3 text-sm">
              <p className="text-base font-bold text-[#d83b01]">{review.normalTierLabel}</p>
              <p className="mt-1 text-[#333]">{review.disclosureText}</p>
            </div>
            <div className="mb-4 border border-[#a80000] bg-[#fff0f0] p-3">
              <p className="text-sm font-semibold leading-5 text-[#a80000]">
                수강확정기간({lockStatus.lockDays}일) 이후에는 현재 CLASS 미만으로 변경할 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => doConfirm(review.reviewToken)} disabled={loading}
                className="flex-1 erp-btn-primary text-sm py-2 font-semibold">
                {loading ? "처리중..." : "동의하고 신청하기"}
              </button>
              <button onClick={() => { setShowAck(false); setReview(null); }}
                className="erp-btn text-sm px-4">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 mb-4 flex gap-0 border-b border-[#ccc] pb-2">
        {TABS.map(t => tabBtn(t.key, t.label))}
      </div>

      {tab === "catalog" && (
        <div>
          <div className="mb-3 space-y-2">
            <input type="text" placeholder="수업명, 코드, 선생님으로 검색" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#adadad] px-3 py-1.5 text-sm outline-none focus:border-[#336699]" />
            <div className="flex gap-0">
              {CAT_FILTERS.map(f => (
                <button key={f.key} onClick={() => setCatFilter(f.key)}
                  className={`px-3 py-1 text-xs border ${catFilter === f.key ? "bg-white border-[#336699] text-[#336699] font-semibold" : "bg-[#e1e1e1] border-[#adadad] text-[#333] hover:bg-[#e5f1fb]"}`}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
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
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleOffering(o.id); }} disabled={loading}
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
              {filtered.length === 0 && <p className="text-sm text-[#999] col-span-2 py-8 text-center">{search ? "검색 결과가 없습니다" : "수업이 없습니다"}</p>}
            </div>

            <div className="space-y-3">
              <div className="erp-card p-3">
                <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>선택한 수업 ({selected.size}개)</h3>
                {selected.size === 0 ? <p className="text-xs text-[#999]">수업을 선택해주세요</p> : (
                  <ul className="space-y-1 mb-3">
                    {offerings.filter(o => selected.has(o.id)).map(o => (
                      <li key={o.id} className="flex justify-between text-xs py-1 border-b border-[#eee]">
                        <span className="truncate">{o.courseName}</span>
                        <button onClick={() => toggleOffering(o.id)} className="shrink-0 text-[#a80000] hover:underline text-xs">제거</button>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={handlePrepare} disabled={selected.size === 0 || loading}
                  className="w-full erp-btn-primary py-1.5 text-sm font-semibold disabled:opacity-50">
                  {loading ? "처리중..." : "신청하기"}
                </button>
              </div>

              <div className="erp-card p-3">
                <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>나의 CLASS</h3>
                <div className="flex">
                  {NORMAL_TIERS.map((t, i) => {
                    const active = t.name === currentTier.name;
                    return (
                      <div key={t.name} className="flex-1 py-1 text-center text-xs border"
                        style={{
                          background: active ? "#336699" : "#f5f5f5",
                          color: active ? "#fff" : "#999",
                          fontWeight: active ? 700 : 400,
                          borderColor: active ? "#2b5797" : "#ccc",
                          marginLeft: i > 0 ? -1 : 0,
                        }}>
                        {t.name.replace("CLASS ", "")}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs font-semibold" style={{ color: "#2b5797" }}>{currentTier.label}</p>
                <p className="mt-0.5 text-xs text-[#666]">
                  정규수업 수강중 {currentNormalInSelection - selectedNormalCount}과목
                  {selectedNormalCount > 0 ? ` + 선택 ${selectedNormalCount}과목 = 총 ${currentNormalInSelection}과목` : ""}
                </p>
              </div>

              <div className="erp-card p-3">
                <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>주간 시간표 미리보기</h3>
                {confirmedCells.length === 0 && pendingCells.length === 0 ? (
                  <p className="text-xs text-[#999]">표시할 수업 일정이 없습니다</p>
                ) : (
                  <>
                    <MiniTimetableGrid sessions={confirmedCells} pendingSessions={pendingCells} />
                    <div className="mt-2 flex items-center gap-3 text-xs text-[#666]">
                      <span className="flex items-center gap-1">
                        <span style={{ width: 10, height: 10, background: "#f0f5ff", border: "1px solid #336699", display: "inline-block" }} />
                        수강중
                      </span>
                      <span className="flex items-center gap-1">
                        <span style={{ width: 10, height: 10, background: "#fff", border: "1px dashed #336699", display: "inline-block" }} />
                        선택중
                      </span>
                    </div>
                  </>
                )}
              </div>

              {review && (
                <div className="erp-card p-3">
                  <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>신청 확인</h3>
                  <div className="mb-3 border border-[#336699] bg-[#f0f5ff] p-2 text-xs text-[#336699]">{review.disclosureText}</div>
                  <table className="w-full text-xs">
                    <thead><tr className="erp-header"><th className="p-1 text-left">수업명</th><th className="p-1 text-right">결과</th></tr></thead>
                    <tbody>
                      {review.items.map(item => (
                        <tr key={item.offeringId}>
                          <td className="p-1 truncate max-w-[180px]">{item.courseName}</td>
                          <td className="p-1 text-right font-medium" style={{ color: item.outcome === "CONFIRMED" ? "#107c10" : item.outcome === "WAITLISTED" ? "#d83b01" : item.outcome === "SCHEDULE_PENDING" ? "#336699" : "#a80000" }}>
                            {item.outcome === "CONFIRMED" ? "확정" : item.outcome === "WAITLISTED" ? "대기" : item.outcome === "SCHEDULE_PENDING" ? "시간배정필요" : "충돌"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "timetable" && (
        <div>
          {sessions.length === 0 ? (
            <div className="erp-card p-8 text-center"><p className="text-sm text-[#999]">등록된 수업이 없습니다</p><p className="mt-1 text-xs text-[#aaa]">수강 카탈로그에서 수업을 신청해주세요</p></div>
          ) : <TimetableGrid sessions={sessions} />}
        </div>
      )}

      {tab === "my" && (
        <div className="erp-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead><tr className="erp-header"><th className="px-3 py-2">수업명</th><th className="px-3 py-2">선생님</th><th className="px-3 py-2">유형</th><th className="px-3 py-2">상태</th><th className="px-3 py-2">대기순번</th></tr></thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id} className="border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
                  <td className="px-3 py-2 font-medium">{r.courseName}</td>
                  <td className="px-3 py-2 text-[#666]">{r.teacher ?? "-"}</td>
                  <td className="px-3 py-2 text-xs text-[#666]">{CAT_LABELS[r.category] ?? r.category}</td>
                  <td className="px-3 py-2"><span className={r.status === "CONFIRMED" ? "erp-badge erp-badge-ok" : "erp-badge erp-badge-warn"}>{r.status === "CONFIRMED" ? "확정" : "대기"}</span></td>
                  <td className="px-3 py-2 text-[#666]">{r.waitlistSequence ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {registrations.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#999]">수강 내역이 없습니다</p>}
        </div>
      )}
    </div>
  );
}
