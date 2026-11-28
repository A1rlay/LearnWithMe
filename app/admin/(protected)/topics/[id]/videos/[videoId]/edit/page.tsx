import Link from "next/link";
import { notFound } from "next/navigation";

import { updateVideoAction } from "../../actions";
import { adminGetVideo } from "@/server/data/admin";
import { requireEditorPage } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/submit-button";

type EditVideoPageProps = {
  params: Promise<{ id: string; videoId: string }>;
};

export default async function EditVideoPage({ params }: EditVideoPageProps) {
  const { id, videoId } = await params;
  await requireEditorPage({ kind: "video", id: videoId });
  const video = await adminGetVideo(videoId);
  if (!video) notFound();

  const update = updateVideoAction.bind(null, id, videoId);

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

      <div>
        <p className="eyebrow">
          Studio · {video.topic.title}
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">
          Edit video
        </h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 card p-8"
      >
        <VideoFields defaults={video} />
        <div className="flex gap-3 pt-2">
          <SubmitButton className="btn btn-primary">Save changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}

export function VideoFields({
  defaults,
}: {
  defaults?: {
    description?: string | null;
    order?: number;
    subtitlesEnabled?: boolean;
    title?: string;
    videoUrl?: string;
  };
} = {}) {
  return (
    <>
      <Field label="Title" name="title" defaultValue={defaults?.title} required />
      <Field
        label="YouTube URL"
        name="videoUrl"
        defaultValue={defaults?.videoUrl}
        hint="e.g. https://www.youtube.com/watch?v=VIDEO_ID"
        required
      />
      <Field
        label="Order"
        name="order"
        defaultValue={defaults?.order?.toString() ?? "0"}
        hint="Display order within topic"
        required
      />
      <Field
        label="Description"
        name="description"
        defaultValue={defaults?.description ?? ""}
        multiline
      />
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 transition-colors hover:bg-surface-2">
        <input
          type="checkbox"
          name="subtitlesEnabled"
          defaultChecked={defaults?.subtitlesEnabled ?? false}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-fg">Show subtitles</span>
          <span className="text-xs text-muted">
            Turn on for beginner material (e.g. A1–B1). Leave off when understanding by ear is the
            point of the lesson.
          </span>
        </span>
      </label>
    </>
  );
}

function Field({
  defaultValue,
  hint,
  label,
  multiline,
  name,
  required,
}: {
  defaultValue?: string;
  hint?: string;
  label: string;
  multiline?: boolean;
  name: string;
  required?: boolean;
}) {
  const inputClass =
    "field";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-fg"
      >
        {label}
        {required && <span className="ml-1 text-accent-text">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className={inputClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={defaultValue}
          required={required}
          className={inputClass}
        />
      )}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
