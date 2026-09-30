import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPage } from "@/lib/db";
import { formatDate, isoDate } from "@/lib/format";
import { renderBody } from "@/lib/markup";
import { pageDefaults } from "@/lib/page-defaults";
import { site } from "@/lib/site";
import "../pages.css";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${site.name} 홈페이지 개인정보처리방침`,
};

export default async function Page() {
  const page = await getPage("privacy");
  // The drafted default stands in until the admin saves a body.
  const saved = page.body.trim() ? page.body : null;
  return (
    <>
      <PageHero pathname="/privacy" title={page.title} />
      <div className="wrap narrow page-body">
        {saved && page.updatedAt && (
          <p className="meta updated">
            최종 수정일 <time dateTime={isoDate(page.updatedAt)}>{formatDate(page.updatedAt)}</time>
          </p>
        )}
        <div className="prose">{renderBody(saved ?? pageDefaults.privacy)}</div>
      </div>
    </>
  );
}
