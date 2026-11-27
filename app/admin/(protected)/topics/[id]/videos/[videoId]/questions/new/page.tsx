import Link from "next/link";
import { notFound } from "next/navigation";

import { createQuestionAction } from "../actions";
import { QuestionFields } from "../[questionId]/edit/page";
import { adminGetVideo } from "@/server/data/admin";
import { requireEditorPage } from "@/lib/auth";

type NewQuestionPageProps = {
  params: Promise<{ id: string; videoId: string }>;
};

export default async function NewQuestionPage({ params }: NewQuestionPageProps) {
  const { id, videoId } = await params;
  await requireEditorPage({ kind: "video", id: videoId });
  const video = await adminGetVideo(videoId);
  if (!video) notFound();

  const nextOrder = video.questions.length + 1;
  const create = createQuestionAction.bind(null, id, videoId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/topics/${id}/videos/${videoId}/questions`}
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          Studio · {video.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">
          New question
        </h1>
      </div>

      <form
        action={create}
        className="flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-8"
      >
        <QuestionFields defaultOrder={nextOrder} />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
          >
            Create question
          </button>
        </div>
      </form>
    </div>
  );
}
