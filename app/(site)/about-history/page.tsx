import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import "../pages.css";

export const metadata: Metadata = {
  title: "협회소개",
  description:
    "캘리그라피를 통해 아름다운 감성과 따뜻한 문화를 나누며, 교육과 예술의 가치를 실현하는 한국청목캘리그라피예술협회를 소개합니다.",
};

const goals = [
  [
    "누구나 쉽게 배우는 캘리그라피 교육 실현",
    "한국형 교육용 서체와 체계적인 교육과정을 개발하여 남녀노소 누구나 쉽고 즐겁게 캘리그라피를 배울 수 있도록 한다.",
  ],
  [
    "감성문화 확산을 통한 사회적 가치 창출",
    "아름다운 글씨와 따뜻한 감성 표현을 통해 개인의 정서 향상은 물론, 더 따뜻하고 행복한 사회를 만들어 가는 데 기여한다.",
  ],
  [
    "전문 캘리그라피 교육자 양성",
    "우수한 전문 강사와 교육자를 지속적으로 양성하여 캘리그라피 교육의 질을 높이고 문화예술 교육의 저변을 확대한다.",
  ],
  [
    "연구와 개발을 통한 예술적 혁신",
    "창의적인 연구와 창작 활동을 바탕으로 교육 콘텐츠와 교재를 개발하여 캘리그라피 문화 발전을 선도한다.",
  ],
  [
    "감각적 작가 양성을 통한 문화예술 발전 기여",
    "예술적 감성과 창의성을 갖춘 전문 캘리그라피 작가를 양성하여 문화예술 발전에 이바지한다.",
  ],
] as const;

const values = [
  ["창의성", "새로운 표현과", "예술적 도전"],
  ["교육성", "누구나 배우고", "성장하는 교육"],
  ["감성", "사람의 마음을 움직이는", "따뜻한 소통"],
  ["전문성", "깊이 있는 연구와", "체계적인 교육"],
  ["사회공헌", "문화예술을 통한", "사회적 가치 실현"],
] as const;

export default function Page() {
  return (
    <>
      <PageHero pathname="/about-history" />
      <div className="wrap page-body">
        <section className="page-section about-intro" aria-label="협회 소개 글">
          <figure className="about-art">
            <Image
              src="/assets/pages/about-calligraphy.webp"
              alt="‘붓끝에 예술을 담다’를 쓴 붓글씨 작품"
              width={1600}
              height={628}
              sizes="(max-width: 1360px) 100vw, 1216px"
              loading="eager"
            />
          </figure>
          <p className="slogan-name">한국청목캘리그라피예술협회는</p>
          <p className="slogan">
            캘리그라피를 통해 아름다운 감성과 따뜻한 문화를 나누며,
            <br />
            교육과 예술의 가치를 실현하는 대한민국 대표 문화예술 교육기관입니다.
          </p>
        </section>
        <section className="split" aria-labelledby="goals-title">
          <h2 id="goals-title">비전 실천 목표</h2>
          <ol className="num-list">
            {goals.map(([title, text], index) => (
              <li key={title}>
                <span className="num" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="band" aria-labelledby="values-title">
        <div className="wrap page-section">
          <div className="section-heading">
            <h2 id="values-title">핵심 가치</h2>
            <p>글씨를 통해 감성을 전하고, 교육을 통해 인재를 키우며, 예술을 통해 세상을 아름답게 만듭니다.</p>
          </div>
          <ul className="fact-list values">
            {values.map(([word, line1, line2]) => (
              <li key={word}>
                <h3>{word}</h3>
                <p>
                  {line1}
                  <br />
                  {line2}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="wrap page-body">
        <section className="split" aria-labelledby="logo-title">
          <h2 id="logo-title">협회 로고 소개</h2>
          <div className="logo-intro">
            <div className="logo-plate">
              <Image src="/assets/logo.png" alt="한국청목캘리그라피예술협회 로고" width={102} height={90} />
            </div>
            <div>
              <p className="logo-symbol">청목(靑木)</p>
              <p>
                청목(靑木)은 '푸른 나무'를 뜻하며,
                <br />
                협회의 로고는 이 의미를 담아 디자인되었습니다.
                <br />
                뿌리 깊은 나무처럼 굳건하고,
                <br />
                푸른 잎처럼 생명력 넘치는 예술 협회의 정체성을 상징합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
