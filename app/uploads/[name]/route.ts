import { randomUUID } from "node:crypto";
import { existsSync, openAsBlob } from "node:fs";
import { access, rename, unlink } from "node:fs/promises";
import sharp from "sharp";
import { attachmentName } from "@/lib/db";
import { contentTypes, encodeFileName, storedPath } from "@/lib/uploads";

/** The share-preview JPEG of an uploaded image: made on first request, then kept next to it. */
async function shareJpeg(file: string) {
  await access(file); // the source must still exist (removeStored deletes both)
  const jpeg = `${file}.jpg`;
  if (!existsSync(jpeg)) {
    const temp = `${jpeg}.${randomUUID()}.tmp`;
    await sharp(file)
      .resize({ width: 1200, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 80 })
      .toFile(temp);
    await rename(temp, jpeg); // atomic, so a parallel request never serves half a file
    // The post was deleted while converting: drop the copy instead of leaving an orphan.
    await access(file).catch(async (error) => {
      await unlink(jpeg).catch(() => {});
      throw error;
    });
  }
  return openAsBlob(jpeg);
}

// Public uploads. Names are random UUIDs, so responses never change and can be cached forever.
export async function GET(
  _request: Request,
  context: RouteContext<"/uploads/[name]">,
) {
  const { name } = await context.params;
  // <image>.jpg (e.g. <uuid>.webp.jpg): a JPEG copy ≤1200px wide for post share previews
  // (og:image), since KakaoTalk may not show WebP.
  const source = /^(.+\.(?:webp|png|gif|jpe?g))\.jpg$/.exec(name)?.[1];
  const file = storedPath(source ?? name);
  if (!file) return new Response("Not found", { status: 404 });
  let data: Blob;
  try {
    // File-backed Blobs: streamed from disk, so slow downloads never hold the file in memory.
    data = source ? await shareJpeg(file) : await openAsBlob(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const type = contentTypes[name.split(".").pop()!];
  const disposition = type.startsWith("image/") ? "inline" : "attachment";
  // Attachments keep their original name where <a download> is ignored (in-app browsers, new tabs).
  const original = attachmentName(`/uploads/${name}`);
  return new Response(data, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(data.size),
      "Content-Disposition": original
        ? `${disposition}; filename*=UTF-8''${encodeFileName(original)}`
        : disposition,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
