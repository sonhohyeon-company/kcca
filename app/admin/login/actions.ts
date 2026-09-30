"use server";
// The only admin action without requireAdmin(): it is how an admin session starts.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import type { FormState } from "../validate";

const messages = {
  wrong: "비밀번호가 맞지 않습니다. 5번 틀리면 15분 동안 로그인할 수 없습니다.",
  locked:
    "비밀번호를 5번 틀려 15분 동안 로그인할 수 없습니다. 15분 뒤에 다시 시도해 주세요. 비밀번호가 생각나지 않으면 누리집을 설치·관리해 준 담당자에게 문의해 주세요.",
  disabled:
    "ADMIN_PASSWORD 환경 변수를 12자 이상으로 설정해야 관리자 로그인을 쓸 수 있습니다.",
};

export async function loginAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const result = await login(String(form.get("password") ?? ""));
  if (result === "ok") {
    revalidatePath("/admin", "layout"); // re-render the layout so the admin menu appears
    redirect("/admin");
  }
  return { error: messages[result] };
}
