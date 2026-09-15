import { SiteHeader } from "@/components/site-header";
import { ReadingTools } from "@/components/reading-tools";
import { ArtworkProvider } from "@/components/artwork-viewer";
import { Gallery } from "@/components/gallery";
import {
  Hero,
  Competition,
  NewsAndEducation,
  Footer,
  MobileBar,
} from "@/components/site-sections";

export default function HomePage() {
  return (
    <ArtworkProvider>
      <a className="skip" href="#main">
        본문 바로가기
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <ReadingTools />
        <Hero />
        <Competition />
        <Gallery />
        <NewsAndEducation />
      </main>
      <Footer />
      <MobileBar />
    </ArtworkProvider>
  );
}
