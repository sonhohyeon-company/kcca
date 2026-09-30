// 자격증 안내 content, copied from the imweb pages.
import { certificateGuides } from "./boards";

type CertificateSection = {
  title: string;
  list?: readonly string[];
  /** Term and description rows, e.g. 학습 내용 or S급 취득 조건. */
  pairs?: readonly (readonly [string, string])[];
  tags?: readonly string[];
  period?: string;
  exams?: readonly { title: string; items: readonly string[] }[];
  note?: string;
};

export type Certificate = {
  href: string;
  title: string;
  step: string;
  tagline: readonly [string, string];
  lead: string;
  qualification: { label: string; value: string };
  /** Sample artwork, 1200×900 WebP. */
  image: { src: string; alt: string };
  sections: readonly CertificateSection[];
};

const period = "개인 학습 속도와 교육기관 커리큘럼에 따라 조정될 수 있습니다.";

export const certificates: readonly Certificate[] = [
  {
    ...certificateGuides[0],
    step: "STEP 1 · 기초과정",
    tagline: ["기초부터 완성까지,", "모든 서체의 출발점"],
    lead: "청목 캘리그라피의 시작이자 모든 서체의 기반이 되는 순수 정자 글꼴입니다. 14개의 자음과 모음을 다각적인 원리로 구성하며, 평행과 속도, 방향, 간격, 양감 등을 학습하는 기초 과정입니다.",
    qualification: { label: "취득 가능 자격", value: "청목정체 2급 지도사 · 1급 지도사" },
    image: { src: "/assets/pages/certificate-1.webp", alt: "청목정체로 쓴 캘리그라피 예시 작품" },
    sections: [
      {
        title: "특징",
        list: [
          "선의 90도에 공기 표현",
          "점·획의 정확한 공기 조형",
          "속도에 따른 질감 표현",
          "자간과 어간의 줄간 조형",
          "강조와 비례를 통한 다각적인 감각 향상",
          "모든 서체 학습의 기초 과정",
        ],
      },
      {
        title: "자음 구성 특징",
        tags: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "특 (쌍자음)"],
        note: "14개 기본 자음을 각도·속도·비례 원리에 맞춰 학습하며, 쌍자음의 균형 표현까지 다룹니다.",
      },
      { title: "교육 기간", period: "약 3개월 이상", note: period },
      {
        title: "시험 안내",
        exams: [
          {
            title: "2급 시험",
            items: [
              "교재 내 단어 확목 평가",
              "14개 자음 관련 단어 평가",
              "14개 자음 모두 습득 시 2급 취득",
              "일부 미흡 시 재시험 가능",
            ],
          },
          {
            title: "1급 시험",
            items: ["2급 합격자 응시 가능", "문장 표현 및 조형 능력 평가", "지도 및 강수 역할 평가"],
          },
        ],
        note: "시험은 지정 교육기관 또는 협회 공인 시험장에서 응시할 수 있습니다.",
      },
    ],
  },
  {
    ...certificateGuides[1],
    step: "전문 서체 · 봄체",
    tagline: ["둥근 마카 펜으로 표현하는", "따뜻하고 부드러운 서체"],
    lead: "둥근 마카 펜을 활용하여 표현하는 서체로, 자연과 관의 조화를 바탕으로 합니다. 누구나 쉽고 즐겁게 배울 수 있도록 개발된 과정으로, 친근하고 따뜻한 느낌이 특징입니다.",
    qualification: { label: "취득 가능 자격", value: "청목봄체 지도사 1급" },
    image: {
      src: "/assets/pages/certificate-2.webp",
      alt: "청목봄체 예시 작품: 동구밖 과수원길 아카시아꽃이 활짝 폈네 하얀꽃 이파리 눈송이처럼 날리네",
    },
    sections: [
      {
        title: "특징",
        list: [
          "둥근 마카 펜 사용",
          "끊임없이 이어지는 글기 표현",
          "자연과 관 중심의 구조",
          "전 연령 학습 가능",
          "EBS 캘리그라피 지도사 과정 운영",
        ],
      },
      {
        title: "활용 분야",
        tags: ["패션 디자인", "인테리어 디자인", "포장 디자인", "손글씨 및 펜 캘리그라피"],
      },
      { title: "교육 기간", period: "약 3개월", note: period },
    ],
  },
  {
    ...certificateGuides[2],
    step: "STEP 2 · 전문 서체",
    tagline: ["사각 마카펜으로 빚는", "정돈된 조형의 아름다움"],
    lead: "봄체와 달리 사각형태의 마카펜을 사용하는 서체로, 'ㅎ'과 'ㅊ'의 십자가 형태를 기본 구조로 삼아 만들어졌습니다. 누구나 쉽게 배우도록 자음을 간결하게 구성했으며, 사각펜 특유의 각진 조형과 굵고 가는 선의 조화가 만들어내는 정돈된 아름다움이 특징입니다.",
    qualification: { label: "취득 가능 자격", value: "청목소망체 지도사 1급" },
    image: { src: "/assets/pages/certificate-3.webp", alt: "청목소망체 예시 작품: 행복하세요!" },
    sections: [
      {
        title: "특징",
        list: [
          "'ㅎ, ㅊ'의 십자가 형태를 기본으로 한 자음 구조",
          "굵은 기본 선과 가는 선의 조화",
          "반듯한 표현과 기울어진 표현의 공존",
          "사각마카펜의 각도로 조절하는 선의 두께",
          "간결하고 단순한 형태로 누구나 배우기 쉬운 구성",
        ],
      },
      {
        title: "학습 내용",
        pairs: [
          ["선 연습", "사각 마카펜의 넓은 면과 모서리의 가는 선 표현"],
          ["원·곡선 표현", "매우 가늘게 표현하는 연습"],
          ["강조", "핵심 단어의 비례감 표현"],
          ["색채 활용", "컬러 사용을 통한 문장의 조화로움 표현"],
          ["조형미 연출", "덩어리감을 통한 구성 완성"],
        ],
      },
      { title: "활용 분야", tags: ["메뉴판 디자인", "간판 디자인", "포장 디자인", "펜글씨 응용"] },
    ],
  },
  {
    ...certificateGuides[3],
    step: "STEP 3 · 전문 서체",
    tagline: ["붓의 자유로운 곡선으로", "감성을 담는 서체"],
    lead: "붓과 붓펜의 자유로운 곡선을 활용하는 감성적인 서체입니다. 아름다운 문장과 시를 표현하기에 적합하며, 예술성과 개성을 동시에 갖출 수 있습니다.",
    qualification: { label: "취득 가능 자격", value: "청목아름체 지도사 1급" },
    image: {
      src: "/assets/pages/certificate-4.webp",
      alt: "청목아름체로 세로로 쓴 캘리그라피 예시 작품",
    },
    sections: [
      {
        title: "특징",
        list: ["붓 및 붓펜 사용", "자유로운 곡선 표현", "빠른 필의 속도 활용", "감성적이고 예술적인 표현", "높은 가독성"],
      },
      { title: "주요 자음", tags: ["ㅇ", "ㅅ", "ㄴ", "ㄹ", "ㅎ"] },
      { title: "활용 분야", tags: ["시 작품", "캘리그라피 작품", "선물용 상품", "디자인 상품 개발"] },
    ],
  },
  {
    ...certificateGuides[4],
    step: "전문 서체 · 바름체",
    tagline: ["수직·수평의 힘으로", "정갈함을 담는 서체"],
    lead: "빠른 글씨의 아름다움을 담은 서체로, 수직선과 수평선의 힘과 균형을 중요하게 생각합니다. 예술성과 가독성을 동시에 갖출 수 있어 다양한 분야에 폭넓게 활용됩니다.",
    qualification: { label: "취득 가능 자격", value: "청목바름체 지도사 1급" },
    image: { src: "/assets/pages/certificate-5.webp", alt: "청목바름체로 세로로 쓴 캘리그라피 예시 작품" },
    sections: [
      {
        title: "특징",
        list: ["정갈한 선 표현", "수직·수평 중심 구조", "비례와 간격 강조", "예술성과 가독성의 조화", "붓과 펜 모두 사용 가능"],
      },
      { title: "활용 분야", tags: ["관련 디자인", "타이틀 디자인", "선물 상품", "작품 제작"] },
      { title: "교육 기간", period: "약 3개월", note: period },
    ],
  },
  {
    ...certificateGuides[5],
    step: "STEP 4 · 최고 등급",
    tagline: ["청목캘리그라피의", "최고 등급 자격"],
    lead: "청목캘리그라피의 최고 등급 자격으로, 5개 지도사 과정을 모두 이수한 전문가에게 부여됩니다. S급 지도사는 작품 활동과 전시 활동을 통해 청목캘리그라피의 전문성을 이어갑니다.",
    qualification: { label: "자격 등급", value: "청목 S급 지도사 (최고 등급)" },
    image: { src: "/assets/pages/certificate-6.webp", alt: "붉은 낙관이 찍힌 S급 지도사의 붓글씨 예시 작품" },
    sections: [
      {
        title: "취득 조건",
        pairs: [
          ["청목정체 1급", "지도사 자격 취득"],
          ["청목봄체 1급", "지도사 자격 취득"],
          ["청목소망체 1급", "지도사 자격 취득"],
          ["청목아름체 1급", "지도사 자격 취득"],
          ["청목바름체 1급", "지도사 자격 취득"],
        ],
        note: "위 5개 지도사 자격을 모두 취득한 경우 S급 자격을 부여합니다.",
      },
      { title: "자격 유지 기준", list: ["연 1회 이상 전시 참여", "미술관 및 전시 공간 작품 봉사 활동"] },
      {
        title: "시험 안내",
        exams: [
          { title: "이론시험", items: ["총 25문항", "디자인 이론", "캘리그라피 역사 및 문화", "교수법 및 지도 방법"] },
          { title: "실기시험", items: ["문장 작품 2회분 출제", "디자인 구상안 평가", "조형미 및 표현력 평가"] },
          {
            title: "평가위원회 구성",
            items: ["실기시험은 디자인 전문가, 서체 개발자, 미술 전문가 등 5인 이내의 평가위원회가 심사합니다."],
          },
        ],
      },
    ],
  },
];

