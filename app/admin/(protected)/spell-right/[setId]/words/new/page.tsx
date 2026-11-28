import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetSpellRightSet } from "@/server/data/spell-right";
import { createSpellRightWordAction } from "../../../actions";
import { requireEditorPage } from "@/lib/auth";

type Props = { params: Promise<{ setId: string }> };

const inputClass =
  "rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text";

export default async function NewSpellRightWordPage({ params }: Props) {
  const { setId } = await params;
  await requireEditorPage({ kind: "spellSet", id: setId });
  const set = await adminGetSpellRightSet(setId);
  if (!set) notFound();

  const isTermination = set.mode === "TERMINATION";
  const nextOrder = set.words.length;
  const create = createSpellRightWordAction.bind(null, setId, nextOrder);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/spell-right/${setId}/words`}
        className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          Studio · Sounds & spelling · {set.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">Add word</h1>
      </div>

      <form
        action={create}
        className="flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="word" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Word <span className="text-accent-text">*</span>
          </label>
          <input
            id="word"
            name="word"
            required
            placeholder="e.g. walked"
            className={inputClass}
          />
        </div>

        {isTermination && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Correct termination <span className="text-accent-text">*</span>
            </span>
            <div className="flex gap-4">
              {[
                { value: "ed", label: "/ɪd/ — ed", hint: "wanted, landed" },
                { value: "t", label: "/t/", hint: "walked, jumped" },
                { value: "d", label: "/d/", hint: "played, moved" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={opt.value}
                    className="mt-0.5 accent-accent-text"
                    required
                  />
                  <div>
                    <p className="text-sm font-semibold text-fg">{opt.label}</p>
                    <p className="text-xs text-muted">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="explanation" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Explanation
            <span className="ml-1 normal-case text-fg/30">(shown after answer)</span>
          </label>
          <textarea
            id="explanation"
            name="explanation"
            rows={2}
            placeholder={
              isTermination
                ? "e.g. 'walked' ends in /t/ because /k/ is a voiceless consonant"
                : "e.g. stress falls on the second syllable: pre-SENT"
            }
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
          >
            Add word
          </button>
        </div>
      </form>
    </div>
  );
}
