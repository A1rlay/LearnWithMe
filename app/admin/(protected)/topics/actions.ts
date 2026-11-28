"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireEditorOf, requireSubjectEditor } from "@/lib/auth";
import { str, subjectAndSkills } from "@/lib/form";
import { adminCreateTopic, adminDeleteTopic, adminUpdateTopic } from "@/server/data/admin";
import { assertSubjectOffers, setActivitySubjectAndSkills } from "@/server/data/subjects";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function revalidateLearner() {
  revalidatePath("/admin/topics");
  revalidatePath("/", "layout");
}

export async function createTopicAction(formData: FormData) {
  const { subjectId, skillIds } = subjectAndSkills(formData);
  await requireSubjectEditor(subjectId);
  await assertSubjectOffers(subjectId, "VIDEO");
  const topic = await adminCreateTopic({
    title: str(formData, "title"),
    description: str(formData, "description"),
    level: str(formData, "level"),
    tags: parseTags(str(formData, "tags")),
    subjectId,
  });
  await setActivitySubjectAndSkills("topic", topic.id, subjectId, skillIds);
  revalidateLearner();
  redirect(`/admin/topics?subject=${subjectId}`);
}

export async function updateTopicAction(id: string, formData: FormData) {
  const { subjectId, skillIds } = subjectAndSkills(formData);
  // Must be allowed on the topic's current subject AND the destination subject.
  await requireEditorOf({ kind: "topic", id });
  await requireSubjectEditor(subjectId);
  await adminUpdateTopic(id, {
    title: str(formData, "title"),
    description: str(formData, "description"),
    level: str(formData, "level"),
    tags: parseTags(str(formData, "tags")),
  });
  await setActivitySubjectAndSkills("topic", id, subjectId, skillIds);
  revalidateLearner();
  redirect(`/admin/topics?subject=${subjectId}`);
}

export async function deleteTopicAction(id: string) {
  await requireEditorOf({ kind: "topic", id });
  await adminDeleteTopic(id);
  revalidateLearner();
  redirect("/admin/topics");
}
