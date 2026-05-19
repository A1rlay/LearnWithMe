import Link from "next/link";
import { notFound } from "next/navigation";

import { AnswerDisplay } from "@/components/qm/answer-display";
import { getQMSession } from "@/server/data/question-maker";
import type { QMQuestionData } from "@/server/data/question-maker";
import { reviewQMAnswerAction } from "../../actions";

type Props = { params: Promise<{ sessionId: string }> };

export default async function QMSessionReviewPage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getQMSession(sessionId);
  if (!session) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/question-maker/sessions?topicId=${session.topicId}`}
        className="flex items-center gap-1.5 text-sm font-semibold text-[rgba(255,255,255,0.55)] transition-colors hover:text-white"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · QuestionMaker · {session.topic.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Session review</h1>
        {session.completedAt && (
          <p className="mt-1 text-sm text-[var(--muted)]">
            Completed {new Date(session.completedAt).toLocaleString()}
          </p>
        )}
        {session.userId && (
          <Link
            href={`/profile/${session.userId}`}
            className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            View student profile
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {session.answers.map((answer, idx) => {
          const qData = answer.question.data as QMQuestionData;

          return (
            <div
              key={answer.id}
              className="flex flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    {idx + 1}. {answer.question.type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--foreground)]">
                    {answer.question.prompt}
                  </p>
                </div>
                {answer.isCorrect === true && (
                  <span className="shrink-0 rounded-full bg-[rgba(15,156,0,0.2)] px-3 py-1.5 text-xs font-bold text-[#0F9C00]">Correct</span>
                )}
                {answer.isCorrect === false && (
                  <span className="shrink-0 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400">Incorrect</span>
                )}
                {answer.isCorrect === null && (
                  <span className="shrink-0 rounded-full bg-yellow-500/20 px-3 py-1.5 text-xs font-bold text-yellow-300">Pending review</span>
                )}
              </div>

              <AnswerDisplay questionData={qData} studentAnswer={answer.answer as unknown} />

              {answer.question.type === "OPEN_ANSWER" && (
                <div className="flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <p className="mr-auto text-xs text-[var(--muted)]">
                    {answer.isCorrect === null ? "Mark this answer:" : "Override:"}
                  </p>
                  <form action={reviewQMAnswerAction.bind(null, sessionId, answer.id, true)}>
                    <button
                      type="submit"
                      disabled={answer.isCorrect === true}
                      className="rounded-full bg-[rgba(15,156,0,0.2)] px-4 py-2 text-xs font-bold text-[#0F9C00] transition-colors hover:bg-[rgba(15,156,0,0.35)] disabled:opacity-30"
                    >
                      Correct
                    </button>
                  </form>
                  <form action={reviewQMAnswerAction.bind(null, sessionId, answer.id, false)}>
                    <button
                      type="submit"
                      disabled={answer.isCorrect === false}
                      className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-30"
                    >
                      Incorrect
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
