import Image from "next/image";
import { Icon } from "./icon";
import { ArtButton } from "./artwork-viewer";

export function Hero() {
  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            <span>한 획의 진심,</span>
            <span>
              <em>예술</em>로 피어나다.
            </span>
          </h1>
          <p className="hero-desc">
            <strong>대한민국 청목캘리그라피 공모전</strong>당신의 마음을 담은
            글씨,
            <br />
            청목에서 하나의 작품으로 만나보세요.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#competition">
              공모전 참여 안내
              <Icon name="arrow-right" className="arrow" />
            </a>
            <a className="text-link" href="#gallery">
              수상작 감상
              <Icon name="arrow-right" className="arrow" />
            </a>
          </div>
          <p className="hero-status">
            <strong>공모요강 준비중</strong>
            <span>접수 일정은 공식 공지에서 안내합니다.</span>
          </p>
        </div>
        <figure className="hero-art">
          <div className="art-pair">
            <ArtButton
              className="art-sheet"
              artIndex={0}
              aria-label="김현희 은상 수상작 크게 보기"
            >
              <Image
                src="/assets/award-kim-hyunhee.webp"
                alt="꽃과 유려한 붓글씨로 구성한 김현희의 캘리그라피 수상작"
                width="684"
                height="1333"
                fetchPriority="high"
                loading="eager"
              />
            </ArtButton>
            <ArtButton
              className="art-sheet small"
              artIndex={1}
              aria-label="장순덕 은상 수상작 크게 보기"
            >
              <Image
                src="/assets/award-jang-soondeok.webp"
                alt="세로로 길게 흐르는 장순덕의 캘리그라피 수상작"
                width="665"
                height="1334"
                fetchPriority="high"
                loading="eager"
              />
            </ArtButton>
          </div>
          <figcaption className="art-pair-caption">
            <span>
              2025 대한민국 청목캘리그라피 공모전
              <br />
              김현희 · 장순덕, 은상
            </span>
            <ArtButton className="caption-control" artIndex={0}>
              작품 보기
              <Icon name="expand" />
            </ArtButton>
          </figcaption>
        </figure>
      </section>
    </>
  );
}

