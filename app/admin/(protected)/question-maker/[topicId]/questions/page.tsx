import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { adminGetQMTopic } from "@/server/data/question-maker";
import { deleteQMQuestionAction } from "../../actions";
import { requireEditorPage } from "@/lib/auth";

type Props = { params: Promise<{ topicId: string }> };

const typeLabel: Record<string, string> = {
  MULTIPLE_OPTION: "Multiple option",
  OPEN_ANSWER: "Open answer",
  MATCHER: "Matcher",
  CLASSIFIER: "Classifier",
};

export default async function QMQuestionsPage({ params }: Props) {
  const { topicId } = await params;
  await requireEditorPage({ kind: "qmTopic", id: topicId });
  const topic = await adminGetQMTopic(topicId);
  if (!topic) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/question-maker" className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">Studio · Quizzes · {topic.title}</p>
          <h1 className="mt-2 font-serif text-4xl text-fg">Questions</h1>
        </div>
        <Link href={`/admin/question-maker/${topicId}/questions/new`} className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90">
          New question
        </Link>
      </div>

      {topic.questions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line p-12 text-center text-sm text-muted">No questions yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {topic.questions.map((q) => (
            <div key={q.id} className="flex items-start justify-between gap-4 rounded-[24px] border border-line bg-surface px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-text">
                  {q.order}. {typeLabel[q.type] ?? q.type}
                </p>
                <p className="mt-1 font-semibold text-fg">{q.prompt}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/admin/question-maker/${topicId}/questions/${q.id}/edit`} className="rounded-full border border-fg/25 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg hover:text-fg">
                  Edit
                </Link>
                <DeleteButton action={deleteQMQuestionAction.bind(null, topicId, q.id)} label={`question ${q.order}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
