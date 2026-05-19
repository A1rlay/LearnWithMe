"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  addStudentToClass,
  adminCreateClass,
  adminDeleteClass,
  adminUpdateClass,
  assignTopicToClass,
  removeAssignment,
  removeStudentFromClass,
} from "@/server/data/classes";

export async function createClassAction(formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const name = formData.get("name")?.toString().trim() ?? "";
  const teacherId = formData.get("teacherId")?.toString() ?? "";
  if (!name || !teacherId) throw new Error("Name and teacher are required.");
  await adminCreateClass({ name, teacherId });
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function updateClassAction(id: string, formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const name = formData.get("name")?.toString().trim() ?? "";
  const teacherId = formData.get("teacherId")?.toString() ?? "";
  await adminUpdateClass(id, { name, teacherId });
  revalidatePath("/admin/classes");
  redirect(`/admin/classes/${id}`);
}

export async function deleteClassAction(id: string) {
  await requireRole("ADMIN", "TEACHER");
  await adminDeleteClass(id);
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function addStudentAction(classId: string, formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const studentId = formData.get("studentId")?.toString() ?? "";
  if (!studentId) return;
  await addStudentToClass(classId, studentId);
  revalidatePath(`/admin/classes/${classId}`);
}

export async function removeStudentAction(classId: string, studentId: string) {
  await requireRole("ADMIN", "TEACHER");
  await removeStudentFromClass(classId, studentId);
  revalidatePath(`/admin/classes/${classId}`);
}

export async function assignTopicAction(classId: string, formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const topicId = formData.get("topicId")?.toString() ?? "";
  const note = formData.get("note")?.toString().trim() || undefined;
  const dueRaw = formData.get("dueAt")?.toString();
  const dueAt = dueRaw ? new Date(dueRaw) : undefined;
  if (!topicId) return;
  await assignTopicToClass(classId, topicId, { note, dueAt });
  revalidatePath(`/admin/classes/${classId}`);
}

export async function removeAssignmentAction(classId: string, assignmentId: string) {
  await requireRole("ADMIN", "TEACHER");
  await removeAssignment(assignmentId);
  revalidatePath(`/admin/classes/${classId}`);
}