// /certificate-guide

export const grades = [
  { step: "STEP 1", name: "청목정체", grade: "2급", text: "기초 과정 · 획임과 자음 구조" },
  { step: "STEP 2", name: "청목정체", grade: "1급", text: "문장 구성 · 조형 표현" },
  { step: "STEP 3", name: "전문 서체", grade: "4종 1급", tags: ["봄체", "소망체", "아름체", "바름체"] },
  { step: "STEP 4", name: "청목", grade: "S급 지도사", text: "최고 등급 · 전문 지도사" },
] as const;

export const courses = [
  {
    no: "01",
    title: "청목정체 2급",
    text: "청목캘리그라피의 기초 과정으로, 획임과 자음 구조를 익히며 서체의 기본 원리를 학습합니다.",
    href: "/certificate-guide-1",
  },
  {
    no: "02",
    title: "청목정체 1급",
    text: "문장 구성과 조형 표현 능력을 향상시키며 지도자로서의 기본 역량을 갖추는 과정입니다.",
    href: "/certificate-guide-1",
  },
  {
    no: "03",
    title: "청목봄체 1급",
    text: "둥근 마카 펜을 활용하여 따뜻하고 감성적인 표현을 배우는 과정입니다.",
    href: "/certificate-guide-2",
  },
  {
    no: "04",
    title: "청목소망체 1급",
    text: "사각 마카 펜을 이용한 정돈된 조형 표현과 디자인 감각을 익히는 과정입니다.",
    href: "/certificate-guide-3",
  },
  {
    no: "05",
    title: "청목아름체 1급",
    text: "붓과 붓펜의 자유로운 곡선을 활용하여 감성적이고 예술적인 표현을 배우는 과정입니다.",
    href: "/certificate-guide-4",
  },
  {
    no: "06",
    title: "청목바름체 1급",
    text: "필서와 균형을 바탕으로 한 정갈한 서세를 익히며 예술성과 가독성을 함께 향상시키는 과정입니다.",
    href: "/certificate-guide-5",
  },
  {
    no: "S",
    title: "청목 S급 지도사",
    text: "5개 지도사 과정을 모두 이수한 전문가에게 부여되는 최고 등급 자격입니다. S급 지도사는 작품 활동과 전시 활동을 통해 청목캘리그라피의 전문성을 이어갑니다.",
    href: "/certificate-guide-6",
  },
] as const;

export const education = [
  { title: "온·오프라인 교육", text: "온라인 강의와 오프라인 집합 교육을 병행 운영합니다." },
  { title: "단계별 교재 제공", text: "각 급수에 맞는 전용 교재와 영상 강의를 제공합니다." },
  { title: "지정 교육기관 강의", text: "협회 교육장 및 지정 교육기관에서 강의 활동이 가능합니다." },
  { title: "자격시험 및 작품 연계", text: "지도사 자격시험 응시 및 전시·작품 활동과 연계됩니다." },
] as const;
