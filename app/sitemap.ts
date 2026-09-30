import type { MetadataRoute } from "next";
import { boards, certificateGuides, isBoardSlug } from "@/lib/boards";
import { listPosts } from "@/lib/db";
import { siteUrl } from "@/lib/site";

const pages = [
  "/",
  "/about-history",
  "/about-greetings",
  "/about-organization",
  "/about-map",
  "/certificate-guide",
  ...certificateGuides.map((guide) => guide.href),
  "/application-form",
  "/policy",
  "/privacy",
  ...Object.keys(boards).map((slug) => `/${slug}`),
];

// listPosts awaits connection(), so this is built per request from the live DB.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await listPosts({ perPage: 50000 }); // ponytail: sitemap protocol cap; split with generateSitemaps past 50k posts
  const base = siteUrl().replace(/\/+$/, "");
  return [
    ...pages.map((path) => ({ url: `${base}${path}` })),
    ...posts
      .filter((post) => isBoardSlug(post.board))
      .map((post) => ({
        url: `${base}/${post.board}/${post.id}`,
        lastModified: post.updatedAt,
      })),
  ];
}
