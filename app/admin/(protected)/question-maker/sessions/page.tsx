import Link from "next/link";

import { adminGetQMTopics, adminGetQMSessions } from "@/server/data/question-maker";

type Props = { searchParams: Promise<{ topicId?: string }> };

export default async function QMSessionsPage({ searchParams }: Props) {
  const { topicId } = await searchParams;
  const topics = await adminGetQMTopics();
  const selectedTopic = topicId ? topics.find((t) => t.id === topicId) : null;
  const sessions = topicId ? await adminGetQMSessions(topicId) : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/question-maker"
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        ← Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · QuestionMaker
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Sessions</h1>
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/admin/question-maker/sessions?topicId=${t.id}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              t.id === topicId
                ? "bg-[#0F9C00] text-white"
                : "border border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white hover:text-white"
            }`}
          >
            {t.title}
          </Link>
        ))}
      </div>

      {!topicId ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          Select a topic above to view its sessions.
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
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
                className="flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-5 transition-colors hover:border-[rgba(255,255,255,0.4)]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    Session {sessions.length - idx}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {session.completedAt
                      ? new Date(session.completedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {pending > 0 && (
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                      {pending} pending
                    </span>
                  )}
                  <span className="rounded-full bg-[rgba(15,156,0,0.2)] px-3 py-1 text-xs font-semibold text-[#0F9C00]">
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
