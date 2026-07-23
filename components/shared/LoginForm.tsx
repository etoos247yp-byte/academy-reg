"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const form = new FormData();
    form.set("email", email);
    form.set("password", password);

    try {
      const res = await fetch("/api/auth/login", { method: "POST", body: form });
      const data = await res.json();

      if (data.success && data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-bold">수강신청 로그인</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
        이메일
      </label>
      <input
        id="email"
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="mb-4 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
        비밀번호
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={4}
        className="mb-6 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        로그인
      </button>
    </form>
  );
}
