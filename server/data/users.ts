import { Role } from "@prisma/client";

import { prisma } from "@/server/db";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function adminGetAllUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminGetUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function adminCreateUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}) {
  return prisma.user.create({ data });
}

export async function adminUpdateUser(
  id: string,
  data: { email: string; name: string; role: Role; passwordHash?: string },
) {
  return prisma.user.update({ where: { id }, data });
}

export async function adminDeleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
