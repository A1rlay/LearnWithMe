"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { normalizeDiscord, normalizeEmail, normalizeTimezone, parseInterests, parseVisibility, parseWeeklyGoal, passwordError } from "@/lib/identity";
import { hashPassword, verifyPassword } from "@/lib/password";
import { unblockUser } from "@/server/data/buddies";
import { setPasswordHash, updateMyProfile } from "@/server/data/me";
import { allow } from "@/server/data/rate-limit";
import { prisma } from "@/server/db";

export type FormState = { ok?: string; error?: string };

export async function saveProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireSession();
  if (!(await allow(`profile-save:${userId}`, 20, 60 * 60_000))) return { error: "Too many saves. Try again in a while." };
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (!current) return { error: "Please sign in again." };
  const username = current.username;
  const discord = normalizeDiscord(formData.get("discordHandle")?.toString() ?? "");
  if (discord === "invalid") return { error: "Discord usernames are 2–32 characters: letters, numbers, _ or ." };
  const email = normalizeEmail(formData.get("email")?.toString() ?? "");
  if (email === "invalid") return { error: "That email doesn't look right." };
  if (email) {
    const taken = await prisma.user.count({ where: { id: { not: userId }, email: { equals: email, mode: "insensitive" } } });
    if (taken) return { error: "That email can't be used. Try another." };
  }

  try {
    await updateMyProfile(userId, {
      name: formData.get("name")?.toString().trim().slice(0, 60) || username,
      bio: formData.get("bio")?.toString().trim().slice(0, 300) || null,
      interests: parseInterests(formData.get("interests")?.toString() ?? ""),
      discordHandle: discord,
      email,
      lookingForBuddies: formData.get("lookingForBuddies") === "on",
      weeklyGoal: parseWeeklyGoal(formData.get("weeklyGoal")),
      timezone: normalizeTimezone(formData.get("timezone")),
      profileVisibility: parseVisibility(formData.get("profileVisibility")),
      subjectIds: formData.getAll("subjectIds").map(String),
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "That email can't be used. Try another." };
    }
    throw e;
  }
  revalidatePath("/me");
  revalidatePath("/buddies");
  revalidatePath(`/u/${username}`);
  return { ok: "Saved." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireSession();
  if (!(await allow(`pw-change:${userId}`, 10, 60 * 60_000))) return { error: "Too many attempts. Try again later." };
  const current = formData.get("current")?.toString() ?? "";
  const next = formData.get("next")?.toString() ?? "";
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(current, user.passwordHash).catch(() => false))) {
    return { error: "Your current password isn't right." };
  }
  const err = passwordError(next);
  if (err) return { error: err };
  await setPasswordHash(userId, await hashPassword(next));
  return { ok: "Password changed." };
}

export async function unblockAction(otherId: string) {
  const { userId } = await requireSession();
  await unblockUser(userId, otherId);
  revalidatePath("/me");
}
