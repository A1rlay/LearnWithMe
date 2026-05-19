"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  addStudentToClass,
  adminCreateClass,
  adminDeleteClass,
  adminUpdateClass,
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
