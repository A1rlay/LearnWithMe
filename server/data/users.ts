import { Role } from "@prisma/client";

import { prisma } from "@/server/db";

/** Every account whose email matches case-insensitively (legacy data may hold case variants). */
export async function getUsersByEmail(email: string) {
  return prisma.user.findMany({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
    take: 5,
  });
}

/** Login accepts a username or an email. */
export async function getUserByLogin(login: string) {
  const l = login.trim().toLowerCase();
  if (!l) return null;
  // Emails compare case-insensitively (older accounts may have mixed case stored).
  return l.includes("@")
    ? prisma.user.findFirst({ where: { email: { equals: l, mode: "insensitive" } }, orderBy: { createdAt: "asc" } })
    : prisma.user.findUnique({ where: { username: l.replace(/^@/, "") } });
}

export async function adminGetAllUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminGetUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function adminCreateUser(data: {
  username: string;
  email: string | null;
  passwordHash: string;
  name: string;
  role: Role;
}) {
  return prisma.user.create({ data });
}

export async function adminUpdateUser(
  id: string,
  data: { username: string; email: string | null; name: string; role: Role; passwordHash?: string },
) {
  // Leaving the expert role ends every subject assignment in the same transaction.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data });
    if (user.role !== "TEACHER") await tx.subjectExpert.deleteMany({ where: { userId: id } });
    return user;
  });
}

export async function adminDeleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

/** Self sign-up: always a learner. Throws Prisma P2002 if the username is taken. */
export async function createLearner(data: { username: string; passwordHash: string }) {
  return prisma.user.create({
    data: { username: data.username, name: data.username, passwordHash: data.passwordHash, role: "STUDENT" },
  });
}
