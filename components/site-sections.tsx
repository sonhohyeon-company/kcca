import Image from "next/image";
import Link from "next/link";
import { artworkLabel } from "@/lib/boards";
import type { PostSummary, Settings } from "@/lib/db";
import { formatDate, isoDate } from "@/lib/format";
import { safeHref, safeImageSrc } from "@/lib/markup";
import { site } from "@/lib/site";
import { Icon } from "./icon";
import { ArtButton, type Artwork } from "./artwork-viewer";

function PostMeta({ post }: { post: PostSummary }) {
  return (
    <>
      {post.pinned && <strong className="pin">공지</strong>}
      {post.category && <span>{post.category}</span>}
      <time dateTime={isoDate(post.createdAt)}>
        {formatDate(post.createdAt)}
      </time>
    </>
  );
}

export function Hero({
  items,
  settings,
}: {
  items: Artwork[];
  settings: Settings;
}) {
  const pair = items.slice(0, 2);
  return (
    <section
      className={pair.length ? "hero wrap" : "hero wrap no-art"}
      aria-labelledby="hero-title"
    >
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
          <Link
            className="text-link"
            href={pair.length ? "#gallery" : "/notice-gallery"}
          >
            수상작 감상
            <Icon name="arrow-right" className="arrow" />
          </Link>
        </div>
        {settings.contestStatus && (
          <p className="hero-status">
            <strong>{settings.contestStatus}</strong>
            {settings.contestPeriod && (
              <span>접수 기간 {settings.contestPeriod}</span>
            )}
          </p>
        )}
      </div>
      {pair.length > 0 && (
        <figure className="hero-art">
          <div className="art-pair">
            {pair.map((art, index) => (
              <ArtButton
                key={art.id}
                className={index ? "art-sheet small" : "art-sheet"}
                artIndex={index}
                aria-label={`${artworkLabel(art)} 수상작 크게 보기`}
              >
                <span className="art-frame">
                  <Image
                    src={art.src}
                    alt={art.alt}
                    fill
                    sizes="(max-width: 600px) 45vw, (max-width: 1050px) 28vw, 340px"
                    fetchPriority="high"
                    loading="eager"
                  />
                </span>
              </ArtButton>
            ))}
          </div>
          <figcaption className="art-pair-caption">
            <span>
              {pair[0].category && (
                <>
                  {pair[0].category}
                  <br />
                </>
              )}
              {pair
                .map((art) => [art.name, art.award].filter(Boolean).join(" "))
                .join(" · ")}
            </span>
            <ArtButton className="caption-control" artIndex={0}>
              작품 보기
              <Icon name="expand" />
            </ArtButton>
          </figcaption>
        </figure>
      )}
    </section>
  );
}

