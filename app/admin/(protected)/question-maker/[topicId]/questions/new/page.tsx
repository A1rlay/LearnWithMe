import Link from "next/link";
import { notFound } from "next/navigation";

import { QMQuestionForm } from "@/components/admin/qm-question-form";
import { adminGetQMTopic } from "@/server/data/question-maker";
import { createQMQuestionAction } from "../../../actions";
import { requireEditorPage } from "@/lib/auth";

type Props = { params: Promise<{ topicId: string }> };

export default async function NewQMQuestionPage({ params }: Props) {
  const { topicId } = await params;
  await requireEditorPage({ kind: "qmTopic", id: topicId });
  const topic = await adminGetQMTopic(topicId);
  if (!topic) notFound();

  const nextOrder = topic.questions.length + 1;
  const action = createQMQuestionAction.bind(null, topicId, nextOrder);

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
          Studio · Quizzes · {topic.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">New question</h1>
      </div>
      <QMQuestionForm action={action} submitLabel="Create question" />
    </div>
  );
}
