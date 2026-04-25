"use server";

import { submitQMAnswers } from "@/server/data/question-maker";

export async function submitQuizAction(
  sessionId: string,
  answers: { questionId: string; answer: unknown; isCorrect: boolean | null }[],
) {
  await submitQMAnswers(sessionId, answers);
}
