import Link from "next/link";
import { findMenu } from "@/lib/boards";

/**
 * Title block and section sub-navigation for every public page except home.
 * `pathname` is the page's own path (e.g. "/notice-association" or "/certificate-guide-2").
 */
export function PageHero({
  pathname,
  title,
  lead,
  titleAs: Title = "h1",
}: {
  pathname: string;
  title?: string;
  lead?: string;
  /** "p" when the page has its own h1 (e.g. a post title). */
  titleAs?: "h1" | "p";
}) {
  const found = findMenu(pathname);
  const current = (href: string) =>
    pathname === href
      ? "page"
      : pathname.startsWith(`${href}/`)
        ? "true"
        : undefined;
  return (
    <>
      <header className="page-hero wrap">
        {found && <p className="eyebrow">{found.group.title}</p>}
        <Title className="page-title">{title ?? found?.item.title}</Title>
        {lead && <p>{lead}</p>}
      </header>
      {found && (
        <nav
          className="subnav wrap"
          aria-label={`${found.group.title} 하위 메뉴`}
        >
          <ul>
            {found.group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={
                    item === found.item
                      ? (current(item.href) ?? "true")
                      : undefined
                  }
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {found?.item.items && (
        <nav
          className="subnav chips wrap"
          aria-label={`${found.item.title} 종류`}
        >
          <ul>
            {found.item.items.map((sub) => (
              <li key={sub.href}>
                <Link href={sub.href} aria-current={current(sub.href)}>
                  {sub.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
