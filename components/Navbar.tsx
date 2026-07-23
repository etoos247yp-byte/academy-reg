"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { LogOut, BookOpen, Shield } from "lucide-react";

interface NavbarProps {
  user: { name: string; role: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={user.role === "admin" ? "/admin" : "/student"} className="flex items-center gap-2 text-xl font-bold text-blue-600">
              <BookOpen className="h-6 w-6" />
              <span>아카데미</span>
            </Link>
            {user.role === "admin" ? (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  수업 관리
                </Link>
                <Link href="/admin/students" className="text-gray-600 hover:text-gray-900">
                  학생 목록
                </Link>
              </div>
            ) : (
              <Link href="/student" className="text-sm text-gray-600 hover:text-gray-900">
                수업 목록
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              {user.role === "admin" ? (
                <Shield className="h-4 w-4 text-red-500" />
              ) : null}
              {user.name}
              {user.role === "admin" ? " (관리자)" : " (학생)"}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
