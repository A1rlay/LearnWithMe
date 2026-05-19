import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { SpellRightMode, adminGetSpellRightSets } from "@/server/data/spell-right";
import { requireRole } from "@/lib/auth";
import { deleteSpellRightSetAction } from "./actions";

const MODE_LABEL: Record<SpellRightMode, string> = {
  TERMINATION: "ed / t / d",
  PRONUNCIATION: "Pronunciation",
};

export default async function AdminSpellRightPage() {
  await requireRole("ADMIN", "TEACHER");
  const sets = await adminGetSpellRightSets();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/games"
          className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Admin · SpellRight
          </p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Sets</h1>
        </div>
        <Link
          href="/admin/spell-right/new"
          className="rounded-full bg-[#0F9C00] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          New set
        </Link>
      </div>

      {sets.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No sets yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sets.map((set) => (
            <div
              key={set.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--foreground)]">{set.title}</p>
                  <span className="rounded-full bg-[rgba(15,156,0,0.18)] px-2 py-0.5 text-xs font-bold text-[#0F9C00]">
                    {MODE_LABEL[set.mode]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {set._count.words} word{set._count.words !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/spell-right/${set.id}/words`}
                  className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
                >
                  Words
                </Link>
                <Link
                  href={`/admin/spell-right/${set.id}/edit`}
                  className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
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
