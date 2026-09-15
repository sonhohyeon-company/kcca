import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap section">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소를 다시 확인하거나 홈페이지에서 안내를 찾아보세요.</p>
      <Link href="/" className="text-link">
        홈페이지로 돌아가기 →
      </Link>
    </main>
  );
}
