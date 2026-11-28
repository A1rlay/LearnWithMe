import Link from "next/link";
import { notFound } from "next/navigation";

import { QMQuestionForm } from "@/components/admin/qm-question-form";
import { adminGetQMQuestion } from "@/server/data/question-maker";
import type { QMQuestionData, QMQuestionType } from "@/server/data/question-maker";
import { updateQMQuestionAction } from "../../../../actions";
import { requireEditorPage } from "@/lib/auth";

type Props = { params: Promise<{ topicId: string; questionId: string }> };

export default async function EditQMQuestionPage({ params }: Props) {
  const { topicId, questionId } = await params;
  await requireEditorPage({ kind: "qmQuestion", id: questionId });
  const question = await adminGetQMQuestion(questionId);
  if (!question) notFound();

  const action = updateQMQuestionAction.bind(null, topicId, questionId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/question-maker/${topicId}/questions`}
        className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          Studio · Quizzes · Question {question.order}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">Edit question</h1>
      </div>
      <QMQuestionForm
        action={action}
        defaults={{
          type: question.type as QMQuestionType,
          prompt: question.prompt,
          data: question.data as QMQuestionData,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
