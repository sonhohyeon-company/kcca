import type { Metadata } from "next";
import Link from "next/link";
import { BodySyntaxHelp } from "@/components/admin/body-editor";
import { requireAdmin } from "@/lib/auth";
import { boards, getBoard } from "@/lib/boards";
import { retentionCutoff } from "@/app/(site)/application-form/validate";
import {
  countPostsByBoard,
  editablePages,
  listApplications,
  listPosts,
  purgeApplications,
} from "@/lib/db";
import { formatDate, isoDate } from "@/lib/format";
import { removeStored } from "@/lib/uploads";

export const metadata: Metadata = { title: "대시보드" };

export default async function AdminDashboard() {
  await requireAdmin();
  await removeStored(purgeApplications(retentionCutoff()), "private");
  const [counts, { posts }, applications] = await Promise.all([
    countPostsByBoard(),
    // listPosts puts pinned posts first; take a wider slice and re-sort by date.
    // ponytail: wrong only if more than 42 posts are pinned.
    listPosts({ perPage: 50 }),
    listApplications(),
  ]);
  const recent = posts
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>관리자 홈</h1>
          <p className="meta">글과 페이지, 첫 화면 안내를 여기서 고칩니다.</p>
        </div>
        <Link className="btn" href="/admin/posts/new">
          새 글 쓰기
        </Link>
      </div>

      <div className="dash-grid">
        <section aria-labelledby="dash-boards">
          <h2 id="dash-boards">게시판</h2>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">게시판</th>
                  <th scope="col">글 수</th>
                  <th scope="col">
                    <span className="sr-only">새 글</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(boards).map(([slug, board]) => (
                  <tr key={slug}>
                    <td>
                      <Link
                        className="row-title"
                        href={`/admin/posts?board=${slug}`}
                      >
                        {board.title}
                      </Link>
                    </td>
                    <td className="num">{counts[slug] ?? 0}</td>
                    <td>
                      <Link
                        className="btn small secondary"
                        href={`/admin/posts/new?board=${slug}`}
                      >
                        새 글<span className="sr-only">: {board.title}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="dash-side">
          <section aria-labelledby="dash-recent">
            <h2 id="dash-recent">최근 글</h2>
            {recent.length ? (
              <ul className="dash-list">
                {recent.map((post) => (
                  <li key={post.id}>
                    <Link
                      className="row-title"
                      href={`/admin/posts/${post.id}`}
                    >
                      {post.title}
                    </Link>
                    <p className="meta">
                      <span>{getBoard(post.board)?.title ?? post.board}</span>
                      <time dateTime={isoDate(post.createdAt)}>
                        {formatDate(post.createdAt)}
                      </time>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-empty">아직 글이 없습니다.</p>
            )}
          </section>

          <section aria-labelledby="dash-applications">
            <h2 id="dash-applications">시험 접수 신청서</h2>
            <p>
              받은 신청서 <strong>{applications.length}</strong>건
            </p>
            <Link className="text-link" href="/admin/applications">
              신청서 보기
            </Link>
          </section>

          <section aria-labelledby="dash-links">
            <h2 id="dash-links">바로가기</h2>
            <ul className="dash-links">
              <li>
                <Link className="text-link" href="/admin/settings">
                  공모전 안내·메인 팝업 설정
                </Link>
              </li>
              {Object.entries(editablePages).map(([slug, title]) => (
                <li key={slug}>
                  <Link className="text-link" href={`/admin/pages/${slug}`}>
                    {title} 고치기
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="help-box" aria-labelledby="dash-help">
        <h2 id="dash-help">본문 쓰는 법</h2>
        <p>
          글쓰기 화면의 버튼을 눌러도 되고, 아래처럼 직접 써도 됩니다.
          [미리보기] 버튼으로 사이트에 보일 모습을 확인할 수 있습니다.
        </p>
        <BodySyntaxHelp />
      </section>
    </>
  );
}
