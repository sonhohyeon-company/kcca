import type { Metadata } from "next";
import { PostForm } from "@/components/admin/post-form";
import { requireAdmin } from "@/lib/auth";
import { boards, isBoardSlug } from "@/lib/boards";
import { boardCategories } from "@/lib/db";
import { toKstInput } from "@/lib/format";
import { savePostAction, uploadImage } from "../../actions";

export const metadata: Metadata = { title: "새 글 쓰기" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { board } = await searchParams;
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
        <h1>새 글 쓰기</h1>
      </div>
      <PostForm
        action={savePostAction.bind(null, null)}
        uploadImage={uploadImage}
        categories={categories}
        initial={{
          board:
            typeof board === "string" && isBoardSlug(board)
              ? board
              : "notice-association",
          category: "",
          title: "",
          body: "",
          cover: null,
          attachments: [],
          pinned: false,
          createdAt: toKstInput(new Date().toISOString()),
        }}
      />
    </>
  );
}
