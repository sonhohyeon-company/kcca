import Link from "next/link";

// notFound() in admin pages (missing post, unknown page slug). Rendered inside the admin layout.
export default function AdminNotFound() {
  return (
    <>
      <title>찾을 수 없습니다 | 관리자</title>
      <div className="admin-head">
        <h1>찾을 수 없습니다</h1>
      </div>
      <p>이미 삭제되었거나 주소가 잘못되었습니다.</p>
      <p className="form-actions">
        <Link className="btn" href="/admin">
          관리자 홈으로
        </Link>
      </p>
    </>
  );
}
