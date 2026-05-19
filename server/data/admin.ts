import { prisma } from "@/server/db";

// ─── Topics ──────────────────────────────────────────────────────────────────

export async function adminGetAllTopics() {
  return prisma.topic.findMany({
    include: {
      _count: {
        select: { videos: true },
      },
    },
    orderBy: { title: "asc" },
  });
}

export async function adminGetTopic(id: string) {
  return prisma.topic.findUnique({
    where: { id },
    include: {
      videos: {
        include: {
          _count: { select: { questions: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function adminCreateTopic(data: {
  description: string;
  level: string;
  tags: string[];
  title: string;
}) {
  return prisma.topic.create({ data });
}

export async function adminUpdateTopic(
  id: string,
  data: {
    description: string;
    level: string;
    tags: string[];
    title: string;
  },
) {
  return prisma.topic.update({ where: { id }, data });
}

export async function adminDeleteTopic(id: string) {
  return prisma.topic.delete({ where: { id } });
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export async function adminGetVideo(id: string) {
  return prisma.video.findUnique({
    where: { id },
    include: {
      topic: true,
      questions: {
        include: {
          options: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function adminCreateVideo(data: {
  description: string;
  order: number;
  title: string;
  topicId: string;
  videoUrl: string;
}) {
  return prisma.video.create({ data });
}

export async function adminUpdateVideo(
  id: string,
  data: {
    description: string;
    order: number;
    title: string;
    videoUrl: string;
  },
) {
  return prisma.video.update({ where: { id }, data });
}

export async function adminDeleteVideo(id: string) {
  return prisma.video.delete({ where: { id } });
}

// ─── Questions ───────────────────────────────────────────────────────────────

export async function adminGetQuestion(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      video: { include: { topic: true } },
    },
  });
}

export async function adminCreateQuestion(data: {
  checkpointSeconds: number;
  options: { isCorrect: boolean; order: number; text: string }[];
  order: number;
  prompt: string;
  videoId: string;
}) {
  const { options, ...questionData } = data;
  return prisma.question.create({
    data: {
      ...questionData,
      options: { create: options },
    },
    include: { options: true },
  });
}

export async function adminUpdateQuestion(
  id: string,
  data: {
    checkpointSeconds: number;
    options: { id: string; isCorrect: boolean; text: string }[];
    prompt: string;
  },
) {
  const { options, ...questionData } = data;

  await prisma.question.update({ where: { id }, data: questionData });

  for (const option of options) {
    await prisma.questionOption.update({
      where: { id: option.id },
      data: { isCorrect: option.isCorrect, text: option.text },
    });
  }

  return prisma.question.findUnique({
    where: { id },
    include: { options: { orderBy: { order: "asc" } } },
  });
}

export async function adminDeleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

// ─── Dashboard counts ─────────────────────────────────────────────────────────

export async function adminGetDashboardCounts() {
  const [topicCount, videoCount, questionCount, qmTopicCount, qmQuestionCount, userCount] =
    await Promise.all([
      prisma.topic.count(),
      prisma.video.count(),
      prisma.question.count(),
      prisma.qMTopic.count(),
      prisma.qMQuestion.count(),
      prisma.user.count(),
    ]);

  return { topicCount, videoCount, questionCount, qmTopicCount, qmQuestionCount, userCount };
}
