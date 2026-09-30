"use server";
// Every exported function here is a public endpoint: each one checks the admin session itself.

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, logout, requireAdmin } from "@/lib/auth";
import {
  createPost,
  deletePost,
  editablePages,
  getPage,
  getPost,
  getSettings,
  referencedUploads,
  savePage,
  saveSettings,
  updatePost,
  type Attachment,
  type PageSlug,
  type Post,
} from "@/lib/db";
import { bodyImages } from "@/lib/markup";
import { dataDir } from "@/lib/schema";
import {
  removeStored,
  saveAttachment,
  saveImage,
  UploadError,
} from "@/lib/uploads";
import {
  editorUploads,
  expiredMessage,
  isUploadUrl,
  parsePostForm,
  parseSettingsForm,
  type FormState,
} from "./validate";

const invalid = (errors: Record<string, string>): FormState => ({
  errors,
  error: "입력한 내용을 확인해 주세요.",
});

/**
 * Deletes stored uploads that no post, page or setting refers to any more: the given ones, and
 * any unreferenced file older than a day (photos put into an editor that was left unsaved).
 */
async function removeUnreferenced(urls: (string | null)[]) {
  const referenced = referencedUploads();
  const dir = path.join(/*turbopackIgnore: true*/ dataDir(), "uploads");
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const abandoned: string[] = [];
  // ponytail: lists the whole uploads folder on every save; fine for a few thousand files.
  for (const name of await readdir(dir).catch(() => [] as string[])) {
    const url = `/uploads/${name}`;
    if (!isUploadUrl(url) || referenced.has(url)) continue;
    const file = await stat(
      path.join(/*turbopackIgnore: true*/ dir, name),
    ).catch(() => null);
    if (file && file.mtimeMs < dayAgo) abandoned.push(url);
  }
  await removeStored([
    ...(urls.filter(
      (url) => isUploadUrl(url) && !referenced.has(url),
    ) as string[]),
    ...abandoned,
  ]);
}

const postFiles = (post: Post) => [
  post.cover,
  ...post.attachments.map((file) => file.url),
  ...bodyImages(post.body),
];

export async function logoutAction() {
  await logout();
  revalidatePath("/admin", "layout"); // hides the admin menu
  redirect("/admin/login");
}

/** Body editor "사진 넣기": stores one image and returns its URL. */
export async function uploadImage(
  form: FormData,
): Promise<{ url: string } | { error: string }> {
  if (!(await isAdmin())) return { error: expiredMessage };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "사진 파일을 골라 주세요." };
  }
  try {
    return { url: await saveImage(file) };
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

/** Creates (id null) or updates a post, then returns to the admin list. */
export async function savePostAction(
  id: number | null,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await isAdmin())) return { error: expiredMessage };
  const current = id === null ? null : await getPost(id);
  if (id !== null && !current) {
    return { error: "글을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다." };
  }
  const input = parsePostForm(form, current);
  if (Object.keys(input.errors).length) return invalid(input.errors);

  // Store new files only after validation; undo them if a later one is rejected.
  const stored: string[] = [];
  let field = "cover";
  let cover = input.cover;
  const attachments: Attachment[] = [...input.attachments];
  try {
    if (input.coverFile)
      stored.push((cover = await saveImage(input.coverFile)));
    field = "attachments";
    for (const file of input.newAttachments) {
      const attachment = await saveAttachment(file);
      stored.push(attachment.url);
      attachments.push(attachment);
    }
  } catch (error) {
    await removeStored(stored);
    if (!(error instanceof UploadError)) throw error;
    return { errors: { [field]: error.message }, error: error.message };
  }

  const post = {
    board: input.board,
    category: input.category,
    title: input.title,
    body: input.body,
    cover,
    attachments,
    pinned: input.pinned,
    createdAt: input.createdAt,
  };
  let postId: number;
  if (current) {
    updatePost(current.id, post);
    postId = current.id;
  } else {
    postId = createPost(post);
  }
  // Replaced cover, removed attachments and body images, editor uploads that were dropped.
  await removeUnreferenced([
    ...(current ? postFiles(current) : []),
    ...editorUploads(form),
  ]);
  revalidatePath("/", "layout");
  redirect(`/admin/posts?board=${post.board}&saved=${postId}`);
}

export async function deletePostAction(id: number) {
  await requireAdmin();
  const post = await getPost(id);
  if (post) {
    deletePost(post.id);
    await removeUnreferenced(postFiles(post));
    revalidatePath("/", "layout");
  }
  redirect(`/admin/posts?${post ? `board=${post.board}&` : ""}deleted=1`);
}

export async function savePageAction(
  slug: string,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await isAdmin())) return { error: expiredMessage };
  if (!Object.hasOwn(editablePages, slug))
    return { error: "없는 페이지입니다." };
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
  const errors: Record<string, string> = {};
  if (!title) errors.title = "제목을 입력해 주세요.";
  else if (title.length > 100)
    errors.title = "제목은 100자까지 쓸 수 있습니다.";
  if (body.length > 100_000) errors.body = "본문이 너무 깁니다.";
  if (Object.keys(errors).length) return invalid(errors);

  const old = await getPage(slug as PageSlug);
  savePage(slug as PageSlug, title, body);
  await removeUnreferenced([...bodyImages(old.body), ...editorUploads(form)]);
  revalidatePath("/", "layout");
  return { message: "저장했습니다.", savedAt: Date.now() };
}

export async function saveSettingsAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await isAdmin())) return { error: expiredMessage };
  const current = await getSettings();
  const { errors, values, popupFile, removeImage } = parseSettingsForm(
    form,
    current.popupImage,
  );
  if (Object.keys(errors).length) return invalid(errors);

  let popupImage = removeImage ? "" : current.popupImage;
  if (popupFile) {
    try {
      popupImage = await saveImage(popupFile);
    } catch (error) {
      if (!(error instanceof UploadError)) throw error;
      return { errors: { popupFile: error.message }, error: error.message };
    }
  }
  saveSettings({ ...values, popupImage });
  if (current.popupImage !== popupImage) {
    await removeUnreferenced([current.popupImage]);
  }
  revalidatePath("/", "layout");
  return { message: "저장했습니다.", savedAt: Date.now() };
}
