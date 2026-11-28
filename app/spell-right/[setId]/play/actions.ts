"use server";

import { getSession } from "@/lib/session";
import { recordSpellRightRun } from "@/server/data/spell-right";

/**
 * Saves a finished SpellRight run for the signed-in learner (guests: no-op).
 * Only the learner's raw answers are accepted; correctness is computed server-side.
 */
export async function recordSpellRightRunAction(
  setId: string,
  answers: { wordId: string; answer: string }[],
): Promise<void> {
  const session = await getSession();
  if (!session) return;
  if (!Array.isArray(answers) || answers.length > 500) return;
  const clean = answers
    .filter((a) => a && typeof a.wordId === "string" && typeof a.answer === "string")
    .map((a) => ({ wordId: a.wordId, answer: a.answer }));
  await recordSpellRightRun(setId, session.userId, clean);
}
