"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  prepareSelectionAction,
  confirmSelectionAction,
} from "@/lib/actions/registration";
import type { SelectionReview } from "@/modules/registration/domain/types";
import { TimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";

interface Offering {
  id: number;
  courseName: string;
  code: string;
  category: string;
  teacher: string | null;
  capacity: number;
  status: string;
  subject: string | null;
  confirmedCount: number;
}

interface Registration {
  id: number;
  offeringId: number;
  status: string;
  courseName: string;
  category: string;
  teacher: string | null;
  waitlistSequence: number | null;
}

interface ScheduleRow {
  id: number;
  courseName: string;
  teacher: string | null;
  category: string;
  room: string | null;
  status: string;
  subject: string | null;
  capacity: number;
  sessionDate: string | Date | null;
  startTime: string | null;
  endTime: string | null;
}

interface Props {
  userId: number;
  periodId: number;
  offerings: Offering[];
  registrations: Registration[];
  scheduleData: ScheduleRow[];
  periodName: string;
}

const TABS = [
  { key: "catalog", label: "수강 카탈로그" },
  { key: "timetable", label: "내 시간표" },
  { key: "my", label: "내 수강 목록" },
];

const CAT_FILTERS = [
  { key: "all", label: "전체" },
  { key: "NORMAL_SEASON", label: "정규수업" },
  { key: "ONE_UP", label: "원업" },
  { key: "SPECIAL", label: "특강" },
  { key: "ESSAY_SPECIAL", label: "논술" },
];

export function StudentDashboard({ userId, periodId, offerings, registrations, scheduleData, periodName }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("catalog");
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<SelectionReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const registeredIds = useMemo(() => new Set(registrations.map((r) => r.offeringId)), [registrations]);

  const filtered = useMemo(() => {
    return offerings.filter((o) => {
      if (o.status !== "PUBLISHED") return false;
      if (catFilter !== "all" && o.category !== catFilter) return false;
      return true;
    });
  }, [offerings, catFilter]);

  const sessions = useMemo(() => buildTimetableSessions(scheduleData), [scheduleData]);

  function toggleOffering(id: number) {
    if (registeredIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setReview(null);
    setError("");
  }

  async function handleReview() {
    if (selected.size === 0) { setError("수업을 하나 이상 선택해주세요"); return; }
    setLoading(true); setError("");
    try {
      const r = await prepareSelectionAction(periodId, [...selected]);
      if (r.error) setError(r.error.message);
      else if (r.data) setReview(r.data);
    } catch { setError("검토 중 오류가 발생했습니다"); }
    finally { setLoading(false); }
  }

  async function handleConfirm() {
    if (!review) return;
    setLoading(true);
    try {
      const r = await confirmSelectionAction(periodId, review.reviewToken, [...selected]);
      if (r.error) setError(r.error.message);
      else if ("data" in r && r.data) {
        setResult("수강신청이 완료되었습니다");
        setSelected(new Set());
        setReview(null);
        router.refresh();
      } else if ("review" in r && r.review) {
        setReview(r.review);
        setError("상태가 변경되어 다시 검토가 필요합니다");
      }
    } catch { setError("신청 중 오류가 발생했습니다"); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">수강신청</h1>
      <p className="mb-4 text-sm text-gray-500">{periodName}</p>

      {result && <div className="mb-4 rounded bg-green-50 p-4 text-sm text-green-700">{result}</div>}
      {error && <div className="mb-4 rounded bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="mb-4 flex gap-2 border-b pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        <div>
          <div className="mb-4 flex gap-2">
            {CAT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setCatFilter(f.key)}
                className={`rounded-full px-4 py-1 text-xs font-medium ${
                  catFilter === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((o) => {
                const isReg = registeredIds.has(o.id);
                const isSel = selected.has(o.id);
                const full = o.confirmedCount >= o.capacity;
                const seats = o.capacity - o.confirmedCount;
                return (
                  <div key={o.id} className={`rounded-lg border bg-white p-4 shadow-sm ${isSel ? "ring-2 ring-blue-500" : ""} ${isReg ? "opacity-70" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs text-gray-400">{o.code}</span>
                        <h3 className="font-semibold text-sm">{o.courseName}</h3>
                        <p className="text-xs text-gray-500">{o.teacher ?? "미정"}</p>
                        <p className="mt-1 text-xs text-gray-400">{seats <= 0 ? "정원 마감" : `잔여 ${seats}석`} (정원 {o.capacity}명)</p>
                      </div>
                      <button
                        onClick={() => toggleOffering(o.id)}
                        disabled={isReg || loading}
                        className={`rounded px-3 py-1.5 text-xs font-medium ${
                          isReg ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                          isSel ? "bg-blue-600 text-white" :
                          full ? "bg-gray-100 text-gray-500" :
                          "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {isReg ? "신청완료" : isSel ? "선택됨" : full ? "정원마감" : "선택"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="text-sm text-gray-400 col-span-2 py-8 text-center">수업이 없습니다</p>}
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-sm">선택한 수업 ({selected.size}개)</h3>
                {selected.size === 0 ? (
                  <p className="text-xs text-gray-400">수업을 선택해주세요</p>
                ) : (
                  <ul className="space-y-2">
                    {offerings.filter((o) => selected.has(o.id)).map((o) => (
                      <li key={o.id} className="flex justify-between text-xs">
                        <span>{o.courseName}</span>
                        <button onClick={() => toggleOffering(o.id)} className="text-red-400 hover:text-red-600">제거</button>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={handleReview} disabled={selected.size === 0 || loading}
                  className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
                  {loading ? "처리중..." : "검토하기"}
                </button>
              </div>

              {review && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="mb-3 font-semibold text-sm">검토 결과</h3>
                  <div className="mb-3 rounded bg-blue-50 p-3 text-xs">
                    <p className="font-medium text-blue-800">수강료 안내</p>
                    <p className="mt-1 text-blue-700">{review.disclosureText}</p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {review.items.map((item) => (
                      <li key={item.offeringId} className="text-xs flex justify-between">
                        <span>{item.courseName}</span>
                        <span className={`font-medium ${
                          item.outcome === "CONFIRMED" ? "text-green-600" :
                          item.outcome === "WAITLISTED" ? "text-yellow-600" :
                          item.outcome === "SCHEDULE_PENDING" ? "text-blue-600" : "text-red-600"
                        }`}>
                          {item.outcome === "CONFIRMED" ? "확정" : item.outcome === "WAITLISTED" ? "대기" : item.outcome === "SCHEDULE_PENDING" ? "시간배정필요" : "충돌"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleConfirm} disabled={loading}
                    className="w-full rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-300">
                    {loading ? "처리중..." : "수강신청 확정"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "timetable" && (
        <div>
          {sessions.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-400">등록된 수업이 없습니다</p>
              <p className="mt-1 text-xs text-gray-300">수강 카탈로그에서 수업을 신청해주세요</p>
            </div>
          ) : (
            <TimetableGrid sessions={sessions} />
          )}
        </div>
      )}

      {tab === "my" && (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">수업명</th>
                <th className="px-4 py-3 font-medium">선생님</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">대기순번</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.courseName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.teacher ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.category === "NORMAL_SEASON" ? "정규" : r.category === "ONE_UP" ? "원업" : r.category === "SPECIAL" ? "특강" : r.category === "ESSAY_SPECIAL" ? "논술" : r.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${r.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.status === "CONFIRMED" ? "확정" : "대기"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.waitlistSequence ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {registrations.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">수강 내역이 없습니다</p>}
        </div>
      )}
    </div>
  );
}
