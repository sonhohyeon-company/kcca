import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { saveSettingsAction } from "../actions";

export const metadata: Metadata = { title: "사이트 설정" };

export default async function SettingsPage() {
  await requireAdmin();
  return (
    <>
      <div className="admin-head">
        <h1>사이트 설정</h1>
        <a
          className="btn secondary"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
        >
          첫 화면 보기<span className="sr-only"> (새 창)</span>
        </a>
      </div>
      <SettingsForm
        action={saveSettingsAction}
        settings={await getSettings()}
      />
    </>
  );
}
