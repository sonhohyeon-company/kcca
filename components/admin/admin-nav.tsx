"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "게시글" },
  { href: "/admin/pages/about-organization", label: "페이지" },
  { href: "/admin/settings", label: "사이트 설정" },
  { href: "/admin/applications", label: "시험 접수 신청서" },
];

// "/admin/posts/12" → "/admin/posts": a link is current anywhere in its section.
const section = (path: string) => path.split("/").slice(0, 3).join("/");

function AdminNav({ pathname }: { pathname: string }) {
  return (
    <nav className="admin-nav" aria-label="관리 메뉴">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={
                pathname === link.href
                  ? "page"
                  : section(pathname) === section(link.href)
                    ? "true"
                    : undefined
              }
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <a href="/" target="_blank" rel="noopener noreferrer">
            사이트 보기<span className="sr-only"> (새 창)</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}

export function CurrentAdminNav() {
  return <AdminNav pathname={usePathname() ?? ""} />;
}
