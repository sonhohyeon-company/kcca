# KCCA Next.js 홈페이지

한국청목캘리그라피예술협회 홈페이지 v2를 Next.js App Router와 TypeScript로 구현했습니다. 50~60대 사용자의 공모전 참여와 작품 감상에 초점을 맞춘 기존 디자인을 유지합니다.

## 실행

Node.js 24 이상에서 실행할 수 있습니다.

```sh
npm ci
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 검증과 배포용 빌드

```sh
npm run typecheck
npm test
npm run build
```

`next build`가 `out/`에 정적 웹사이트를 생성합니다. 이 폴더를 정적 호스팅에 게시할 수 있습니다. `next start` 대신 정적 웹 서버로 `out/`를 제공합니다. 정적 내보내기 설정에 맞춰 `next/image`의 서버 이미지 최적화를 끄고 기존 WebP 이미지를 사용합니다.

## 두 가지 시안

- 시안 1: `/` — `app/(v1)/` 아래 기존 디자인(`app/globals.css`)
- 시안 2: `/v2/` — `app/v2/` 아래 새 디자인(`app/v2/v2.css`, `components/v2/`)

두 시안은 루트 레이아웃이 달라 서로 CSS가 섞이지 않습니다. 화면 왼쪽 아래의 `시안 1 | 시안 2` 버튼(`components/design-switch.tsx`)으로 오갑니다. 시안 2의 글꼴(Hahmlet, IBM Plex Sans KR)은 `next/font/google`이 빌드 때 내려받아 같은 도메인에서 제공합니다. 전역 404는 `app/global-not-found.tsx`입니다.

## 수정할 위치

- `app/(v1)/page.tsx`: 시안 1 섹션 구성
- `app/(v1)/layout.tsx`: 시안 1 문서 설정과 검색 메타데이터
- `app/globals.css`: 시안 1 반응형 디자인, 글자 확대, 모바일 화면 스타일
- `app/v2/page.tsx`, `components/v2/sections.tsx`, `components/v2/header.tsx`: 시안 2 구성
- `components/site-sections.tsx`: 공모전 안내·협회 소식·교육·연락처
- `components/site-header.tsx`: 모바일 메뉴와 헤더 높이 계산
- `components/reading-tools.tsx`: 글자 크기 설정과 기기 내 저장
- `components/gallery.tsx`: 수상작 선택
- `components/artwork-viewer.tsx`: 작품 확대, 이전·다음, 키보드 조작
- `lib/artworks.ts`: 작가·작품 설명·공식 작품 링크
- `public/assets/`: 로고·작품·활동 사진·한글 폰트와 출처

공모전 접수 일정은 아직 공식 공지에 게시되지 않아 '공모요강 준비중' 상태를 유지합니다. 접수 안내 버튼은 공식 홈페이지로 연결됩니다. 결제·접수 처리 서버는 포함되지 않습니다.

현재 공개 주소: https://kcca.hohyeon.dev

공유용 개선안이므로 `noindex, nofollow` 메타데이터를 유지했습니다. 공식 사이트로 전환할 때 두 레이아웃의 `metadataBase`와 `robots`를 검토하세요.

Next.js 공식 참고: https://nextjs.org/docs/app/guides/static-exports
