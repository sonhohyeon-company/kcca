import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Hahmlet, IBM_Plex_Sans_KR } from "next/font/google";
import { DesignSwitch } from "@/components/design-switch";
import "./v2.css";
import "@/components/design-switch.css";

// 한글은 unicode-range 조각으로 쓰이는 글자만 내려받으므로 preload는 끈다(켜면 조각 수백 개를 미리 받는다).
const display = Hahmlet({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});
const text = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-text",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "한국청목캘리그라피예술협회 | 공모전과 자격증 안내",
  description:
    "대한민국 청목캘리그라피 공모전 참여 안내와 2025년 수상작, 청목캘리그라피 지도사 자격증 과정을 안내합니다.",
  metadataBase: new URL("https://kcca.hohyeon.dev"),
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "한국청목캘리그라피예술협회",
    title: "정성껏 쓴 한 획이 작품이 되는 자리 | 한국청목캘리그라피예술협회",
    description:
      "대한민국 청목캘리그라피 공모전 참여 안내와 수상작, 지도사 자격증 과정을 한곳에서 확인하세요.",
    url: "/v2/",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b4a43",
};

export default function DesignTwoLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${text.variable}`}>
      <body>
        {children}
        <DesignSwitch current="v2" />
      </body>
    </html>
  );
}
