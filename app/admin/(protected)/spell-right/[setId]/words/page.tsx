import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { adminGetSpellRightSet } from "@/server/data/spell-right";
import { deleteSpellRightWordAction } from "../../actions";
import { requireEditorPage } from "@/lib/auth";

type Props = { params: Promise<{ setId: string }> };

export default async function SpellRightWordsPage({ params }: Props) {
  const { setId } = await params;
  await requireEditorPage({ kind: "spellSet", id: setId });
  const set = await adminGetSpellRightSet(setId);
  if (!set) notFound();

  const isTermination = set.mode === "TERMINATION";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/spell-right"
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
          <p className="eyebrow">
            Studio · Sounds & spelling · {set.title}
          </p>
          <h1 className="mt-2 font-display text-4xl text-fg">Words</h1>
          <p className="mt-1 text-sm text-muted">
            {isTermination ? "Students hear the audio and pick the termination (ed / t / d)." : "Students see the word and practice pronouncing it."}
          </p>
        </div>
        <Link
          href={`/admin/spell-right/${setId}/words/new`}
          className="shrink-0 btn btn-primary"
        >
          Add word
        </Link>
      </div>

      {set.words.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center text-sm text-muted">
          No words yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {set.words.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-4 card px-6 py-5"
            >
              <div>
                <p className="font-semibold text-fg">{w.word}</p>
                {isTermination && w.correctAnswer && (
                  <p className="mt-0.5 text-xs text-muted">
                    Answer: <span className="font-bold text-success">/{w.correctAnswer}/</span>
                  </p>
                )}
                {w.explanation && (
                  <p className="mt-0.5 text-xs text-muted max-w-sm truncate">{w.explanation}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/spell-right/${setId}/words/${w.id}/edit`}
                  className="rounded-full border border-line-strong px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-fg hover:text-fg"
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
