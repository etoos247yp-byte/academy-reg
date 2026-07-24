import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db/connection";
import { createUserSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = form.get("email")?.toString() ?? "";
  const password = form.get("password")?.toString() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요" }, { status: 400 });
  }

  // Always authenticate against the real database.
  // TEST_MODE only affects page display data, not authentication.
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (!user) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다" }, { status: 401 });
  }

  await createUserSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const redirectTo = user.role === "STUDENT" ? "/student/registration" : "/staff/offerings";
  return NextResponse.json({ success: true, redirect: redirectTo });
}
