import Link from "next/link";
import { notFound } from "next/navigation";

import { QMQuestionForm } from "@/components/admin/qm-question-form";
import { adminGetQMQuestion } from "@/server/data/question-maker";
import type { QMQuestionData, QMQuestionType } from "@/server/data/question-maker";
import { updateQMQuestionAction } from "../../../../actions";

type Props = { params: Promise<{ topicId: string; questionId: string }> };

export default async function EditQMQuestionPage({ params }: Props) {
  const { topicId, questionId } = await params;
  const question = await adminGetQMQuestion(questionId);
  if (!question) notFound();

  const action = updateQMQuestionAction.bind(null, topicId, questionId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/question-maker/${topicId}/questions`}
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        ← Back
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · QuestionMaker · Question {question.order}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Edit question</h1>
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
