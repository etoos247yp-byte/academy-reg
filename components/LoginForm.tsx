"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";
import { LogIn, BookOpen } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(result.role === "admin" ? "/admin" : "/student");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <BookOpen className="h-10 w-10 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="text-sm text-gray-500">아카데미 수강 관리 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4" />
            로그인
          </button>

          <p className="text-center text-xs text-gray-400">
            관리자: admin@academy.com / admin123
            <br />
            학생: student@test.com / student123
          </p>
        </form>
      </div>
    </div>
  );
}
