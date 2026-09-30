// Pure form parsing for the admin Server Actions (no Next or DB imports), unit-tested in
// tests/admin.test.tsx. Everything the browser sends is re-checked here.
import { isBoardSlug } from "@/lib/boards";
import type { Attachment, Settings } from "@/lib/db";
import { fromKstInput, toKstInput } from "@/lib/format";
import { bodyImages, safeHref } from "@/lib/markup";
import { siteUrl } from "@/lib/site";

/** Result of an admin form action: field errors, a form-level error, or a success message. */
export type FormState = {
  errors?: Record<string, string>;
  error?: string;
  message?: string;
  /** Set on success so the form can remount with the saved values. */
  savedAt?: number;
};

// Save actions answer with this instead of requireAdmin()'s redirect, which would navigate
// away and drop the unsaved text. The form shows a login link next to it.
export const expiredMessage =
  "로그인 시간이 지났습니다. 쓰던 내용을 복사해 두고, 새 탭에서 관리자 화면에 다시 로그인한 뒤 이 화면에서 다시 저장해 주세요.";

export const MAX_FILE_MB = 20;
// Server Actions accept 45MB per request (next.config.ts); leave room for the text fields.
const MAX_REQUEST_MB = 40;

/** Only files this app stored itself: "/uploads/<uuid>.<ext>". */
export const isUploadUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\/uploads\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(value);

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