export function Competition({ settings }: { settings: Settings }) {
  const link = safeHref(settings.contestLink) ?? "/notice-contest";
  return (
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
          {settings.contestStatus && (
            <span className="status">{settings.contestStatus}</span>
          )}
          {settings.contestTitle && (
            <h3 className="contest-title">{settings.contestTitle}</h3>
          )}
          {settings.contestPeriod && (
            <p className="contest-period">
              <span>접수 기간</span>
              {settings.contestPeriod}
            </p>
          )}
          {settings.contestNote && (
            <p className="status-note">{settings.contestNote}</p>
          )}
          {/^https?:/i.test(link) ? (
            <a className="btn" href={link} target="_blank" rel="noopener">
              공모요강 자세히 보기
              <Icon name="arrow-up-right" className="arrow" />
              <span className="sr-only"> (새 창)</span>
            </a>
          ) : (
            <Link className="btn" href={link}>
              공모요강 자세히 보기
              <Icon name="arrow-right" className="arrow" />
            </Link>
          )}
        </div>
        <div>
          <ol className="steps">
            <li>
              <div>
                <h3>공모요강 살펴보기</h3>
                <p>응모 자격과 접수 기간, 출품 부문을 먼저 확인하세요.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>작품과 제출 자료 준비하기</h3>
                <p>
                  요강에 맞춰 작품 규격과 제출 자료를 확인하고, 당신만의 글씨를
                  완성하세요.
                </p>
              </div>
            </li>
            <li>
              <div>
                <h3>안내된 방법으로 접수하기</h3>
                <p>
                  공모요강에 적힌 접수 방법과 마감일을 확인한 뒤 작품을
                  제출하세요.
                </p>
              </div>
            </li>
          </ol>
          <p className="help-line">
            <span>참여 방법이 궁금하다면</span>
            <a href={site.tel}>협회 문의 {site.phone}</a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function NewsAndEducation({
  news,
  activities,
}: {
  news: PostSummary[];
  activities: PostSummary[];
}) {
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
              <Link className="text-link" href="/notice-association">
                전체 보기
                <Icon name="arrow-right" className="arrow" />
              </Link>
            </div>
            {news.length ? (
              <ul className="news-list">
                {news.map((post) => (
                  <li key={post.id}>
                    <Link href={`/notice-association/${post.id}`}>
                      <div className="meta">
                        <PostMeta post={post} />
                      </div>
                      <h3>{post.title}</h3>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-note">아직 등록된 소식이 없습니다.</p>
            )}
          </div>
          <div>
            <div className="news-title">
              <h2>협회 활동</h2>
              <Link className="text-link" href="/association">
                활동 더 보기
                <Icon name="arrow-right" className="arrow" />
              </Link>
            </div>
            {activities.length ? (
              <div className="activity-list">
                {activities.map((post) => {
                  const cover = safeImageSrc(post.cover ?? "");
                  return (
                    <Link key={post.id} href={`/association/${post.id}`}>
                      <div className="activity-image">
                        {cover && (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            sizes="(max-width: 600px) 90vw, (max-width: 850px) 45vw, 340px"
                          />
                        )}
                      </div>
                      <h3>{post.title}</h3>
                      <p className="meta">
                        <PostMeta post={post} />
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="empty-note">아직 등록된 활동이 없습니다.</p>
            )}
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
            <Link className="btn secondary" href="/certificate-guide">
              자격증 안내
              <Icon name="arrow-right" className="arrow" />
            </Link>
            <Link className="btn secondary" href="/branches">
              지부·교육기관
              <Icon name="arrow-right" className="arrow" />
            </Link>
            <Link className="btn secondary" href="/application-form">
              시험 접수 신청
              <Icon name="arrow-right" className="arrow" />
            </Link>
            <a
              className="btn secondary"
              href={site.youtube}
              target="_blank"
              rel="noopener"
            >
              유튜브 채널
              <Icon name="arrow-up-right" className="arrow" />
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
          <p className="mission">
            캘리그라피의 교육을 통한 저변확대 및 대한민국 캘리그라피의 비전을
            제시하는 사단법인 {site.name}입니다.
          </p>
          <Link className="text-link" href="/about-history">
            한국청목캘리그라피예술협회 소개
            <Icon name="arrow-right" className="arrow" />
          </Link>
        </section>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <a
            className="brand"
            href="#main"
            aria-label="한국청목캘리그라피예술협회 맨 위로"
          >
            <Image src="/assets/logo.png" width="102" height="90" alt="KCCA" />
            <span className="brand-name">
              <span>한국청목</span>
              <span>캘리그라피예술협회</span>
            </span>
          </a>
          <div className="footer-contact">
            <a className="phone" href={site.tel}>
              {site.phone}
            </a>
            <a className="email" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>
        </div>
        <div className="footer-legal">
          <div>
            <p>
              법인명 : {site.legalName} ·{" "}
              <span className="nowrap">대표 : {site.representative}</span>
            </p>
            <p>사업자등록번호 : {site.businessNumber}</p>
            <address>
              ({site.postcode}) {site.address}
            </address>
          </div>
          <div className="policies">
            <Link href="/policy">이용약관</Link>
            <Link className="privacy" href="/privacy">
              개인정보처리방침
            </Link>
            <Link href="/about-map">오시는 길</Link>
            <a href={site.youtube} target="_blank" rel="noopener">
              유튜브 채널<span className="sr-only"> (새 창)</span>
            </a>
          </div>
        </div>
        <p className="copyright">© 2026 {site.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function MobileBar() {
  return (
    <nav className="mobile-bar" aria-label="빠른 연결">
      <a className="mobile-call" href={site.tel}>
        전화 문의
      </a>
      <Link className="btn" href="/notice-contest">
        공모전 안내
        <Icon name="arrow-right" />
      </Link>
    </nav>
  );
}

/** Korean 404 body for app/(site)/not-found.tsx and app/global-not-found.tsx. */
export function NotFoundContent() {
  return (
    <div className="wrap narrow">
      <div className="page-hero">
        <p className="eyebrow">404</p>
        <h1 className="page-title">페이지를 찾을 수 없습니다</h1>
        <p>
          주소가 바뀌었거나 없어진 페이지입니다. 홈페이지에서 원하시는 안내를
          찾아보세요.
        </p>
      </div>
      <div className="not-found-actions">
        <Link className="btn" href="/">
          홈페이지로 가기
          <Icon name="arrow-right" className="arrow" />
        </Link>
        <a className="btn secondary" href={site.tel}>
          전화 문의 {site.phone}
        </a>
      </div>
    </div>
  );
}
