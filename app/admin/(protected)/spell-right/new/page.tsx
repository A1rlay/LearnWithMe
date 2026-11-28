import { PedagogyFields } from "@/components/studio/pedagogy-fields";
import Link from "next/link";

import { SubjectSkillPicker } from "@/components/studio/subject-skill-picker";
import { pickerSubjects } from "@/lib/studio";

import { createSpellRightSetAction } from "../actions";

const inputClass =
  "field";

export default async function NewSpellRightSetPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const subjects = await pickerSubjects("SPELLING");
  const defaultSubjectId = subjects.some((s) => s.id === subject) ? subject : undefined;
  const back = defaultSubjectId ? `/admin/spell-right?subject=${defaultSubjectId}` : "/admin/spell-right";
  return (
    <div className="flex flex-col gap-6">
      <Link
        href={back}
        className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <div>
        <p className="eyebrow">
          Studio · Sounds & spelling
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">New set</h1>
      </div>

      <form
        action={createSpellRightSetAction}
        className="flex flex-col gap-5 card p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-fg">
            Title <span className="text-accent-text">*</span>
          </label>
          <input id="title" name="title" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-fg">
            Description
          </label>
          <textarea id="description" name="description" rows={2} className={inputClass} />
        </div>
        <PedagogyFields />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">
            Mode <span className="text-accent-text">*</span>
          </span>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="TERMINATION" defaultChecked className="accent-accent-text" />
              <span className="text-sm text-fg">Termination (ed / t / d)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="PRONUNCIATION" className="accent-accent-text" />
              <span className="text-sm text-fg">Pronunciation</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="order" className="text-sm font-medium text-fg">
            Order
          </label>
          <input id="order" name="order" type="number" defaultValue={0} className={inputClass} />
        </div>

        <SubjectSkillPicker subjects={subjects} defaultSubjectId={defaultSubjectId} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Create set
          </button>
        </div>
      </form>
    </div>
  );
}
