import Link from "next/link";

import { HomeLogo } from "@/components/ui/home-logo";
import { SpellRightMode, getSpellRightSets } from "@/server/data/spell-right";
import type { SpellRightSetSummary } from "@/server/data/spell-right";

export default async function SpellRightPage() {
  const sets = await getSpellRightSets();
  const termSets = sets.filter((s) => s.mode === SpellRightMode.TERMINATION);
  const pronSets = sets.filter((s) => s.mode === SpellRightMode.PRONUNCIATION);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-12 sm:py-16">
      <HomeLogo />

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
          SpellRight
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white">Choose a set</h1>
      </div>

      {sets.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No sets available yet.
        </div>
      )}

      {termSets.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-[rgba(255,255,255,0.45)]">
            Termination — ed / t / d
          </h2>
          {termSets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </section>
      )}

      {pronSets.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-[rgba(255,255,255,0.45)]">
            Pronunciation practice
          </h2>
          {pronSets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </section>
      )}
    </main>
  );
}

function SetCard({ set }: { set: SpellRightSetSummary }) {
  return (
    <Link
      href={`/spell-right/${set.id}/play`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-6 py-5 backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.14)]"
    >
      <div>
        <p className="font-bold text-white">{set.title}</p>
        {set.description && (
          <p className="mt-0.5 text-sm text-[rgba(255,255,255,0.55)]">{set.description}</p>
        )}
        <p className="mt-1 text-xs text-[rgba(255,255,255,0.4)]">
          {set.wordCount} word{set.wordCount !== 1 ? "s" : ""}
        </p>
      </div>
      <svg
        className="shrink-0 text-[rgba(255,255,255,0.4)]"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
