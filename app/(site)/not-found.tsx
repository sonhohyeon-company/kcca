import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site-sections";
import { site } from "@/lib/site";

// notFound() in any site page (unknown board, missing post, page past the end).
// Next serves an empty error shell for these and renders this on the client, where the
// metadata title is lost, so the <title> is also set here.
const title = "페이지를 찾을 수 없습니다";
export const metadata: Metadata = {
  title,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <title>{`${title} | ${site.name}`}</title>
      <NotFoundContent />
    </>
  );
}
