import Link from "next/link";
import { notFound } from "next/navigation";

import { updateVideoAction } from "../../actions";
import { adminGetVideo } from "@/server/data/admin";

type EditVideoPageProps = {
  params: Promise<{ id: string; videoId: string }>;
};

export default async function EditVideoPage({ params }: EditVideoPageProps) {
  const { id, videoId } = await params;
  const video = await adminGetVideo(videoId);
  if (!video) notFound();

  const update = updateVideoAction.bind(null, id, videoId);

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
          Admin · {video.topic.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">
          Edit video
        </h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <VideoFields defaults={video} />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
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
    "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
      >
        {label}
        {required && <span className="ml-1 text-[var(--accent)]">*</span>}
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
      {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
