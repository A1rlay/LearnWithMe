"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  adminCreateQMTopic,
  adminDeleteQMTopic,
  adminUpdateQMTopic,
  adminCreateQMQuestion,
  adminDeleteQMQuestion,
  adminUpdateQMQuestion,
  adminReviewQMAnswer,
  QMQuestionType,
} from "@/server/data/question-maker";
import type { QMQuestionData } from "@/server/data/question-maker";

// ─── Topics ───────────────────────────────────────────────────────────────────

export async function createQMTopicAction(formData: FormData) {
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);
  await adminCreateQMTopic({ title, description, order });
  revalidatePath("/admin/question-maker");
  revalidatePath("/question-maker");
  redirect("/admin/question-maker");
}

export async function updateQMTopicAction(id: string, formData: FormData) {
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);
  await adminUpdateQMTopic(id, { title, description, order });
  revalidatePath("/admin/question-maker");
  revalidatePath("/question-maker");
  redirect("/admin/question-maker");
}

export async function deleteQMTopicAction(id: string) {
  await adminDeleteQMTopic(id);
  revalidatePath("/admin/question-maker");
  revalidatePath("/question-maker");
  redirect("/admin/question-maker");
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function createQMQuestionAction(
  topicId: string,
  order: number,
  formData: FormData,
) {
  const type = formData.get("type")?.toString() as QMQuestionType;
  const prompt = formData.get("prompt")?.toString().trim() ?? "";
  const data = parseQuestionData(type, formData);

  await adminCreateQMQuestion({ topicId, order, type, prompt, data });
  revalidatePath(`/admin/question-maker/${topicId}/questions`);
  redirect(`/admin/question-maker/${topicId}/questions`);
}

export async function updateQMQuestionAction(
  topicId: string,
  questionId: string,
  formData: FormData,
) {
  const type = formData.get("type")?.toString() as QMQuestionType;
  const prompt = formData.get("prompt")?.toString().trim() ?? "";
  const data = parseQuestionData(type, formData);

  await adminUpdateQMQuestion(questionId, { prompt, data });
  revalidatePath(`/admin/question-maker/${topicId}/questions`);
  redirect(`/admin/question-maker/${topicId}/questions`);
}

export async function deleteQMQuestionAction(topicId: string, questionId: string) {
  await adminDeleteQMQuestion(questionId);
  revalidatePath(`/admin/question-maker/${topicId}/questions`);
  redirect(`/admin/question-maker/${topicId}/questions`);
}

// ─── Review ───────────────────────────────────────────────────────────────────

export async function reviewQMAnswerAction(
  sessionId: string,
  answerId: string,
  isCorrect: boolean,
) {
  await adminReviewQMAnswer(answerId, isCorrect);
  revalidatePath(`/admin/question-maker/sessions/${sessionId}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseQuestionData(type: QMQuestionType, formData: FormData): QMQuestionData {
  switch (type) {
    case QMQuestionType.MULTIPLE_OPTION: {
      const count = parseInt(formData.get("optionCount")?.toString() ?? "4", 10);
      const options = Array.from({ length: count }, (_, i) =>
        formData.get(`option_${i}`)?.toString().trim() ?? "",
      );
      const correctIndex = parseInt(formData.get("correctIndex")?.toString() ?? "0", 10);
      return { options, correctIndex };
    }
    case QMQuestionType.OPEN_ANSWER: {
      const referenceAnswer = formData.get("referenceAnswer")?.toString().trim() ?? "";
      return { referenceAnswer };
    }
    case QMQuestionType.MATCHER: {
      const count = parseInt(formData.get("pairCount")?.toString() ?? "4", 10);
      const pairs = Array.from({ length: count }, (_, i) => ({
        left: formData.get(`left_${i}`)?.toString().trim() ?? "",
        right: formData.get(`right_${i}`)?.toString().trim() ?? "",
      }));
      return { pairs };
    }
    case QMQuestionType.CLASSIFIER: {
      const catCount = parseInt(formData.get("categoryCount")?.toString() ?? "2", 10);
      const categories = Array.from({ length: catCount }, (_, i) =>
        formData.get(`category_${i}`)?.toString().trim() ?? "",
      );
      const itemCount = parseInt(formData.get("itemCount")?.toString() ?? "4", 10);
      const items = Array.from({ length: itemCount }, (_, i) => ({
        categoryIndex: parseInt(formData.get(`item_cat_${i}`)?.toString() ?? "0", 10),
        text: formData.get(`item_${i}`)?.toString().trim() ?? "",
      }));
      return { categories, items };
    }
  }
}
