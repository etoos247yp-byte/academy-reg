import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getActivePeriod, getAllOfferings, getInstructors } from "@/lib/actions/queries";
import { StaffOfferings } from "@/components/staff/StaffOfferings";
import { ExcelToolbar } from "@/components/staff/ExcelToolbar";

export default async function StaffOfferingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/student/registration");

  const period = await getActivePeriod();
  const offerings = await getAllOfferings();
  const instructors = await getInstructors();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <ExcelToolbar />
      <div className="mt-4">
        <StaffOfferings
          periodId={period?.id ?? 0}
          periodName={period?.name ?? ""}
          offerings={offerings}
          instructors={instructors}
        />
      </div>
    </main>
  );
}
