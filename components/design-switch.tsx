// 스타일은 각 루트 레이아웃이 design-switch.css로 불러온다(테스트에서 CSS 없이 렌더링).
const designs = [
  { key: "v1", label: "시안 1", href: "/" },
  { key: "v2", label: "시안 2", href: "/v2/" },
] as const;

export type DesignKey = (typeof designs)[number]["key"];

// 두 시안은 루트 레이아웃이 달라 일반 링크로 전체 페이지를 다시 불러온다.
export function DesignSwitch({ current }: { current: DesignKey }) {
  return (
    <nav className="design-switch" aria-label="시안 선택">
      {designs.map((design) =>
        design.key === current ? (
          <span key={design.key} aria-current="page">
            {design.label}
          </span>
        ) : (
          <a key={design.key} href={design.href}>
            {design.label}
          </a>
        ),
      )}
    </nav>
  );
}
