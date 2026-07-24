"use client";

export function OneUpBoard() {
  return (
    <div>
      <h1 className="text-lg font-bold mb-1" style={{ color: "#2b5797" }}>원업 관리</h1>
      <p className="text-sm text-[#666] mb-4">1:1 수업 시간 배정 및 대기 관리</p>
      <div className="erp-card p-8 text-center">
        <p className="text-sm text-[#999]">아직 등록된 원업 수강생이 없습니다.</p>
        <p className="mt-1 text-xs text-[#aaa]">학생이 원업 수업을 신청하면 이곳에서 시간 배정과 선생님 지정이 가능합니다.</p>
      </div>
    </div>
  );
}
