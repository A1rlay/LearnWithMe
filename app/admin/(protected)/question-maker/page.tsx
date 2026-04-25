import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { adminGetQMTopics } from "@/server/data/question-maker";
import { deleteQMTopicAction } from "./actions";

export default async function AdminQMTopicsPage() {
  const topics = await adminGetQMTopics();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]">
          ← Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Admin · QuestionMaker</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Topics</h1>
        </div>
        <Link href="/admin/question-maker/new" className="rounded-full bg-[#0F9C00] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
          New topic
        </Link>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No topics yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <div key={topic.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-5">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{topic.title}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{topic._count.questions} question{topic._count.questions !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/question-maker/${topic.id}/questions`} className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white">
                  Questions
                </Link>
                <Link href={`/admin/question-maker/sessions?topicId=${topic.id}`} className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white">
                  Sessions
                </Link>
                <Link href={`/admin/question-maker/${topic.id}/edit`} className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white">
                  Edit
                </Link>
                <DeleteButton action={deleteQMTopicAction.bind(null, topic.id)} label={`"${topic.title}"`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
