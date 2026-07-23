import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourses } from "@/lib/actions/courses";
import { getMyEnrollments } from "@/lib/actions/enrollments";
import { CourseCard } from "@/components/CourseCard";

export default async function StudentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");

  const [courses, myEnrollments] = await Promise.all([
    getCourses(),
    getMyEnrollments(),
  ]);

  const enrolledCourseIds = new Set(
    (myEnrollments as any[]).map((e: any) => e.course_id)
  );

  return (
    <div>
      {/* My Enrollments */}
      {myEnrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xl font-bold text-gray-900">내 수강 목록</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(myEnrollments as any[]).map((enrollment: any) => (
              <div key={enrollment.id} className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="font-semibold text-gray-900">{enrollment.title}</p>
                <p className="text-sm text-gray-600">{enrollment.schedule}</p>
                <p className="text-sm text-gray-500">{enrollment.location}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Catalog */}
      <h2 className="mb-3 text-xl font-bold text-gray-900">수업 목록</h2>
      {courses.length === 0 ? (
        <p className="text-gray-500">등록된 수업이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(courses as any[]).map((course: any) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourseIds.has(course.id)}
              enrolledCourseIds={enrolledCourseIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
