import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth";
import { editablePages, getPage, type PageSlug } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { pageDefaults } from "@/lib/page-defaults";
import { savePageAction, uploadImage } from "../../actions";

export const metadata: Metadata = { title: "페이지 편집" };

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  if (!Object.hasOwn(editablePages, slug)) notFound();
  const page = await getPage(slug as PageSlug);
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>페이지 편집</h1>
          {page.updatedAt && (
            <p className="meta">마지막 저장 {formatDate(page.updatedAt)}</p>
          )}
        </div>
        <a
          className="btn secondary"
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          사이트에서 보기<span className="sr-only"> (새 창)</span>
        </a>
      </div>
      <nav className="subnav" aria-label="편집할 페이지">
        <ul>
          {Object.entries(editablePages).map(([key, title]) => (
            <li key={key}>
              <Link
                href={`/admin/pages/${key}`}
                aria-current={key === slug ? "page" : undefined}
              >
                {title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <PageForm
        key={slug}
        action={savePageAction.bind(null, slug)}
        uploadImage={uploadImage}
        // An unsaved policy/privacy page starts from the draft the site shows.
        page={
          page.body
            ? page
            : {
                ...page,
                body: (pageDefaults as Record<string, string>)[slug] ?? "",
              }
        }
        hint={
          slug === "about-organization"
            ? "조직도 페이지에 보이는 내용입니다. 사진은 [사진 넣기]로 넣을 수 있습니다."
            : "본문을 비워 두면 사이트에 기본 문안이 보입니다."
        }
      />
    </>
  );
}
