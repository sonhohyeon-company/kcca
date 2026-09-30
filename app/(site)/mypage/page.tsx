import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ProfileForm } from "@/components/profile-form";
import { formatDate } from "@/lib/format";
import { requireMember } from "@/lib/members";
import { PROVIDERS, formatPhone } from "@/lib/profile";
import { logoutAction, updateProfileAction, withdrawAction } from "./actions";
import "../member.css";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};

export default async function MyPage() {
  const member = await requireMember("/mypage");
  return (
    <>
      <PageHero
        pathname="/mypage"
        title="마이페이지"
        lead={`${PROVIDERS[member.provider]} 계정으로 로그인했습니다. 가입일 ${formatDate(member.createdAt)}`}
      />
      <div className="wrap narrow member">
        <section className="member-section" aria-labelledby="profile-title">
          <h2 id="profile-title">내 정보</h2>
          <ProfileForm
            action={updateProfileAction}
            values={{
              name: member.name,
              phone: formatPhone(member.phone),
              email: member.email,
            }}
          />
        </section>
        <section className="member-section" aria-labelledby="logout-title">
          <h2 id="logout-title">로그아웃</h2>
          <form action={logoutAction}>
            <button type="submit" className="btn secondary">
              로그아웃
            </button>
          </form>
        </section>
        <section className="member-section" aria-labelledby="withdraw-title">
          <h2 id="withdraw-title">회원 탈퇴</h2>
          <details className="member-withdraw">
            <summary className="btn danger">회원 탈퇴</summary>
            <form action={withdrawAction}>
              <p>
                탈퇴하면 이름, 휴대폰 번호, 이메일이 바로 삭제되며 되돌릴 수
                없습니다. 이미 보내신 시험 접수 신청서는 신청서 보관 기간(1년)에
                따라 따로 처리됩니다.
              </p>
              <button type="submit" className="btn danger">
                탈퇴합니다
              </button>
            </form>
          </details>
        </section>
      </div>
    </>
  );
}
