import Image from "next/image";
import Link from "next/link";
import type { Certificate } from "@/lib/certificates";
import { site } from "@/lib/site";
import { Icon } from "./icon";
import { PageHero } from "./page-hero";

/** One 자격증 안내 detail page (/certificate-guide-1 … -6). Styles live in app/(site)/pages.css. */
export function CertificateDetail({ cert }: { cert: Certificate }) {
  return (
    <>
      <PageHero pathname={cert.href} title={cert.title} />
      <section className="cert-intro" aria-labelledby="cert-intro-title">
        <div className="wrap cert-intro-grid">
          <div>
            <p className="cert-step">{cert.step}</p>
            <h2 id="cert-intro-title">
              {cert.tagline[0]}
              <br />
              {cert.tagline[1]}
            </h2>
            <p className="cert-lead">{cert.lead}</p>
            <dl className="cert-qual">
              <dt>{cert.qualification.label}</dt>
              <dd>{cert.qualification.value}</dd>
            </dl>
          </div>
          <figure className="sheet">
            <Image
              src={cert.image.src}
              alt={cert.image.alt}
              width={1200}
              height={900}
              sizes="(max-width: 850px) 100vw, 640px"
              loading="eager"
            />
          </figure>
        </div>
      </section>
      <div className="wrap page-body">
        {cert.sections.map((section, index) => (
          <section className="split" key={section.title} aria-labelledby={`cert-s${index}`}>
            <h2 id={`cert-s${index}`}>{section.title}</h2>
            <div>
              {section.list && (
                <ul className="dash-list">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.pairs && (
                <dl className="pair-list">
                  {section.pairs.map(([term, text]) => (
                    <div key={term}>
                      <dt>{term}</dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {section.tags && <TagList tags={section.tags} />}
              {section.period && <p className="cert-period">{section.period}</p>}
              {section.exams && (
                <div className="exam-grid">
                  {section.exams.map((exam) => (
                    <div key={exam.title}>
                      <h3>{exam.title}</h3>
                      {exam.items.length === 1 ? (
                        <p>{exam.items[0]}</p>
                      ) : (
                        <ul className="dash-list">
                          {exam.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {section.note && <p className="note">{section.note}</p>}
            </div>
          </section>
        ))}
      </div>
      <CertificateCta />
    </>
  );
}

export function TagList({ tags }: { tags: readonly string[] }) {
  return (
    <ul className="tag-list">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

/** Closing band shared by /certificate-guide and the detail pages. */
export function CertificateCta() {
  return (
    <section className="band" aria-labelledby="cert-cta-title">
      <div className="wrap cta-row">
        <div>
          <h2 id="cert-cta-title">자격시험 접수</h2>
          <p>
            시험 일정을 확인하신 뒤 접수 신청서를 보내 주세요. 궁금한 점은 협회 사무국(
            <a href={site.tel}>{site.phone}</a>)에 문의해 주십시오.
          </p>
        </div>
        <div className="cta-links">
          <Link className="btn" href="/application-form">
            시험 접수 신청
            <Icon name="arrow-right" className="arrow" />
          </Link>
          <Link className="btn secondary" href="/certificate-register">
            시험 일정 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
