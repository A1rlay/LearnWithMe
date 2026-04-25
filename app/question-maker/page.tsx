import Link from "next/link";

import { getQMTopics } from "@/server/data/question-maker";

export default async function QuestionMakerPage() {
  const topics = await getQMTopics();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 sm:py-16">
      <Link
        href="/learn"
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        ← Back
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
          QuestionMaker
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white">Choose a topic</h1>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No topics available yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/question-maker/${topic.id}`}
              className="flex flex-col gap-1.5 rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-6 py-5 backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.14)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-white">{topic.title}</span>
                <span className="shrink-0 rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1 text-xs font-semibold text-[rgba(255,255,255,0.6)]">
                  {topic.questionCount} question{topic.questionCount !== 1 ? "s" : ""}
                </span>
              </div>
              {topic.description && (
                <p className="text-sm text-[rgba(255,255,255,0.55)]">{topic.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
