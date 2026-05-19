"use server";

import { getSession } from "@/lib/session";
import { createQMSession, submitQMAnswers } from "@/server/data/question-maker";

export async function submitQuizAction(
  topicId: string,
  answers: { questionId: string; answer: unknown; isCorrect: boolean | null }[],
) {
  const session = await getSession();
  const qmSession = await createQMSession(topicId, session?.userId ?? null);
  await submitQMAnswers(qmSession.id, answers);
}
