import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "한국청목캘리그라피예술협회 | 한 획에서 시작되는 예술",
  description:
    "한국청목캘리그라피예술협회. 대한민국 청목캘리그라피 공모전 안내와 수상작, 교육·자격검정, 협회 소식을 만나보세요.",
  metadataBase: new URL(
    "https://kcca-calligraphy-preview.ohssomio.chatgpt.site",
  ),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f3",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
