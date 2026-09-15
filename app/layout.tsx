import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "한국청목캘리그라피예술협회 | 한 획에서 시작되는 예술",
  description:
    "한국청목캘리그라피예술협회. 대한민국 청목캘리그라피 공모전 안내와 수상작, 교육·자격검정, 협회 소식을 만나보세요.",
  metadataBase: new URL("https://kcca.hohyeon.dev"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "한국청목캘리그라피예술협회",
    title: "한 획의 진심, 예술로 피어나다 | 한국청목캘리그라피예술협회",
    description:
      "대한민국 청목캘리그라피 공모전 안내와 수상작 감상, 교육·자격검정 소식을 한곳에서 만나보세요.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "한 획의 진심, 예술로 피어나다 — 한국청목캘리그라피예술협회",
      },
    ],
  },
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
