"use client";

import { useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-green-600 text-5xl">&#10003;</div>
          <h2 className="text-xl font-bold text-gray-900">회원가입 완료</h2>
          <p className="mt-2 text-sm text-gray-500">이제 로그인할 수 있습니다.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <UserPlus className="h-10 w-10 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <input name="email" type="email" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input name="password" type="password" required minLength={6} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">이름</label>
            <input name="name" type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">연락처 (선택)</label>
            <input name="phone" type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            <UserPlus className="h-4 w-4" />
            회원가입
          </button>

          <p className="text-center text-xs text-gray-400">
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="text-blue-600 hover:underline">로그인</a>
          </p>
        </form>
      </div>
    </div>
  );
}
