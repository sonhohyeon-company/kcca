import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { requireAdmin } from "@/lib/auth";
import { boards, getBoard } from "@/lib/boards";
import { boardCategories, getPost } from "@/lib/db";
import { toKstInput } from "@/lib/format";
import { deletePostAction, savePostAction, uploadImage } from "../../actions";

export const metadata: Metadata = { title: "글 고치기" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const post = /^\d{1,15}$/.test(id) ? await getPost(Number(id)) : null;
  if (!post) notFound();
  const categories = Object.fromEntries(
    await Promise.all(
      Object.keys(boards).map(async (slug) => [
        slug,
        await boardCategories(slug),
      ]),
    ),
  );
  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">{getBoard(post.board)?.title ?? post.board}</p>
          <h1>글 고치기</h1>
        </div>
        <a
          className="btn secondary"
          href={`/${post.board}/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          사이트에서 보기<span className="sr-only"> (새 창)</span>
        </a>
      </div>
      <PostForm
        key={post.id}
        action={savePostAction.bind(null, post.id)}
        deleteAction={deletePostAction.bind(null, post.id)}
        uploadImage={uploadImage}
        categories={categories}
        initial={{
          board: post.board,
          category: post.category,
          title: post.title,
          body: post.body,
          cover: post.cover,
          attachments: post.attachments,
          pinned: post.pinned,
          createdAt: toKstInput(post.createdAt),
        }}
      />
    </>
  );
}
