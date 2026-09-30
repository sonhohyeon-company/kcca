import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { PageHero } from "@/components/page-hero";
import { getBoard, splitAwardTitle } from "@/lib/boards";
import {
  adjacentPosts,
  getPost,
  incrementViews,
  type PostSummary,
} from "@/lib/db";
import { formatBytes, formatDate, isoDate } from "@/lib/format";
import {
  BodyImage,
  bodyImages,
  renderBody,
  safeHref,
  safeImageSrc,
  toPlainText,
} from "@/lib/markup";
import { site } from "@/lib/site";
import "../boards.css";

// Shared by generateMetadata and the page: one DB read per request.
const loadPost = cache(async (id: string) =>
  /^\d{1,15}$/.test(id) ? getPost(Number(id)) : null,
);

/** Artwork titles "은상_김현희" read as "김현희 (은상)" outside the post header. */
function displayTitle(post: Pick<PostSummary, "board" | "title">) {
  if (getBoard(post.board)?.layout !== "artwork") return post.title;
  const { award, name } = splitAwardTitle(post.title);
  return award ? `${name} (${award})` : name;
}

export async function generateMetadata(
  props: PageProps<"/[board]/[id]">,
): Promise<Metadata> {
  const { board: slug, id } = await props.params;
  const post = await loadPost(id);
  const board = getBoard(slug);
  if (!post || !board || post.board !== slug) return {};
  const title = displayTitle(post);
  const description = toPlainText(post.body, 120) || board.title;
  // Uploads are WebP, which KakaoTalk may not show: share a JPEG copy (app/uploads/[name]/route.ts).
  const image = post.cover ?? bodyImages(post.body)[0];
  return {
    title,
    description,
    // List links add ?category=&q=&page= for 목록으로; the post itself has one address.
    alternates: { canonical: `/${slug}/${post.id}` },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: site.name,
      title,
      description,
      url: `/${slug}/${post.id}`,
      images: [
        image?.startsWith("/uploads/") ? `${image}.jpg` : (image ?? "/og.png"),
      ],
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function PostPage(props: PageProps<"/[board]/[id]">) {
  const { board: slug, id } = await props.params;
  const post = await loadPost(id);
  const board = post && getBoard(post.board);
  if (!post || !board) notFound();
  // Posts moved to another board (and imweb gallery years) keep working at their old URL.
  if (post.board !== slug) permanentRedirect(`/${post.board}/${post.id}`);
  incrementViews(post.id);

  // The list this post was opened from (postHref in ../page.tsx), for 목록으로 and 이전/다음 글.
  const query = await props.searchParams;
  const list = new URLSearchParams();
  for (const key of ["category", "q", "page"]) {
    const value = query[key];
    if (typeof value === "string" && value) list.set(key, value.slice(0, 100));
  }
  // 이전/다음 글 stay inside the category and search the visitor was browsing.
  const inCategory = post.category && list.get("category") === post.category;
  const { older, newer } = await adjacentPosts(
    post,
    inCategory ? post.category : "",
    list.get("q") ?? "",
  );
  const listSearch = list.size ? `?${list}` : "";
  const artwork = board.layout === "artwork";
  const { award, name } = artwork
    ? splitAwardTitle(post.title)
    : { award: null, name: post.title };
  // Covers are usually a body image (imported posts use the first); don't show it twice.
  const cover =
    board.layout !== "list" &&
    post.cover &&
    !bodyImages(post.body).includes(post.cover) &&
    safeImageSrc(post.cover);

  return (
    <>
      <PageHero pathname={`/${slug}/${post.id}`} titleAs="p" />
      <article
        className={artwork ? "post wrap narrow is-artwork" : "post wrap narrow"}
      >
        <header className="post-header">
          {post.category && <p className="eyebrow">{post.category}</p>}
          <h1 className="post-title">{name}</h1>
          <p className="meta">
            {award && <span>{award}</span>}
            <time dateTime={isoDate(post.createdAt)}>
              {formatDate(post.createdAt)}
            </time>
          </p>
        </header>

        {cover && artwork && (
          <div className="post-cover">
            <Image
              src={cover}
              alt={`${name} 작품`}
              fill
              sizes="(max-width: 850px) 100vw, 48rem"
              loading="eager"
            />
          </div>
        )}

        <div className="prose">
          {/* A photo cover is shown whole, like the body pictures below it. */}
          {cover && !artwork && (
            <BodyImage src={cover} alt={`${post.title} 대표 사진`} first />
          )}
          {renderBody(post.body, !cover)}
        </div>

        {post.attachments.length > 0 && (
          <section className="attachments" aria-labelledby="attachments-title">
            <h2 id="attachments-title">첨부파일</h2>
            <ul>
              {post.attachments.map((file) => {
                const url = safeHref(file.url);
                return (
                  url && (
                    <li key={url}>
                      <a href={url} download={file.name}>
                        {file.name}
                      </a>
                      <span className="meta">{formatBytes(file.size)}</span>
                    </li>
                  )
                );
              })}
            </ul>
          </section>
        )}

        {(older || newer) && (
          <nav className="post-nav" aria-label="이전 글과 다음 글">
            {older && (
              <Link href={`/${slug}/${older.id}${listSearch}`} rel="prev">
                <span>이전 글</span>
                <span>{displayTitle(older)}</span>
              </Link>
            )}
            {newer && (
              <Link href={`/${slug}/${newer.id}${listSearch}`} rel="next">
                <span>다음 글</span>
                <span>{displayTitle(newer)}</span>
              </Link>
            )}
          </nav>
        )}

        <p className="post-actions">
          <Link className="btn secondary" href={`/${slug}${listSearch}`}>
            목록으로
          </Link>
        </p>
      </article>
    </>
  );
}
