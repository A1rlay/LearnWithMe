"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
} from "@/server/data/users";

export async function createUserAction(formData: FormData) {
  await requireRole("ADMIN");
  const email = formData.get("email")?.toString().trim() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const role = (formData.get("role")?.toString() ?? "STUDENT") as Role;
  const password = formData.get("password")?.toString() ?? "";

  if (!password) throw new Error("Password is required.");

  const passwordHash = await hashPassword(password);
  await adminCreateUser({ email, passwordHash, name, role });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const email = formData.get("email")?.toString().trim() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const role = (formData.get("role")?.toString() ?? "STUDENT") as Role;
  const password = formData.get("password")?.toString() ?? "";

  const update: Parameters<typeof adminUpdateUser>[1] = { email, name, role };
  if (password) update.passwordHash = await hashPassword(password);

  await adminUpdateUser(id, update);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUserAction(id: string) {
  await requireRole("ADMIN");
  await adminDeleteUser(id);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
