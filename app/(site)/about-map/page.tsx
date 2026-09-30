import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { site } from "@/lib/site";
import "../pages.css";

export const metadata: Metadata = {
  title: "오시는길",
  description: `${site.name} 오시는 길: (${site.postcode}) ${site.address}, 전화 ${site.phone}`,
};

// Same searches as the imweb page; encodeURI only escapes the spaces and Korean text.
const mapLinks = [
  ["카카오맵으로 보기", "https://map.kakao.com/link/search/경기도 의정부시 서부로 545"],
  ["네이버맵으로 보기", "https://map.naver.com/v5/search/경기도 의정부시 서부로 545 창업관"],
  ["구글맵으로 보기", "https://maps.google.com/?q=경기도+의정부시+서부로+545"],
] as const;
const tmapLink = "tmap://search?name=경기도 의정부시 서부로 545 창업관";

// 마을버스 carry their "마을" label in the text itself.
const buses = ["7", "8", "11", "25-1", "31", "35", "39", "106-1", "360", "마을 205", "마을 208"];

export default function Page() {
  return (
    <>
      <PageHero pathname="/about-map" />
      <div className="wrap page-body">
        <section className="page-section map-top" aria-labelledby="address-title">
          <figure className="map-photo">
            <Image
              src="/assets/pages/map-building.webp"
              alt="협회 사무국이 있는 창업관 건물 외관"
              width={1600}
              height={1045}
              sizes="(max-width: 850px) 100vw, 50vw"
              loading="eager"
            />
          </figure>
          <div>
            <h2 id="address-title">주소</h2>
            <p className="address-main">{site.address}</p>
            <dl className="contact-list">
              <div>
                <dt>우편번호</dt>
                <dd>{site.postcode}</dd>
              </div>
              <div>
                <dt>전화</dt>
                <dd>
                  <a href={site.tel}>{site.phone}</a>
                </dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </dd>
              </div>
            </dl>
            <ul className="map-links" aria-label="지도 서비스에서 위치 보기">
              {mapLinks.map(([label, href]) => (
                <li key={label}>
                  <a className="btn secondary" href={encodeURI(href)} target="_blank" rel="noopener noreferrer">
                    {label}
                    <span className="sr-only"> (새 창)</span>
                    <Icon name="arrow-up-right" />
                  </a>
                </li>
              ))}
              <li>
                <a className="btn secondary" href={encodeURI(tmapLink)} aria-describedby="tmap-hint">
                  티맵으로 보기
                  <Icon name="arrow-up-right" />
                </a>
                <p className="hint" id="tmap-hint">
                  휴대폰에 티맵 앱이 설치되어 있을 때 열립니다.
                </p>
              </li>
            </ul>
          </div>
          <figure className="page-photo map-figure">
            <a href={encodeURI(mapLinks[0][1])} target="_blank" rel="noopener noreferrer">
              <Image
                src="/assets/pages/map.webp"
                alt="경민대학교(서부로 545) 위치 지도, 카카오맵에서 크게 보기"
                width={1240}
                height={520}
                sizes="(max-width: 1300px) 100vw, 1240px"
              />
              <span className="sr-only"> (새 창)</span>
            </a>
            <figcaption>
              지도를 누르면 카카오맵이 새 창으로 열립니다. 지도 ©{" "}
              <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자
            </figcaption>
          </figure>
        </section>
        <section className="split" aria-labelledby="transit-title">
          <h2 id="transit-title">교통 안내</h2>
          <div className="route-grid">
            <div>
              <h3>지하철</h3>
              <p className="route-main">
                <span className="route-chip">1호선</span> 가능역 하차
              </p>
              <p>
                2번 출구로 나와 도보 약 <strong>10분</strong> (800m)
              </p>
              <p>
                서울역 / 청량리역에서
                <br />
                직통 이용 가능
              </p>
            </div>
            <div>
              <h3>버스</h3>
              <p className="route-main">가능역·성베드로병원 정류장</p>
              <ul className="tag-list" aria-label="버스 번호">
                {buses.map((bus) => (
                  <li key={bus}>{bus}</li>
                ))}
              </ul>
              <p>
                가능역 하차 후 도보 약 <strong>10분</strong>
              </p>
            </div>
            <div>
              <h3>자가용 / 주차</h3>
              <p className="route-main">창업관 내 주차장 이용</p>
              <p>
                내비게이션 검색
                <br />
                <strong>「의정부 창업관」</strong> 또는
                <br />
                <strong>「서부로 545」</strong>
              </p>
              <p>
                건물 도착 후 창업관 내 엘리베이터 이용,
                <br />
                6층 651호
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
