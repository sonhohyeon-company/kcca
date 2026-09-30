import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ReadingTools } from "@/components/reading-tools";
import { SiteHeader } from "@/components/site-header";
import { Footer, MobileBar } from "@/components/site-sections";
import { fontVariables } from "@/lib/fonts";
import { currentMember } from "@/lib/members";
import { enabledProviders } from "@/lib/oauth";
import { gaId, indexingAllowed, site, siteUrl } from "@/lib/site";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  await connection(); // env is read per request, so one build serves preview and production
  const indexing = indexingAllowed();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${site.name} | 한 획에서 시작되는 예술`,
      template: `%s | ${site.name}`,
    },
    description:
      "한국청목캘리그라피예술협회. 대한민국 청목캘리그라피 공모전 안내와 수상작, 교육·자격검정, 협회 소식을 만나보세요.",
    // Every page's own path without the query (?utm_…, ?page=); posts and the home page set their own.
    alternates: { canonical: "./" },
    // og:title and og:description follow each page's title and description.
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: site.name,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `한 획의 진심, 예술로 피어나다 — ${site.name}`,
        },
      ],
    },
    robots: { index: indexing, follow: indexing },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f8f4",
};

// Applies the saved large-text preference before first paint (ReadingTools keeps it in sync).
const largeTextScript = `try{if(localStorage.getItem("kcca-large-text")==="true")document.documentElement.classList.add("large-text")}catch(e){}`;

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const member = await currentMember();
  const ga = gaId();
  return (
    <html
      lang="ko"
      className={fontVariables}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: largeTextScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          본문 바로가기
        </a>
        <SiteHeader
          member={member && { name: member.name }}
          login={enabledProviders().length > 0}
        />
        <main id="main" tabIndex={-1}>
          <ReadingTools />
          {children}
        </main>
        <Footer />
        <MobileBar />
        {ga && (
          // Google Analytics 4; page views on in-site navigation come from its enhanced measurement.
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
