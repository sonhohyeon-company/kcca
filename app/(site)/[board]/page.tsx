import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { getBoard, pageRange, splitAwardTitle } from "@/lib/boards";
import { boardCategories, listPosts } from "@/lib/db";
import { formatDate, isoDate } from "@/lib/format";
import { safeImageSrc } from "@/lib/markup";
import { indexingAllowed } from "@/lib/site";
import { legacyRedirect } from "./legacy";
import "./boards.css";

const perPage = 12;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

export async function generateMetadata(
  props: PageProps<"/[board]">,
): Promise<Metadata> {
  const board = getBoard((await props.params).board);
  if (!board) return {};
  // The layout's canonical (the path without the query) covers ?page= and ?category=;
  // search results are not pages of their own.
  const q = one((await props.searchParams).q).trim();
  return q
    ? {
        title: board.title,
        robots: { index: false, follow: indexingAllowed() },
      }
    : { title: board.title };
}

export default async function BoardPage(props: PageProps<"/[board]">) {
  const { board: slug } = await props.params;
  const query = await props.searchParams;
  const legacy = legacyRedirect(slug, query);
  if (legacy) permanentRedirect(legacy);
  const board = getBoard(slug);
  if (!board) notFound();

  const q = one(query.q).trim().slice(0, 50);
  const page = /^\d{1,6}$/.test(one(query.page))
    ? Math.max(1, Number(one(query.page)))
    : 1;
  const categories = await boardCategories(slug);
  // Unknown categories (e.g. old imweb ?category=3166d77hS0 links) show the whole board.
  const category = categories.includes(one(query.category))
    ? one(query.category)
    : "";
  const { posts, total } = await listPosts({
    board: slug,
    category,
    q,
    page,
    perPage,
  });
  const last = Math.max(1, Math.ceil(total / perPage));
  if (page > last) notFound();

  type ListState = { category?: string; q?: string; page?: number };
  const listSearch = (state: ListState) => {
    const params = new URLSearchParams();
    if (state.category) params.set("category", state.category);
    if (state.q) params.set("q", state.q);
    if (state.page && state.page > 1) params.set("page", String(state.page));
    return params.size ? `?${params}` : "";
  };
  const href = (state: ListState) => `/${slug}${listSearch(state)}`;
  // Posts carry the list state so 목록으로 returns to this exact list.
  const postHref = (id: number) =>
    `/${slug}/${id}${listSearch({ category, q, page })}`;
  const pageHref = (n: number) => href({ category, q, page: n });

  return (
    <>
      <PageHero pathname={`/${slug}`} />
      <div className="wrap board">
        {slug === "certificate-register" && (
          <p className="board-cta">
            <Link className="btn" href="/application-form">
              시험 접수 신청하기
              <Icon name="arrow-right" className="arrow" />
            </Link>
          </p>
        )}
        {categories.length > 0 && (
          <nav className="subnav chips" aria-label={`${board.title} 분류`}>
            <ul>
              {["", ...categories].map((name) => (
                <li key={name}>
                  <Link
                    href={href({ category: name })}
                    aria-current={name === category ? "page" : undefined}
                  >
                    {name || "전체"}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="board-toolbar">
          <p className="board-count">
            {q ? "검색 결과" : "전체"} <strong>{total}</strong>건
          </p>
          <form className="search" role="search" action={`/${slug}`}>
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
            <label className="sr-only" htmlFor="board-q">
              게시글 검색
            </label>
            <input
              id="board-q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={50}
              placeholder="제목·내용 검색"
            />
            <button className="btn secondary">검색</button>
          </form>
        </div>

        {posts.length === 0 ? (
          <p className="board-empty">
            {q ? (
              <>
                검색 결과가 없습니다.
                <Link className="btn secondary" href={href({ category })}>
                  전체 글 보기
                </Link>
              </>
            ) : (
              "등록된 글이 없습니다."
            )}
          </p>
        ) : board.layout === "list" ? (
          <>
            <div className="board-head" aria-hidden="true">
              <span>번호</span>
              <span>제목</span>
              <span>등록일</span>
            </div>
            <ol className="board-list">
              {posts.map((post, index) => (
                <li
                  key={post.id}
                  className={post.pinned ? "is-pinned" : undefined}
                >
                  <Link href={postHref(post.id)}>
                    <span className="board-no">
                      {post.pinned
                        ? "공지"
                        : total - (page - 1) * perPage - index}
                    </span>
                    <span className="board-title">
                      {post.category && (
                        <span className="board-cat">{post.category}</span>
                      )}
                      {post.title}
                    </span>
                    <time
                      className="board-date"
                      dateTime={isoDate(post.createdAt)}
                    >
                      {formatDate(post.createdAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <ul
            className={
              board.layout === "photo" ? "gallery-grid photos" : "gallery-grid"
            }
          >
            {posts.map((post, index) => {
              const artwork = board.layout === "artwork";
              const { award, name } = artwork
                ? splitAwardTitle(post.title)
                : { award: null, name: post.title };
              const cover = post.cover && safeImageSrc(post.cover);
              return (
                <li key={post.id}>
                  <Link href={postHref(post.id)}>
                    <div className={artwork ? "thumb" : "thumb cover"}>
                      {cover && (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(max-width: 600px) 50vw, (max-width: 1050px) 33vw, 340px"
                          // The first row is on screen at load (two cards on a phone, four on a PC).
                          loading={index < 4 ? "eager" : undefined}
                          fetchPriority={index < 2 ? "high" : undefined}
                        />
                      )}
                    </div>
                    <h2>{name}</h2>
                    {artwork ? (
                      (post.pinned || award) && (
                        <p className="meta">
                          {post.pinned && <strong className="pin">공지</strong>}
                          {award}
                        </p>
                      )
                    ) : (
                      <p className="meta">
                        {post.pinned && <strong className="pin">공지</strong>}
                        {post.category && <span>{post.category}</span>}
                        <time dateTime={isoDate(post.createdAt)}>
                          {formatDate(post.createdAt)}
                        </time>
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {last > 1 && (
          <nav aria-label="페이지 이동">
            <ol className="pagination">
              {page > 1 && (
                <li>
                  <Link className="step" href={pageHref(page - 1)}>
                    <Icon name="arrow-left" />
                    이전
                  </Link>
                </li>
              )}
              {pageRange(page, last).map((n) => (
                <li key={n}>
                  <Link
                    href={pageHref(n)}
                    aria-current={n === page ? "page" : undefined}
                  >
                    {n}
                  </Link>
                </li>
              ))}
              {page < last && (
                <li>
                  <Link className="step" href={pageHref(page + 1)}>
                    다음
                    <Icon name="arrow-right" />
                  </Link>
                </li>
              )}
            </ol>
          </nav>
        )}
      </div>
    </>
  );
}
