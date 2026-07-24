"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

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
      if (data.error) setError(data.error);
    } catch {
      setError("로그인 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#ececec" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm erp-card p-8">
        <h1 className="mb-6 text-center text-xl font-bold" style={{ color: "#2b5797" }}>수강신청 로그인</h1>
        {error && (
          <div className="mb-4 border border-[#a80000] bg-[#fff0f0] p-2 text-sm" style={{ color: "#a80000" }}>
            {error}
          </div>
        )}
        <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: "#333" }}>
          이메일
        </label>
        <input
          id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="mb-4 w-full border border-[#adadad] px-3 py-1.5 text-sm outline-none focus:border-[#336699]"
        />
        <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: "#333" }}>
          비밀번호
        </label>
        <input
          id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4}
          className="mb-6 w-full border border-[#adadad] px-3 py-1.5 text-sm outline-none focus:border-[#336699]"
        />
        <button type="submit" disabled={loading}
          className="w-full erp-btn-primary py-2 text-sm font-semibold disabled:opacity-50">
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
