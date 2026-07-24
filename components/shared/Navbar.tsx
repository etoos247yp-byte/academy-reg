"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth/session";

interface Props {
  user: SessionUser | null;
}

export function Navbar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  if (!user) return null;

  const linkClass = (path: string) =>
    `px-3 py-1.5 text-sm border border-transparent ${
      isActive(path)
        ? "bg-white border-[#336699] text-[#336699] font-semibold"
        : "text-[#333] hover:bg-white hover:border-[#ccc]"
    }`;

  return (
    <nav style={{ background: "#ddd", borderBottom: "1px solid #bbb" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          <Link href="/" className="text-base font-bold mr-4" style={{ color: "#2b5797" }}>
            이투스247
          </Link>
          {user.role !== "STUDENT" ? (
            <div className="flex gap-0">
              <Link href="/staff/offerings" className={linkClass("/staff/offerings")}>수업 관리</Link>
              <Link href="/staff/registrations" className={linkClass("/staff/registrations")}>수강 현황</Link>
              <Link href="/staff/one-up" className={linkClass("/staff/one-up")}>원업 관리</Link>
              <Link href="/staff/students" className={linkClass("/staff/students")}>학생 목록</Link>
              <Link href="/staff/instructors" className={linkClass("/staff/instructors")}>강사 관리</Link>
            </div>
          ) : (
            <Link href="/student/registration" className={linkClass("/student/registration")}>
              수강신청
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span style={{ color: "#333" }}>{user.name}</span>
          <span className="erp-badge erp-badge-info">
            {user.role === "ADMIN" ? "관리자" : user.role === "STAFF" ? "직원" : "학생"}
          </span>
          <button onClick={handleLogout} style={{ color: "#666", background: "none", border: "none", cursor: "pointer" }}>
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
