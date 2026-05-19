"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  adminCreateQuestion,
  adminDeleteQuestion,
  adminUpdateQuestion,
} from "@/server/data/admin";

function buildOptions(
  formData: FormData,
  correctIndex: number,
): { isCorrect: boolean; order: number; text: string }[] {
  return [1, 2, 3, 4].map((n) => ({
    isCorrect: n === correctIndex,
    order: n,
    text: formData.get(`option${n}`)?.toString().trim() ?? "",
  }));
}

export async function createQuestionAction(
  topicId: string,
  videoId: string,
  formData: FormData,
) {
  await requireRole("ADMIN");
  const prompt = formData.get("prompt")?.toString().trim() ?? "";
  const order = parseInt(formData.get("order")?.toString() ?? "1", 10);
  const checkpointSeconds = parseInt(
    formData.get("checkpointSeconds")?.toString() ?? "0",
    10,
  );
  const correct = parseInt(formData.get("correct")?.toString() ?? "1", 10);
  const options = buildOptions(formData, correct);

  await adminCreateQuestion({ checkpointSeconds, options, order, prompt, videoId });

  revalidatePath(`/admin/topics/${topicId}/videos/${videoId}/questions`);
  redirect(`/admin/topics/${topicId}/videos/${videoId}/questions`);
}

export async function updateQuestionAction(
  topicId: string,
  videoId: string,
  questionId: string,
  formData: FormData,
) {
  await requireRole("ADMIN");
  const prompt = formData.get("prompt")?.toString().trim() ?? "";
  const checkpointSeconds = parseInt(
    formData.get("checkpointSeconds")?.toString() ?? "0",
    10,
  );
  const correct = parseInt(formData.get("correct")?.toString() ?? "1", 10);

  const options = [1, 2, 3, 4].map((n) => ({
    id: formData.get(`option${n}Id`)?.toString() ?? "",
    isCorrect: n === correct,
    text: formData.get(`option${n}`)?.toString().trim() ?? "",
  }));

  await adminUpdateQuestion(questionId, { checkpointSeconds, options, prompt });

  revalidatePath(`/admin/topics/${topicId}/videos/${videoId}/questions`);
  redirect(`/admin/topics/${topicId}/videos/${videoId}/questions`);
}

export async function deleteQuestionAction(
  topicId: string,
  videoId: string,
  questionId: string,
) {
  await requireRole("ADMIN");
  await adminDeleteQuestion(questionId);
  revalidatePath(`/admin/topics/${topicId}/videos/${videoId}/questions`);
  redirect(`/admin/topics/${topicId}/videos/${videoId}/questions`);
}
