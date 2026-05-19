import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetSpellRightSet } from "@/server/data/spell-right";
import { updateSpellRightSetAction } from "../../actions";

type Props = { params: Promise<{ setId: string }> };

const inputClass =
  "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

export default async function EditSpellRightSetPage({ params }: Props) {
  const { setId } = await params;
  const set = await adminGetSpellRightSet(setId);
  if (!set) notFound();

  const update = updateSpellRightSetAction.bind(null, setId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/spell-right"
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · SpellRight
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Edit set</h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Title <span className="text-[var(--accent)]">*</span>
          </label>
          <input id="title" name="title" defaultValue={set.title} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Description
          </label>
          <textarea id="description" name="description" defaultValue={set.description ?? ""} rows={2} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Mode (read-only)
          </span>
          <p className="text-sm text-[var(--foreground)]">
            {set.mode === "TERMINATION" ? "Termination (ed / t / d)" : "Pronunciation"}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="order" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Order
          </label>
          <input id="order" name="order" type="number" defaultValue={set.order} className={inputClass} />
        </div>

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
