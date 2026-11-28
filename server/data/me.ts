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
      weeklyGoal: true,
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
    weeklyGoal: number;
    subjectIds: string[];
  },
) {
  const allowed = await prisma.subject.findMany({ where: { ...VISIBLE, id: { in: data.subjectIds } }, select: { id: true } });
  const { name, bio, interests, discordHandle, email, lookingForBuddies, weeklyGoal } = data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { name, bio, interests, discordHandle, email, lookingForBuddies, weeklyGoal } }),
    prisma.learnerSubject.deleteMany({ where: { userId } }),
    prisma.learnerSubject.createMany({ data: allowed.map((s) => ({ userId, subjectId: s.id })), skipDuplicates: true }),
  ]);
}

export async function setPasswordHash(userId: string, passwordHash: string) {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function needsOnboarding(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { onboardedAt: true, role: true } });
  return !!u && u.role === "STUDENT" && u.onboardedAt === null;
}

/** First-run choices. Empty choices are fine: skipping just marks the flow done. */
export async function completeOnboarding(
  userId: string,
  data: { subjectIds: string[]; interests: string[]; lookingForBuddies: boolean; weeklyGoal: number } | null,
) {
  if (!data) {
    await prisma.user.update({ where: { id: userId }, data: { onboardedAt: new Date() } });
    return;
  }
  const allowed = await prisma.subject.findMany({ where: { ...VISIBLE, id: { in: data.subjectIds } }, select: { id: true } });
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        interests: data.interests,
        lookingForBuddies: data.lookingForBuddies,
        weeklyGoal: data.weeklyGoal,
        onboardedAt: new Date(),
      },
    }),
    prisma.learnerSubject.deleteMany({ where: { userId } }),
    prisma.learnerSubject.createMany({ data: allowed.map((s) => ({ userId, subjectId: s.id })), skipDuplicates: true }),
  ]);
}

/**
 * Where a learner should start in a subject: the first activity of the first
 * kind the subject offers (videos, then quizzes, then sounds). Null when empty.
 */
export async function firstActivityHref(subjectId: string): Promise<string | null> {
  const s = await prisma.subject.findFirst({
    where: { id: subjectId, ...VISIBLE },
    select: {
      activityTypes: true,
      topics: { orderBy: { title: "asc" }, take: 1, select: { id: true } },
      qmTopics: { orderBy: [{ order: "asc" }, { title: "asc" }], take: 1, select: { id: true } },
      spellRightSets: { orderBy: [{ mode: "asc" }, { order: "asc" }], take: 1, select: { id: true } },
    },
  });
  if (!s) return null;
  if (s.activityTypes.includes("VIDEO") && s.topics[0]) return `/topics/${s.topics[0].id}`;
  if (s.activityTypes.includes("QUIZ") && s.qmTopics[0]) return `/question-maker/${s.qmTopics[0].id}`;
  if (s.activityTypes.includes("SPELLING") && s.spellRightSets[0]) return `/spell-right/${s.spellRightSets[0].id}/play`;
  return null;
}

/** For the welcome flow: open subjects with a short line about what's inside. */
export async function getPickableSubjectsWithCounts() {
  const rows = await prisma.subject.findMany({
    where: VISIBLE,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { topics: true, qmTopics: true, spellRightSets: true, learners: true } },
    },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    activities: s._count.topics + s._count.qmTopics + s._count.spellRightSets,
    learners: s._count.learners,
  }));
}
