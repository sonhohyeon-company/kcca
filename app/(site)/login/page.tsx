import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { ProviderMark } from "@/components/provider-mark";
import { currentMember } from "@/lib/members";
import { enabledProviders } from "@/lib/oauth";
import { PROVIDERS, safeNext } from "@/lib/profile";
import { site } from "@/lib/site";
import "../member.css";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

// ?error= comes from app/auth/[provider]/callback, ?notice= from requireMember and 회원 탈퇴.
const errors: Record<string, string> = {
  denied:
    "로그인을 취소하셨습니다. 다시 로그인하시려면 아래 버튼을 눌러 주세요.",
  state:
    "로그인 확인 정보가 맞지 않거나 시간이 지났습니다. 다시 시도해 주세요.",
  provider:
    "로그인 서비스에서 정보를 받지 못했습니다. 잠시 후 다시 시도해 주세요.",
  expired: "가입 정보 확인 시간이 지났습니다. 다시 로그인해 주세요.",
};
const notices: Record<string, string> = {
  required:
    "로그인이 필요한 화면입니다. 로그인하면 보시던 화면으로 돌아갑니다.",
  withdrawn: "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.",
};

// Official button labels: 카카오 로그인, 네이버 로그인, Google 계정으로 로그인.
const label = (provider: keyof typeof PROVIDERS) =>
  provider === "google"
    ? `${PROVIDERS[provider]} 계정으로 로그인`
    : `${PROVIDERS[provider]} 로그인`;

export default async function LoginPage(props: PageProps<"/login">) {
  const [query, member] = await Promise.all([
    props.searchParams,
    currentMember(),
  ]);
  const next = safeNext(query.next);
  if (member) redirect(next === "/" ? "/mypage" : next);
  const providers = enabledProviders();
  const error = typeof query.error === "string" ? errors[query.error] : "";
  const notice = typeof query.notice === "string" ? notices[query.notice] : "";
  const start = (provider: string) =>
    `/auth/${provider}${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}`;

  return (
    <>
      <PageHero
        pathname="/login"
        title="로그인"
        lead="카카오, 네이버, Google 계정으로 간편하게 로그인합니다. 처음 오셨다면 로그인 뒤 가입 정보를 확인하는 화면이 나옵니다."
      />
      <div className="wrap narrow member">
        {error && (
          <p className="member-note" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="member-note" role="status">
            {notice}
          </p>
        )}
        {providers.length ? (
          <ul className="login-buttons">
            {providers.map((provider) => (
              <li key={provider}>
                {/* Plain links: these routes set a cookie, so they must not be prefetched. */}
                <a
                  className={`login-btn ${provider}`}
                  href={start(provider)}
                  rel="nofollow"
                >
                  <ProviderMark provider={provider} />
                  {label(provider)}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="member-note">
            지금은 간편로그인을 준비하고 있습니다. 필요하신 내용은 협회(
            {site.phone})로 전화해 주세요.
          </p>
        )}
        <ul className="member-guide">
          <li>따로 비밀번호를 만들지 않아도 됩니다.</li>
          <li>
            회원 정보는 이름, 휴대폰 번호, 이메일만 받으며, 시험 접수 신청서를
            쓸 때 자동으로 채워 드립니다.
          </li>
          <li>
            로그인이 어려우시면 협회로 전화해 주세요.{" "}
            <a href={site.tel}>{site.phone}</a>
          </li>
        </ul>
      </div>
    </>
  );
}
