import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getStaffRegistrations } from "@/lib/actions/queries";
import { StaffRegistrations } from "@/components/staff/StaffRegistrations";

export default async function StaffRegistrationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/student/registration");

  const registrations = await getStaffRegistrations();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StaffRegistrations registrations={registrations} />
    </main>
  );
}
