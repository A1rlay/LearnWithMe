import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { getWeekProgress, type WeekProgress } from "@/server/data/activity";

export type StudentInsight = {
  id: string;
  name: string;
  username: string;
  week: WeekProgress;
  answers30d: number;
  pct30d: number | null;
};

export type MissedQuestion = { id: string; prompt: string; activity: string; kind: "Quiz" | "Video"; attempts: number; wrongPct: number };

/**
 * What an expert needs at a glance: who is active, who has gone quiet, and which
 * questions trip the class up. Last 30 days; legacy timestamps read AT TIME ZONE 'UTC'.
 */
export async function getClassInsights(classId: string): Promise<{ students: StudentInsight[]; missed: MissedQuestion[] }> {
  const members = await prisma.classStudent.findMany({
    where: { classId },
    select: { student: { select: { id: true, name: true, username: true } } },
  });
  const ids = members.map((m) => m.student.id);
  if (ids.length === 0) return { students: [], missed: [] };

  const [week, acc, missed] = await Promise.all([
    getWeekProgress(ids),
    prisma.$queryRaw<{ userId: string; total: number; correct: number }[]>`
      WITH a AS (
        SELECT s."userId", qa."isCorrect"
          FROM "QMAnswer" qa JOIN "QMSession" s ON s.id = qa."sessionId"
         WHERE s."userId" IN (${Prisma.join(ids)}) AND qa."isCorrect" IS NOT NULL
           AND (qa."createdAt" AT TIME ZONE 'UTC') >= now() - interval '30 days'
        UNION ALL
        SELECT va."userId", va."isCorrect" FROM "VideoAnswer" va
         WHERE va."userId" IN (${Prisma.join(ids)}) AND va."createdAt" >= now() - interval '30 days'
        UNION ALL
        SELECT s."userId", sa."isCorrect"
          FROM "SpellRightAnswer" sa JOIN "SpellRightSession" s ON s.id = sa."sessionId"
         WHERE s."userId" IN (${Prisma.join(ids)})
           AND (sa."createdAt" AT TIME ZONE 'UTC') >= now() - interval '30 days'
      )
      SELECT "userId", count(*)::int AS total, count(*) FILTER (WHERE "isCorrect")::int AS correct
        FROM a GROUP BY "userId"
    `,
    prisma.$queryRaw<MissedQuestion[]>`
      WITH a AS (
        SELECT qa."questionId" AS id, qa."isCorrect", 'Quiz' AS kind
          FROM "QMAnswer" qa JOIN "QMSession" s ON s.id = qa."sessionId"
         WHERE s."userId" IN (${Prisma.join(ids)}) AND qa."isCorrect" IS NOT NULL
           AND (qa."createdAt" AT TIME ZONE 'UTC') >= now() - interval '30 days'
        UNION ALL
        SELECT va."questionId", va."isCorrect", 'Video' FROM "VideoAnswer" va
         WHERE va."userId" IN (${Prisma.join(ids)}) AND va."createdAt" >= now() - interval '30 days'
      ),
      g AS (
        SELECT id, kind, count(*)::int AS attempts,
               round(100.0 * count(*) FILTER (WHERE NOT "isCorrect") / count(*))::int AS "wrongPct"
          FROM a GROUP BY id, kind HAVING count(*) >= 2
      )
      SELECT g.id, g.kind, g.attempts, g."wrongPct",
             COALESCE(qq.prompt, vq.prompt) AS prompt,
             COALESCE(qt.title, v.title) AS activity
        FROM g
        LEFT JOIN "QMQuestion" qq ON g.kind = 'Quiz' AND qq.id = g.id
        LEFT JOIN "QMTopic" qt ON qt.id = qq."topicId"
        LEFT JOIN "Question" vq ON g.kind = 'Video' AND vq.id = g.id
        LEFT JOIN "Video" v ON v.id = vq."videoId"
       WHERE g."wrongPct" > 0
       ORDER BY g."wrongPct" DESC, g.attempts DESC
       LIMIT 5
    `,
  ]);

  const accMap = new Map(acc.map((r) => [r.userId, r]));
  const students = members
    .map(({ student: s }) => {
      const a = accMap.get(s.id);
      return {
        ...s,
        week: week.get(s.id) ?? { done: 0, goal: 3, lastActiveAt: null },
        answers30d: a?.total ?? 0,
        pct30d: a && a.total > 0 ? Math.round((a.correct / a.total) * 100) : null,
      };
    })
    // Quietest first: they are the ones to check on.
    .sort((x, y) => (x.week.lastActiveAt?.getTime() ?? 0) - (y.week.lastActiveAt?.getTime() ?? 0));
  return { students, missed };
}
