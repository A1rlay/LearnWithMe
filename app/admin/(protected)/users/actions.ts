"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { normalizeEmail, normalizeUsername, passwordError, usernameError } from "@/lib/identity";
import { hashPassword } from "@/lib/password";
import { adminCreateUser, adminDeleteUser, adminUpdateUser } from "@/server/data/users";

function readUser(formData: FormData) {
  const username = normalizeUsername(formData.get("username")?.toString() ?? "");
  const uErr = usernameError(username);
  if (uErr) throw new Error(uErr);
  const email = normalizeEmail(formData.get("email")?.toString() ?? "");
  if (email === "invalid") throw new Error("That email doesn't look right.");
  const role = formData.get("role")?.toString() as Role;
  if (!Object.values(Role).includes(role)) throw new Error("Unknown role.");
  const name = formData.get("name")?.toString().trim().slice(0, 80) || username;
  return { username, email, role, name };
}

function friendly(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new Error("That username or email is already used by someone else.");
  }
  throw e;
}

export async function createUserAction(formData: FormData) {
  await requireRole("ADMIN");
  const data = readUser(formData);
  const password = formData.get("password")?.toString() ?? "";
  const pErr = passwordError(password);
  if (pErr) throw new Error(pErr);
  await adminCreateUser({ ...data, passwordHash: await hashPassword(password) }).catch(friendly);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const data = readUser(formData);
  const password = formData.get("password")?.toString() ?? "";
  const update: Parameters<typeof adminUpdateUser>[1] = data;
  if (password) {
    const pErr = passwordError(password);
    if (pErr) throw new Error(pErr);
    update.passwordHash = await hashPassword(password);
  }
  await adminUpdateUser(id, update).catch(friendly);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUserAction(id: string) {
  await requireRole("ADMIN");
  await adminDeleteUser(id);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
