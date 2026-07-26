"use client";

import { MiniTimetableGrid, buildTimetableSessions } from "@/components/shared/TimetableGrid";
import { computeNormalTier, NORMAL_TIERS } from "@/modules/pricing/tiers";
import { selectUpcomingSessions } from "@/modules/registration/domain/upcoming";
import { OneUpStatus } from "@/components/student/OneUpStatus";
import { fd, type Registration, type ScheduleRow, type LockStatus, type OneUpRow } from "@/components/student/types";

interface Props {
  registrations: Registration[];
  scheduleData: ScheduleRow[];
  windowClosesAt: Date | null;
  lockStatus: LockStatus;
  normalCount: number;
  oneUpRows: OneUpRow[];
  onGoTab: (tab: string) => void;
}

export function HomeTab({ registrations, scheduleData, windowClosesAt, lockStatus, normalCount, oneUpRows, onGoTab }: Props) {
  const dDay = windowClosesAt ? Math.ceil((new Date(windowClosesAt).getTime() - Date.now()) / 86400000) : null;
  const waitlisted = registrations.filter(r => r.status === "WAITLISTED");
  const hasAlerts = dDay !== null || lockStatus.isLocked || waitlisted.length > 0;

  const tier = computeNormalTier(normalCount);

  const normalSessions = buildTimetableSessions(scheduleData.filter(s => s.category === "NORMAL_SEASON"));

  const upcomingSpecials = selectUpcomingSessions(
    scheduleData.filter(s => s.category === "SPECIAL" || s.category === "ESSAY_SPECIAL"),
    new Date(),
    6,
  );

  return (
    <div>
      {hasAlerts && (
        <div className="mb-3 space-y-1">
          {dDay !== null && (
            <p className="text-sm font-semibold" style={{ color: dDay <= 3 ? "#a80000" : "#2b5797" }}>
              신청 마감 D-{dDay}
            </p>
          )}
          {lockStatus.isLocked && (
            <p className="text-sm font-medium" style={{ color: "#2b5797" }}>
              수강확정 · {lockStatus.lockedTierLabel} ({lockStatus.lockedNormalCount}과목 고정, 추가만 가능)
              {lockStatus.lockedAt ? ` · 잠금일: ${lockStatus.lockedAt.toLocaleDateString("ko-KR")}` : ""}
            </p>
          )}
          {waitlisted.map(r => (
            <p key={r.id} className="text-sm font-medium text-[#d83b01]">대기중: {r.courseName} (대기 {r.waitlistSequence}번)</p>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="erp-card p-3">
          <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>나의 CLASS</h3>
          <div className="flex">
            {NORMAL_TIERS.map((t, i) => {
              const active = t.name === tier.name;
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
          <p className="mt-2 text-xs font-semibold" style={{ color: "#2b5797" }}>{tier.label}</p>
          <p className="mt-0.5 text-xs text-[#666]">정규수업 수강중 {normalCount}과목</p>
        </div>

        <div className="erp-card p-3">
          <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>이번 주 시간표</h3>
          {normalSessions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="mb-2 text-xs text-[#999]">등록된 정규수업이 없습니다</p>
              <button onClick={() => onGoTab("normal")} className="erp-btn text-xs px-3 py-1">정규수업 카탈로그 보기</button>
            </div>
          ) : (
            <MiniTimetableGrid sessions={normalSessions} pendingSessions={[]} />
          )}
        </div>

        <div className="erp-card p-3">
          <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>다가오는 특강</h3>
          {upcomingSpecials.length === 0 ? (
            <div className="py-6 text-center">
              <p className="mb-2 text-xs text-[#999]">신청한 특강이 없습니다</p>
              <button onClick={() => onGoTab("special")} className="erp-btn text-xs px-3 py-1">특강 카탈로그 보기</button>
            </div>
          ) : (
            <ul className="space-y-1">
              {upcomingSpecials.map((s, i) => (
                <li key={i} className="border-b border-[#eee] py-1 text-xs text-[#333] last:border-b-0">
                  {fd(s.date)} {s.startTime}~{s.endTime} {s.courseName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="erp-card p-3">
          <h3 className="mb-2 font-semibold text-sm" style={{ borderBottom: "1px solid #ccc", paddingBottom: "6px" }}>원업 현황</h3>
          {oneUpRows.length === 0 ? (
            <div className="py-6 text-center">
              <p className="mb-2 text-xs text-[#999]">원업 수업을 신청하면 담당 선생님이 시간을 배정합니다</p>
              <button onClick={() => onGoTab("oneup")} className="erp-btn text-xs px-3 py-1">원업 카탈로그 보기</button>
            </div>
          ) : (
            <div className="-m-3 mt-1">
              <OneUpStatus rows={oneUpRows} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
