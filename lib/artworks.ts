export const artworks = [
  {
    name: "김현희",
    src: "/assets/award-kim-hyunhee.webp",
    detail: "/assets/award-kim-hyunhee-detail.webp",
    width: 684,
    height: 1333,
    id: "173460414",
    description:
      "꽃과 유려한 붓글씨가 어우러진 작품입니다. 획의 흐름과 여백을 천천히 살펴보세요.",
  },
  {
    name: "장순덕",
    src: "/assets/award-jang-soondeok.webp",
    detail: "/assets/award-jang-soondeok-detail.webp",
    width: 665,
    height: 1334,
    id: "173460396",
    description:
      "가느다란 선과 굵은 획이 세로로 길게 이어지는 작품입니다. 글씨가 만들어 내는 움직임을 느껴보세요.",
  },
  {
    name: "김승한",
    src: "/assets/award-kim-seunghan.webp",
    detail: "/assets/award-kim-seunghan-detail.webp",
    width: 490,
    height: 1334,
    id: "173460356",
    description:
      "절벽 그림과 푸른 붓글씨가 어우러진 작품입니다. 그림과 글씨가 함께 전하는 풍경을 감상해 보세요.",
  },
] as const;

export type Artwork = (typeof artworks)[number];
export const artworkURL = (art: Artwork) =>
  `https://kcca-society.kr/notice-gallery-2025/?bmode=view&idx=${art.id}`;
export const artworkAlt = (art: Artwork) =>
  `${art.name}의 2025 대한민국 청목캘리그라피 공모전 은상 수상작`;
export const wrapArtworkIndex = (index: number) =>
  ((index % artworks.length) + artworks.length) % artworks.length;
