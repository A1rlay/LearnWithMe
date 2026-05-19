import Link from "next/link";

import { createTopicAction } from "../actions";

export default function NewTopicPage() {
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

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · Topics
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">
          New topic
        </h1>
      </div>

      <form
        action={createTopicAction}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <TopicFields />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Create topic
          </button>
        </div>
      </form>
    </div>
  );
}

export function TopicFields({
  defaults,
}: {
  defaults?: {
    description?: string | null;
    level?: string | null;
    tags?: string[];
    title?: string;
  };
} = {}) {
  return (
    <>
      <Field label="Title" name="title" defaultValue={defaults?.title} required />
      <Field
        label="Level"
        name="level"
        defaultValue={defaults?.level ?? ""}
        hint="e.g. A1 - A2"
      />
      <Field
        label="Description"
        name="description"
        defaultValue={defaults?.description ?? ""}
        multiline
      />
      <Field
        label="Tags"
        name="tags"
        defaultValue={defaults?.tags?.join(", ") ?? ""}
        hint="Comma-separated, e.g. was, were, past descriptions"
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
