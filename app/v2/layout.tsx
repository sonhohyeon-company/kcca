import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DesignSwitch } from "@/components/design-switch";
import "./fonts.css";
import "./v2.css";
import "@/components/design-switch.css";

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
    images: [
      {
        url: "/og-v2.png",
        width: 1200,
        height: 630,
        alt: "정성껏 쓴 한 획이 작품이 되는 자리 — 한국청목캘리그라피예술협회",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b4a43",
};

export default function DesignTwoLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <DesignSwitch current="v2" />
      </body>
    </html>
  );
}
