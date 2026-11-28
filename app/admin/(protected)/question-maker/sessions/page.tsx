import Link from "next/link";

import { adminGetQMTopics, adminGetQMSessions } from "@/server/data/question-maker";
import { editableSubjectIds, requireEditorPage, requireRole } from "@/lib/auth";

type Props = { searchParams: Promise<{ topicId?: string }> };

export default async function QMSessionsPage({ searchParams }: Props) {
  const { topicId } = await searchParams;
  const viewer = await requireRole("ADMIN", "TEACHER");
  if (topicId) await requireEditorPage({ kind: "qmTopic", id: topicId });
  const topics = await adminGetQMTopics(await editableSubjectIds(viewer));
  const selectedTopic = topicId ? topics.find((t) => t.id === topicId) : null;
  const sessions = topicId ? await adminGetQMSessions(topicId) : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/question-maker"
        className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>

      <div>
        <p className="eyebrow">
          Studio · Quizzes
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">Sessions</h1>
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/admin/question-maker/sessions?topicId=${t.id}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              t.id === topicId
                ? "bg-accent text-fg"
                : "border border-line-strong text-muted hover:border-fg hover:text-fg"
            }`}
          >
            {t.title}
          </Link>
        ))}
      </div>

      {!topicId ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center text-sm text-muted">
          Select a topic above to view its sessions.
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center text-sm text-muted">
          No completed sessions for {selectedTopic?.title ?? "this topic"} yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session, idx) => {
            const total = session.answers.length;
            const correct = session.answers.filter((a) => a.isCorrect === true).length;
            const pending = session.answers.filter((a) => a.isCorrect === null).length;

            return (
              <Link
                key={session.id}
                href={`/admin/question-maker/sessions/${session.id}`}
                className="flex items-center justify-between gap-4 card px-6 py-5 transition-colors hover:border-fg"
              >
                <div>
                  <p className="eyebrow">
                    Session {sessions.length - idx}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {session.completedAt
                      ? new Date(session.completedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {pending > 0 && (
                    <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
                      {pending} pending
                    </span>
                  )}
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-text">
                    {correct}/{total} correct
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
