"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteMember } from "@/lib/db";

/** Deletes a member (same effect as their own 회원 탈퇴). Bound with the id in the list. */
export async function removeMember(id: number) {
  await requireAdmin();
  if (Number.isSafeInteger(id)) deleteMember(id);
  redirect("/admin/members?deleted=1");
}
