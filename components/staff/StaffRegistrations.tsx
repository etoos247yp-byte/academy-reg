"use client";

interface Registration {
  id: number;
  userId: number;
  studentName: string;
  studentEmail: string;
  offeringId: number;
  status: string;
  enrolledAt: string | Date;
  courseName: string;
  category: string;
  waitlistSequence: number | null;
}

interface Props {
  registrations: Registration[];
}

export function StaffRegistrations({ registrations }: Props) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">수강 현황</h1>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium">학생</th>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">수업</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">대기순번</th>
              <th className="px-4 py-3 font-medium">신청일</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.studentName}</td>
                <td className="px-4 py-3 text-gray-500">{r.studentEmail}</td>
                <td className="px-4 py-3">{r.courseName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      r.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : r.status === "WAITLISTED"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.status === "CONFIRMED" ? "확정" : r.status === "WAITLISTED" ? "대기" : r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {r.waitlistSequence ?? "-"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(r.enrolledAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">수강신청 내역이 없습니다</p>
        )}
      </div>
    </div>
  );
}
