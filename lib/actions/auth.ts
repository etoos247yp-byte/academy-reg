"use server";

import { getCurrentUser, createUserSession, destroySession } from "@/lib/auth/session";
import { db, schema } from "@/lib/db/connection";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function loginAction(email: string, password: string) {
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요" };
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    return { error: "이메일 또는 비밀번호가 일치하지 않습니다" };
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return { error: "이메일 또는 비밀번호가 일치하지 않습니다" };
  }

  await createUserSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  revalidatePath("/");
  return { success: true, role: user.role };
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
}
