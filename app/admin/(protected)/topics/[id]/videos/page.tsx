import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { deleteVideoAction } from "./actions";
import { adminGetTopic } from "@/server/data/admin";
import { requireEditorPage } from "@/lib/auth";

type TopicVideosPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TopicVideosPage({ params }: TopicVideosPageProps) {
  const { id } = await params;
  await requireEditorPage({ kind: "topic", id: id });
  const topic = await adminGetTopic(id);
  if (!topic) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/topics"
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
            Studio · Video lessons · {topic.title}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-fg">
            Videos
          </h1>
        </div>
        <Link
          href={`/admin/topics/${id}/videos/new`}
          className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
        >
          New video
        </Link>
      </div>

      {topic.videos.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line p-12 text-center text-sm text-muted">
          No videos yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topic.videos.map((video) => (
            <div
              key={video.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-line bg-surface px-6 py-5"
            >
              <div>
                <p className="font-semibold text-fg">{video.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {video._count.questions} question
                  {video._count.questions !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/topics/${id}/videos/${video.id}/questions`}
                  className="rounded-full border border-fg/25 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg hover:text-fg"
                >
                  Questions
                </Link>
                <Link
                  href={`/admin/topics/${id}/videos/${video.id}/edit`}
                  className="rounded-full border border-fg/25 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg hover:text-fg"
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
