import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

/**
 * "Completed activities": a finished quiz run, a finished sounds/spelling run, or a
 * video watched to the end. Legacy tables store UTC in `timestamp`, read AT TIME ZONE 'UTC'.
 * Weeks run Monday 00:00 UTC to Monday.
 */
const COMPLETIONS = Prisma.sql`
  SELECT "userId", ("completedAt" AT TIME ZONE 'UTC') AS at FROM "QMSession" WHERE "completedAt" IS NOT NULL AND "userId" IS NOT NULL
  UNION ALL
  SELECT "userId", ("completedAt" AT TIME ZONE 'UTC') FROM "SpellRightSession" WHERE "completedAt" IS NOT NULL AND "userId" IS NOT NULL
  UNION ALL
  SELECT "userId", ("completedAt" AT TIME ZONE 'UTC') FROM "VideoProgress" WHERE "completedAt" IS NOT NULL
`;

export type WeekProgress = { done: number; goal: number; lastActiveAt: Date | null };

/** This week's completed activities, goal and last activity for each user. */
export async function getWeekProgress(userIds: string[]): Promise<Map<string, WeekProgress>> {
  const out = new Map<string, WeekProgress>();
  if (userIds.length === 0) return out;
  const rows = await prisma.$queryRaw<{ id: string; goal: number; done: number; last: Date | null }[]>`
    WITH c AS (${COMPLETIONS})
    SELECT u.id,
           u."weeklyGoal" AS goal,
           (SELECT count(*)::int FROM c WHERE c."userId" = u.id AND c.at >= date_trunc('week', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') AS done,
           (SELECT max(c.at) FROM c WHERE c."userId" = u.id) AS last
      FROM "User" u
     WHERE u.id IN (${Prisma.join(userIds)})
  `;
  for (const r of rows) out.set(r.id, { done: r.done, goal: r.goal, lastActiveAt: r.last });
  return out;
}

/** "Studied today", "Studied 3 days ago"… for buddy cards. */
export function activityLabel(last: Date | null, now = new Date()): string {
  if (!last) return "Hasn't started yet";
  const day = (d: Date) => Math.floor(d.getTime() / 86_400_000);
  const days = day(now) - day(last);
  if (days <= 0) return "Studied today";
  if (days === 1) return "Studied yesterday";
  if (days < 7) return `Studied ${days} days ago`;
  return "Not active this week";
}

export type Funnel = {
  windowDays: number;
  signedUp: number;
  onboarded: number;
  firstActivity7d: number;
  withBuddy: number;
  returnedWeek2: number;
};

/**
 * Activation funnel for learners who signed up in the last `days` days.
 * Activated = finished at least one activity within 7 days of signing up.
 */
export async function getActivationFunnel(days = 30): Promise<Funnel> {
  const [r] = await prisma.$queryRaw<Omit<Funnel, "windowDays">[]>`
    WITH c AS (${COMPLETIONS}),
    u AS (
      SELECT id, ("createdAt" AT TIME ZONE 'UTC') AS joined, "onboardedAt"
        FROM "User"
       WHERE role = 'STUDENT'
         AND ("createdAt" AT TIME ZONE 'UTC') >= now() - make_interval(days => ${days}::int)
    )
    SELECT count(*)::int AS "signedUp",
           count(*) FILTER (WHERE u."onboardedAt" IS NOT NULL)::int AS onboarded,
           count(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM c WHERE c."userId" = u.id AND c.at < u.joined + interval '7 days'))::int AS "firstActivity7d",
           count(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM "BuddyConnection" b
              WHERE b.status = 'ACCEPTED' AND (b."userAId" = u.id OR b."userBId" = u.id)))::int AS "withBuddy",
           count(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM c WHERE c."userId" = u.id
                AND c.at >= u.joined + interval '7 days' AND c.at < u.joined + interval '14 days'))::int AS "returnedWeek2"
      FROM u
  `;
  return { windowDays: days, ...r };
}
