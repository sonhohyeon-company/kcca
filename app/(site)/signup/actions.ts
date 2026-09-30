"use server";

import { redirect } from "next/navigation";
import { createMember, findMember } from "@/lib/db";
import { endSignup, pendingSignup, startSession } from "@/lib/members";
import {
  normalizePhone,
  readProfile,
  validateProfile,
  type ProfileState,
} from "@/lib/profile";

export async function signupAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const values = readProfile(formData);
  const pending = await pendingSignup();
  if (!pending)
    return {
      status: "error",
      values,
      expired: true,
      message:
        "가입 정보 확인 시간이 지났습니다. 처음부터 다시 로그인해 주세요.",
    };
  const errors = validateProfile(values, true);
  if (Object.keys(errors).length)
    return {
      status: "error",
      values,
      errors,
      message: "입력하신 내용을 다시 확인해 주세요.",
    };
  // The same account may have finished signing up in another tab; then this is just a login.
  const id =
    (await findMember(pending.provider, pending.providerId))?.id ??
    createMember({
      provider: pending.provider,
      providerId: pending.providerId,
      name: values.name,
      phone: normalizePhone(values.phone),
      email: values.email,
    });
  await startSession(id);
  await endSignup();
  redirect(pending.next);
}
