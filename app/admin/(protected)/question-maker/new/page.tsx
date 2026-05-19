import Link from "next/link";

import { createQMTopicAction } from "../actions";
import { QMTopicFields } from "../[topicId]/edit/page";

export default function NewQMTopicPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/question-maker" className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Admin · QuestionMaker</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">New topic</h1>
      </div>
      <form action={createQMTopicAction} className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8">
        <QMTopicFields />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Create topic
          </button>
        </div>
      </form>
    </div>
  );
}
