"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type SyntheticEvent } from "react";
import { findMenu, menu, type MenuItem } from "@/lib/boards";
import { closeOnBackdrop } from "@/lib/dialog";
import { site } from "@/lib/site";
import { Icon } from "./icon";

export function SiteHeader({
  member,
  login,
}: {
  /** The logged-in member (from the server layout), or null. */
  member: { name: string } | null;
  /** False until at least one login provider is configured: then no 로그인 link is shown. */
  login: boolean;
}) {
  const pathname = usePathname() ?? "";
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const found = findMenu(pathname);
  const current = (item: MenuItem) =>
    item === found?.item
      ? pathname === item.href
        ? "page"
        : "true"
      : undefined;

  function closeGroups(except?: Element) {
    navRef.current?.querySelectorAll("details[open]").forEach((group) => {
      if (group !== except) (group as HTMLDetailsElement).open = false;
    });
  }

  function closeMenu() {
    menuRef.current?.close();
  }

  useEffect(() => {
    const header = headerRef.current;
    if (!header || !("ResizeObserver" in window)) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        "--header-measured",
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // A new page closes the dropdowns and the mobile menu.
  useEffect(() => {
    closeGroups();
    closeMenu();
  }, [pathname]);

  // Escape or a click outside the desktop menu closes an open dropdown.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const open = navRef.current?.querySelector("details[open]");
      if (event.key !== "Escape" || !open) return;
      closeGroups();
      open.querySelector("summary")?.focus();
    }
    function onClick(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) closeGroups();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // Where 로그인 leads: back to this page afterwards, except from home and the login page itself.
  const account = member
    ? "/mypage"
    : pathname === "/" || pathname.startsWith("/login")
      ? "/login"
      : `/login?next=${encodeURIComponent(pathname)}`;

  // `name="gnb"` keeps one dropdown open in current browsers; this covers older ones.
  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open) closeGroups(event.currentTarget);
  }

  return (
    <>
      <header ref={headerRef} className="site-header">
        <div className="wrap header-inner">
          <Link
            className="brand"
            href="/"
            aria-label="한국청목캘리그라피예술협회 홈"
          >
            <Image
              src="/assets/logo-kcca.png"
              width="275"
              height="44"
              alt="한국청목캘리그라피예술협회"
              loading="eager"
            />
          </Link>
          <nav
            ref={navRef}
            className="desktop-nav"
            aria-label="주요 메뉴"
            onClick={(event) => {
              // Also close when the link points at the page already shown.
              if ((event.target as Element).closest("a")) closeGroups();
            }}
            onBlur={(event) => {
              // Tabbing out closes the dropdown. A null target (a click on the
              // page) is left to the document click listener.
              const next = event.relatedTarget;
              if (next && !event.currentTarget.contains(next)) closeGroups();
            }}
          >
            {menu.map((group) => (
              <details
                key={group.title}
                className="nav-group"
                name="gnb"
                onToggle={handleToggle}
              >
                <summary
                  aria-current={group === found?.group ? "true" : undefined}
                >
                  {group.title}
                </summary>
                <ul className="submenu">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} aria-current={current(item)}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </nav>
          {(member || login) && (
            <Link className="header-account" href={account}>
              {member ? "마이페이지" : "로그인"}
            </Link>
          )}
          <button
            className="menu-open"
            id="menu-open"
            type="button"
            onClick={() => {
              if (menuRef.current && !menuRef.current.open)
                menuRef.current.showModal();
            }}
            aria-label="전체 메뉴 열기"
            aria-haspopup="dialog"
            aria-controls="menu-dialog"
          >
            <span>메뉴</span>
            <Icon name="menu" />
          </button>
        </div>
      </header>
      <dialog
        ref={menuRef}
        onClick={closeOnBackdrop}
        className="menu-dialog"
        id="menu-dialog"
        aria-labelledby="menu-title"
      >
        <div className="dialog-header">
          <h2 id="menu-title">전체 메뉴</h2>
          <button
            className="dialog-close"
            type="button"
            onClick={closeMenu}
            aria-label="전체 메뉴 닫기"
          >
            <span>닫기</span>
            <Icon name="close" />
          </button>
        </div>
        <nav className="menu-links" aria-label="모바일 주요 메뉴">
          {(member || login) && (
            <Link className="menu-account" href={account} onClick={closeMenu}>
              {member ? `${member.name} 님 · 마이페이지` : "로그인 · 회원가입"}
              <Icon name="arrow-right" />
            </Link>
          )}
          {menu.map((group) => (
            <div key={group.title} className="menu-group">
              <h3>{group.title}</h3>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={current(item)}
                >
                  {item.title}
                  <Icon name="arrow-right" />
                </Link>
              ))}
            </div>
          ))}
          <a onClick={closeMenu} className="btn" href={site.tel}>
            협회에 문의하기 · {site.phone}
          </a>
        </nav>
      </dialog>
    </>
  );
}
