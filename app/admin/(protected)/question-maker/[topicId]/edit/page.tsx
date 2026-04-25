import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetQMTopic } from "@/server/data/question-maker";
import { updateQMTopicAction } from "../../actions";

type Props = { params: Promise<{ topicId: string }> };

export default async function EditQMTopicPage({ params }: Props) {
  const { topicId } = await params;
  const topic = await adminGetQMTopic(topicId);
  if (!topic) notFound();

  const update = updateQMTopicAction.bind(null, topicId);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/question-maker" className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]">
        ← Back
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Admin · QuestionMaker</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Edit topic</h1>
      </div>
      <form action={update} className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8">
        <QMTopicFields defaults={topic} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

export function QMTopicFields({ defaults }: { defaults?: { title?: string; description?: string | null; order?: number } } = {}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Title <span className="text-[var(--accent)]">*</span>
        </label>
        <input id="title" name="title" defaultValue={defaults?.title} required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Description</label>
        <textarea id="description" name="description" defaultValue={defaults?.description ?? ""} rows={2} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="order" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Order</label>
        <input id="order" name="order" defaultValue={defaults?.order ?? 0} className={inputClass} />
      </div>
    </>
  );
}
