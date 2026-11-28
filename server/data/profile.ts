import type { ProjectStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { VISIBLE } from "@/server/data/subjects";

// ─── Access ───────────────────────────────────────────────────────────────────

/**
 * Who may open a profile: the person, staff, or, per the owner's setting, any
 * signed-in member or only accepted buddies. A block either way hides it.
 */
export async function canViewProfile(
  viewer: { userId: string; role: string } | null,
  target: { id: string; profileVisibility: "MEMBERS" | "BUDDIES" | "ONLY_ME" },
): Promise<boolean> {
  if (!viewer) return false;
  if (viewer.userId === target.id) return true;
  if (viewer.role === "ADMIN" || viewer.role === "TEACHER") return true;
  const blocked = await prisma.block.count({
    where: {
      OR: [
        { blockerId: viewer.userId, blockedId: target.id },
        { blockerId: target.id, blockedId: viewer.userId },
      ],
    },
  });
  if (blocked) return false;
  if (target.profileVisibility === "MEMBERS") return true;
  if (target.profileVisibility === "ONLY_ME") return false;
  return areBuddies(viewer.userId, target.id);
}

export async function areBuddies(a: string, b: string): Promise<boolean> {
  const [userAId, userBId] = a < b ? [a, b] : [b, a];
  return (await prisma.buddyConnection.count({ where: { userAId, userBId, status: "ACCEPTED" } })) > 0;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfileByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      bio: true,
      interests: true,
      discordHandle: true,
      lookingForBuddies: true,
      profileVisibility: true,
      timezone: true,
      weeklyGoal: true,
      createdAt: true,
      learning: { where: { subject: VISIBLE }, select: { subject: { select: { id: true, name: true } } } },
      projects: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, description: true, url: true, status: true, subject: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function buddyCount(userId: string): Promise<number> {
  return prisma.buddyConnection.count({ where: { status: "ACCEPTED", OR: [{ userAId: userId }, { userBId: userId }] } });
}

// ─── Practice heatmap + streaks ───────────────────────────────────────────────

export type DayCount = { day: string; n: number };

/**
 * Answers per local day for the last 53 weeks, in the learner's timezone.
 * Legacy tables store UTC in `timestamp`, so they are read AT TIME ZONE 'UTC' first.
 */
export async function getPracticeDays(userId: string, timezone: string): Promise<{ days: DayCount[]; today: string }> {
  const rows = await prisma.$queryRaw<{ day: string; n: number }[]>`
    WITH a AS (
      SELECT (qa."createdAt" AT TIME ZONE 'UTC') AS at
        FROM "QMAnswer" qa JOIN "QMSession" s ON s.id = qa."sessionId" WHERE s."userId" = ${userId}
      UNION ALL
      SELECT va."createdAt" FROM "VideoAnswer" va WHERE va."userId" = ${userId}
      UNION ALL
      SELECT (sa."createdAt" AT TIME ZONE 'UTC')
        FROM "SpellRightAnswer" sa JOIN "SpellRightSession" s ON s.id = sa."sessionId" WHERE s."userId" = ${userId}
    )
    SELECT to_char((at AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM a
     WHERE at >= now() - interval '372 days'
     GROUP BY 1
     ORDER BY 1
  `;
  const [{ today }] = await prisma.$queryRaw<{ today: string }[]>`
    SELECT to_char((now() AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD') AS today
  `;
  return { days: rows, today };
}

const addDays = (iso: string, d: number) => {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
};

/** Current streak counts back from today, or from yesterday if today has no practice yet. */
export function streaks(days: DayCount[], today: string) {
  const active = new Set(days.filter((d) => d.n > 0).map((d) => d.day));
  let current = 0;
  let cursor = active.has(today) ? today : addDays(today, -1);
  while (active.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of [...active].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest, activeDays: active.size, practicedToday: active.has(today) };
}

// ─── Recent activity ──────────────────────────────────────────────────────────

export type RecentItem = { kind: "Quiz" | "Sounds" | "Video"; title: string; subject: string; href: string; at: Date };

export async function getRecentActivity(userId: string, limit = 8): Promise<RecentItem[]> {
  const rows = await prisma.$queryRaw<(Omit<RecentItem, "at"> & { at: Date })[]>`
    SELECT * FROM (
      SELECT 'Quiz' AS kind, t.title, sub.name AS subject, '/question-maker/' || t.id AS href,
             (s."completedAt" AT TIME ZONE 'UTC') AS at
        FROM "QMSession" s JOIN "QMTopic" t ON t.id = s."topicId" JOIN "Subject" sub ON sub.id = t."subjectId"
       WHERE s."userId" = ${userId} AND s."completedAt" IS NOT NULL
      UNION ALL
      SELECT 'Sounds', t.title, sub.name, '/spell-right/' || t.id || '/play', (s."completedAt" AT TIME ZONE 'UTC')
        FROM "SpellRightSession" s JOIN "SpellRightSet" t ON t.id = s."setId" JOIN "Subject" sub ON sub.id = t."subjectId"
       WHERE s."userId" = ${userId} AND s."completedAt" IS NOT NULL
      UNION ALL
      SELECT 'Video', v.title, sub.name, '/topics/' || tp.id || '/videos/' || v.id, (p."completedAt" AT TIME ZONE 'UTC')
        FROM "VideoProgress" p JOIN "Video" v ON v.id = p."videoId" JOIN "Topic" tp ON tp.id = v."topicId"
        JOIN "Subject" sub ON sub.id = tp."subjectId"
       WHERE p."userId" = ${userId} AND p."completedAt" IS NOT NULL
    ) x
    ORDER BY at DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function completedActivityCount(userId: string): Promise<number> {
  const [r] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT ((SELECT count(*) FROM "QMSession" WHERE "userId" = ${userId} AND "completedAt" IS NOT NULL)
          + (SELECT count(*) FROM "SpellRightSession" WHERE "userId" = ${userId} AND "completedAt" IS NOT NULL)
          + (SELECT count(*) FROM "VideoProgress" WHERE "userId" = ${userId} AND "completedAt" IS NOT NULL))::int AS n
  `;
  return r.n;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const MAX_PROJECTS = 6;

export class ProjectError extends Error {}

type ProjectInput = { title: string; description: string | null; url: string | null; status: ProjectStatus; subjectId: string | null };

async function visibleSubjectOrNull(subjectId: string | null) {
  if (!subjectId) return null;
  const s = await prisma.subject.findFirst({ where: { id: subjectId, ...VISIBLE }, select: { id: true } });
  return s?.id ?? null;
}

export async function createProject(userId: string, data: ProjectInput) {
  const subjectId = await visibleSubjectOrNull(data.subjectId);
  await prisma.$transaction(async (tx) => {
    // Lock the owner row so two concurrent creates can't both pass the limit.
    await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const n = await tx.learningProject.count({ where: { userId } });
    if (n >= MAX_PROJECTS) throw new ProjectError(`You can pin up to ${MAX_PROJECTS} projects.`);
    await tx.learningProject.create({ data: { ...data, subjectId, userId, order: n } });
  });
}

export async function updateProject(userId: string, id: string, data: ProjectInput) {
  const subjectId = await visibleSubjectOrNull(data.subjectId);
  // Scoped to the owner: someone else's id matches nothing.
  const r = await prisma.learningProject.updateMany({ where: { id, userId }, data: { ...data, subjectId } });
  if (r.count === 0) throw new ProjectError("That project wasn't found.");
}

export async function deleteProject(userId: string, id: string) {
  await prisma.learningProject.deleteMany({ where: { id, userId } });
}
