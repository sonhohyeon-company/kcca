import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/forms";
import { adminPassword, hasSessionCookie, isAdmin } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <LoginForm
      action={loginAction}
      disabled={!adminPassword()}
      expired={await hasSessionCookie()}
    />
  );
}
