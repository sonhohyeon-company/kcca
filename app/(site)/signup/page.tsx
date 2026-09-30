import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { ProfileForm } from "@/components/profile-form";
import { pendingSignup } from "@/lib/members";
import { PROVIDERS, formatPhone } from "@/lib/profile";
import { signupAction } from "./actions";
import "../member.css";

export const metadata: Metadata = {
  title: "가입 정보 확인",
  robots: { index: false, follow: false },
};

// Reached from the login callback with the provider's profile in a short-lived cookie.
export default async function SignupPage() {
  const pending = await pendingSignup();
  if (!pending) redirect("/login?error=expired");
  return (
    <>
      <PageHero
        pathname="/signup"
        title="가입 정보 확인"
        lead={`${PROVIDERS[pending.provider]} 계정으로 처음 로그인하셨습니다. 아래 정보를 확인하고 가입을 마쳐 주세요.`}
      />
      <div className="wrap narrow member">
        <ProfileForm
          action={signupAction}
          signup
          values={{
            name: pending.name,
            phone: formatPhone(pending.phone),
            email: pending.email,
          }}
        />
      </div>
    </>
  );
}
