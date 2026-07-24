import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db/connection";
import { createUserSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { MOCK_USER, MOCK_STAFF } from "@/lib/db/mock-data";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = form.get("email")?.toString() ?? "";
  const password = form.get("password")?.toString() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요" }, { status: 400 });
  }

  // TEST_MODE: fast login bypass for development (no DB needed)
  if (process.env.TEST_MODE === "true") {
    if (email === "12345" && password === "12345") {
      await createUserSession(MOCK_USER);
      return NextResponse.json({ success: true, redirect: "/student/registration" });
    }
    if (email === "1234" && password === "1234") {
      await createUserSession(MOCK_STAFF);
      return NextResponse.json({ success: true, redirect: "/staff/offerings" });
    }
  }

  // Real DB authentication
  try {
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
  } catch {
    // DB connection failed — if TEST_MODE didn't match either, return error
    if (process.env.TEST_MODE === "true") {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
