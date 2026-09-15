import Image from "next/image";
import { Icon } from "@/components/icon";
import { ArtButton } from "@/components/artwork-viewer";
import { BrandName } from "@/components/v2/header";
import { artworks, artworkAlt, type Artwork } from "@/lib/artworks";

const site = "https://kcca-society.kr";
const phone = "031-878-0503";
const phoneHref = "tel:0318780503";

function External({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener">
      {children}
      <Icon name="arrow-up-right" />
      <span className="sr-only"> (새 창)</span>
    </a>
  );
}

// 정적 내보내기라 next/image가 크기별 파일을 만들지 않으므로 400px 변형을 직접 고른다.
function ArtworkImage({
  art,
  sizes,
  eager,
}: {
  art: Artwork;
  sizes: string;
  eager?: boolean;
}) {
  return (
    <img
      src={art.src}
      srcSet={`${art.src.replace(".webp", "-400.webp")} 400w, ${art.src} ${art.width}w`}
      sizes={sizes}
      width={art.width}
      height={art.height}
      alt={artworkAlt(art)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}

export function Hero() {
  return (
    <section className="wall" aria-labelledby="hero-title">
      <div className="wrap wall-inner">
        <div className="wall-copy">
          <h1 id="hero-title">정성껏 쓴 한 획이 작품이 되는 자리</h1>
          <p className="lead">
            대한민국 청목캘리그라피 공모전은 최근 3년 동안 해마다 열렸습니다.
            2026년 공모요강은 준비 중이며, 발표되는 대로 이 페이지에서
            안내합니다.
          </p>
          <div className="actions">
            <a className="button button-paper" href="#competition">
              공모전 안내 보기
            </a>
            <a className="button button-ghost" href="#winners">
              수상작 감상하기
            </a>
          </div>
          <p className="wall-status">
            <span className="stamp" aria-hidden="true">
              2026
            </span>
            <span>
              <strong>2026년 공모요강 준비 중</strong>
              <br />
              공식 공지에 게시되면 이곳에서도 바로 안내합니다.
            </span>
          </p>
        </div>
        <div className="wall-art">
          {artworks.slice(0, 2).map((art, index) => (
            <figure key={art.id} className="hang">
              <ArtButton
                artIndex={index}
                aria-label={`${art.name} 은상 수상작 크게 보기`}
              >
                <ArtworkImage
                  art={art}
                  sizes="(max-width: 900px) 45vw, 19vw"
                  eager
                />
              </ArtButton>
              <figcaption>{art.name}, 은상</figcaption>
            </figure>
          ))}
          <p className="wall-note">
            2025 대한민국 청목캘리그라피 공모전 수상작
          </p>
        </div>
      </div>
    </section>
  );
}

const steps = [
  ["공모요강 확인", "응모 자격, 접수 기간, 출품 부문을 먼저 확인합니다."],
  [
    "작품 준비",
    "요강에 적힌 규격에 맞춰 작품을 완성하고 제출 자료를 갖춥니다.",
  ],
  ["접수", "안내된 방법과 마감 시간에 맞춰 작품을 제출합니다."],
  ["심사와 발표", "심사 결과는 심사결과발표 게시판에 올라옵니다."],
  ["시상과 전시", "수상작은 수상작 갤러리에서 소개됩니다."],
];

const pastContests = [
  ["2025", "대한민국 청목캘리그라피 공모전", `${site}/notice-gallery-2025`],
  ["2024", "韓·中 국제 청목캘리그라피 공모전", `${site}/notice-gallery-2024`],
  ["2023", "청목캘리그라피 공모전 수상작", `${site}/notice-gallery-2023`],
];

export function Competition() {
  return (
    <section
      className="section"
      id="competition"
      tabIndex={-1}
      aria-labelledby="competition-title"
    >
      <div className="wrap">
        <div className="section-head">
          <h2 id="competition-title">공모전 참여 안내</h2>
          <p>
            처음 참여하셔도 순서만 알아 두시면 됩니다. 요강이 나오면 아래
            순서대로 준비해 보세요.
          </p>
        </div>
        <div className="notice">
          <h3>2026년 공모요강 준비 중</h3>
          <p>
            접수 기간, 출품 부문, 작품 규격은 공식 공지에 게시됩니다. 궁금한
            점은 협회로 전화 주시면 안내해 드립니다.
          </p>
          <div className="actions">
            <External
              className="button button-pine"
              href={`${site}/notice-contest`}
            >
              공식 공지 확인
            </External>
            <a className="button button-line" href={phoneHref}>
              <Icon name="phone" />
              {phone}
            </a>
          </div>
        </div>
        <div className="competition-grid">
          <div>
            <h3>참여 순서</h3>
            <ol className="steps">
              {steps.map(([title, body]) => (
                <li key={title}>
                  <div>
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="past">
            <h3>지난 공모전</h3>
            <ul>
              {pastContests.map(([year, name, href]) => (
                <li key={year}>
                  <External href={href}>
                    <strong>{year}</strong>
                    <span>{name}</span>
                  </External>
                </li>
              ))}
            </ul>
            <p className="past-note">
              수상작 갤러리에서 해마다 어떤 작품이 상을 받았는지 볼 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Winners() {
  return (
    <section
      className="section section-mount"
      id="winners"
      tabIndex={-1}
      aria-labelledby="winners-title"
    >
      <div className="wrap">
        <div className="section-head">
          <h2 id="winners-title">2025년 수상작</h2>
          <p>
            은상 수상작 세 점을 소개합니다. 작품을 누르면 크게 볼 수 있고,
            확대해서 획 하나하나를 살펴볼 수 있습니다.
          </p>
        </div>
        <ul className="works">
          {artworks.map((art, index) => (
            <li key={art.id}>
              <ArtButton
                artIndex={index}
                aria-label={`${art.name} 은상 수상작 크게 보기`}
              >
                <ArtworkImage
                  art={art}
                  sizes="(max-width: 600px) 60vw, (max-width: 900px) 30vw, 20vw"
                />
              </ArtButton>
              <h3>
                {art.name}
                <span>은상</span>
              </h3>
              <p>{art.description}</p>
            </li>
          ))}
        </ul>
        <p className="more">
          <External className="text-link" href={`${site}/notice-gallery-2025`}>
            2025년 수상작 전체 보기
          </External>
        </p>
      </div>
    </section>
  );
}

const grades = [
  {
    step: "1",
    name: "청목정체 2급",
    sub: "기초 과정",
    body: "획과 자음 구조를 익히며 서체의 기본 원리를 배웁니다.",
  },
  {
    step: "2",
    name: "청목정체 1급",
    sub: "문장 구성과 조형 표현",
    body: "문장을 구성하고 조형으로 표현하는 힘을 기르며 지도자의 기본 역량을 갖춥니다.",
  },
  {
    step: "3",
    name: "전문 서체 4종 1급",
    sub: "봄체, 소망체, 아름체, 바름체",
    body: "둥근 마카의 봄체, 사각 마카의 소망체, 붓과 붓펜의 아름체, 정갈한 필서의 바름체를 차례로 배웁니다.",
  },
  {
    step: "S",
    name: "청목 S급 지도사",
    sub: "최고 등급",
    body: "다섯 가지 지도사 과정을 모두 마친 분에게 주어집니다. 이론시험 25문항과 실기시험(문장 작품 2회분)을 거칩니다.",
  },
];

const learning = [
  [
    "온라인과 오프라인 병행",
    "온라인 강의와 오프라인 집합 교육을 함께 운영합니다.",
  ],
  ["급수별 교재와 영상", "각 급수에 맞는 전용 교재와 영상 강의를 제공합니다."],
  [
    "지정 교육기관 강의",
    "지도사가 되면 협회 지정 교육기관에서 강의할 수 있습니다.",
  ],
  ["전시와 작품 활동", "자격시험 응시와 전시, 작품 활동으로 이어집니다."],
];

export function Certificate() {
  return (
    <section
      className="section"
      id="certificate"
      tabIndex={-1}
      aria-labelledby="certificate-title"
    >
      <div className="wrap">
        <div className="section-head">
          <h2 id="certificate-title">자격증 안내</h2>
          <p>
            청목캘리그라피 지도사 자격은 네 단계로 올라갑니다. 기초부터 차례대로
            배우고, 지도사가 되면 강의와 전시 활동을 시작할 수 있습니다.
          </p>
        </div>
        {/* 왼쪽에서 오른쪽으로 높아지는 계단: 순서가 곧 그림이다. */}
        <ol className="grades">
          {grades.map((grade) => (
            <li key={grade.name}>
              <span className="grade-step" aria-hidden="true">
                {grade.step}
              </span>
              <h3>
                {grade.name}
                <small>{grade.sub}</small>
              </h3>
              <p>{grade.body}</p>
            </li>
          ))}
        </ol>
        <div className="actions cert-actions">
          <External
            className="button button-pine"
            href={`${site}/certificate-guide`}
          >
            자격증 안내 전체 보기
          </External>
          <External
            className="button button-line"
            href={`${site}/certificate-register`}
          >
            시험 일정과 접수
          </External>
        </div>
      </div>
      <div className="wrap learn">
        <h3>교육은 이렇게 진행됩니다</h3>
        <ul className="learn-list">
          {learning.map(([title, body]) => (
            <li key={title}>
              <h4>{title}</h4>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const posts = [
  {
    date: "2026-08-30",
    label: "2026년 8월 30일",
    title: "청목 긴책 신간 출간 (청목정체, 청목아름체, 청목바름체)",
    href: `${site}/notice-association/?idx=173568854&bmode=view`,
  },
  {
    date: "2026-08-26",
    label: "2026년 8월 26일",
    title: "한국청목캘리그라피협회 공식 유튜브 채널 안내",
    href: `${site}/notice-association/?idx=173461003&bmode=view`,
  },
  {
    date: "2026-08-23",
    label: "2026년 8월 23일",
    title: "한국청목캘리그라피협회 공식 홈페이지 오픈 안내",
    href: `${site}/notice-association/?idx=173353821&bmode=view`,
  },
];

const activities = [
  {
    src: "/assets/activity-pocheon.webp",
    width: 701,
    height: 934,
    alt: "2026 포천 인문도시 페스티벌의 캘리그라피 전시 부스",
    title: "2026 포천 인문도시 페스티벌",
    body: "캘리그라피 작품 전시와 홍보",
    href: `${site}/association/?idx=174003766&bmode=view`,
  },
  {
    src: "/assets/activity-writing.webp",
    width: 700,
    height: 525,
    alt: "캘리그라피 이름 써주기 외부 활동 현장",
    title: "캘리그라피 이름 써주기",
    body: "마음을 전하는 협회 외부 활동",
    href: `${site}/association/?idx=173461152&bmode=view`,
  },
];

export function News() {
  return (
    <section
      className="section news"
      id="news"
      tabIndex={-1}
      aria-label="협회 소식과 활동"
    >
      <div className="wrap news-grid">
        <div>
          <div className="news-head">
            <h2>협회 소식</h2>
            <External className="text-link" href={`${site}/notice-association`}>
              전체 보기
            </External>
          </div>
          <ul className="posts">
            {posts.map((post) => (
              <li key={post.href}>
                <a href={post.href} target="_blank" rel="noopener">
                  <time dateTime={post.date}>{post.label}</time>
                  <strong>{post.title}</strong>
                  <span className="sr-only"> (새 창)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="youtube">
            <External
              className="text-link"
              href="https://www.youtube.com/@청목캘리그라피"
            >
              유튜브 채널에서 교육 영상 보기
            </External>
          </p>
        </div>
        <div>
          <div className="news-head">
            <h2>협회 활동</h2>
            <External className="text-link" href={`${site}/association`}>
              활동 더 보기
            </External>
          </div>
          <ul className="acts">
            {activities.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noopener">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                  />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <span className="sr-only"> (새 창)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="about" aria-labelledby="about-title">
      <div className="wrap">
        <div className="about-inner">
          <h2 id="about-title">청목(靑木), 푸른 나무</h2>
          <p>
            뿌리 깊은 나무처럼 굳건하고 푸른 잎처럼 생명력 넘치는 협회를
            지향합니다. 사단법인 한국청목캘리그라피예술협회는 교육을 통해
            캘리그라피의 저변을 넓히고, 글씨로 따뜻한 감성을 나누는 문화예술
            단체입니다.
          </p>
          <External className="text-link" href={`${site}/about-history`}>
            협회 소개 더 보기
          </External>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <Image src="/assets/logo.png" width="102" height="90" alt="" />
          <BrandName />
        </div>
        <dl className="foot-contact">
          <div>
            <dt>전화</dt>
            <dd>
              <a href={phoneHref}>{phone}</a>
            </dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>
              <a href="mailto:kccasociety@gmail.com">kccasociety@gmail.com</a>
            </dd>
          </div>
          <div>
            <dt>주소</dt>
            <dd>
              <address>(11618) 경기도 의정부시 서부로 545 창업관 651호</address>
            </dd>
          </div>
        </dl>
        <ul className="foot-links">
          <li>
            <External href={`${site}/about-map`}>오시는 길</External>
          </li>
          <li>
            <External href={`${site}/54`}>청목 스토어</External>
          </li>
          <li>
            <External href={`${site}/?mode=policy`}>이용약관</External>
          </li>
          <li>
            <External href={`${site}/?mode=privacy`}>개인정보처리방침</External>
          </li>
        </ul>
      </div>
      <div className="wrap foot-legal">
        <p>법인명 (사)한국청목캘리그라피예술협회</p>
        <p>대표 김상돈</p>
        <p>사업자등록번호 861-82-00740</p>
        <p>© 2026 한국청목캘리그라피예술협회</p>
      </div>
    </footer>
  );
}

export function MobileBar() {
  return (
    <nav className="bar" aria-label="빠른 연결">
      <a className="button button-line" href={phoneHref}>
        <Icon name="phone" />
        전화 문의
      </a>
      <a className="button button-pine" href="#competition">
        공모전 안내
      </a>
    </nav>
  );
}
