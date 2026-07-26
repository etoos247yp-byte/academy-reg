"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { prepareSelectionAction, confirmSelectionAction } from "@/lib/actions/registration";
import type { SelectionReview } from "@/modules/registration/domain/types";
import { TimetableGrid, MiniTimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";
import { computeNormalTier, NORMAL_TIERS } from "@/modules/pricing/tiers";
import { ProgramCatalog } from "@/components/student/ProgramCatalog";
import { SpecialSchedule } from "@/components/student/SpecialSchedule";
import { OneUpStatus } from "@/components/student/OneUpStatus";
import { MyRegistrations } from "@/components/student/MyRegistrations";
import { HomeTab } from "@/components/student/HomeTab";
import type { Offering, Registration, ScheduleRow, LockStatus, OneUpRow, HistoryBatch } from "@/components/student/types";

interface Props {
  userId: number;
  periodId: number;
  offerings: Offering[];
  registrations: Registration[];
  scheduleData: ScheduleRow[];
  periodName: string;
  windowClosesAt: Date | null;
  offeringSchedules: ScheduleRow[];
  lockStatus: LockStatus;
  oneUpStatus: OneUpRow[];
  history: HistoryBatch[];
}

const TABS = [
  { key: "home", label: "홈" },
  { key: "normal", label: "정규수업" },
  { key: "special", label: "특강" },
  { key: "oneup", label: "원업" },
  { key: "my", label: "내 수강 목록" },
];

export function StudentDashboard({ userId, periodId, offerings, registrations, scheduleData, periodName, windowClosesAt, offeringSchedules, lockStatus, oneUpStatus, history }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [normalView, setNormalView] = useState<"catalog" | "timetable">("catalog");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<SelectionReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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

  const confirmedNormalCount = useMemo(() => {
    return registrations.filter(r => r.status === "CONFIRMED" && r.category === "NORMAL_SEASON").length;
  }, [registrations]);

  // Merge confirmed schedule + selected (pending) offerings for the normal-tab full timetable,
  // restricted to NORMAL_SEASON rows before building sessions.
  const normalSessions = useMemo(() => {
    const merged = [...scheduleData];
    for (const id of selected) {
      const scheds = scheduleByOffering.get(id);
      if (scheds) merged.push(...scheds);
    }
    return buildTimetableSessions(merged.filter(s => s.category === "NORMAL_SEASON"));
  }, [scheduleData, selected, scheduleByOffering]);

  // Sidebar mini timetable (normal tab only): confirmed sessions vs selected-but-unconfirmed sessions,
  // restricted to NORMAL_SEASON rows before building sessions.
  const confirmedCells = useMemo(() => buildTimetableSessions(scheduleData.filter(s => s.category === "NORMAL_SEASON")), [scheduleData]);
  const pendingCells = useMemo(() => {
    const rows = [...selected].flatMap((id) => scheduleByOffering.get(id) ?? []);
    return buildTimetableSessions(rows.filter(s => s.category === "NORMAL_SEASON"));
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

      {tab === "home" && (
        <HomeTab
          registrations={registrations}
          scheduleData={scheduleData}
          windowClosesAt={windowClosesAt}
          lockStatus={lockStatus}
          normalCount={confirmedNormalCount}
          oneUpRows={oneUpStatus}
          onGoTab={setTab}
        />
      )}

      {tab === "normal" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-3 flex gap-0">
              <button onClick={() => setNormalView("catalog")}
                className={`px-4 py-1 text-sm border ${normalView === "catalog" ? "bg-white border-[#336699] text-[#336699] font-semibold" : "bg-[#e1e1e1] border-[#adadad] text-[#333] hover:bg-[#e5f1fb]"}`}>카탈로그</button>
              <button onClick={() => setNormalView("timetable")}
                className={`px-4 py-1 text-sm border ${normalView === "timetable" ? "bg-white border-[#336699] text-[#336699] font-semibold" : "bg-[#e1e1e1] border-[#adadad] text-[#333] hover:bg-[#e5f1fb]"}`}>전체 시간표</button>
            </div>

            {normalView === "catalog" ? (
              <ProgramCatalog
                offerings={offerings.filter(o => o.category === "NORMAL_SEASON")}
                registeredIds={registeredIds}
                selected={selected}
                loading={loading}
                showPrice={false}
                scheduleByOffering={scheduleByOffering}
                onToggle={toggleOffering}
                emptyText="정규수업이 없습니다"
              />
            ) : (
              normalSessions.length === 0 ? (
                <div className="erp-card p-8 text-center"><p className="text-sm text-[#999]">등록된 수업이 없습니다</p><p className="mt-1 text-xs text-[#aaa]">카탈로그에서 수업을 신청해주세요</p></div>
              ) : <TimetableGrid sessions={normalSessions} />
            )}
          </div>

          <div className="space-y-3">
            <BasketCard offerings={offerings} selected={selected} loading={loading} onToggle={toggleOffering} onPrepare={handlePrepare} />

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

            <ReviewCard review={review} />
          </div>
        </div>
      )}

      {tab === "special" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <ProgramCatalog
              offerings={offerings.filter(o => o.category === "SPECIAL" || o.category === "ESSAY_SPECIAL")}
              registeredIds={registeredIds}
              selected={selected}
              loading={loading}
              showPrice
              scheduleByOffering={scheduleByOffering}
              onToggle={toggleOffering}
              emptyText="특강이 없습니다"
            />
            <SpecialSchedule scheduleData={scheduleData} />
          </div>
          <div className="space-y-3">
            <BasketCard offerings={offerings} selected={selected} loading={loading} onToggle={toggleOffering} onPrepare={handlePrepare} />
            <ReviewCard review={review} />
          </div>
        </div>
      )}

      {tab === "oneup" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <ProgramCatalog
              offerings={offerings.filter(o => o.category === "ONE_UP")}
              registeredIds={registeredIds}
              selected={selected}
              loading={loading}
              showPrice
              scheduleByOffering={scheduleByOffering}
              onToggle={toggleOffering}
              emptyText="원업 수업이 없습니다"
            />
            <OneUpStatus rows={oneUpStatus} />
          </div>
          <div className="space-y-3">
            <BasketCard offerings={offerings} selected={selected} loading={loading} onToggle={toggleOffering} onPrepare={handlePrepare} />
            <ReviewCard review={review} />
          </div>
        </div>
      )}

      {tab === "my" && <MyRegistrations registrations={registrations} history={history} />}
    </div>
  );
}

function BasketCard({ offerings, selected, loading, onToggle, onPrepare }: {
  offerings: Offering[];
  selected: Set<number>;
  loading: boolean;
  onToggle: (id: number) => void;
  onPrepare: () => void;
}) {
  return (
    <div className="erp-card p-3">
      <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>선택한 수업 ({selected.size}개)</h3>
      {selected.size === 0 ? <p className="text-xs text-[#999]">수업을 선택해주세요</p> : (
        <ul className="space-y-1 mb-3">
          {offerings.filter(o => selected.has(o.id)).map(o => (
            <li key={o.id} className="flex justify-between text-xs py-1 border-b border-[#eee]">
              <span className="truncate">{o.courseName}</span>
              <button onClick={() => onToggle(o.id)} className="shrink-0 text-[#a80000] hover:underline text-xs">제거</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={onPrepare} disabled={selected.size === 0 || loading}
        className="w-full erp-btn-primary py-1.5 text-sm font-semibold disabled:opacity-50">
        {loading ? "처리중..." : "신청하기"}
      </button>
    </div>
  );
}

function ReviewCard({ review }: { review: SelectionReview | null }) {
  if (!review) return null;
  return (
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
  );
}
