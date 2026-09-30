import type { Metadata } from "next";
import Link from "next/link";
import { CertificateCta, TagList } from "@/components/certificate-detail";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { courses, education, grades } from "@/lib/certificates";
import "../pages.css";

export const metadata: Metadata = {
  title: "자격증 안내",
  description:
    "청목정체 2급부터 전문 서체 4종, S급 지도사까지 청목캘리그라피 지도사 자격의 급수와 취득 과정을 안내합니다.",
};

export default function Page() {
  return (
    <>
      <PageHero pathname="/certificate-guide" />
      <div className="wrap page-body">
        <section className="page-section" aria-labelledby="grades-title">
          <div className="section-heading">
            <h2 id="grades-title">급수 안내</h2>
            <p>
              청목캘리그라피는 단계별 교육과 체계적인 자격과정을 통해 전문 작가와 지도자를 양성합니다.
              각 급수는 고유한 디자인 원리와 표현 기법을 가지며, 순차적인 학습을 통해 예술성과 지도
              역량을 함께 갖출 수 있습니다.
            </p>
          </div>
          <ol className="stairs">
            {grades.map((grade) => (
              <li key={grade.step}>
                <p className="stairs-step">{grade.step}</p>
                <h3>
                  {grade.name}{" "}
                  <strong>{grade.grade}</strong>
                </h3>
                {"tags" in grade ? <TagList tags={grade.tags} /> : <p>{grade.text}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="band" aria-labelledby="courses-title">
        <div className="wrap page-section">
          <div className="section-heading">
            <h2 id="courses-title">자격 취득 과정</h2>
            <p>과정을 누르면 서체별 특징과 시험 안내를 보실 수 있습니다.</p>
          </div>
          <ol className="course-list">
            {courses.map((course) => (
              <li key={course.no} className={course.no === "S" ? "is-top" : undefined}>
                <Link href={course.href}>
                  <span className="course-no" aria-hidden="true">
                    {course.no}
                  </span>
                  <div>
                    <h3>{course.title}</h3>
                    <p>{course.text}</p>
                  </div>
                  <Icon name="arrow-right" className="arrow" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="wrap page-body">
        <section className="page-section" aria-labelledby="education-title">
          <div className="section-heading">
            <h2 id="education-title">교육 안내</h2>
          </div>
          <ul className="fact-list">
            {education.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <CertificateCta />
    </>
  );
}
