"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteApplication, getApplication } from "@/lib/db";
import { removeStored } from "@/lib/uploads";

/** Deletes an application and its private attachment. Bound with the id in the detail page. */
export async function removeApplication(id: number) {
  await requireAdmin();
  const application = Number.isSafeInteger(id)
    ? await getApplication(id)
    : null;
  if (application) {
    deleteApplication(application.id);
    if (application.file) await removeStored([application.file], "private");
  }
  redirect("/admin/applications?deleted=1");
}
