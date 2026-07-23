import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

export type UserRole = "STUDENT" | "STAFF" | "ADMIN";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionData {
  user: SessionUser;
}

function sessionSecret(): string {
  if (process.env.TEST_MODE === "true") {
    return "test-secret-key-at-least-32-characters-long!!";
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return secret;
}

function getSession(): Promise<IronSession<SessionData>> {
  const all = cookies();
  const s = getIronSession<SessionData>(all, {
    password: sessionSecret(),
    cookieName: "academy-session",
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" },
  });
  return s;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function createUserSession(user: SessionUser): Promise<void> {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
