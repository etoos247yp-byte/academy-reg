import type { SessionUser, UserRole } from "@/lib/auth/session";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new AuthorizationError("로그인이 필요합니다");
  }
  return user;
}

export function requireRole(user: SessionUser | null, roles: UserRole[]): SessionUser {
  const authed = requireAuth(user);
  if (!roles.includes(authed.role)) {
    throw new AuthorizationError("권한이 없습니다");
  }
  return authed;
}

export function requireStaff(user: SessionUser | null): SessionUser {
  return requireRole(user, ["STAFF", "ADMIN"]);
}

export function requireAdmin(user: SessionUser | null): SessionUser {
  return requireRole(user, ["ADMIN"]);
}
