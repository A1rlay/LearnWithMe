"use server";

import { getSession } from "@/lib/session";
import { recordQMRun } from "@/server/data/question-maker";

/**
 * Stores a finished quiz. Only raw answers are accepted: the server grades them
 * (lib/qm-scoring), drops questions that aren't in this topic, and refuses
 * topics whose subject is hidden (no expert).
 */
export async function submitQuizAction(
  topicId: string,
  answers: { questionId: string; answer: unknown }[],
): Promise<void> {
  if (typeof topicId !== "string" || !Array.isArray(answers) || answers.length > 200) return;
  const session = await getSession();
  await recordQMRun(topicId, session?.userId ?? null, answers);
}
