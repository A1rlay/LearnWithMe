import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { deleteQuestionAction } from "./actions";
import { adminGetVideo } from "@/server/data/admin";
import { requireEditorPage } from "@/lib/auth";

type QuestionsPageProps = {
  params: Promise<{ id: string; videoId: string }>;
};

export default async function QuestionsPage({ params }: QuestionsPageProps) {
  const { id, videoId } = await params;
  await requireEditorPage({ kind: "video", id: videoId });
  const video = await adminGetVideo(videoId);
  if (!video) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/topics/${id}/videos`}
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
            Studio · {video.topic.title} · {video.title}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-fg">
            Questions
          </h1>
        </div>
        <Link
          href={`/admin/topics/${id}/videos/${videoId}/questions/new`}
          className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
        >
          New question
        </Link>
      </div>

      {video.questions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line p-12 text-center text-sm text-muted">
          No questions yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {video.questions.map((question) => (
            <div
              key={question.id}
              className="rounded-[24px] border border-line bg-surface p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-text">
                    Question {question.order} · checkpoint {question.checkpointSeconds}s
                  </p>
                  <p className="mt-2 text-sm font-semibold text-fg">
                    {question.prompt}
                  </p>
                  <div className="mt-3 space-y-1">
                    {question.options.map((opt) => (
                      <p
                        key={opt.id}
                        className={`text-xs ${opt.isCorrect ? "font-semibold text-fg" : "text-muted"}`}
                      >
                        {opt.order}. {opt.text}
                        {opt.isCorrect && " ✓"}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/topics/${id}/videos/${videoId}/questions/${question.id}/edit`}
                    className="rounded-full border border-fg/25 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg hover:text-fg"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteQuestionAction.bind(null, id, videoId, question.id)}
                    label={`question ${question.order}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
