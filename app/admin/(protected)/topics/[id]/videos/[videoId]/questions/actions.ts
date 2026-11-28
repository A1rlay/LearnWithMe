"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireEditorOf } from "@/lib/auth";
import { int, str } from "@/lib/form";
import { adminCreateQuestion, adminDeleteQuestion, adminUpdateQuestion } from "@/server/data/admin";
import { prisma } from "@/server/db";

async function questionPath(questionId: string) {
  const q = await prisma.question.findUniqueOrThrow({
    where: { id: questionId },
    select: { videoId: true, video: { select: { topicId: true } } },
  });
  return `/admin/topics/${q.video.topicId}/videos/${q.videoId}/questions`;
}

export async function createQuestionAction(_topicId: string, videoId: string, formData: FormData) {
  await requireEditorOf({ kind: "video", id: videoId });
  const correct = int(formData, "correct", 1);
  await adminCreateQuestion({
    videoId,
    prompt: str(formData, "prompt"),
    order: int(formData, "order", 1),
    checkpointSeconds: Math.max(0, int(formData, "checkpointSeconds")),
    options: [1, 2, 3, 4].map((n) => ({
      isCorrect: n === correct,
      order: n,
      text: str(formData, `option${n}`),
    })),
  });
  const { topicId } = await prisma.video.findUniqueOrThrow({ where: { id: videoId }, select: { topicId: true } });
  const path = `/admin/topics/${topicId}/videos/${videoId}/questions`;
  revalidatePath(path);
  redirect(path);
}

export async function updateQuestionAction(
  _topicId: string,
  _videoId: string,
  questionId: string,
  formData: FormData,
) {
  await requireEditorOf({ kind: "question", id: questionId });
  const correct = int(formData, "correct", 1);
  await adminUpdateQuestion(questionId, {
    prompt: str(formData, "prompt"),
    checkpointSeconds: Math.max(0, int(formData, "checkpointSeconds")),
    options: [1, 2, 3, 4].map((n) => ({
      id: str(formData, `option${n}Id`),
      isCorrect: n === correct,
      text: str(formData, `option${n}`),
    })),
  });
  const path = await questionPath(questionId);
  revalidatePath(path);
  redirect(path);
}

export async function deleteQuestionAction(_topicId: string, _videoId: string, questionId: string) {
  await requireEditorOf({ kind: "question", id: questionId });
  const path = await questionPath(questionId);
  await adminDeleteQuestion(questionId);
  revalidatePath(path);
  redirect(path);
}
