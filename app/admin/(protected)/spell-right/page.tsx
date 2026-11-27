import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { SpellRightMode, adminGetSpellRightSets } from "@/server/data/spell-right";
import { editableSubjectIds, requireRole } from "@/lib/auth";
import { deleteSpellRightSetAction } from "./actions";

const MODE_LABEL: Record<SpellRightMode, string> = {
  TERMINATION: "ed / t / d",
  PRONUNCIATION: "Pronunciation",
};

export default async function AdminSpellRightPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const sets = await adminGetSpellRightSets(await editableSubjectIds(session));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/games"
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
            Studio · Sounds & spelling
          </p>
          <h1 className="mt-2 font-serif text-4xl text-fg">Sets</h1>
        </div>
        <Link
          href="/admin/spell-right/new"
          className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
        >
          New set
        </Link>
      </div>

      {sets.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line p-12 text-center text-sm text-muted">
          No sets yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sets.map((set) => (
            <div
              key={set.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-line bg-surface px-6 py-5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-fg">{set.title}</p>
                  <span className="rounded-full bg-accent/18 px-2 py-0.5 text-xs font-bold text-accent-text">
                    {MODE_LABEL[set.mode]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {set.subject.name} · {set._count.words} word{set._count.words !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/spell-right/${set.id}/words`}
                  className="rounded-full border border-fg/25 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg hover:text-fg"
                >
                  Words
                </Link>
                <Link
                  href={`/admin/spell-right/${set.id}/edit`}
                  className="rounded-full border border-fg/25 px-4 py-2 text-xs font-semibold text-fg/70 transition-colors hover:border-fg hover:text-fg"
                >
                  Edit
                </Link>
                <DeleteButton action={deleteSpellRightSetAction.bind(null, set.id)} label={`"${set.title}"`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
