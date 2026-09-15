import type { Metadata } from "next";
import "./globals.css";

// 루트 레이아웃이 두 개(시안 1·2)라 전역 404는 문서 전체를 직접 그린다.
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | 한국청목캘리그라피예술협회",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body>
        <main className="wrap section">
          <h1>페이지를 찾을 수 없습니다</h1>
          <p>주소를 다시 확인하거나 홈페이지에서 안내를 찾아보세요.</p>
          <a href="/" className="text-link">
            홈페이지로 돌아가기 →
          </a>
        </main>
      </body>
    </html>
  );
}
