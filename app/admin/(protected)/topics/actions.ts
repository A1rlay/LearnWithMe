"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  adminCreateTopic,
  adminDeleteTopic,
  adminUpdateTopic,
} from "@/server/data/admin";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createTopicAction(formData: FormData) {
  await requireRole("ADMIN");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const level = formData.get("level")?.toString().trim() ?? "";
  const tags = parseTags(formData.get("tags")?.toString() ?? "");

  await adminCreateTopic({ title, description, level, tags });
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  redirect("/admin/topics");
}

export async function updateTopicAction(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const level = formData.get("level")?.toString().trim() ?? "";
  const tags = parseTags(formData.get("tags")?.toString() ?? "");

  await adminUpdateTopic(id, { title, description, level, tags });
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  redirect("/admin/topics");
}

export async function deleteTopicAction(id: string) {
  await requireRole("ADMIN");
  await adminDeleteTopic(id);
  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  redirect("/admin/topics");
}
