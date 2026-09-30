import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { boards, getBoard, isBoardSlug, pageRange } from "@/lib/boards";
import { countPostsByBoard, listPosts } from "@/lib/db";
import { formatDate, isoDate } from "@/lib/format";

export const metadata: Metadata = { title: "게시글" };

const perPage = 20;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const one = (name: string) => {
    const value = params[name];
    return typeof value === "string" ? value : "";
  };
  const board = isBoardSlug(one("board")) ? one("board") : "";
  const q = one("q").trim().slice(0, 100);
  const page = /^\d{1,5}$/.test(one("page"))
    ? Math.max(1, Number(one("page")))
    : 1;
  const saved = /^\d+$/.test(one("saved")) ? one("saved") : "";
  const [{ posts, total }, counts] = await Promise.all([
    listPosts({ board: board || undefined, q, page, perPage }),
    countPostsByBoard(),
  ]);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageHref = (n: number) => {
    const query = new URLSearchParams(
      Object.entries({ board, q, page: n > 1 ? String(n) : "" }).filter(
        ([, value]) => value,
      ),
    ).toString();
    return query ? `/admin/posts?${query}` : "/admin/posts";
  };
  const all = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <div className="admin-head">
        <h1>게시글</h1>
        <Link
          className="btn"
          href={board ? `/admin/posts/new?board=${board}` : "/admin/posts/new"}
        >
          새 글 쓰기
        </Link>
      </div>

      <div role="status">
        {saved && (
          <p className="flash">
            글을 저장했습니다.{" "}
            {board && (
              <a
                href={`/${board}/${saved}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                사이트에서 보기<span className="sr-only"> (새 창)</span>
              </a>
            )}
          </p>
        )}
        {one("deleted") && <p className="flash">글을 삭제했습니다.</p>}
      </div>

      <nav className="subnav chips" aria-label="게시판 고르기">
        <ul>
          <li>
            <Link
              href={
                q ? `/admin/posts?q=${encodeURIComponent(q)}` : "/admin/posts"
              }
              aria-current={board ? undefined : "page"}
            >
              전체 {all}
            </Link>
          </li>
          {Object.entries(boards).map(([slug, item]) => (
            <li key={slug}>
              <Link
                href={`/admin/posts?${new URLSearchParams(q ? { board: slug, q } : { board: slug })}`}
                aria-current={board === slug ? "page" : undefined}
              >
                {item.title} {counts[slug] ?? 0}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-toolbar">
        <p className="meta">
          {board ? getBoard(board)?.title : "전체 게시판"}
          {q && ` · ‘${q}’ 검색`} · {total}건
        </p>
        <form className="search" role="search" action="/admin/posts">
          {board && <input type="hidden" name="board" value={board} />}
          <label className="sr-only" htmlFor="q">
            제목·본문 검색
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="제목·본문 검색"
          />
          <button className="btn secondary">검색</button>
        </form>
      </div>

      {posts.length ? (
        <div className="table-scroll">
          <table className="admin-table">
            <caption className="sr-only">게시글 목록</caption>
            <thead>
              <tr>
                <th scope="col">제목</th>
                <th scope="col">게시판</th>
                <th scope="col">분류</th>
                <th scope="col">등록일</th>
                <th scope="col">조회수</th>
                <th scope="col">고정</th>
                <th scope="col">
                  <span className="sr-only">사이트에서 보기</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link
                      className="row-title"
                      href={`/admin/posts/${post.id}`}
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td>{getBoard(post.board)?.title ?? post.board}</td>
                  <td>{post.category}</td>
                  <td>
                    <time dateTime={isoDate(post.createdAt)}>
                      {formatDate(post.createdAt)}
                    </time>
                  </td>
                  <td className="num">{post.views.toLocaleString("ko-KR")}</td>
                  <td>{post.pinned ? "고정" : ""}</td>
                  <td>
                    <a
                      href={`/${post.board}/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      보기
                      <span className="sr-only">: {post.title} (새 창)</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">
          {total ? (
            <>
              이 페이지에는 글이 없습니다.{" "}
              <Link className="text-link" href={pageHref(1)}>
                첫 페이지로 가기
              </Link>
            </>
          ) : q ? (
            `‘${q}’에 맞는 글이 없습니다.`
          ) : (
            "아직 글이 없습니다."
          )}
        </p>
      )}

      {pages > 1 && (
        <nav aria-label="페이지 이동">
          <ol className="pagination">
            {page > 1 && (
              <li>
                <Link className="step" href={pageHref(page - 1)}>
                  이전
                </Link>
              </li>
            )}
            {pageRange(page, pages).map((n) => (
              <li key={n}>
                <Link
                  href={pageHref(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </Link>
              </li>
            ))}
            {page < pages && (
              <li>
                <Link className="step" href={pageHref(page + 1)}>
                  다음
                </Link>
              </li>
            )}
          </ol>
        </nav>
      )}
    </>
  );
}
