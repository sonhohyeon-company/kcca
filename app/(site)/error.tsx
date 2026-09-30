"use client";

import { site } from "@/lib/site";

// Renders inside the site layout, so the header and footer stay. A failed
// generateMetadata leaves no <title>, so it is set here as in not-found.tsx.
export default function SiteError() {
  return (
    <div className="wrap narrow">
      <title>{`잠시 문제가 생겼습니다 | ${site.name}`}</title>
      <div className="page-hero">
        <h1 className="page-title">잠시 문제가 생겼습니다</h1>
        <p>
          페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. 계속 안 되면
          협회로 전화 주세요.
        </p>
      </div>
      <div className="not-found-actions">
        <button
          type="button"
          className="btn"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
        <a className="btn secondary" href={site.tel}>
          전화 문의 {site.phone}
        </a>
      </div>
    </div>
  );
}
