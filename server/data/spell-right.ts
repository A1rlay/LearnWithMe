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

export async function createSpellRightSession(setId: string, userId: string | null = null) {
  return prisma.spellRightSession.create({ data: { setId, userId } });
}

export async function submitSpellRightAnswers(
  sessionId: string,
  answers: { wordId: string; answer: string; isCorrect: boolean }[],
) {
  await prisma.spellRightAnswer.createMany({
    data: answers.map((a) => ({ ...a, sessionId })),
  });
  await prisma.spellRightSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
  });
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function adminGetSpellRightSets() {
  return prisma.spellRightSet.findMany({
    include: { _count: { select: { words: true } } },
    orderBy: [{ mode: "asc" }, { order: "asc" }],
  });
}

export async function adminGetSpellRightSet(id: string) {
  return prisma.spellRightSet.findUnique({
    where: { id },
    include: { words: { orderBy: { order: "asc" } } },
  });
}

export async function adminCreateSpellRightSet(data: {
  title: string;
  description: string;
  mode: SpellRightMode;
  order: number;
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
