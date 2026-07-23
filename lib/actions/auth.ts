"use server";

import { getDb } from "@/lib/db/connection";
import { getSession } from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/schemas";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  await session.save();

  return { success: true, role: user.role as string };
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password, name, phone } = parsed.data;
  const db = getDb();

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return { error: "이미 등록된 이메일입니다" };
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, 'student')"
  ).run(email, hash, name, phone || "");

  return { success: true };
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  return { success: true };
}
