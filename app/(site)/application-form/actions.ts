"use server";

import { requestIp } from "@/lib/auth";
import { createApplication, purgeApplications } from "@/lib/db";
import { createLimiter } from "@/lib/session";
import { site } from "@/lib/site";
import {
  UploadError,
  checkUpload,
  removeStored,
  saveFile,
} from "@/lib/uploads";
import {
  readApplication,
  retentionCutoff,
  validateApplication,
  type ApplicationState,
} from "./validate";

// Valid submissions per address per hour (the limiter's "fail" is used as a plain counter).
const submissions = createLimiter(5, 60 * 60 * 1000);
// Attachments from everyone per day: files are kept a year, so rotating addresses must not fill the disk.
// ponytail: fixed in-memory cap; raise it if a busy exam deadline ever reaches it.
const attachments = createLimiter(50, 24 * 60 * 60 * 1000);

export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  // Honeypot: people never see this field, bots fill it. Pretend it worked.
  if (formData.get("homepage")) return { status: "success" };

  const values = readApplication(formData);
  // Without proxy headers every visitor is "unknown"; never let one shared key block everyone.
  const ip = await requestIp();
  const limited = ip !== "unknown";
  if (limited && submissions.blocked(ip)) {
    return {
      status: "error",
      values,
      message: `짧은 시간에 신청서가 여러 번 접수되어 잠시 보낼 수 없습니다. 협회(${site.phone})로 전화해 주시면 도와드리겠습니다.`,
    };
  }

  const errors = validateApplication(values);
  if (Object.keys(errors).length) {
    return {
      status: "error",
      values,
      errors,
      message: "입력하신 내용을 다시 확인해 주세요.",
    };
  }
  const upload = formData.get("file");
  const hasFile = upload instanceof File && upload.size > 0;
  // A rejected file is not a submission: check it before either limit counts it.
  if (hasFile) {
    try {
      checkUpload(upload);
    } catch (error) {
      if (!(error instanceof UploadError)) throw error;
      return {
        status: "error",
        values,
        errors: { file: error.message },
        message: "첨부파일을 확인해 주세요.",
      };
    }
  }
  // Count now, before any await, so parallel requests cannot all pass the check above.
  if (limited) submissions.fail(ip);

  let saved: Awaited<ReturnType<typeof saveFile>> | null = null;
  if (hasFile) {
    if (attachments.blocked("all")) {
      return {
        status: "error",
        values,
        errors: {
          file: `지금은 첨부파일을 받을 수 없습니다. 첨부파일 없이 보내 주시거나 협회(${site.phone})로 전화해 주세요.`,
        },
        message: "첨부파일을 확인해 주세요.",
      };
    }
    attachments.fail("all");
    try {
      saved = await saveFile(upload, "private");
    } catch (error) {
      if (!(error instanceof UploadError)) console.error(error);
      return {
        status: "error",
        values,
        errors: {
          file:
            error instanceof UploadError
              ? error.message
              : "파일을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        },
        message: "첨부파일을 확인해 주세요.",
      };
    }
  }

  try {
    // Enforce the 1-year retention promised in the consent text.
    await removeStored(purgeApplications(retentionCutoff()), "private");
    createApplication({
      name: values.name,
      phone: values.phone,
      email: values.email,
      message: values.message,
      fileName: saved?.name ?? null,
      file: saved?.stored ?? null,
    });
  } catch (error) {
    console.error(error);
    if (saved) await removeStored([saved.stored], "private");
    return {
      status: "error",
      values,
      message: `신청서를 저장하지 못했습니다. 잠시 후 다시 보내 주시거나 협회(${site.phone})로 전화해 주세요.`,
    };
  }
  return { status: "success" };
}
