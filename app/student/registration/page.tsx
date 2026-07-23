import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getActivePeriod, getStudentOfferings, getRegistrations, getOfferingsByIds } from "@/lib/actions/queries";
import { Navbar } from "@/components/shared/Navbar";
import { StudentDashboard } from "@/components/student/StudentDashboard";

export default async function StudentRegistrationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STAFF" || user.role === "ADMIN") redirect("/staff/offerings");

  const period = await getActivePeriod();
  const offerings = await getStudentOfferings(user.id);
  const registrations = await getRegistrations(user.id);

  const regOfferingIds = registrations
    .filter((r) => r.status === "CONFIRMED")
    .map((r) => r.offeringId);
  const scheduleData = await getOfferingsByIds(regOfferingIds);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StudentDashboard
        userId={user.id}
        periodId={period?.id ?? 0}
        offerings={offerings}
        registrations={registrations}
        scheduleData={scheduleData}
        periodName={period?.name ?? ""}
      />
    </main>
  );
}
