"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { adminReviewQMAnswer } from "@/server/data/question-maker";

export async function reviewAnswerAction(
  userId: string,
  sessionId: string,
  answerId: string,
  isCorrect: boolean,
) {
  await requireRole("ADMIN", "TEACHER");
  await adminReviewQMAnswer(answerId, isCorrect);
  revalidatePath(`/profile/${userId}/sessions/${sessionId}`);
  // Also keep the admin sessions view in sync
  revalidatePath(`/admin/question-maker/sessions/${sessionId}`);
}
