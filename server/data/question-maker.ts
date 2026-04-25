import { QMQuestionType } from "@prisma/client";

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

export type QMQuestionData =
  | MultipleOptionData
  | OpenAnswerData
  | MatcherData
  | ClassifierData;

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
  title: string;
  description: string | null;
  questions: QMQuestionDetail[];
};

export type QMQuestionDetail = {
  id: string;
  order: number;
  type: QMQuestionType;
  prompt: string;
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
    questions: topic.questions.map((q) => ({
      data: q.data as QMQuestionData,
      id: q.id,
      order: q.order,
      prompt: q.prompt,
      type: q.type,
    })),
    title: topic.title,
  };
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function createQMSession(topicId: string) {
  return prisma.qMSession.create({ data: { topicId } });
}

export async function submitQMAnswers(
  sessionId: string,
  answers: { questionId: string; answer: unknown; isCorrect: boolean | null }[],
) {
  await prisma.qMAnswer.createMany({
    data: answers.map((a) => ({
      answer: a.answer as object,
      isCorrect: a.isCorrect,
      questionId: a.questionId,
      sessionId,
    })),
  });
  await prisma.qMSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
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

export async function adminGetQMTopics() {
  return prisma.qMTopic.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { order: "asc" },
  });
}

export async function adminGetQMTopic(id: string) {
  return prisma.qMTopic.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function adminCreateQMTopic(data: {
  title: string;
  description: string;
  order: number;
}) {
  return prisma.qMTopic.create({ data });
}

export async function adminUpdateQMTopic(
  id: string,
  data: { title: string; description: string; order: number },
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
  data: QMQuestionData;
}) {
  return prisma.qMQuestion.create({
    data: { ...data, data: data.data as object },
  });
}

export async function adminUpdateQMQuestion(
  id: string,
  data: { prompt: string; data: QMQuestionData },
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
