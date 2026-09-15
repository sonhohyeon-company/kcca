import { ArtworkProvider } from "@/components/artwork-viewer";
import { Header } from "@/components/v2/header";
import {
  About,
  Certificate,
  Competition,
  Footer,
  Hero,
  MobileBar,
  News,
  Winners,
} from "@/components/v2/sections";

export default function DesignTwoPage() {
  return (
    <ArtworkProvider>
      <a className="skip" href="#main">
        본문 바로가기
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Competition />
        <Winners />
        <Certificate />
        <News />
        <About />
      </main>
      <Footer />
      <MobileBar />
    </ArtworkProvider>
  );
}
