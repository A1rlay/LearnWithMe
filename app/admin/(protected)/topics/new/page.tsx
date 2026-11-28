import { PedagogyFields } from "@/components/studio/pedagogy-fields";
import Link from "next/link";

import { SubjectSkillPicker } from "@/components/studio/subject-skill-picker";
import { pickerSubjects } from "@/lib/studio";

import { createTopicAction } from "../actions";

export default async function NewTopicPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const subjects = await pickerSubjects("VIDEO");
  const defaultSubjectId = subjects.some((s) => s.id === subject) ? subject : undefined;
  const back = defaultSubjectId ? `/admin/topics?subject=${defaultSubjectId}` : "/admin/topics";
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={back}
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          Studio · Video lessons
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">
          New topic
        </h1>
      </div>

      <form
        action={createTopicAction}
        className="flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-8"
      >
        <TopicFields />
        <SubjectSkillPicker subjects={subjects} defaultSubjectId={defaultSubjectId} />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
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
    instructions?: string | null;
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
      <PedagogyFields defaults={defaults} withLevel={false} />
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
    "rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
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
