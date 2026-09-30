import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { getPage } from "@/lib/db";
import { renderBody } from "@/lib/markup";
import { site } from "@/lib/site";
import "../pages.css";

export const metadata: Metadata = {
  title: "조직도",
  description: `${site.name}의 조직과 임원을 안내합니다.`,
};

export default async function Page() {
  const page = await getPage("about-organization");
  return (
    <>
      <PageHero pathname="/about-organization" title={page.title} />
      <div className="wrap narrow page-body">
        {page.body.trim() ? (
          <div className="prose">{renderBody(page.body)}</div>
        ) : (
          <div className="page-section">
            <div className="notice-box">
              <p className="notice-title">조직도를 준비하고 있습니다.</p>
              <p>
                협회 조직과 임원 안내를 곧 이 페이지에 올려 드리겠습니다.
                궁금하신 점은 협회 사무국(<a href={site.tel}>{site.phone}</a>
                )으로 문의해 주십시오.
              </p>
            </div>
            <figure className="page-photo">
              <Image
                src="/assets/pages/organization-exhibition.webp"
                alt="전시장에 모인 협회 회원들과 행사에서 인사말을 하는 모습"
                width={1600}
                height={1200}
                sizes="(max-width: 900px) 100vw, 48rem"
              />
              <figcaption>협회 전시 행사</figcaption>
            </figure>
          </div>
        )}
      </div>
    </>
  );
}
