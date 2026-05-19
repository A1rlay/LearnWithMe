import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { adminGetSpellRightSet } from "@/server/data/spell-right";
import { deleteSpellRightWordAction } from "../../actions";

type Props = { params: Promise<{ setId: string }> };

export default async function SpellRightWordsPage({ params }: Props) {
  const { setId } = await params;
  const set = await adminGetSpellRightSet(setId);
  if (!set) notFound();

  const isTermination = set.mode === "TERMINATION";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/spell-right"
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
            Admin · SpellRight · {set.title}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Words</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isTermination ? "Students hear the audio and pick the termination (ed / t / d)." : "Students see the word and practice pronouncing it."}
          </p>
        </div>
        <Link
          href={`/admin/spell-right/${setId}/words/new`}
          className="shrink-0 rounded-full bg-[#0F9C00] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Add word
        </Link>
      </div>

      {set.words.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No words yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {set.words.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-5"
            >
              <div>
                <p className="font-semibold text-[var(--foreground)]">{w.word}</p>
                {isTermination && w.correctAnswer && (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    Answer: <span className="font-bold text-[#0F9C00]">/{w.correctAnswer}/</span>
                  </p>
                )}
                {w.explanation && (
                  <p className="mt-0.5 text-xs text-[var(--muted)] max-w-sm truncate">{w.explanation}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/spell-right/${setId}/words/${w.id}/edit`}
                  className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteSpellRightWordAction.bind(null, setId, w.id)}
                  label={`"${w.word}"`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