const multiline = (form: FormData, name: string) =>
  String(form.get(name) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();

/** Chosen files of a file input (an empty input still sends one 0-byte File). */
const chosenFiles = (form: FormData, name: string) =>
  form
    .getAll(name)
    .filter((file): file is File => file instanceof File && file.size > 0);

/** Images uploaded from the body editor during this edit (candidates for cleanup). */
export const editorUploads = (form: FormData) =>
  form.getAll("uploaded").filter(isUploadUrl);

const tooLong = (value: string, max: number, label: string) =>
  value.length > max ? `${label}은(는) ${max}자까지 쓸 수 있습니다.` : null;

/** Checked in the browser before sending, so oversized uploads fail with a clear message. */
export function checkFileSizes(form: FormData) {
  let total = 0;
  for (const value of form.values()) {
    if (!(value instanceof File)) continue;
    if (value.size > MAX_FILE_MB * 1024 * 1024) {
      return `‘${value.name}’ 파일이 ${MAX_FILE_MB}MB를 넘습니다. 파일은 ${MAX_FILE_MB}MB까지 올릴 수 있습니다.`;
    }
    total += value.size;
  }
  return total > MAX_REQUEST_MB * 1024 * 1024
    ? `한 번에 올리는 파일은 모두 합쳐 ${MAX_REQUEST_MB}MB까지입니다. 나누어 저장해 주세요.`
    : null;
}

/**
 * Post form. `current` is the stored post when editing: its cover and attachments are the
 * only existing files the form may keep, so client-sent paths are never trusted.
 */
export function parsePostForm(
  form: FormData,
  current: {
    cover: string | null;
    attachments: Attachment[];
    createdAt: string;
  } | null,
) {
  const errors: Record<string, string> = {};
  const board = text(form, "board");
  const category = text(form, "category");
  const title = text(form, "title");
  const body = multiline(form, "body");
  const dateInput = text(form, "createdAt");
  // Unchanged date: keep the stored seconds so the order of same-minute posts stays put.
  const createdAt =
    current && dateInput === toKstInput(current.createdAt)
      ? current.createdAt
      : fromKstInput(dateInput);

  if (!isBoardSlug(board)) errors.board = "게시판을 골라 주세요.";
  if (!title) errors.title = "제목을 입력해 주세요.";
  const titleError = tooLong(title, 200, "제목");
  if (titleError) errors.title = titleError;
  const categoryError = tooLong(category, 60, "분류");
  if (categoryError) errors.category = categoryError;
  const bodyError = tooLong(body, 100_000, "본문");
  if (bodyError) errors.body = bodyError;
  if (!createdAt) errors.createdAt = "등록일시를 다시 확인해 주세요.";

  const choice = text(form, "cover") || "auto";
  const images = bodyImages(body).filter(isUploadUrl);
  let cover: string | null = null;
  let coverFile: File | null = null;
  if (choice === "auto") cover = images[0] ?? null;
  else if (choice === "upload") {
    coverFile = chosenFiles(form, "coverFile")[0] ?? null;
    if (!coverFile) errors.cover = "올릴 대표 사진을 골라 주세요.";
  } else if (choice === "none") cover = null;
  else if (images.includes(choice) || choice === current?.cover) {
    cover = choice;
  } else errors.cover = "대표 이미지를 다시 골라 주세요.";

  const remove = new Set(form.getAll("removeAttachment").map(String));
  const attachments = (current?.attachments ?? []).filter(
    (file) => !remove.has(file.url),
  );

  return {
    errors,
    board,
    category,
    title,
    body,
    createdAt: createdAt ?? "",
    pinned: form.get("pinned") === "on",
    cover,
    coverFile,
    attachments,
    newAttachments: chosenFiles(form, "attachments"),
  };
}

const bareHost = (host: string) => host.replace(/^www\./, "");

/** A pasted address of this site ("https://kcca-society.kr/notice-contest/1") becomes a path. */
function sitePath(value: string) {
  const url = URL.parse(value);
  return url &&
    /^https?:$/.test(url.protocol) &&
    bareHost(url.host) === bareHost(new URL(siteUrl()).host)
    ? url.pathname + url.search + url.hash
    : value;
}

const linkError =
  "주소는 /로 시작하는 사이트 안 주소나 https://로 시작하는 주소로 적어 주세요.";

/** Site settings form; `currentImage` is the stored popup image. */
export function parseSettingsForm(form: FormData, currentImage: string) {
  const errors: Record<string, string> = {};
  const values = {
    contestStatus: text(form, "contestStatus"),
    contestTitle: text(form, "contestTitle"),
    contestPeriod: text(form, "contestPeriod"),
    contestNote: multiline(form, "contestNote"),
    contestLink: sitePath(text(form, "contestLink")),
    popupEnabled: form.get("popupEnabled") === "on",
    popupAlt: multiline(form, "popupAlt"),
    popupLink: sitePath(text(form, "popupLink")),
    popupUntil: text(form, "popupUntil"),
  } satisfies Partial<Settings>;

  const limits: [keyof typeof values, number, string][] = [
    ["contestStatus", 30, "상태 표시"],
    ["contestTitle", 100, "공모전 이름"],
    ["contestPeriod", 100, "접수 기간"],
    ["contestNote", 300, "안내 문구"],
    ["contestLink", 500, "링크"],
    ["popupAlt", 500, "사진 설명"],
    ["popupLink", 500, "링크"],
  ];
  for (const [name, max, label] of limits) {
    const error = tooLong(String(values[name]), max, label);
    if (error) errors[name] = error;
  }
  if (!values.contestTitle)
    errors.contestTitle = "공모전 이름을 입력해 주세요.";
  if (values.contestLink && !safeHref(values.contestLink))
    errors.contestLink = linkError;
  if (values.popupLink && !safeHref(values.popupLink))
    errors.popupLink = linkError;
  const until = new Date(`${values.popupUntil}T00:00:00Z`);
  if (
    values.popupUntil &&
    !(
      /^\d{4}-\d{2}-\d{2}$/.test(values.popupUntil) &&
      !Number.isNaN(until.getTime()) &&
      until.toISOString().startsWith(values.popupUntil)
    )
  ) {
    errors.popupUntil = "날짜를 다시 확인해 주세요.";
  }

  const popupFile = chosenFiles(form, "popupFile")[0] ?? null;
  const removeImage = form.get("popupRemove") === "on";
  const hasImage = !!popupFile || (!!currentImage && !removeImage);
  if (hasImage && !values.popupAlt) {
    errors.popupAlt =
      "사진에 적힌 글자와 내용을 적어 주세요. 화면을 읽어 주는 프로그램이 이 설명을 읽습니다.";
  }
  if (values.popupEnabled && !hasImage)
    errors.popupFile = "팝업을 보이려면 사진을 올려 주세요.";

  return { errors, values, popupFile, removeImage };
}
