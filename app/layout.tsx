import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "아카데미 수강 관리",
  description: "학원 수강 신청 및 관리 시스템",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
