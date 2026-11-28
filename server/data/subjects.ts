import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

// ─── Public catalog ───────────────────────────────────────────────────────────
// A subject is visible to learners only while at least one expert is assigned —
// and that person must still be staff (TEACHER = expert; the owner/ADMIN may also be one).
export const VISIBLE: Prisma.SubjectWhereInput = {
  experts: { some: { user: { role: { in: ["TEACHER", "ADMIN"] } } } },
};

export type SubjectCard = {
  id: string;
  name: string;
  description: string | null;
  videoTopicCount: number;
  quizCount: number;
  spellingSetCount: number;
  skills: string[];
};

export async function getVisibleSubjects(): Promise<SubjectCard[]> {
  const subjects = await prisma.subject.findMany({
    where: VISIBLE,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      skills: { orderBy: [{ order: "asc" }, { name: "asc" }], select: { name: true } },
      _count: { select: { topics: true, qmTopics: true, spellRightSets: true } },
    },
  });
  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    videoTopicCount: s._count.topics,
    quizCount: s._count.qmTopics,
    spellingSetCount: s._count.spellRightSets,
    skills: s.skills.map((k) => k.name),
  }));
}

/** Subject page for learners. Returns null when hidden (no expert) unless `includeHidden`. */
export async function getSubjectForLearner(id: string, includeHidden = false) {
  return prisma.subject.findFirst({
    where: includeHidden ? { id } : { id, ...VISIBLE },
    include: {
      skills: { orderBy: [{ order: "asc" }, { name: "asc" }] },
      topics: {
        orderBy: { title: "asc" },
        include: {
          _count: { select: { videos: true } },
          skills: { include: { skill: { select: { name: true } } } },
        },
      },
      qmTopics: {
        orderBy: [{ order: "asc" }, { title: "asc" }],
        include: {
          _count: { select: { questions: true } },
          skills: { include: { skill: { select: { name: true } } } },
        },
      },
      spellRightSets: {
        orderBy: [{ mode: "asc" }, { order: "asc" }],
        include: {
          _count: { select: { words: true } },
          skills: { include: { skill: { select: { name: true } } } },
        },
      },
    },
  });
}

/** True when the subject is visible to learners (or the viewer is staff). */
export async function isSubjectVisible(subjectId: string): Promise<boolean> {
  const n = await prisma.subject.count({ where: { id: subjectId, ...VISIBLE } });
  return n > 0;
}

// ─── Access ───────────────────────────────────────────────────────────────────

/** Assignment row exists AND the user is still staff (demotion to learner revokes at once). */
export async function isSubjectExpert(subjectId: string, userId: string): Promise<boolean> {
  const row = await prisma.subjectExpert.findFirst({
    where: { subjectId, userId, user: { role: { in: ["TEACHER", "ADMIN"] } } },
    select: { userId: true },
  });
  return row !== null;
}

export async function getUserRole(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role ?? null;
}

export async function getExpertSubjectIds(userId: string): Promise<string[]> {
  const rows = await prisma.subjectExpert.findMany({
    where: { userId, user: { role: { in: ["TEACHER", "ADMIN"] } } },
    select: { subjectId: true },
  });
  return rows.map((r) => r.subjectId);
}

type Owned =
  | { kind: "topic"; id: string }
  | { kind: "video"; id: string }
  | { kind: "question"; id: string }
  | { kind: "qmTopic"; id: string }
  | { kind: "qmQuestion"; id: string }
  | { kind: "qmAnswer"; id: string }
  | { kind: "spellSet"; id: string }
  | { kind: "spellWord"; id: string }
  | { kind: "skill"; id: string };

/**
 * Resolves the subject that owns a record, starting from the record itself —
 * never from a parent id supplied by the client — so authorization can't be
 * bypassed by pairing an allowed parent with someone else's child.
 */
export async function subjectIdOf(target: Owned): Promise<string | null> {
  switch (target.kind) {
    case "topic":
      return (await prisma.topic.findUnique({ where: { id: target.id }, select: { subjectId: true } }))?.subjectId ?? null;
    case "video":
      return (
        await prisma.video.findUnique({ where: { id: target.id }, select: { topic: { select: { subjectId: true } } } })
      )?.topic.subjectId ?? null;
    case "question":
      return (
        await prisma.question.findUnique({
          where: { id: target.id },
          select: { video: { select: { topic: { select: { subjectId: true } } } } },
        })
      )?.video.topic.subjectId ?? null;
    case "qmTopic":
      return (await prisma.qMTopic.findUnique({ where: { id: target.id }, select: { subjectId: true } }))?.subjectId ?? null;
    case "qmQuestion":
      return (
        await prisma.qMQuestion.findUnique({ where: { id: target.id }, select: { topic: { select: { subjectId: true } } } })
      )?.topic.subjectId ?? null;
    case "qmAnswer":
      return (
        await prisma.qMAnswer.findUnique({
          where: { id: target.id },
          select: { session: { select: { topic: { select: { subjectId: true } } } } },
        })
      )?.session.topic.subjectId ?? null;
    case "spellSet":
      return (await prisma.spellRightSet.findUnique({ where: { id: target.id }, select: { subjectId: true } }))?.subjectId ?? null;
    case "spellWord":
      return (
        await prisma.spellRightWord.findUnique({ where: { id: target.id }, select: { set: { select: { subjectId: true } } } })
      )?.set.subjectId ?? null;
    case "skill":
      return (await prisma.skill.findUnique({ where: { id: target.id }, select: { subjectId: true } }))?.subjectId ?? null;
  }
}

