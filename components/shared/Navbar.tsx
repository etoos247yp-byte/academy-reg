"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-blue-700">
            이투스247
          </Link>
          {user.role !== "STUDENT" ? (
            <div className="flex gap-4 text-sm">
              <Link
                href="/staff/offerings"
                className={`px-2 py-1 rounded ${isActive("/staff/offerings") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900"}`}
              >
                수업 관리
              </Link>
              <Link
                href="/staff/registrations"
                className={`px-2 py-1 rounded ${isActive("/staff/registrations") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900"}`}
              >
                수강 현황
              </Link>
              <Link
                href="/staff/one-up"
                className={`px-2 py-1 rounded ${isActive("/staff/one-up") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900"}`}
              >
                원업 관리
              </Link>
              <Link
                href="/staff/students"
                className={`px-2 py-1 rounded ${isActive("/staff/students") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900"}`}
              >
                학생 목록
              </Link>
              <Link
                href="/staff/instructors"
                className={`px-2 py-1 rounded ${isActive("/staff/instructors") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900"}`}
              >
                강사 관리
              </Link>
            </div>
          ) : (
            <Link
              href="/student/registration"
              className={`px-2 py-1 rounded text-sm ${isActive("/student/registration") ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900"}`}
            >
              수강신청
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{user.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {user.role === "ADMIN" ? "관리자" : user.role === "STAFF" ? "직원" : "학생"}
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
