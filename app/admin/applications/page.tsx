import type { Metadata } from "next";
import Link from "next/link";
import { retentionCutoff } from "@/app/(site)/application-form/validate";
import { requireAdmin } from "@/lib/auth";
import { listApplications, purgeApplications } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { removeStored } from "@/lib/uploads";

export const metadata: Metadata = { title: "시험 접수 신청서" };

export default async function ApplicationsPage(
  props: PageProps<"/admin/applications">,
) {
  await requireAdmin();
  await removeStored(purgeApplications(retentionCutoff()), "private");
  const [applications, query] = await Promise.all([
    listApplications(),
    props.searchParams,
  ]);

  return (
    <>
      <div className="admin-head">
        <h1>시험 접수 신청서</h1>
        <p className="meta">전체 {applications.length}건</p>
      </div>
      {query.deleted && (
        <p className="flash" role="status">
          신청서를 삭제했습니다.
        </p>
      )}
      <p>
        홈페이지 <Link href="/application-form">시험 접수 신청</Link> 화면에서
        보낸 신청서입니다. 개인정보 보호를 위해 접수일로부터 1년이 지난 신청서는
        첨부파일과 함께 자동으로 삭제됩니다.
      </p>
      {applications.length === 0 ? (
        <p>접수된 신청서가 없습니다.</p>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">접수일시</th>
                <th scope="col">이름</th>
                <th scope="col">연락처</th>
                <th scope="col">첨부</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <time dateTime={application.createdAt}>
                      {formatDateTime(application.createdAt)}
                    </time>
                  </td>
                  <td>
                    <Link href={`/admin/applications/${application.id}`}>
                      {application.name}
                    </Link>
                  </td>
                  <td className="num">{application.phone}</td>
                  <td>{application.file ? "있음" : "없음"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
