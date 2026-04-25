import Link from "next/link";
import { notFound } from "next/navigation";

import { QMQuestionForm } from "@/components/admin/qm-question-form";
import { adminGetQMTopic } from "@/server/data/question-maker";
import { createQMQuestionAction } from "../../../actions";

type Props = { params: Promise<{ topicId: string }> };

export default async function NewQMQuestionPage({ params }: Props) {
  const { topicId } = await params;
  const topic = await adminGetQMTopic(topicId);
  if (!topic) notFound();

  const nextOrder = topic.questions.length + 1;
  const action = createQMQuestionAction.bind(null, topicId, nextOrder);

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
          Admin · QuestionMaker · {topic.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">New question</h1>
      </div>
      <QMQuestionForm action={action} submitLabel="Create question" />
    </div>
  );
}
