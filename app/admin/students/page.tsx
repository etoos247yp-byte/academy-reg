import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudents } from "@/lib/actions/enrollments";

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/student");

  const students = await getStudents();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">학생 목록</h1>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">이름</th>
              <th className="px-4 py-3 font-medium text-gray-700">이메일</th>
              <th className="px-4 py-3 font-medium text-gray-700">연락처</th>
              <th className="px-4 py-3 font-medium text-gray-700">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(students as any[]).map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                <td className="px-4 py-3 text-gray-600">{s.phone || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{s.created_at}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  등록된 학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
