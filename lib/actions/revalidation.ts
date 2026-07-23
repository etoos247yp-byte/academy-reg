import { revalidatePath } from "next/cache";

export function revalidateRegistrationPaths() {
  revalidatePath("/student/registration");
  revalidatePath("/staff/offerings");
  revalidatePath("/staff/registrations");
  revalidatePath("/staff/one-up");
}
