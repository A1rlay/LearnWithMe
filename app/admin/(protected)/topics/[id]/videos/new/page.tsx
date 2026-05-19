import Link from "next/link";
import { notFound } from "next/navigation";

import { createVideoAction } from "../actions";
import { VideoFields } from "../[videoId]/edit/page";
import { adminGetTopic } from "@/server/data/admin";

type NewVideoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewVideoPage({ params }: NewVideoPageProps) {
  const { id } = await params;
  const topic = await adminGetTopic(id);
  if (!topic) notFound();

  const create = createVideoAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/topics/${id}/videos`}
          className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · {topic.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">
          New video
        </h1>
      </div>

      <form
        action={create}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <VideoFields />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Create video
          </button>
        </div>
      </form>
    </div>
  );
}
