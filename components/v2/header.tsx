"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { Icon } from "@/components/icon";
import { ReadingTools } from "@/components/reading-tools";
import { closeOnBackdrop } from "@/lib/dialog";

const sections = [
  ["#competition", "공모전"],
  ["#winners", "수상작"],
  ["#certificate", "자격증"],
  ["#news", "협회 소식"],
] as const;

// 좁은 화면에서는 세 줄로 나뉘고, 넓은 화면에서는 한 줄로 이어진다.
export function BrandName() {
  return (
    <span className="brand-name">
      <span>한국청목</span>
      <span>캘리그라피</span>
      <span>예술협회</span>
    </span>
  );
}

export function Header() {
  const menuRef = useRef<HTMLDialogElement>(null);

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>) {
    menuRef.current?.close();
    const href = event.currentTarget.getAttribute("href");
    if (href?.startsWith("#")) {
      const target = document.getElementById(href.slice(1));
      // 브라우저의 앵커 스크롤은 그대로 두고, 키보드 초점만 섹션으로 옮긴다.
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    }
  }

  return (
    <>
      <header className="top">
        <div className="wrap top-inner">
          <a
            className="brand"
            href="#main"
            aria-label="한국청목캘리그라피예술협회 홈"
          >
            <Image src="/assets/logo.png" width="102" height="90" alt="" />
            <BrandName />
          </a>
          <nav className="top-nav" aria-label="주요 메뉴">
            {sections.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
            <a
              href="https://kcca-society.kr/about-history"
              target="_blank"
              rel="noopener"
            >
              협회 소개<span className="sr-only"> (새 창)</span>
            </a>
          </nav>
          <div className="top-tools">
            <a className="top-phone" href="tel:0318780503">
              <Icon name="phone" />
              <span>031-878-0503</span>
              <span className="sr-only">전화 문의</span>
            </a>
            <ReadingTools />
            <button
              type="button"
              className="menu-open"
              id="v2-menu-open"
              aria-haspopup="dialog"
              aria-controls="v2-menu"
              onClick={() => {
                const menu = menuRef.current;
                if (menu && !menu.open) menu.showModal();
              }}
            >
              메뉴
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>
      <dialog
        ref={menuRef}
        className="menu"
        id="v2-menu"
        aria-labelledby="v2-menu-title"
        onClick={closeOnBackdrop}
      >
        <div className="menu-head">
          <h2 id="v2-menu-title">메뉴</h2>
          <button
            type="button"
            className="menu-close"
            aria-label="메뉴 닫기"
            onClick={() => menuRef.current?.close()}
          >
            닫기
            <Icon name="close" />
          </button>
        </div>
        <nav className="menu-links" aria-label="전체 메뉴">
          {sections.map(([href, label]) => (
            <a key={href} href={href} onClick={handleNavigation}>
              {label}
              <Icon name="arrow-right" />
            </a>
          ))}
          <a
            href="https://kcca-society.kr/about-history"
            target="_blank"
            rel="noopener"
            onClick={handleNavigation}
          >
            협회 소개<span className="sr-only"> (새 창)</span>
            <Icon name="arrow-up-right" />
          </a>
          <a
            href="https://kcca-society.kr/54"
            target="_blank"
            rel="noopener"
            onClick={handleNavigation}
          >
            청목 스토어<span className="sr-only"> (새 창)</span>
            <Icon name="arrow-up-right" />
          </a>
        </nav>
        <a
          className="button button-pine menu-call"
          href="tel:0318780503"
          onClick={handleNavigation}
        >
          <Icon name="phone" />
          전화 문의 031-878-0503
        </a>
      </dialog>
    </>
  );
}
