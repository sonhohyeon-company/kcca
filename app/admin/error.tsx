"use client";

// Most likely cause in production: this tab still runs the previous deploy
// ("Failed to find Server Action"), so a full reload is the fix.
export default function AdminError() {
  return (
    <div className="admin-error" role="alert">
      <h1>화면을 불러오지 못했습니다</h1>
      <p>
        사이트가 새 버전으로 바뀌었거나 잠시 연결이 끊겼을 수 있습니다. 페이지를
        새로고침한 뒤 다시 시도해 주세요.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => window.location.reload()}
      >
        새로고침
      </button>
    </div>
  );
}
