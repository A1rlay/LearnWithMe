import { notFound, redirect } from "next/navigation";

import { AnswerDisplay } from "@/components/qm/answer-display";
import { BackLink } from "@/components/ui/nav-link";
import { requireSession } from "@/lib/auth";
import { getQMSession } from "@/server/data/question-maker";
import type { QMQuestionData } from "@/server/data/question-maker";
import { adminGetUser } from "@/server/data/users";
import { reviewAnswerAction } from "./actions";

type Props = { params: Promise<{ userId: string; sessionId: string }> };

export default async function ProfileSessionPage({ params }: Props) {
  const viewer = await requireSession();
  const { userId, sessionId } = await params;

  const canView =
    viewer.userId === userId ||
    viewer.role === "ADMIN" ||
    viewer.role === "TEACHER";
  if (!canView) redirect("/learn");

  const [session, user] = await Promise.all([
    getQMSession(sessionId),
    adminGetUser(userId),
  ]);

  if (!session || !user) notFound();
  // Prevent viewing a session that belongs to a different student
  if (session.userId !== userId) notFound();

  const isStaff = viewer.role === "ADMIN" || viewer.role === "TEACHER";
  const isOwner = viewer.userId === userId;

  const scoreTotal = session.answers.filter((a) => a.isCorrect !== null).length;
  const scoreCorrect = session.answers.filter((a) => a.isCorrect === true).length;
  const pct = scoreTotal > 0 ? Math.round((scoreCorrect / scoreTotal) * 100) : null;

  const pendingCount = session.answers.filter(
    (a) => a.question.type === "OPEN_ANSWER" && a.isCorrect === null,
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12 sm:py-16">
      <BackLink href={`/profile/${userId}`}>{isOwner ? "My Profile" : user.name}</BackLink>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Session review
        </p>
        <h1 className="mt-1 font-serif text-3xl text-[var(--foreground)]">
          {session.topic.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {session.completedAt && (
            <span className="text-sm text-[var(--muted)]">
              {new Date(session.completedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          {pct !== null && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                pct >= 80
                  ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]"
                  : pct >= 50
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {pct}% · {scoreCorrect}/{scoreTotal} correct
            </span>
          )}
          {isStaff && pendingCount > 0 && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-300">
              {pendingCount} pending review
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {session.answers.map((answer, idx) => {
          const qData = answer.question.data as QMQuestionData;
          const needsReview =
            isStaff && answer.question.type === "OPEN_ANSWER" && answer.isCorrect === null;

          return (
            <div
              key={answer.id}
              className="flex flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-6"
            >
              {/* Question header */}
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
                  <span className="shrink-0 rounded-full bg-[rgba(15,156,0,0.2)] px-3 py-1.5 text-xs font-bold text-[#0F9C00]">
                    Correct
                  </span>
                )}
                {answer.isCorrect === false && (
                  <span className="shrink-0 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400">
                    Incorrect
                  </span>
                )}
                {answer.isCorrect === null && isStaff && (
                  <span className="shrink-0 rounded-full bg-yellow-500/20 px-3 py-1.5 text-xs font-bold text-yellow-300">
                    Pending review
                  </span>
                )}
              </div>

              {/* Answer */}
              <AnswerDisplay questionData={qData} studentAnswer={answer.answer as unknown} />

              {/* Staff: mark open answers */}
              {needsReview && (
                <div className="flex gap-2 border-t border-[var(--border)] pt-4">
                  <p className="mr-auto self-center text-xs text-[var(--muted)]">Mark this answer:</p>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, true)}>
                    <button
                      type="submit"
                      className="rounded-full bg-[rgba(15,156,0,0.2)] px-4 py-2 text-xs font-bold text-[#0F9C00] transition-colors hover:bg-[rgba(15,156,0,0.35)]"
                    >
                      Correct
                    </button>
                  </form>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, false)}>
                    <button
                      type="submit"
                      className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/25"
                    >
                      Incorrect
                    </button>
                  </form>
                </div>
              )}

              {/* Staff: override already-marked answers */}
              {isStaff && answer.isCorrect !== null && answer.question.type === "OPEN_ANSWER" && (
                <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
                  <p className="mr-auto text-xs text-[var(--muted)]">Override:</p>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, true)}>
                    <button
                      type="submit"
                      disabled={answer.isCorrect === true}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-[rgba(15,156,0,0.7)] transition-colors hover:text-[#0F9C00] disabled:opacity-30"
                    >
                      Mark correct
                    </button>
                  </form>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, false)}>
                    <button
                      type="submit"
                      disabled={answer.isCorrect === false}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-400/70 transition-colors hover:text-red-400 disabled:opacity-30"
                    >
                      Mark incorrect
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