// ─── Admin: subjects ──────────────────────────────────────────────────────────

export async function adminGetSubjects(onlyIds?: string[]) {
  return prisma.subject.findMany({
    where: onlyIds ? { id: { in: onlyIds } } : undefined,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      experts: {
        where: { user: { role: { in: ["TEACHER", "ADMIN"] } } },
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { skills: true, topics: true, qmTopics: true, spellRightSets: true } },
    },
  });
}

export async function adminGetSubject(id: string) {
  return prisma.subject.findUnique({
    where: { id },
    include: {
      experts: {
        where: { user: { role: { in: ["TEACHER", "ADMIN"] } } },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { assignedAt: "asc" },
      },
      skills: { orderBy: [{ order: "asc" }, { name: "asc" }] },
    },
  });
}

export async function adminCreateSubject(data: { name: string; description: string | null; order: number }) {
  return prisma.subject.create({ data });
}

export async function adminUpdateSubject(id: string, data: { name: string; description: string | null; order: number }) {
  return prisma.subject.update({ where: { id }, data });
}

/** Fails (FK RESTRICT) while the subject still has content — by design. */
export async function adminDeleteSubject(id: string) {
  return prisma.subject.delete({ where: { id } });
}

export async function adminAssignExpert(subjectId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) throw new Error("Only expert or admin accounts can be experts.");
  await prisma.subjectExpert.upsert({
    where: { subjectId_userId: { subjectId, userId } },
    update: {},
    create: { subjectId, userId },
  });
}

export async function adminUnassignExpert(subjectId: string, userId: string) {
  await prisma.subjectExpert.deleteMany({ where: { subjectId, userId } });
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function getSubjectSkills(subjectId: string) {
  return prisma.skill.findMany({
    where: { subjectId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function createSkill(subjectId: string, name: string) {
  const max = await prisma.skill.aggregate({ where: { subjectId }, _max: { order: true } });
  return prisma.skill.create({ data: { subjectId, name, order: (max._max.order ?? -1) + 1 } });
}

export async function renameSkill(id: string, name: string) {
  return prisma.skill.update({ where: { id }, data: { name } });
}

export async function deleteSkill(id: string) {
  return prisma.skill.delete({ where: { id } });
}

// ─── Activity subject + skill tags ────────────────────────────────────────────

export type ActivityKind = "topic" | "qmTopic" | "spellSet";

/**
 * Moves an activity to `subjectId` and replaces its skill tags, atomically.
 * Tags are cleared first because the composite FKs (skill must share the
 * activity's subject) would otherwise reject the subject change.
 * Skill ids from other subjects are dropped here and would be rejected by the DB anyway.
 */
export async function setActivitySubjectAndSkills(
  kind: ActivityKind,
  id: string,
  subjectId: string,
  skillIds: string[],
) {
  const valid = await prisma.skill.findMany({
    where: { subjectId, id: { in: skillIds } },
    select: { id: true },
  });
  const ids = valid.map((s) => s.id);

  await prisma.$transaction(async (tx) => {
    // Serialise concurrent saves of the same activity (double-submit) so the
    // delete-then-insert below can't deadlock or hit the tag primary key.
    if (kind === "topic") await tx.$queryRaw`SELECT 1 FROM "Topic" WHERE id = ${id} FOR UPDATE`;
    else if (kind === "qmTopic") await tx.$queryRaw`SELECT 1 FROM "QMTopic" WHERE id = ${id} FOR UPDATE`;
    else await tx.$queryRaw`SELECT 1 FROM "SpellRightSet" WHERE id = ${id} FOR UPDATE`;

    if (kind === "topic") {
      await tx.topicSkill.deleteMany({ where: { topicId: id } });
      await tx.topic.update({ where: { id }, data: { subjectId } });
      if (ids.length) await tx.topicSkill.createMany({ data: ids.map((skillId) => ({ topicId: id, skillId, subjectId })), skipDuplicates: true });
    } else if (kind === "qmTopic") {
      await tx.qMTopicSkill.deleteMany({ where: { topicId: id } });
      await tx.qMTopic.update({ where: { id }, data: { subjectId } });
      if (ids.length) await tx.qMTopicSkill.createMany({ data: ids.map((skillId) => ({ topicId: id, skillId, subjectId })), skipDuplicates: true });
    } else {
      await tx.spellRightSetSkill.deleteMany({ where: { setId: id } });
      await tx.spellRightSet.update({ where: { id }, data: { subjectId } });
      if (ids.length) await tx.spellRightSetSkill.createMany({ data: ids.map((skillId) => ({ setId: id, skillId, subjectId })), skipDuplicates: true });
    }
  });
}

/** Subjects + skills the current editor may tag with (for form pickers). */
export async function getEditableSubjectsWithSkills(onlyIds?: string[]) {
  return prisma.subject.findMany({
    where: onlyIds ? { id: { in: onlyIds } } : undefined,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      skills: { orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } },
    },
  });
}

export async function getExpertCandidates() {
  return prisma.user.findMany({
    where: { role: { in: ["TEACHER", "ADMIN"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}
