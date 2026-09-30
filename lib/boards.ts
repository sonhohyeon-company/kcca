// Boards, site menu and imweb URL aliases. Board slugs keep the imweb paths so old links still work.

type BoardLayout = "list" | "artwork" | "photo";

export const boards = {
  "notice-association": { title: "협회공지", layout: "list" },
  association: { title: "협회활동", layout: "photo" },
  branches: { title: "지부·교육기관", layout: "photo" },
  "notice-communication": { title: "소통공간", layout: "list" },
  "certificate-notice": { title: "자격증 공지", layout: "list" },
  "certificate-register": { title: "시험일정·접수", layout: "list" },
  "notice-contest": { title: "공모요강", layout: "list" },
  "notice-gallery": { title: "수상작 갤러리", layout: "artwork" },
  "notice-judge": { title: "심사결과발표", layout: "list" },
  "notice-membership": { title: "정기 회원전", layout: "photo" },
  "membership-gallery": { title: "작가 갤러리", layout: "artwork" },
} as const satisfies Record<string, { title: string; layout: BoardLayout }>;

export type BoardSlug = keyof typeof boards;
type Board = (typeof boards)[BoardSlug] & { slug: BoardSlug };

export const isBoardSlug = (slug: string): slug is BoardSlug =>
  Object.hasOwn(boards, slug);

export const getBoard = (slug: string): Board | null =>
  isBoardSlug(slug) ? { ...boards[slug], slug } : null;

// Old imweb board paths that now live elsewhere. `?idx=` detail links keep working
// because imported posts keep their imweb idx as id.
export const legacyBoards: Record<
  string,
  { board: BoardSlug; category?: string }
> = {
  "25": { board: "branches" },
  "notice-gallery-2025": {
    board: "notice-gallery",
    category: "2025 대한민국 청목캘리그라피 공모전",
  },
  "notice-gallery-2024": {
    board: "notice-gallery",
    category: "2024 韓•中국제 청목캘리그라피 공모전",
  },
};

export const certificateGuides = [
  { href: "/certificate-guide-1", title: "청목정체" },
  { href: "/certificate-guide-2", title: "청목봄체" },
  { href: "/certificate-guide-3", title: "청목소망체" },
  { href: "/certificate-guide-4", title: "청목아름체" },
  { href: "/certificate-guide-5", title: "청목바름체" },
  { href: "/certificate-guide-6", title: "S급 지도사" },
] as const;

export type MenuItem = {
  title: string;
  href: string;
  items?: readonly { title: string; href: string }[];
};
type MenuGroup = { title: string; items: readonly MenuItem[] };

export const menu: readonly MenuGroup[] = [
  {
    title: "협회소개",
    items: [
      { title: "협회소개", href: "/about-history" },
      { title: "인사말", href: "/about-greetings" },
      { title: "조직도", href: "/about-organization" },
      { title: "오시는길", href: "/about-map" },
    ],
  },
  {
    title: "협회활동",
    items: [
      { title: "협회공지", href: "/notice-association" },
      { title: "협회활동", href: "/association" },
      { title: "지부·교육기관", href: "/branches" },
      { title: "소통공간", href: "/notice-communication" },
    ],
  },
  {
    title: "교육·자격검정",
    items: [
      {
        title: "자격증 안내",
        href: "/certificate-guide",
        items: certificateGuides,
      },
      { title: "자격증 공지", href: "/certificate-notice" },
      { title: "시험일정·접수", href: "/certificate-register" },
    ],
  },
  {
    title: "전국공모전",
    items: [
      { title: "공모요강", href: "/notice-contest" },
      { title: "수상작 갤러리", href: "/notice-gallery" },
      { title: "심사결과발표", href: "/notice-judge" },
    ],
  },
  {
    title: "아카이브·갤러리",
    items: [
      { title: "정기 회원전", href: "/notice-membership" },
      { title: "작가 갤러리", href: "/membership-gallery" },
    ],
  },
];

const matches = (href: string, pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** The menu group and item a path belongs to, e.g. for sub-navigation and aria-current. */
export function findMenu(pathname: string) {
  for (const group of menu) {
    for (const item of group.items) {
      if (
        matches(item.href, pathname) ||
        item.items?.some((sub) => matches(sub.href, pathname))
      ) {
        return { group, item };
      }
    }
  }
  return null;
}

/** Artwork titles are "<상훈>_<작가명>" (e.g. "은상_김현희"); other titles come back as the name. */
export function splitAwardTitle(title: string): {
  award: string | null;
  name: string;
} {
  const at = title.indexOf("_");
  const award = title.slice(0, at).trim();
  const name = title.slice(at + 1).trim();
  return at > 0 && award && name
    ? { award, name }
    : { award: null, name: title };
}

/** "김현희 · 은상", or just the name when the title has no award. Plain module so server components can call it. */
export const artworkLabel = (art: { name: string; award: string | null }) =>
  art.award ? `${art.name} · ${art.award}` : art.name;

/** Up to `span` page numbers around `current`, e.g. pageRange(9, 10) → [6, 7, 8, 9, 10]. */
export function pageRange(current: number, last: number, span = 5) {
  const start = Math.max(
    1,
    Math.min(current - Math.floor(span / 2), last - span + 1),
  );
  const end = Math.min(last, start + span - 1);
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, i) => start + i,
  );
}
