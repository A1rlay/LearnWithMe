import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetSpellRightSet } from "@/server/data/spell-right";
import { requireEditorPage } from "@/lib/auth";
import { SubjectSkillPicker } from "@/components/studio/subject-skill-picker";
import { pickerSubjects } from "@/lib/studio";

import { updateSpellRightSetAction } from "../../actions";

type Props = { params: Promise<{ setId: string }> };

const inputClass =
  "rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text";

export default async function EditSpellRightSetPage({ params }: Props) {
  const { setId } = await params;
  await requireEditorPage({ kind: "spellSet", id: setId });
  const set = await adminGetSpellRightSet(setId);
  if (!set) notFound();
  const subjects = await pickerSubjects("SPELLING", set.subjectId);

  const update = updateSpellRightSetAction.bind(null, setId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/spell-right"
        className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          Studio · Sounds & spelling
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">Edit set</h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Title <span className="text-accent-text">*</span>
          </label>
          <input id="title" name="title" defaultValue={set.title} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Description
          </label>
          <textarea id="description" name="description" defaultValue={set.description ?? ""} rows={2} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Mode (read-only)
          </span>
          <p className="text-sm text-fg">
            {set.mode === "TERMINATION" ? "Termination (ed / t / d)" : "Pronunciation"}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="order" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Order
          </label>
          <input id="order" name="order" type="number" defaultValue={set.order} className={inputClass} />
        </div>

        <SubjectSkillPicker
          subjects={subjects}
          defaultSubjectId={set.subjectId}
          defaultSkillIds={set.skills.map((k) => k.skillId)}
        />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
