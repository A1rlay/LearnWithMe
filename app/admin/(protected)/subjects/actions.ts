"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireEditorOf, requireRole, requireSubjectEditor } from "@/lib/auth";
import { int, str } from "@/lib/form";
import {
  adminAssignExpert,
  adminCreateSubject,
  adminDeleteSubject,
  adminUnassignExpert,
  adminUpdateSubject,
  createSkill,
  deleteSkill,
  renameSkill,
} from "@/server/data/subjects";

function revalidateSubject(id?: string) {
  revalidatePath("/admin/subjects");
  if (id) revalidatePath(`/admin/subjects/${id}`);
  revalidatePath("/", "layout");
}

// ─── Subjects (owner only) ────────────────────────────────────────────────────

export async function createSubjectAction(formData: FormData) {
  await requireRole("ADMIN");
  const name = str(formData, "name");
  if (!name) throw new Error("Name is required.");
  const s = await adminCreateSubject({
    name,
    description: str(formData, "description") || null,
    order: int(formData, "order"),
  });
  revalidateSubject();
  redirect(`/admin/subjects/${s.id}`);
}

export async function updateSubjectAction(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const name = str(formData, "name");
  if (!name) throw new Error("Name is required.");
  await adminUpdateSubject(id, {
    name,
    description: str(formData, "description") || null,
    order: int(formData, "order"),
  });
  revalidateSubject(id);
}

export async function deleteSubjectAction(id: string) {
  await requireRole("ADMIN");
  // RESTRICT FKs make this fail while the subject still has activities.
  await adminDeleteSubject(id);
  revalidateSubject();
  redirect("/admin/subjects");
}

// ─── Experts (owner only) ─────────────────────────────────────────────────────

export async function assignExpertAction(subjectId: string, formData: FormData) {
  await requireRole("ADMIN");
  const userId = str(formData, "userId");
  if (!userId) return;
  await adminAssignExpert(subjectId, userId);
  revalidateSubject(subjectId);
}

export async function unassignExpertAction(subjectId: string, userId: string) {
  await requireRole("ADMIN");
  await adminUnassignExpert(subjectId, userId);
  revalidateSubject(subjectId);
}

// ─── Skills (owner or the subject's experts) ──────────────────────────────────

export async function createSkillAction(subjectId: string, formData: FormData) {
  await requireSubjectEditor(subjectId);
  const name = str(formData, "name").slice(0, 60);
  if (!name) return;
  await createSkill(subjectId, name);
  revalidateSubject(subjectId);
}

export async function renameSkillAction(skillId: string, formData: FormData) {
  const { subjectId } = await requireEditorOf({ kind: "skill", id: skillId });
  const name = str(formData, "name").slice(0, 60);
  if (!name) return;
  await renameSkill(skillId, name);
  revalidateSubject(subjectId);
}

export async function deleteSkillAction(skillId: string) {
  const { subjectId } = await requireEditorOf({ kind: "skill", id: skillId });
  await deleteSkill(skillId);
  revalidateSubject(subjectId);
}