export function Competition() {
  return (
    <>
      <section
        className="participate"
        id="competition"
        tabIndex={-1}
        aria-labelledby="competition-title"
      >
        <div className="wrap participate-grid">
          <div>
            <div className="section-heading">
              <h2 id="competition-title">공모전 참여 안내</h2>
              <p>
                처음 참여하셔도 차근차근.
                <br />
                아래 순서로 준비해 보세요.
              </p>
            </div>
            <span className="status">공모요강 준비중</span>
            <p className="status-note">
              접수 일정과 제출 방법은 아직 게시되지 않았습니다. 공식 게시판에서
              새 안내를 확인해 주세요.
            </p>
            <a
              className="btn"
              href="https://kcca-society.kr/notice-contest"
              target="_blank"
              rel="noopener"
            >
              공식 공지 확인
              <Icon name="arrow-up-right" className="arrow" />
              <span className="sr-only"> (새 창)</span>
            </a>
          </div>
          <div>
            <ol className="steps">
              <li>
                <div>
                  <h3>공모요강 살펴보기</h3>
                  <p>
                    새 공지가 올라오면 응모 자격과 접수 기간, 출품 부문을 먼저
                    확인하세요.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h3>작품과 제출 자료 준비하기</h3>
                  <p>
                    발표된 요강에 맞춰 작품 규격과 제출 자료를 확인하고,
                    당신만의 글씨를 완성하세요.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h3>안내된 방법으로 접수하기</h3>
                  <p>
                    공식 공지에 기재된 접수 방법과 마감 시간을 확인한 뒤 작품을
                    제출하세요.
                  </p>
                </div>
              </li>
            </ol>
            <p className="help-line">
              <span>참여 방법이 궁금하다면</span>
              <a href="tel:0318780503">협회 문의 031-878-0503</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export function NewsAndEducation() {
  return (
    <>
      <section
        className="section wrap"
        id="news"
        tabIndex={-1}
        aria-label="협회 소식과 활동"
      >
        <div className="news-layout">
          <div>
            <div className="news-title">
              <h2>청목의 소식</h2>
              <a
                className="text-link"
                href="https://kcca-society.kr/notice-association"
                target="_blank"
                rel="noopener"
              >
                전체 보기
                <Icon name="arrow-up-right" />
                <span className="sr-only"> (새 창)</span>
              </a>
            </div>
            <ul className="news-list">
              <li>
                <a
                  href="https://kcca-society.kr/notice-association/?idx=173568854&bmode=view"
                  target="_blank"
                  rel="noopener"
                >
                  <div className="meta">
                    <span>출간 소식</span>
                    <time dateTime="2026-08-30">2026.08.30</time>
                  </div>
                  <h3>
                    청목 긴책 신간 출간
                    <br />
                    청목정체 · 청목아름체 · 청목바름체
                  </h3>
                  <span className="sr-only"> (새 창)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://kcca-society.kr/notice-association/?idx=173461003&bmode=view"
                  target="_blank"
                  rel="noopener"
                >
                  <div className="meta">
                    <span>협회 안내</span>
                    <time dateTime="2026-08-26">2026.08.26</time>
                  </div>
                  <h3>한국청목캘리그라피협회 공식 유튜브 채널 안내</h3>
                  <span className="sr-only"> (새 창)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://kcca-society.kr/notice-association/?idx=173353821&bmode=view"
                  target="_blank"
                  rel="noopener"
                >
                  <div className="meta">
                    <span>협회 안내</span>
                    <time dateTime="2026-08-23">2026.08.23</time>
                  </div>
                  <h3>한국청목캘리그라피협회 공식 홈페이지 오픈</h3>
                  <span className="sr-only"> (새 창)</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="news-title">
              <h2>협회 활동</h2>
              <a
                className="text-link"
                href="https://kcca-society.kr/association"
                target="_blank"
                rel="noopener"
              >
                활동 더 보기
                <Icon name="arrow-up-right" />
                <span className="sr-only"> (새 창)</span>
              </a>
            </div>
            <div className="activity-list">
              <a
                href="https://kcca-society.kr/association/?idx=174003766&bmode=view"
                target="_blank"
                rel="noopener"
              >
                <div className="activity-image">
                  <Image
                    src="/assets/activity-pocheon.webp"
                    alt="2026 포천 인문도시 페스티벌의 캘리그라피 전시 부스"
                    width="701"
                    height="934"
                    loading="lazy"
                  />
                </div>
                <h3>2026 포천 인문도시 페스티벌</h3>
                <p>캘리그라피 작품 전시 및 홍보</p>
                <span className="sr-only"> (새 창)</span>
              </a>
              <a
                href="https://kcca-society.kr/association/?idx=173461152&bmode=view"
                target="_blank"
                rel="noopener"
              >
                <div className="activity-image">
                  <Image
                    src="/assets/activity-writing.webp"
                    alt="캘리그라피 이름써주기 외부활동 현장"
                    width="701"
                    height="934"
                    loading="lazy"
                  />
                </div>
                <h3>캘리그라피 이름써주기</h3>
                <p>마음을 전하는 협회 외부활동</p>
                <span className="sr-only"> (새 창)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="wrap">
        <section
          className="learning"
          id="education"
          tabIndex={-1}
          aria-labelledby="education-title"
        >
          <div>
            <h2 id="education-title">배움에서 작품으로 이어지는 길</h2>
            <p>캘리그라피 교육과 자격검정 안내를 확인해 보세요.</p>
          </div>
          <div className="learning-links">
            <a
              className="btn secondary"
              href="https://kcca-society.kr/certificate-guide"
              target="_blank"
              rel="noopener"
            >
              자격증 안내
              <Icon name="arrow-up-right" />
              <span className="sr-only"> (새 창)</span>
            </a>
            <a
              className="btn secondary"
              href="https://kcca-society.kr/25"
              target="_blank"
              rel="noopener"
            >
              지부·교육기관
              <Icon name="arrow-up-right" />
              <span className="sr-only"> (새 창)</span>
            </a>
          </div>
        </section>
        <section className="closing" aria-label="협회 소개">
          <p>
            글씨를 배우고, 마음을 나누고.
            <br />
            청목은 그 곁에 있습니다.
          </p>
          <a
            className="text-link"
            href="https://kcca-society.kr/about-history"
            target="_blank"
            rel="noopener"
          >
            한국청목캘리그라피예술협회 소개
            <Icon name="arrow-up-right" />
            <span className="sr-only"> (새 창)</span>
          </a>
        </section>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <>
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-top">
            <a
              className="brand"
              href="#main"
              aria-label="한국청목캘리그라피예술협회 맨 위로"
            >
              <Image
                src="/assets/logo.png"
                width="102"
                height="90"
                alt="KCCA"
              />
              <span className="brand-name">
                <span>한국청목</span>
                <span>캘리그라피예술협회</span>
              </span>
            </a>
            <div className="footer-contact">
              <a className="phone" href="tel:0318780503">
                031-878-0503
              </a>
              <a className="email" href="mailto:kccasociety@gmail.com">
                kccasociety@gmail.com
              </a>
            </div>
          </div>
          <div className="footer-legal">
            <div>
              <p>법인명 : (사)한국청목캘리그라피예술협회 · 대표 : 김상돈</p>
              <p>사업자등록번호 : 861-82-00740</p>
              <address>(11618) 경기도 의정부시 서부로 545 창업관 651호</address>
            </div>
            <div className="policies">
              <a
                href="https://kcca-society.kr/?mode=policy"
                target="_blank"
                rel="noopener"
              >
                이용약관<span className="sr-only"> (새 창)</span>
              </a>
              <a
                href="https://kcca-society.kr/?mode=privacy"
                target="_blank"
                rel="noopener"
              >
                개인정보처리방침<span className="sr-only"> (새 창)</span>
              </a>
              <a
                href="https://kcca-society.kr/about-map"
                target="_blank"
                rel="noopener"
              >
                오시는 길<span className="sr-only"> (새 창)</span>
              </a>
              <a
                href="https://kcca-society.kr/54"
                target="_blank"
                rel="noopener"
              >
                청목 스토어<span className="sr-only"> (새 창)</span>
              </a>
            </div>
          </div>
          <p className="copyright">
            © 2026 한국청목캘리그라피예술협회. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

export function MobileBar() {
  return (
    <>
      <div className="mobile-bar">
        <a className="mobile-call" href="tel:0318780503">
          전화 문의
        </a>
        <a className="btn" href="#competition">
          공모전 안내
          <Icon name="arrow-right" />
        </a>
      </div>
    </>
  );
}
