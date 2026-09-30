"use server";

import { redirect } from "next/navigation";
import { deleteMember, updateMember } from "@/lib/db";
import { currentMember, endSession } from "@/lib/members";
import {
  formatPhone,
  normalizePhone,
  readProfile,
  validateProfile,
  type ProfileState,
} from "@/lib/profile";

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const values = readProfile(formData);
  const member = await currentMember();
  if (!member)
    return {
      status: "error",
      values,
      expired: true,
      message: "로그인 시간이 지났습니다. 다시 로그인한 뒤 저장해 주세요.",
    };
  const errors = validateProfile(values);
  if (Object.keys(errors).length)
    return {
      status: "error",
      values,
      errors,
      message: "입력하신 내용을 다시 확인해 주세요.",
    };
  const phone = normalizePhone(values.phone);
  updateMember(member.id, { name: values.name, phone, email: values.email });
  return {
    status: "success",
    values: { ...values, phone: formatPhone(phone) },
    message: "저장했습니다.",
  };
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

/** Deletes the member row right away (the consent text promises this). */
export async function withdrawAction() {
  const member = await currentMember();
  if (member) deleteMember(member.id);
  await endSession();
  redirect("/login?notice=withdrawn");
}
