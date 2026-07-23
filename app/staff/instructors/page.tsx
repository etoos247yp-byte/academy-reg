import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getInstructors, getAllOfferings } from "@/lib/actions/queries";
import { StaffInstructors } from "@/components/staff/StaffInstructors";

export default async function StaffInstructorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/student/registration");

  const instructors = await getInstructors();
  const offerings = await getAllOfferings();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StaffInstructors instructors={instructors} offerings={offerings} />
    </main>
  );
}
