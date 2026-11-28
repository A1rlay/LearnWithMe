import Link from "next/link";

import type { TopicDetail } from "@/server/data/learning";

export function VideoList({ topic }: { topic: TopicDetail }) {
  if (topic.videos.length === 0) {
    return (
      <p className="card p-8 text-center text-sm text-muted">
        No videos yet. The expert is still recording this topic.
      </p>
    );
  }

  return (
    <ol className="stagger flex flex-col gap-3">
      {topic.videos.map((video, index) => (
        <li key={video.id}>
          <Link
            href={`/topics/${topic.id}/videos/${video.id}`}
            className="card card-interactive group flex items-center gap-4 px-5 py-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-xs text-muted transition-colors group-hover:border-accent-text group-hover:text-accent-text">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-fg">{video.title}</span>
              <span className="text-xs text-subtle">
                {video.questionCount} checkpoint{video.questionCount === 1 ? "" : "s"}
              </span>
            </span>
            <span aria-hidden="true" className="text-subtle transition-colors group-hover:text-accent-text">▶</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
