import { prisma } from "@/server/db";
import { VISIBLE } from "@/server/data/subjects";

export async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      bio: true,
      interests: true,
      discordHandle: true,
      lookingForBuddies: true,
      role: true,
      learning: { select: { subjectId: true } },
    },
  });
}

/** Only subjects learners can see may be picked. */
export async function getPickableSubjects() {
  return prisma.subject.findMany({ where: VISIBLE, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } });
}

export async function updateMyProfile(
  userId: string,
  data: {
    name: string;
    bio: string | null;
    interests: string[];
    discordHandle: string | null;
    email: string | null;
    lookingForBuddies: boolean;
    subjectIds: string[];
  },
) {
  const allowed = await prisma.subject.findMany({ where: { ...VISIBLE, id: { in: data.subjectIds } }, select: { id: true } });
  const { name, bio, interests, discordHandle, email, lookingForBuddies } = data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { name, bio, interests, discordHandle, email, lookingForBuddies } }),
    prisma.learnerSubject.deleteMany({ where: { userId } }),
    prisma.learnerSubject.createMany({ data: allowed.map((s) => ({ userId, subjectId: s.id })), skipDuplicates: true }),
  ]);
}

export async function setPasswordHash(userId: string, passwordHash: string) {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
