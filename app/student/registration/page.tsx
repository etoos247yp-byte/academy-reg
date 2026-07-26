import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getActivePeriod, getStudentOfferings, getRegistrations, getOfferingsByIds, getActiveRegistrationWindow, getRegistrationLockStatus, getOneUpStatus, getRegistrationHistory } from "@/lib/actions/queries";
import { StudentDashboard } from "@/components/student/StudentDashboard";

export default async function StudentRegistrationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STAFF" || user.role === "ADMIN") redirect("/staff/offerings");

  const period = await getActivePeriod();
  const offerings = await getStudentOfferings(user.id);
  const registrations = await getRegistrations(user.id);
  const window = await getActiveRegistrationWindow();
  const lockStatus = await getRegistrationLockStatus(user.id);
  const oneUpStatus = await getOneUpStatus(user.id);
  const history = await getRegistrationHistory(user.id);

  const regOfferingIds = registrations
    .filter((r) => r.status === "CONFIRMED" || r.status === "WAITLISTED")
    .map((r) => r.offeringId);
  const scheduleData = await getOfferingsByIds(regOfferingIds);

  // Fetch sessions for all offerings to display in expanded cards
  const allOfferingIds = offerings.map((o) => o.id);
  const allScheduleData = await getOfferingsByIds(allOfferingIds);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {period ? (
        <StudentDashboard
          userId={user.id}
          periodId={period.id}
          offerings={offerings}
          registrations={registrations}
          scheduleData={scheduleData}
          periodName={period.name}
          windowClosesAt={window?.closesAt ?? null}
          offeringSchedules={allScheduleData}
          lockStatus={lockStatus}
          oneUpStatus={oneUpStatus}
          history={history}
        />
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-600">현재 활성화된 수강신청 학기가 없습니다.</p>
          <p className="mt-1 text-xs text-gray-400">관리자에게 문의해주세요.</p>
        </div>
      )}
    </main>
  );
}
