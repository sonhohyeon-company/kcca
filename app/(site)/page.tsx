import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { ArtworkProvider, type Artwork } from "@/components/artwork-viewer";
import { Gallery } from "@/components/gallery";
import { HomePopup } from "@/components/home-popup";
import {
  Competition,
  Hero,
  NewsAndEducation,
} from "@/components/site-sections";
import { splitAwardTitle } from "@/lib/boards";
import { getSettings, latestPosts, type PostSummary } from "@/lib/db";
import { kstToday } from "@/lib/format";
import { safeHref, safeImageSrc } from "@/lib/markup";

// One URL for the home page, whatever query string a shared link carries.
export const metadata: Metadata = { alternates: { canonical: "/" } };

function toArtwork(post: PostSummary, src: string): Artwork {
  const { award, name } = splitAwardTitle(post.title);
  return {
    id: post.id,
    name,
    award,
    category: post.category,
    src,
    href: `/notice-gallery/${post.id}`,
    alt: [`${name}의`, post.category, award, "수상작"]
      .filter(Boolean)
      .join(" "),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // imweb footer links: /?mode=policy, /?mode=privacy
  const { mode } = await searchParams;
  if (mode === "policy") permanentRedirect("/policy");
  if (mode === "privacy") permanentRedirect("/privacy");

  const [settings, gallery, news, activities] = await Promise.all([
    getSettings(),
    latestPosts("notice-gallery", 6, true),
    latestPosts("notice-association", 3),
    latestPosts("association", 2, true),
  ]);
  // Only site-hosted covers: next/image rejects unknown remote hosts.
  const items = gallery.flatMap((post) => {
    const src = safeImageSrc(post.cover ?? "");
    return src ? [toArtwork(post, src)] : [];
  });
  const popupImage = safeImageSrc(settings.popupImage);
  const showPopup =
    settings.popupEnabled &&
    popupImage &&
    (settings.popupUntil === "" || kstToday() <= settings.popupUntil);

  return (
    <>
      {showPopup && (
        <HomePopup
          image={popupImage}
          alt={settings.popupAlt || "협회 알림"}
          link={safeHref(settings.popupLink)}
        />
      )}
      <ArtworkProvider items={items}>
        <Hero items={items} settings={settings} />
        <Competition settings={settings} />
        <Gallery items={items} />
        <NewsAndEducation news={news} activities={activities} />
      </ArtworkProvider>
    </>
  );
}
