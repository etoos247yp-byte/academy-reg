import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getStudents, getOfferingsByIds } from "@/lib/actions/queries";
import { Navbar } from "@/components/shared/Navbar";
import { StaffStudentList } from "@/components/staff/StaffStudentList";

export default async function StaffStudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/student/registration");

  const students = await getStudents();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StaffStudentList students={students} />
    </main>
  );
}
