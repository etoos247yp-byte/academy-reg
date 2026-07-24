import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/shared/Navbar";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "이투스247이천기숙학원",
  description: "수강신청 시스템",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased" style={{ background: "#ececec", color: "#222", fontSize: "14px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif" }}>
        {user && <Navbar user={user} />}
        {children}
      </body>
    </html>
  );
}
