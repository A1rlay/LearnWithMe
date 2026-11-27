import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

const topicCatalogArgs = Prisma.validator<Prisma.TopicDefaultArgs>()({
  include: {
    _count: {
      select: {
        videos: true,
      },
    },
  },
});

const topicDetailArgs = Prisma.validator<Prisma.TopicDefaultArgs>()({
  include: {
    subject: { select: { id: true, name: true } },
    skills: { include: { skill: { select: { name: true } } } },
    videos: {
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    },
  },
});

const videoLessonArgs = Prisma.validator<Prisma.VideoDefaultArgs>()({
  include: {
    questions: {
      include: {
        options: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    },
    topic: true,
  },
});

type TopicCatalogRecord = Prisma.TopicGetPayload<typeof topicCatalogArgs>;
type TopicDetailRecord = Prisma.TopicGetPayload<typeof topicDetailArgs>;
type VideoLessonRecord = Prisma.VideoGetPayload<typeof videoLessonArgs>;

export type TopicCard = {
  description: string | null;
  id: string;
  level: string | null;
  tags: string[];
  title: string;
  videoCount: number;
};

export type TopicVideoSummary = {
  description: string | null;
  id: string;
  questionCount: number;
  title: string;
};

export type TopicDetail = {
  description: string | null;
  id: string;
  subject: { id: string; name: string };
  skills: string[];
  level: string | null;
  tags: string[];
  title: string;
  videos: TopicVideoSummary[];
};

export type QuizQuestion = {
  checkpointSeconds: number;
  id: string;
  options: {
    id: string;
    text: string;
  }[];
  order: number;
  prompt: string;
};

export type VideoLesson = {
  description: string | null;
  subtitlesEnabled: boolean;
  questions: QuizQuestion[];
  title: string;
  topic: {
    id: string;
    title: string;
    subjectId: string;
  };
  videoUrl: string;
};

export type SingleAnswerResult = {
  correct: boolean;
  correctOptionId: string | null;
};

function mapTopicCard(topic: TopicCatalogRecord): TopicCard {
  return {
    description: topic.description,
    id: topic.id,
    level: topic.level,
    tags: topic.tags,
    title: topic.title,
    videoCount: topic._count.videos,
  };
}

function mapTopicDetail(topic: TopicDetailRecord): TopicDetail {
  return {
    description: topic.description,
    id: topic.id,
    subject: topic.subject,
    skills: topic.skills.map((s) => s.skill.name),
    level: topic.level,
    tags: topic.tags,
    title: topic.title,
    videos: topic.videos.map((video) => ({
      description: video.description,
      id: video.id,
      questionCount: video._count.questions,
      title: video.title,
    })),
  };
}

function mapVideoLesson(video: VideoLessonRecord): VideoLesson {
  return {
    description: video.description,
    questions: video.questions.map((question) => ({
      checkpointSeconds: question.checkpointSeconds,
      id: question.id,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      order: question.order,
      prompt: question.prompt,
    })),
    subtitlesEnabled: video.subtitlesEnabled,
    title: video.title,
    topic: {
      id: video.topic.id,
      title: video.topic.title,
      subjectId: video.topic.subjectId,
    },
    videoUrl: video.videoUrl,
  };
}

export async function getTopicCatalog() {
  const topics = await prisma.topic.findMany({
    ...topicCatalogArgs,
    orderBy: {
      title: "asc",
    },
  });

  return topics.map(mapTopicCard);
}

export async function getTopicById(id: string) {
  const topic = await prisma.topic.findUnique({
    ...topicDetailArgs,
    where: { id },
  });

  return topic ? mapTopicDetail(topic) : null;
}

export async function getVideoLessonById(videoId: string) {
  const video = await prisma.video.findUnique({
    ...videoLessonArgs,
    where: { id: videoId },
  });

  return video ? mapVideoLesson(video) : null;
}

export async function submitSingleAnswer(
  questionId: string,
  optionId: string,
  userId: string | null,
): Promise<SingleAnswerResult | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: true },
  });

  if (!question) return null;
  // The chosen option must belong to this question (the DB enforces the same
  // with a composite FK on VideoAnswer).
  if (!question.options.some((o) => o.id === optionId)) return null;

  const correctOption = question.options.find((o) => o.isCorrect) ?? null;
  const correct = optionId === correctOption?.id;

  // Signed-in learners' answers feed their skill radar. Guests still get feedback.
  // Throttle: one stored answer per question per 30 s. Scoring additionally counts
  // each question once per day, so bursts can't inflate a skill.
  if (userId) {
    const recent = await prisma.videoAnswer.findFirst({
      where: { userId, questionId, createdAt: { gte: new Date(Date.now() - 30_000) } },
      select: { id: true },
    });
    if (!recent) {
      await prisma.videoAnswer.create({
        data: { userId, questionId, optionId, isCorrect: correct },
      });
    }
  }

  return {
    correct,
    correctOptionId: correctOption?.id ?? null,
  };
}
