import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer, NotFoundContent } from "@/components/site-sections";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import "./globals.css";

// Two root layouts (site and admin), so the global 404 draws the whole document itself.
// notFound() inside the site uses app/(site)/not-found.tsx with the same content.
export const metadata: Metadata = {
  title: `페이지를 찾을 수 없습니다 | ${site.name}`,
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ko" className={fontVariables}>
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link className="brand" href="/" aria-label={`${site.name} 홈`}>
              <Image
                src="/assets/logo-kcca.png"
                width="275"
                height="44"
                alt="한국청목캘리그라피예술협회"
                loading="eager"
              />
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <NotFoundContent />
        </main>
        <Footer />
      </body>
    </html>
  );
}
