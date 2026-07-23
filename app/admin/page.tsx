import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourses } from "@/lib/actions/courses";
import { getAllEnrollments } from "@/lib/actions/enrollments";
import { AdminCourseList } from "./AdminCourseList";
import { ExcelToolbar } from "@/components/ExcelToolbar";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/student");

  const [courses, enrollments] = await Promise.all([
    getCourses(),
    getAllEnrollments(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <ExcelToolbar />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">전체 수업</p>
          <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">전체 수강신청</p>
          <p className="text-2xl font-bold text-blue-600">{enrollments.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">현재 수강중</p>
          <p className="text-2xl font-bold text-green-600">
            {(enrollments as any[]).filter((e: any) => e.status === "enrolled").length}
          </p>
        </div>
      </div>

      {/* Courses */}
      <AdminCourseList courses={courses} />

      {/* Enrollments */}
      <div className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">전체 수강 내역</h2>
        {enrollments.length === 0 ? (
          <p className="text-gray-500">수강 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">학생</th>
                  <th className="px-4 py-3 font-medium text-gray-700">이메일</th>
                  <th className="px-4 py-3 font-medium text-gray-700">수업</th>
                  <th className="px-4 py-3 font-medium text-gray-700">상태</th>
                  <th className="px-4 py-3 font-medium text-gray-700">신청일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(enrollments as any[]).map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.student_email}</td>
                    <td className="px-4 py-3 text-gray-600">{e.course_title}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.status === "enrolled"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {e.status === "enrolled" ? "수강중" : "취소됨"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{e.enrolled_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
