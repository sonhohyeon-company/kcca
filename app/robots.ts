import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { indexingAllowed, siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection(); // read ALLOW_INDEXING at request time, not at build
  return indexingAllowed()
    ? {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${siteUrl().replace(/\/+$/, "")}/sitemap.xml`,
      }
    : {
        // Link-preview scrapers may still read pages (they carry noindex), so KakaoTalk previews can be checked.
        rules: [
          {
            userAgent: ["kakaotalk-scrap", "facebookexternalhit", "Twitterbot"],
            allow: "/",
          },
          { userAgent: "*", disallow: "/" },
        ],
      };
}
