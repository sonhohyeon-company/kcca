import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CurrentAdminNav } from "@/components/admin/admin-nav";
import { isAdmin } from "@/lib/auth";
import { fontVariables } from "@/lib/fonts";
import { logoutAction } from "./actions";
import "../globals.css";
import "./admin.css";

export const metadata: Metadata = {
  title: { template: "%s | 관리자", default: "관리자" },
  robots: { index: false, follow: false },
};

// Only decides whether to show the menu. Not a security boundary: every admin page
// and action calls requireAdmin() itself.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // A failing database must not break this root layout: app/admin/error.tsx can then explain.
  const admin = await isAdmin().catch(() => false);
  return (
    <html lang="ko" className={fontVariables} data-scroll-behavior="smooth">
      <body>
        <a className="skip" href="#main">
          본문 바로가기
        </a>
        {admin && (
          <header className="admin-bar">
            <div className="wrap">
              <p className="admin-brand">KCCA 관리자</p>
              <CurrentAdminNav />
              <form action={logoutAction}>
                <button type="submit" className="admin-logout">
                  로그아웃
                </button>
              </form>
            </div>
          </header>
        )}
        <main id="main" tabIndex={-1} className="admin-main wrap">
          {children}
        </main>
      </body>
    </html>
  );
}
