import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dataDir } from "./schema";
import type { Attachment } from "./db";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// Public files (post images, attachments) are served by app/uploads/[name]/route.ts;
// private files (application form uploads) only through the admin download route.
const dirs = {
  public: () => path.join(/*turbopackIgnore: true*/ dataDir(), "uploads"),
  private: () => path.join(/*turbopackIgnore: true*/ dataDir(), "private"),
};
type Visibility = keyof typeof dirs;

export const contentTypes: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  pdf: "application/pdf",
  hwp: "application/x-hwp",
  hwpx: "application/haansofthwpx",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
};

const storedName = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;

/** Absolute path of a stored file, or null for anything that is not one of our generated names. */
export function storedPath(name: string, visibility: Visibility = "public") {
  const ext = name.split(".").pop() ?? "";
  if (!storedName.test(name) || !Object.hasOwn(contentTypes, ext)) return null;
  return path.join(/*turbopackIgnore: true*/ dirs[visibility](), name);
}

async function store(data: Buffer, ext: string, visibility: Visibility) {
  const name = `${randomUUID()}.${ext}`;
  await mkdir(dirs[visibility](), { recursive: true });
  await writeFile(
    path.join(/*turbopackIgnore: true*/ dirs[visibility](), name),
    data,
  );
  return name;
}

export class UploadError extends Error {}

function checkSize(file: File) {
  if (file.size === 0) throw new UploadError("빈 파일입니다.");
  if (file.size > MAX_UPLOAD_BYTES)
    throw new UploadError("파일은 20MB까지 올릴 수 있습니다.");
}

/**
 * Re-encodes an image as WebP (max 2400px, EXIF orientation applied, metadata such as
 * GPS location stripped) and returns its public URL.
 */
export async function saveImage(file: File) {
  checkSize(file);
  let data: Buffer;
  try {
    data = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new UploadError("사진 파일(JPG, PNG, WebP, GIF)만 올릴 수 있습니다.");
  }
  return `/uploads/${await store(data, "webp", "public")}`;
}

/** saveFile's size and type checks, synchronous so callers can run them before counting a submission. */
export function checkUpload(file: File) {
  checkSize(file);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!Object.hasOwn(contentTypes, ext) || ext === "webp") {
    throw new UploadError(
      "PDF, 한글(HWP), 워드·엑셀·파워포인트, ZIP, 사진 파일만 올릴 수 있습니다.",
    );
  }
  return ext;
}

/**
 * Keeps the original bytes (only allow-listed extensions, served as downloads), except that
 * public JPEGs lose their metadata (GPS location, camera) like saveImage, keeping the format.
 */
export async function saveFile(file: File, visibility: Visibility) {
  const ext = checkUpload(file);
  let data = Buffer.from(await file.arrayBuffer());
  if (visibility === "public" && (ext === "jpg" || ext === "jpeg")) {
    try {
      data = await sharp(data)
        .rotate()
        .jpeg({ quality: 90, force: false })
        .toBuffer();
    } catch {
      throw new UploadError(
        "사진 파일을 읽을 수 없습니다. 다른 파일로 올려 주세요.",
      );
    }
  }
  const name = await store(data, ext, visibility);
  return {
    name: cleanFileName(file.name),
    stored: name,
    url: `/uploads/${name}`,
    size: data.length,
  };
}

/** Admin attachments come several at a time, so errors name the file. */
export async function saveAttachment(file: File): Promise<Attachment> {
  try {
    const { name, url, size } = await saveFile(file, "public");
    return { name, url, size };
  } catch (e) {
    if (e instanceof UploadError)
      throw new UploadError(`‘${cleanFileName(file.name)}’: ${e.message}`);
    throw e;
  }
}

/** Display name for a user-supplied file name: no directories or control characters. */
function cleanFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  return (
    base.replace(/[\u0000-\u001f\u007f"]/g, "").slice(0, 200) || "첨부파일"
  );
}

/** Content-Disposition filename* value (RFC 5987); encodeURIComponent leaves the delimiter ' unescaped. */
export const encodeFileName = (name: string) =>
  encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

/** Deletes stored files; silently ignores names that are not ours or already gone. */
export async function removeStored(
  names: Iterable<string>,
  visibility: Visibility = "public",
) {
  for (const name of names) {
    const file = storedPath(name.replace(/^\/uploads\//, ""), visibility);
    if (file) {
      await unlink(file).catch(() => {});
      await unlink(`${file}.jpg`).catch(() => {}); // share-preview copy (app/uploads/[name]/route.ts)
    }
  }
}
