import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

/** Below this many graded answers a skill is "not enough practice yet", not 0%. */
export const MIN_ANSWERS = 3;
export const THEN_DAYS = 30;

export type SkillScore = {
  skillId: string;
  name: string;
  /** Graded answers up to now. */
  total: number;
  correct: number;
  /** % correct now, or null when total < MIN_ANSWERS. */
  pct: number | null;
  /** Same, counting only answers at least THEN_DAYS old. */
  totalThen: number;
  pctThen: number | null;
};

export type SubjectSkillProgress = {
  subjectId: string;
  subjectName: string;
  skills: SkillScore[];
  /** Any graded answer in this subject at all (drives whether the card is shown). */
  hasAnswers: boolean;
};

type Row = {
  skillId: string;
  name: string;
  subjectId: string;
  subjectName: string;
  skillOrder: number;
  subjectOrder: number;
  total: bigint;
  correct: bigint;
  totalThen: bigint;
  correctThen: bigint;
};

const pct = (correct: number, total: number) =>
  total >= MIN_ANSWERS ? Math.round((correct / total) * 100) : null;

/**
 * Skill progress for one learner, grouped by subject.
 *
 * An answer counts toward every skill its activity is tagged with (ADR 0001);
 * each question/word counts once per UTC day (first attempt). Hidden subjects are excluded.
 * Sources: WordCatch VideoAnswer (server-graded), SpellRight answers
 * (server-graded), QuestionMaker answers with a non-null isCorrect (open
 * answers count once an expert reviews them).
 * Legacy tables store UTC in `timestamp`, so they are read AT TIME ZONE 'UTC'.
 */
export async function getSkillProgress(userId: string): Promise<SubjectSkillProgress[]> {
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    -- Each question / word counts once per UTC day — the FIRST answer that day. The
    -- correct answer is revealed after each attempt, so a later retry isn't evidence of skill;
    -- this also stops retries and request bursts from inflating a skill.
    WITH va AS (
      SELECT DISTINCT ON (a."questionId", (a."createdAt" AT TIME ZONE 'UTC')::date)
             a."questionId", a."isCorrect", a."createdAt" AS at
        FROM "VideoAnswer" a
       WHERE a."userId" = ${userId}
       ORDER BY a."questionId", (a."createdAt" AT TIME ZONE 'UTC')::date, a."createdAt" ASC
    ), qa AS (
      SELECT DISTINCT ON (a."questionId", a."createdAt"::date)
             a."questionId", se."topicId", a."isCorrect", a."createdAt" AT TIME ZONE 'UTC' AS at
        FROM "QMAnswer" a
        JOIN "QMSession" se ON se.id = a."sessionId"
       WHERE se."userId" = ${userId} AND a."isCorrect" IS NOT NULL
       ORDER BY a."questionId", a."createdAt"::date, a."createdAt" ASC
    ), sa AS (
      SELECT DISTINCT ON (a."wordId", a."createdAt"::date)
             se."setId", a."isCorrect", a."createdAt" AT TIME ZONE 'UTC' AS at
        FROM "SpellRightAnswer" a
        JOIN "SpellRightSession" se ON se.id = a."sessionId"
       WHERE se."userId" = ${userId}
       ORDER BY a."wordId", a."createdAt"::date, a."createdAt" ASC
    ), answers AS (
      SELECT ts."skillId", va."isCorrect", va.at
        FROM va
        JOIN "Question" q    ON q.id = va."questionId"
        JOIN "Video" v       ON v.id = q."videoId"
        JOIN "TopicSkill" ts ON ts."topicId" = v."topicId"
      UNION ALL
      SELECT qs."skillId", qa."isCorrect", qa.at
        FROM qa JOIN "QMTopicSkill" qs ON qs."topicId" = qa."topicId"
      UNION ALL
      SELECT ss."skillId", sa."isCorrect", sa.at
        FROM sa JOIN "SpellRightSetSkill" ss ON ss."setId" = sa."setId"
    )
    SELECT k.id AS "skillId", k.name, k."order" AS "skillOrder",
           s.id AS "subjectId", s.name AS "subjectName", s."order" AS "subjectOrder",
           count(a."skillId")                                   AS total,
           count(a."skillId") FILTER (WHERE a."isCorrect")      AS correct,
           count(a."skillId") FILTER (WHERE a.at <= now() - make_interval(days => ${THEN_DAYS}::int))  AS "totalThen",
           count(a."skillId") FILTER (WHERE a."isCorrect" AND a.at <= now() - make_interval(days => ${THEN_DAYS}::int)) AS "correctThen"
      FROM "Skill" k
      JOIN "Subject" s ON s.id = k."subjectId"
      LEFT JOIN answers a ON a."skillId" = k.id
     -- Hidden subjects (no current expert) are not charted.
     WHERE EXISTS (
       SELECT 1 FROM "SubjectExpert" x JOIN "User" u ON u.id = x."userId"
        WHERE x."subjectId" = s.id AND u.role = 'TEACHER'
     )
     GROUP BY k.id, s.id
     ORDER BY s."order", s.name, k."order", k.name
  `);

  const bySubject = new Map<string, SubjectSkillProgress>();
  for (const r of rows) {
    const total = Number(r.total);
    const correct = Number(r.correct);
    const totalThen = Number(r.totalThen);
    const correctThen = Number(r.correctThen);
    let group = bySubject.get(r.subjectId);
    if (!group) {
      group = { subjectId: r.subjectId, subjectName: r.subjectName, skills: [], hasAnswers: false };
      bySubject.set(r.subjectId, group);
    }
    if (total > 0) group.hasAnswers = true;
    group.skills.push({
      skillId: r.skillId,
      name: r.name,
      total,
      correct,
      pct: pct(correct, total),
      totalThen,
      pctThen: pct(correctThen, totalThen),
    });
  }
  return [...bySubject.values()].filter((g) => g.hasAnswers);
}
