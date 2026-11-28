"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { allowedTeacherId, requireClassOwner, requireRole } from "@/lib/auth";
import { prisma } from "@/server/db";
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
  const session = await requireRole("ADMIN", "TEACHER");
  const name = formData.get("name")?.toString().trim() ?? "";
  const teacherId = await allowedTeacherId(session, formData.get("teacherId")?.toString() ?? "");
  if (!name) throw new Error("Name is required.");
  await adminCreateClass({ name, teacherId });
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function updateClassAction(id: string, formData: FormData) {
  const session = await requireClassOwner(id);
  const name = formData.get("name")?.toString().trim() ?? "";
  const teacherId = await allowedTeacherId(session, formData.get("teacherId")?.toString() ?? "");
  await adminUpdateClass(id, { name, teacherId });
  revalidatePath("/admin/classes");
  redirect(`/admin/classes/${id}`);
}

export async function deleteClassAction(id: string) {
  await requireClassOwner(id);
  await adminDeleteClass(id);
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function addStudentAction(classId: string, formData: FormData) {
  await requireClassOwner(classId);
  const studentId = formData.get("studentId")?.toString() ?? "";
  if (!studentId) return;
  if ((await prisma.user.count({ where: { id: studentId, role: "STUDENT" } })) === 0) return;
  await addStudentToClass(classId, studentId);
  revalidatePath(`/admin/classes/${classId}`);
}

export async function removeStudentAction(classId: string, studentId: string) {
  await requireClassOwner(classId);
  await removeStudentFromClass(classId, studentId);
  revalidatePath(`/admin/classes/${classId}`);
}

export async function assignTopicAction(classId: string, formData: FormData) {
  await requireClassOwner(classId);
  const topicId = formData.get("topicId")?.toString() ?? "";
  const note = formData.get("note")?.toString().trim() || undefined;
  const dueRaw = formData.get("dueAt")?.toString();
  const dueAt = dueRaw ? new Date(dueRaw) : undefined;
  if (!topicId) return;
  await assignTopicToClass(classId, topicId, { note, dueAt });
  revalidatePath(`/admin/classes/${classId}`);
}

export async function removeAssignmentAction(classId: string, assignmentId: string) {
  await requireClassOwner(classId);
  // The assignment must belong to this class.
  if ((await prisma.classAssignment.count({ where: { id: assignmentId, classId } })) === 0) return;
  await removeAssignment(assignmentId);
  revalidatePath(`/admin/classes/${classId}`);
}
