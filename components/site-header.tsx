"use client";

import Image from "next/image";
import { useEffect, useRef, type MouseEvent } from "react";
import { Icon } from "./icon";
import { closeOnBackdrop } from "@/lib/dialog";

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);

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

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>) {
    menuRef.current?.close();
    const href = event.currentTarget.getAttribute("href");
    if (href?.startsWith("#")) {
      const target = document.getElementById(href.slice(1));
      // Native anchor scrolling remains intact; move keyboard focus to the section.
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    }
  }

  return (
    <>
      <header ref={headerRef} className="site-header">
        <div className="wrap header-inner">
          <a
            className="brand"
            href="#main"
            aria-label="한국청목캘리그라피예술협회 홈"
          >
            <Image src="/assets/logo.png" width="102" height="90" alt="KCCA" />
            <span className="brand-name">
              <span>한국청목</span>
              <span>캘리그라피예술협회</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label="주요 메뉴">
            <a href="#competition">공모전</a>
            <a href="#gallery">수상작 갤러리</a>
            <a href="#education">교육·자격검정</a>
            <a href="#news">협회소식</a>
            <a
              href="https://kcca-society.kr/about-history"
              target="_blank"
              rel="noopener"
            >
              협회소개<span className="sr-only"> (새 창)</span>
            </a>
          </nav>
          <a className="btn header-action" href="#competition">
            공모전 안내
            <Icon name="arrow-right" />
          </a>
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
            onClick={() => menuRef.current?.close()}
            aria-label="전체 메뉴 닫기"
          >
            <span>닫기</span>
            <Icon name="close" />
          </button>
        </div>
        <nav className="menu-links" aria-label="모바일 주요 메뉴">
          <a onClick={handleNavigation} href="#competition">
            공모전 안내
            <Icon name="arrow-right" />
          </a>
          <a onClick={handleNavigation} href="#gallery">
            수상작 갤러리
            <Icon name="arrow-right" />
          </a>
          <a onClick={handleNavigation} href="#education">
            교육·자격검정
            <Icon name="arrow-right" />
          </a>
          <a onClick={handleNavigation} href="#news">
            협회소식·활동
            <Icon name="arrow-right" />
          </a>
          <a
            onClick={handleNavigation}
            href="https://kcca-society.kr/about-history"
            target="_blank"
            rel="noopener"
          >
            협회소개
            <Icon name="arrow-up-right" />
            <span className="sr-only"> (새 창)</span>
          </a>
          <a
            onClick={handleNavigation}
            href="https://kcca-society.kr/54"
            target="_blank"
            rel="noopener"
          >
            청목 스토어
            <Icon name="arrow-up-right" />
            <span className="sr-only"> (새 창)</span>
          </a>
          <a onClick={handleNavigation} className="btn" href="tel:0318780503">
            협회에 문의하기 · 031-878-0503
          </a>
        </nav>
      </dialog>
    </>
  );
}
