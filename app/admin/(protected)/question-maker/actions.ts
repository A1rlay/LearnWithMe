"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireEditorOf, requireSubjectEditor } from "@/lib/auth";
import { int, str, subjectAndSkills } from "@/lib/form";
import { setActivitySubjectAndSkills } from "@/server/data/subjects";
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

function revalidateQM() {
  revalidatePath("/admin/question-maker");
  revalidatePath("/", "layout");
}

export async function createQMTopicAction(formData: FormData) {
  const { subjectId, skillIds } = subjectAndSkills(formData);
  await requireSubjectEditor(subjectId);
  const topic = await adminCreateQMTopic({
    title: str(formData, "title"),
    description: str(formData, "description"),
    order: int(formData, "order"),
    subjectId,
  });
  await setActivitySubjectAndSkills("qmTopic", topic.id, subjectId, skillIds);
  revalidateQM();
  redirect("/admin/question-maker");
}

export async function updateQMTopicAction(id: string, formData: FormData) {
  const { subjectId, skillIds } = subjectAndSkills(formData);
  await requireEditorOf({ kind: "qmTopic", id });
  await requireSubjectEditor(subjectId);
  await adminUpdateQMTopic(id, {
    title: str(formData, "title"),
    description: str(formData, "description"),
    order: int(formData, "order"),
  });
  await setActivitySubjectAndSkills("qmTopic", id, subjectId, skillIds);
  revalidateQM();
  redirect("/admin/question-maker");
}

export async function deleteQMTopicAction(id: string) {
  await requireEditorOf({ kind: "qmTopic", id });
  await adminDeleteQMTopic(id);
  revalidateQM();
  redirect("/admin/question-maker");
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function createQMQuestionAction(topicId: string, order: number, formData: FormData) {
  await requireEditorOf({ kind: "qmTopic", id: topicId });
  const type = formData.get("type")?.toString() as QMQuestionType;
  if (!Object.values(QMQuestionType).includes(type)) throw new Error("Unknown question type.");
  const prompt = str(formData, "prompt");
  const data = parseQuestionData(type, formData);
  await adminCreateQMQuestion({ topicId, order, type, prompt, data });
  revalidatePath(`/admin/question-maker/${topicId}/questions`);
  redirect(`/admin/question-maker/${topicId}/questions`);
}

export async function updateQMQuestionAction(_topicId: string, questionId: string, formData: FormData) {
  await requireEditorOf({ kind: "qmQuestion", id: questionId });
  const type = formData.get("type")?.toString() as QMQuestionType;
  if (!Object.values(QMQuestionType).includes(type)) throw new Error("Unknown question type.");
  const prompt = str(formData, "prompt");
  const data = parseQuestionData(type, formData);
  const q = await adminUpdateQMQuestion(questionId, { prompt, data });
  revalidatePath(`/admin/question-maker/${q.topicId}/questions`);
  redirect(`/admin/question-maker/${q.topicId}/questions`);
}

export async function deleteQMQuestionAction(_topicId: string, questionId: string) {
  await requireEditorOf({ kind: "qmQuestion", id: questionId });
  const q = await adminDeleteQMQuestion(questionId);
  revalidatePath(`/admin/question-maker/${q.topicId}/questions`);
  redirect(`/admin/question-maker/${q.topicId}/questions`);
}

// ─── Review ───────────────────────────────────────────────────────────────────

export async function reviewQMAnswerAction(sessionId: string, answerId: string, isCorrect: boolean) {
  await requireEditorOf({ kind: "qmAnswer", id: answerId });
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
      const correctIndex = parseInt(
        formData.get("correctIndex")?.toString() ?? "0",
        10,
      );
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
      const catCount = parseInt(
        formData.get("categoryCount")?.toString() ?? "2",
        10,
      );
      const categories = Array.from({ length: catCount }, (_, i) =>
        formData.get(`category_${i}`)?.toString().trim() ?? "",
      );
      const itemCount = parseInt(formData.get("itemCount")?.toString() ?? "4", 10);
      const items = Array.from({ length: itemCount }, (_, i) => ({
        categoryIndex: parseInt(
          formData.get(`item_cat_${i}`)?.toString() ?? "0",
          10,
        ),
        text: formData.get(`item_${i}`)?.toString().trim() ?? "",
      }));
      return { categories, items };
    }
    default:
      return {} as QMQuestionData;
  }
}
