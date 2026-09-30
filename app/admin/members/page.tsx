import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { pageRange } from "@/lib/boards";
import { listMembers } from "@/lib/db";
import { formatDate, formatDateTime, isoDate } from "@/lib/format";
import { PROVIDERS, formatPhone } from "@/lib/profile";
import { removeMember } from "./actions";

export const metadata: Metadata = { title: "회원" };

const PER_PAGE = 30;

export default async function MembersPage(props: PageProps<"/admin/members">) {
  await requireAdmin();
  const query = await props.searchParams;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 50) : "";
  const page = Math.max(1, Number(query.page) || 1);
  const { members, total } = await listMembers({ q, page, perPage: PER_PAGE });
  const pages = Math.ceil(total / PER_PAGE);
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    return `/admin/members${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <div className="admin-head">
        <h1>회원</h1>
        <p className="meta">
          전체 {total}명{q && ` · ‘${q}’ 검색`}
        </p>
      </div>
      {query.deleted && (
        <p className="flash" role="status">
          회원을 삭제했습니다.
        </p>
      )}
      <p>
        카카오·네이버·Google 계정으로 가입한 회원입니다. 회원은 마이페이지에서
        스스로 탈퇴할 수 있고, 여기서 삭제해도 같은 결과입니다.
      </p>

      <div className="admin-toolbar">
        <form className="search" role="search" action="/admin/members">
          <label className="sr-only" htmlFor="q">
            이름·연락처·이메일 검색
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="이름·연락처·이메일 검색"
          />
          <button className="btn secondary">검색</button>
        </form>
      </div>

      {members.length ? (
        <div className="table-scroll">
          <table className="admin-table">
            <caption className="sr-only">회원 목록</caption>
            <thead>
              <tr>
                <th scope="col">이름</th>
                <th scope="col">연락처</th>
                <th scope="col">이메일</th>
                <th scope="col">가입 방법</th>
                <th scope="col">가입일</th>
                <th scope="col">최근 로그인</th>
                <th scope="col">
                  <span className="sr-only">삭제</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="row-title">{member.name}</td>
                  <td className="num">{formatPhone(member.phone)}</td>
                  <td>{member.email}</td>
                  <td>{PROVIDERS[member.provider]}</td>
                  <td>
                    <time dateTime={isoDate(member.createdAt)}>
                      {formatDate(member.createdAt)}
                    </time>
                  </td>
                  <td>
                    <time dateTime={member.lastLoginAt}>
                      {formatDateTime(member.lastLoginAt)}
                    </time>
                  </td>
                  <td>
                    {/* Native two-step confirmation, as for applications. */}
                    <details>
                      <summary className="btn small danger">
                        삭제<span className="sr-only">: {member.name}</span>
                      </summary>
                      <form action={removeMember.bind(null, member.id)}>
                        <button type="submit" className="btn small danger">
                          삭제합니다
                        </button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">
          {total ? (
            <>
              이 페이지에는 회원이 없습니다.{" "}
              <Link className="text-link" href={pageHref(1)}>
                첫 페이지로 가기
              </Link>
            </>
          ) : q ? (
            `‘${q}’에 맞는 회원이 없습니다.`
          ) : (
            "아직 가입한 회원이 없습니다."
          )}
        </p>
      )}

      {pages > 1 && (
        <nav aria-label="페이지 이동">
          <ol className="pagination">
            {page > 1 && (
              <li>
                <Link className="step" href={pageHref(page - 1)}>
                  이전
                </Link>
              </li>
            )}
            {pageRange(page, pages).map((n) => (
              <li key={n}>
                <Link
                  href={pageHref(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </Link>
              </li>
            ))}
            {page < pages && (
              <li>
                <Link className="step" href={pageHref(page + 1)}>
                  다음
                </Link>
              </li>
            )}
          </ol>
        </nav>
      )}
    </>
  );
}
