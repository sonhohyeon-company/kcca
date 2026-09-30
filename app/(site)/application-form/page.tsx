import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { currentMember } from "@/lib/members";
import { enabledProviders } from "@/lib/oauth";
import { formatPhone } from "@/lib/profile";
import { site } from "@/lib/site";
import { MAX_UPLOAD_BYTES, contentTypes } from "@/lib/uploads";
import { ApplicationForm } from "./application-form";
import "./form.css";

export const metadata: Metadata = {
  title: "시험 접수 신청",
  description:
    "한국청목캘리그라피예술협회 캘리그라피 자격검정 시험 접수 신청서입니다.",
};

// Same list saveFile() accepts (it rejects .webp, which is reserved for re-encoded images).
const accept = Object.keys(contentTypes)
  .filter((ext) => ext !== "webp")
  .map((ext) => `.${ext}`)
  .join(",");

export default async function ApplicationFormPage() {
  const member = await currentMember();
  return (
    <>
      <PageHero
        pathname="/certificate-register/apply"
        title="시험 접수 신청"
        lead="캘리그라피 자격검정 시험 접수 신청서를 보내 주시면 협회에서 확인 후 연락드립니다."
      />
      <div className="wrap narrow apply">
        <ul className="apply-guide">
          <li>
            시험 일정은 <Link href="/certificate-register">시험일정·접수</Link>{" "}
            게시판에서 확인해 주세요.
          </li>
          <li>
            이름과 연락처는 꼭 적어 주세요. 나머지는 적지 않으셔도 됩니다.
          </li>
          {!member && enabledProviders().length > 0 && (
            <li>
              <Link href="/login?next=%2Fapplication-form">로그인</Link>하시면
              이름, 연락처, 이메일이 자동으로 채워집니다.
            </li>
          )}
          <li>
            인터넷으로 보내기 어려우시면 협회로 전화해 주세요.{" "}
            <a href={site.tel}>{site.phone}</a>
          </li>
        </ul>
        <ApplicationForm
          accept={accept}
          maxBytes={MAX_UPLOAD_BYTES}
          defaults={
            member && {
              name: member.name,
              phone: formatPhone(member.phone),
              email: member.email,
            }
          }
        />
      </div>
    </>
  );
}
