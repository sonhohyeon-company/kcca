import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import "../pages.css";

export const metadata: Metadata = {
  title: "인사말",
  description: "사단법인 한국청목캘리그라피예술협회 초대 회장 김상돈 화백의 인사말과 이력입니다.",
};

const career: [string, string[]][] = [
  ["학력", ["경기대학교 조형대학원 시각디자인 전공"]],
  [
    "주요 경력",
    [
      "사단법인 한국청목캘리그라피예술협회 회장",
      "경민대학교 라이프콘텐츠과 교수(캘리그라피 전공)",
      "경민대학교 온다입학지원처장",
      "한국 전문대학교육협의회 홍보전략실장역임",
      "전국시사만화협회 제5,6대 회장역임",
      "한국방송통신심의위원회 위원역임",
      "한국전문대학교무입학처장협의회 전국회장",
      "경인일보 화백(시사만화가)",
      "경기일보 편집위원(시사만화가)",
    ],
  ],
  [
    "수상 경력",
    [
      "제2회 경기민주언론상 수상",
      "오마이뉴스 뉴스게릴라 수상",
      "경인일보 올해의 경인대상 수상",
      "교육부총리 표창 수상",
      "한국신문방송언론인 협회 올해의 교육인상 수상",
      "한국전문대학교육협의회 공로상 수상",
    ],
  ],
  [
    "저서",
    [
      "청목캘리그라피따라쓰기 연습교재(초급·중급)",
      "「청목봄체」,「청목소망체」,「청목아름체」,「청목바름체」연습교재",
      "「시와캘리 사랑에 빠지다」",
      "「성경말씀으로 따라쓰는 청목캘리그라피」",
      "「잠언말씀으로 따라쓰는 청목캘리그라피」",
      "「읽고느끼고 쓰,다」",
      "「청목강의 연습교본」",
      "「세계명시 캘리그라피1,2」",
      "「붓 끝에 예술을 담다」",
    ],
  ],
  [
    "연재 활동",
    [
      "오마이뉴스 김상돈만평 연재",
      "중국길림신문 시사만평연재",
      "코리아타임즈 시사만평연재",
      "한국대학신문 시사만평연재",
      "교수신문 시사만평연재",
    ],
  ],
  ["전시", ["지실청목전", "청목캘리그라피 작품전 외 다수"]],
];

export default function Page() {
  return (
    <>
      <PageHero pathname="/about-greetings" />
      <div className="wrap page-body">
        <section className="page-section greeting" aria-labelledby="greeting-title">
          <figure className="greeting-portrait">
            <Image
              src="/assets/pages/greetings-portrait.webp"
              alt="김상돈 회장"
              width={1000}
              height={1336}
              sizes="(max-width: 850px) 24rem, 30vw"
              loading="eager"
            />
            <figcaption>
              사단법인 한국청목캘리그라피예술협회
              <br />
              초대 회장 <strong>김상돈 화백</strong>
            </figcaption>
          </figure>
          <div className="greeting-text">
            <h2 id="greeting-title">
              캘리그라피는 단순한 손글씨를 넘어
              <br />
              마음을 담아가고 이야기가 흐르는 예술입니다.
            </h2>
            <p className="greeting-lead">
              캘리그라피를 사랑하는 회원 여러분,
              <br />
              사단법인 한국청목캘리그라피예술협회 초대 회장을 맡고 있는 김상돈 화백입니다.
            </p>
            <p>
              청목(靑木)은 '푸른 나무'를 뜻하며, 생명력과 성장을 상징합니다. 변함없이 뿌리를 굳건히
              지키는 나무처럼 우리 협회는 다양한 감성과 예술의 기쁨 속에서 전국에 걸쳐 그 뿌리를
              내려가고 있습니다.
            </p>
            <p>
              기술은 발전하고 삶은 빨라지겠지만, 사람 및 문화에 대한 감동과 나누는 문화에 대한 갈망은
              결코 사라지지 않습니다.
              <br />
              캘리그라피는 우리 삶의 매 순간을 아름답게 만들어 주는 소중한 문화입니다.
            </p>
            <p>
              청목 캘리그라피는 전문가 양성을 위한 교육과 예술이 협력하는 캘리그라피 문화를 만들어 가고자
              합니다.
              <br />
              독자적인 교육 프로그램과 전통적 예술 활동을 통해 누구나 캘리그라피를 배우고 즐길 수 있도록
              노력하고 있으며, 전국 공모전과 전시, 지도사 양성 과정을 통해 새로운 예술 인재를 발굴하고
              교육하고 있습니다.
            </p>
            <p>
              예술의 힘이 삶 속에 스며들고 더 나아가 이 사회를 아름답게 변화시킬 수 있도록, 앞으로도
              캘리그라피를 사랑하는 모든 분들과 함께 새로운 가치를 만들어가겠습니다.
            </p>
            <p className="greeting-closing">감사합니다.</p>
          </div>
        </section>
      </div>
      <section className="band" aria-labelledby="career-title">
        <div className="wrap page-section">
          <div className="section-heading">
            <h2 id="career-title">협회장 이력</h2>
          </div>
          <div className="career-grid">
            {career.map(([title, items]) => (
              <div key={title}>
                <h3>{title}</h3>
                <ul className="dash-list">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
