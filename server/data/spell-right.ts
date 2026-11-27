import { SpellRightMode } from "@prisma/client";

import { prisma } from "@/server/db";

export { SpellRightMode };

// ─── Public types ─────────────────────────────────────────────────────────────

export type SpellRightSetSummary = {
  id: string;
  title: string;
  description: string | null;
  mode: SpellRightMode;
  order: number;
  wordCount: number;
};

export type SpellRightWordDetail = {
  id: string;
  word: string;
  correctAnswer: string | null;
  explanation: string | null;
  order: number;
};

export type SpellRightSetDetail = {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  mode: SpellRightMode;
  words: SpellRightWordDetail[];
};

// ─── Public queries ───────────────────────────────────────────────────────────

export async function getSpellRightSets(): Promise<SpellRightSetSummary[]> {
  const sets = await prisma.spellRightSet.findMany({
    include: { _count: { select: { words: true } } },
    orderBy: [{ mode: "asc" }, { order: "asc" }],
  });
  return sets.map((s) => ({
    description: s.description,
    id: s.id,
    mode: s.mode,
    order: s.order,
    title: s.title,
    wordCount: s._count.words,
  }));
}

export async function getSpellRightSetDetail(id: string): Promise<SpellRightSetDetail | null> {
  const set = await prisma.spellRightSet.findUnique({
    where: { id },
    include: { words: { orderBy: { order: "asc" } } },
  });
  if (!set) return null;
  return {
    description: set.description,
    id: set.id,
    subjectId: set.subjectId,
    mode: set.mode,
    title: set.title,
    words: set.words.map((w) => ({
      correctAnswer: w.correctAnswer,
      explanation: w.explanation,
      id: w.id,
      order: w.order,
      word: w.word,
    })),
  };
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** Same normalisation the pronunciation client uses for the live feedback. */
export function normalizeSpoken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Records a finished run. Correctness is recomputed here from the stored words —
 * the client only sends what the learner chose (termination) or what the speech
 * recogniser heard (pronunciation). Words not in the set are ignored, and
 * sets in hidden subjects are refused. Pronunciation trusts the browser's
 * transcript by nature (speech recognition only runs client-side).
 */
export async function recordSpellRightRun(
  setId: string,
  userId: string,
  answers: { wordId: string; answer: string }[],
) {
  const set = await prisma.spellRightSet.findFirst({
    where: { id: setId, subject: { experts: { some: { user: { role: "TEACHER" } } } } },
    select: { mode: true, words: { select: { id: true, word: true, correctAnswer: true } } },
  });
  if (!set) return null;
  const byId = new Map(set.words.map((w) => [w.id, w]));
  const seen = new Set<string>();

  const rows = answers.flatMap((a) => {
    const w = byId.get(a.wordId);
    if (!w || seen.has(w.id)) return [];
    seen.add(w.id);
    const answer = a.answer.slice(0, 200);
    const isCorrect =
      set.mode === SpellRightMode.TERMINATION
        ? w.correctAnswer !== null && answer === w.correctAnswer
        : normalizeSpoken(answer) === normalizeSpoken(w.word);
    return [{ wordId: w.id, answer, isCorrect }];
  });
  if (rows.length === 0) return null;

  return prisma.spellRightSession.create({
    data: { setId, userId, completedAt: new Date(), answers: { create: rows } },
    select: { id: true },
  });
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function adminGetSpellRightSets(subjectIds?: string[]) {
  return prisma.spellRightSet.findMany({
    where: subjectIds ? { subjectId: { in: subjectIds } } : undefined,
    include: { _count: { select: { words: true } }, subject: { select: { name: true } } },
    orderBy: [{ mode: "asc" }, { order: "asc" }],
  });
}

export async function adminGetSpellRightSet(id: string) {
  return prisma.spellRightSet.findUnique({
    where: { id },
    include: { words: { orderBy: { order: "asc" } }, skills: { select: { skillId: true } } },
  });
}

export async function adminCreateSpellRightSet(data: {
  title: string;
  description: string;
  mode: SpellRightMode;
  order: number;
  subjectId: string;
}) {
  return prisma.spellRightSet.create({ data });
}

export async function adminUpdateSpellRightSet(
  id: string,
  data: { title: string; description: string; order: number },
) {
  return prisma.spellRightSet.update({ where: { id }, data });
}

export async function adminDeleteSpellRightSet(id: string) {
  return prisma.spellRightSet.delete({ where: { id } });
}

export async function adminGetSpellRightWord(id: string) {
  return prisma.spellRightWord.findUnique({
    where: { id },
    include: { set: true },
  });
}

export async function adminCreateSpellRightWord(data: {
  setId: string;
  word: string;
  correctAnswer: string | null;
  explanation: string | null;
  order: number;
}) {
  return prisma.spellRightWord.create({ data });
}

export async function adminUpdateSpellRightWord(
  id: string,
  data: { word: string; correctAnswer: string | null; explanation: string | null },
) {
  return prisma.spellRightWord.update({ where: { id }, data });
}

export async function adminDeleteSpellRightWord(id: string) {
  return prisma.spellRightWord.delete({ where: { id } });
}
