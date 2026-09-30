import type { Metadata } from "next";
import { CertificateDetail } from "@/components/certificate-detail";
import { certificates } from "@/lib/certificates";
import "../pages.css";

const cert = certificates[3];

export const metadata: Metadata = { title: `${cert.title} 자격 안내`, description: cert.lead };

export default function Page() {
  return <CertificateDetail cert={cert} />;
}
