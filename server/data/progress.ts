import { prisma } from "@/server/db";

export type TopicStat = {
  id: string;
  title: string;
  sessions: number;
  correct: number;
  total: number;
  avgPct: number;
};

export type RecentSession = {
  id: string;
  topicId: string;
  topicTitle: string;
  completedAt: Date;
  correct: number;
  total: number;
  pct: number;
};

export type StudentStats = {
  totalSessions: number;
  videosWatched: number;
  overallPct: number;
  topics: TopicStat[];
  recentSessions: RecentSession[];
};

export async function getStudentStats(userId: string): Promise<StudentStats> {
  const [sessions, videoProgress] = await Promise.all([
    prisma.qMSession.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        topic: { select: { id: true, title: true } },
        answers: { select: { isCorrect: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.videoProgress.findMany({
      where: { userId, completedAt: { not: null } },
    }),
  ]);

  // Per-topic aggregation
  const topicMap = new Map<string, TopicStat>();
  for (const s of sessions) {
    if (!topicMap.has(s.topicId)) {
      topicMap.set(s.topicId, {
        id: s.topicId,
        title: s.topic.title,
        sessions: 0,
        correct: 0,
        total: 0,
        avgPct: 0,
      });
    }
    const t = topicMap.get(s.topicId)!;
    t.sessions++;
    for (const a of s.answers) {
      if (a.isCorrect !== null) {
        t.total++;
        if (a.isCorrect) t.correct++;
      }
    }
  }

  const topics: TopicStat[] = Array.from(topicMap.values()).map((t) => ({
    ...t,
    avgPct: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  }));

  // Overall score
  const totalCorrect = topics.reduce((a, t) => a + t.correct, 0);
  const totalAnswered = topics.reduce((a, t) => a + t.total, 0);
  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Recent sessions (last 8)
  const recentSessions: RecentSession[] = sessions.slice(0, 8).map((s) => {
    const correct = s.answers.filter((a) => a.isCorrect === true).length;
    const total = s.answers.filter((a) => a.isCorrect !== null).length;
    return {
      id: s.id,
      topicId: s.topicId,
      topicTitle: s.topic.title,
      completedAt: s.completedAt!,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  return {
    totalSessions: sessions.length,
    videosWatched: videoProgress.length,
    overallPct,
    topics,
    recentSessions,
  };
}

export async function markVideoComplete(userId: string, videoId: string) {
  await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId, videoId } },
    update: { completedAt: new Date() },
    create: { userId, videoId, completedAt: new Date() },
  });
}
