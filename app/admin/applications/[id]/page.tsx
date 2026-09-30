import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { retentionCutoff } from "@/app/(site)/application-form/validate";
import { requireAdmin } from "@/lib/auth";
import { getApplication, purgeApplications } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { removeStored } from "@/lib/uploads";
import { removeApplication } from "../actions";

export const metadata: Metadata = { title: "시험 접수 신청서" };

export default async function ApplicationPage(
  props: PageProps<"/admin/applications/[id]">,
) {
  await requireAdmin();
  // Expired applications must not stay readable just because nobody opened the list.
  await removeStored(purgeApplications(retentionCutoff()), "private");
  const { id } = await props.params;
  const application = /^\d{1,15}$/.test(id)
    ? await getApplication(Number(id))
    : null;
  if (!application) notFound();
  const { createdAt, name, phone, email, message, file, fileName } =
    application;

  return (
    <>
      <div className="admin-head">
        <h1>{name} 님의 신청서</h1>
        <Link className="btn secondary small" href="/admin/applications">
          목록으로
        </Link>
      </div>
      <div className="table-scroll">
        <table className="admin-table">
          <tbody>
            <tr>
              <th scope="row">접수일시</th>
              <td>
                <time dateTime={createdAt}>{formatDateTime(createdAt)}</time>
              </td>
            </tr>
            <tr>
              <th scope="row">이름</th>
              <td>{name}</td>
            </tr>
            <tr>
              <th scope="row">연락처</th>
              <td>
                <a href={`tel:${phone.replace(/\D/g, "")}`}>{phone}</a>
              </td>
            </tr>
            <tr>
              <th scope="row">이메일</th>
              <td>
                {email ? (
                  // Encoded so an address like "a?cc=x@y.kr" cannot add mail headers.
                  <a
                    href={`mailto:${email.split("@").map(encodeURIComponent).join("@")}`}
                  >
                    {email}
                  </a>
                ) : (
                  "없음"
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">신청 내용</th>
              {/* Plain text with the applicant's line breaks; never rendered as HTML. */}
              <td style={{ whiteSpace: "pre-wrap" }}>{message || "없음"}</td>
            </tr>
            <tr>
              <th scope="row">첨부파일</th>
              <td>
                {file ? (
                  <a
                    href={`/admin/applications/${application.id}/file`}
                    download
                  >
                    {fileName ?? "첨부파일"} 내려받기
                  </a>
                ) : (
                  "없음"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ margin: "16px 0 24px" }}>
        접수일로부터 1년이 지나면 이 신청서와 첨부파일은 자동으로 삭제됩니다.
      </p>
      <div className="form-actions">
        {/* Native two-step confirmation: open, then press the second button. Works without JS. */}
        <details>
          <summary className="btn danger">신청서 삭제</summary>
          <form action={removeApplication.bind(null, application.id)}>
            <p>
              이 신청서와 첨부파일을 지웁니다. 지운 뒤에는 되돌릴 수 없습니다.
            </p>
            <button type="submit" className="btn danger">
              삭제합니다
            </button>
          </form>
        </details>
      </div>
    </>
  );
}
