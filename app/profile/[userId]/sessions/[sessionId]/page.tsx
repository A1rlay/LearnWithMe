import { notFound, redirect } from "next/navigation";

import { AnswerDisplay } from "@/components/qm/answer-display";
import { BackLink } from "@/components/ui/nav-link";
import { requireEditorPage, requireSession } from "@/lib/auth";
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
  if (!canView) redirect("/");

  const [session, user] = await Promise.all([
    getQMSession(sessionId),
    adminGetUser(userId),
  ]);

  if (!session || !user) notFound();
  // Prevent viewing a session that belongs to a different student
  if (session.userId !== userId) notFound();
  // Experts may only read sessions in subjects they teach (admins: all).
  if (viewer.userId !== userId) await requireEditorPage({ kind: "qmTopic", id: session.topicId });

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
        <p className="eyebrow">
          Session review
        </p>
        <h1 className="mt-1 font-display text-3xl text-fg">
          {session.topic.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {session.completedAt && (
            <span className="text-sm text-muted">
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
                  ? "bg-accent/20 text-accent-text"
                  : pct >= 50
                  ? "bg-warning/20 text-warning"
                  : "bg-danger/20 text-danger"
              }`}
            >
              {pct}% · {scoreCorrect}/{scoreTotal} correct
            </span>
          )}
          {isStaff && pendingCount > 0 && (
            <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-bold text-warning">
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
              className="flex flex-col gap-4 card p-6"
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="eyebrow">
                    {idx + 1}. {answer.question.type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 font-semibold text-fg">
                    {answer.question.prompt}
                  </p>
                </div>
                {answer.isCorrect === true && (
                  <span className="shrink-0 rounded-full bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent-text">
                    Correct
                  </span>
                )}
                {answer.isCorrect === false && (
                  <span className="shrink-0 rounded-full bg-danger/20 px-3 py-1.5 text-xs font-bold text-danger">
                    Incorrect
                  </span>
                )}
                {answer.isCorrect === null && isStaff && (
                  <span className="shrink-0 rounded-full bg-warning/20 px-3 py-1.5 text-xs font-bold text-warning">
                    Pending review
                  </span>
                )}
              </div>

              {/* Answer */}
              <AnswerDisplay questionData={qData} studentAnswer={answer.answer as unknown} />

              {/* Staff: mark open answers */}
              {needsReview && (
                <div className="flex gap-2 border-t border-line pt-4">
                  <p className="mr-auto self-center text-xs text-muted">Mark this answer:</p>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, true)}>
                    <button
                      type="submit"
                      className="rounded-full bg-accent/20 px-4 py-2 text-xs font-bold text-accent-text transition-colors hover:bg-accent/35"
                    >
                      Correct
                    </button>
                  </form>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, false)}>
                    <button
                      type="submit"
                      className="rounded-full bg-danger/15 px-4 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger/25"
                    >
                      Incorrect
                    </button>
                  </form>
                </div>
              )}

              {/* Staff: override already-marked answers */}
              {isStaff && answer.isCorrect !== null && answer.question.type === "OPEN_ANSWER" && (
                <div className="flex items-center gap-2 border-t border-line pt-3">
                  <p className="mr-auto text-xs text-muted">Override:</p>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, true)}>
                    <button
                      type="submit"
                      disabled={answer.isCorrect === true}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent-text/70 transition-colors hover:text-accent-text disabled:opacity-30"
                    >
                      Mark correct
                    </button>
                  </form>
                  <form action={reviewAnswerAction.bind(null, userId, sessionId, answer.id, false)}>
                    <button
                      type="submit"
                      disabled={answer.isCorrect === false}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger/70 transition-colors hover:text-danger disabled:opacity-30"
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
