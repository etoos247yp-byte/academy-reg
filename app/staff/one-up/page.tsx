import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OneUpBoard } from "@/components/staff/OneUpBoard";

export default async function StaffOneUpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/student/registration");

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <OneUpBoard />
    </main>
  );
}
