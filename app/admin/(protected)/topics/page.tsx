import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { deleteTopicAction } from "./actions";
import { adminGetAllTopics } from "@/server/data/admin";
import { studioScope } from "@/lib/studio";

export default async function AdminTopicsPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const scope = await studioScope((await searchParams).subject);
  const topics = await adminGetAllTopics(scope.ids);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/games${scope.q}`}
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">
            {scope.subject ? `${scope.subject.name} · Video lessons` : "Studio · Video lessons"}
          </p>
          <h1 className="mt-2 font-display text-4xl text-fg">
            Topics
          </h1>
        </div>
        <Link
          href={`/admin/topics/new${scope.q}`}
          className="btn btn-primary"
        >
          New topic
        </Link>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center text-sm text-muted">
          No topics yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex flex-wrap items-center justify-between gap-4 card px-6 py-5"
            >
              <div>
                <p className="eyebrow">
                  {topic.level ?? "No level"}
                </p>
                <p className="mt-1 font-semibold text-fg">
                  {topic.title}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {topic.subject.name} · {topic._count.videos} video{topic._count.videos !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/topics/${topic.id}/videos`}
                  className="rounded-full border border-line-strong px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-fg hover:text-fg"
                >
                  Videos
                </Link>
                <Link
                  href={`/admin/topics/${topic.id}/edit`}
                  className="rounded-full border border-line-strong px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-fg hover:text-fg"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteTopicAction.bind(null, topic.id)}
                  label={`"${topic.title}"`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
