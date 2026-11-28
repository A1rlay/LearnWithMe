import { QMQuestionType } from "@prisma/client";

import { scoreQMAnswer } from "@/lib/qm-scoring";
import { prisma } from "@/server/db";

export { QMQuestionType };

// ─── JSON data shapes per question type ──────────────────────────────────────

export type MultipleOptionData = {
  options: string[];
  correctIndex: number;
};

export type OpenAnswerData = {
  referenceAnswer: string;
};

export type MatcherData = {
  pairs: { left: string; right: string }[];
};

export type ClassifierData = {
  categories: string[];
  items: { text: string; categoryIndex: number }[];
};

export type FillBlankData = {
  sentence: string;
  answer: string;
  hint?: string;
};

export type TrueFalseData = {
  statement: string;
  isTrue: boolean;
  explanation?: string;
};

export type SentenceOrderData = {
  words: string[];
};

export type WordScrambleData = {
  word: string;
  hint?: string;
};

export type FlashcardData = {
  front: string;
  back: string;
  frontLabel?: string;
  backLabel?: string;
};

export type QMQuestionData =
  | MultipleOptionData
  | OpenAnswerData
  | MatcherData
  | ClassifierData
  | FillBlankData
  | TrueFalseData
  | SentenceOrderData
  | WordScrambleData
  | FlashcardData;

// ─── Public types ─────────────────────────────────────────────────────────────

export type QMTopicSummary = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  questionCount: number;
};

export type QMTopicDetail = {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  level: string | null;
  instructions: string | null;
  questions: QMQuestionDetail[];
};

export type QMQuestionDetail = {
  id: string;
  order: number;
  type: QMQuestionType;
  prompt: string;
  hint: string | null;
  data: QMQuestionData;
};

// ─── Topic queries ────────────────────────────────────────────────────────────

export async function getQMTopics(): Promise<QMTopicSummary[]> {
  const topics = await prisma.qMTopic.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { order: "asc" },
  });
  return topics.map((t) => ({
    description: t.description,
    id: t.id,
    order: t.order,
    questionCount: t._count.questions,
    title: t.title,
  }));
}

export async function getQMTopicDetail(id: string): Promise<QMTopicDetail | null> {
  const topic = await prisma.qMTopic.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!topic) return null;
  return {
    description: topic.description,
    id: topic.id,
    subjectId: topic.subjectId,
    level: topic.level,
    instructions: topic.instructions,
    questions: topic.questions.map((q) => ({
      data: q.data as QMQuestionData,
      id: q.id,
      order: q.order,
      prompt: q.prompt,
      hint: q.hint,
      type: q.type,
    })),
    title: topic.title,
  };
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Grades and stores one quiz run. Returns null (stores nothing) when the topic
 * doesn't exist or its subject is hidden. Questions from other topics are ignored;
 * oversized answer payloads are rejected.
 */
export async function recordQMRun(
  topicId: string,
  userId: string | null,
  answers: { questionId: string; answer: unknown }[],
) {
  const topic = await prisma.qMTopic.findFirst({
    where: { id: topicId, subject: { experts: { some: { user: { role: { in: ["TEACHER", "ADMIN"] } } } } } },
    select: { questions: { select: { id: true, type: true, data: true } } },
  });
  if (!topic) return null;
  const byId = new Map(topic.questions.map((q) => [q.id, q]));
  const seen = new Set<string>();
  const rows = answers.flatMap((a) => {
    const q = a && typeof a.questionId === "string" ? byId.get(a.questionId) : undefined;
    if (!q || seen.has(q.id)) return [];
    seen.add(q.id);
    const json = JSON.stringify(a.answer ?? null);
    if (json.length > 4000) return [];
    return [{ questionId: q.id, answer: JSON.parse(json) as object, isCorrect: scoreQMAnswer(q, a.answer) }];
  });
  if (rows.length === 0) return null;
  return prisma.qMSession.create({
    data: { topicId, userId, completedAt: new Date(), answers: { create: rows } },
    select: { id: true },
  });
}

export async function getQMSession(sessionId: string) {
  return prisma.qMSession.findUnique({
    where: { id: sessionId },
    include: {
      topic: true,
      answers: {
        include: { question: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function adminGetQMTopics(subjectIds?: string[]) {
  return prisma.qMTopic.findMany({
    where: subjectIds ? { subjectId: { in: subjectIds } } : undefined,
    include: { _count: { select: { questions: true } }, subject: { select: { name: true } } },
    orderBy: { order: "asc" },
  });
}

export async function adminGetQMTopic(id: string) {
  return prisma.qMTopic.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } }, skills: { select: { skillId: true } } },
  });
}

export async function adminCreateQMTopic(data: {
  title: string;
  description: string;
  order: number;
  subjectId: string;
  level?: string | null;
  instructions?: string | null;
}) {
  return prisma.qMTopic.create({ data });
}

export async function adminUpdateQMTopic(
  id: string,
  data: { title: string; description: string; order: number; level?: string | null; instructions?: string | null },
) {
  return prisma.qMTopic.update({ where: { id }, data });
}

export async function adminDeleteQMTopic(id: string) {
  return prisma.qMTopic.delete({ where: { id } });
}

export async function adminGetQMQuestion(id: string) {
  return prisma.qMQuestion.findUnique({ where: { id } });
}

export async function adminCreateQMQuestion(data: {
  topicId: string;
  order: number;
  type: QMQuestionType;
  prompt: string;
  hint?: string | null;
  data: QMQuestionData;
}) {
  return prisma.qMQuestion.create({
    data: { ...data, data: data.data as object },
  });
}

export async function adminUpdateQMQuestion(
  id: string,
  data: { prompt: string; hint?: string | null; data: QMQuestionData },
) {
  return prisma.qMQuestion.update({
    where: { id },
    data: { ...data, data: data.data as object },
  });
}

export async function adminDeleteQMQuestion(id: string) {
  return prisma.qMQuestion.delete({ where: { id } });
}

export async function adminGetQMSessions(topicId: string) {
  return prisma.qMSession.findMany({
    where: { topicId, completedAt: { not: null } },
    include: {
      answers: {
        include: { question: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminReviewQMAnswer(
  answerId: string,
  isCorrect: boolean,
) {
  return prisma.qMAnswer.update({
    where: { id: answerId },
    data: { isCorrect, reviewedAt: new Date() },
  });
}
