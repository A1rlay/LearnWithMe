"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/password";
import { clearSession, createSession } from "@/lib/session";
import { getUserByEmail } from "@/server/data/users";

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const user = await getUserByEmail(email);
  if (!user) redirect("/login?error=1");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) redirect("/login?error=1");

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  if (user.role === "STUDENT") {
    redirect("/learn");
  } else {
    redirect("/admin");
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
