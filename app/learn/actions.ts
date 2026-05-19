"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { joinClassByCode } from "@/server/data/classes";

export async function joinClassAction(formData: FormData) {
  const session = await requireSession();
  const code = formData.get("code")?.toString().trim().toUpperCase() ?? "";
  if (!code) return;
  await joinClassByCode(session.userId, code);
  revalidatePath("/learn");
}
