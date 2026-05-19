import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { deleteVideoAction } from "./actions";
import { adminGetTopic } from "@/server/data/admin";

type TopicVideosPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TopicVideosPage({ params }: TopicVideosPageProps) {
  const { id } = await params;
  const topic = await adminGetTopic(id);
  if (!topic) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/topics"
          className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Admin · Topics · {topic.title}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">
            Videos
          </h1>
        </div>
        <Link
          href={`/admin/topics/${id}/videos/new`}
          className="rounded-full bg-[#0F9C00] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          New video
        </Link>
      </div>

      {topic.videos.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No videos yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topic.videos.map((video) => (
            <div
              key={video.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-5"
            >
              <div>
                <p className="font-semibold text-[var(--foreground)]">{video.title}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {video._count.questions} question
                  {video._count.questions !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/topics/${id}/videos/${video.id}/questions`}
                  className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
                >
                  Questions
                </Link>
                <Link
                  href={`/admin/topics/${id}/videos/${video.id}/edit`}
                  className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteVideoAction.bind(null, id, video.id)}
                  label={`"${video.title}"`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
