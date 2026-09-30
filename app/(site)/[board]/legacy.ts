import { isBoardSlug, legacyBoards } from "@/lib/boards";

/**
 * Where an old imweb board URL lives now, or null when it needs no redirect.
 * Renamed boards (/25, /notice-gallery-20xx) move to their new board; detail links
 * /<board>/?idx=173353821&bmode=view go to /<board>/173353821 (imported posts keep idx as id).
 */
export function legacyRedirect(
  slug: string,
  query: Record<string, string | string[] | undefined>,
): string | null {
  const idx =
    typeof query.idx === "string" && /^\d{1,15}$/.test(query.idx)
      ? query.idx
      : "";
  if (Object.hasOwn(legacyBoards, slug)) {
    const { board, category } = legacyBoards[slug];
    if (idx) return `/${board}/${idx}`;
    return category
      ? `/${board}?category=${encodeURIComponent(category)}`
      : `/${board}`;
  }
  return idx && isBoardSlug(slug) ? `/${slug}/${idx}` : null;
}
