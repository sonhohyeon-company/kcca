import { openAsBlob } from "node:fs";
import { retentionCutoff } from "@/app/(site)/application-form/validate";
import { requireAdmin } from "@/lib/auth";
import { getApplication, purgeApplications } from "@/lib/db";
import {
  contentTypes,
  encodeFileName,
  removeStored,
  storedPath,
} from "@/lib/uploads";

// Private application attachment: admin only, always downloaded, never cached.
export async function GET(
  _request: Request,
  context: RouteContext<"/admin/applications/[id]/file">,
) {
  await requireAdmin();
  await removeStored(purgeApplications(retentionCutoff()), "private");
  const { id } = await context.params;
  const application = /^\d{1,15}$/.test(id)
    ? await getApplication(Number(id))
    : null;
  const file = application?.file
    ? storedPath(application.file, "private")
    : null;
  if (!application?.file || !file)
    return new Response("Not found", { status: 404 });
  let data: Blob;
  try {
    data = await openAsBlob(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  return new Response(data, {
    headers: {
      "Content-Type": contentTypes[application.file.split(".").pop()!],
      "Content-Length": String(data.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(application.fileName ?? application.file)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
