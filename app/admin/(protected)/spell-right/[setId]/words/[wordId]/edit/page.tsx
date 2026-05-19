import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetSpellRightWord } from "@/server/data/spell-right";
import { updateSpellRightWordAction } from "../../../../actions";

type Props = { params: Promise<{ setId: string; wordId: string }> };

const inputClass =
  "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

export default async function EditSpellRightWordPage({ params }: Props) {
  const { setId, wordId } = await params;
  const wordRow = await adminGetSpellRightWord(wordId);
  if (!wordRow || wordRow.setId !== setId) notFound();

  const isTermination = wordRow.set.mode === "TERMINATION";
  const update = updateSpellRightWordAction.bind(null, setId, wordId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/spell-right/${setId}/words`}
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · SpellRight · {wordRow.set.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Edit word</h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="word" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Word <span className="text-[var(--accent)]">*</span>
          </label>
          <input id="word" name="word" defaultValue={wordRow.word} required className={inputClass} />
        </div>

        {isTermination && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Correct termination <span className="text-[var(--accent)]">*</span>
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
                    defaultChecked={wordRow.correctAnswer === opt.value}
                    className="mt-0.5 accent-[#0F9C00]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{opt.label}</p>
                    <p className="text-xs text-[var(--muted)]">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="explanation" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Explanation
            <span className="ml-1 normal-case text-[rgba(255,255,255,0.3)]">(shown after answer)</span>
          </label>
          <textarea
            id="explanation"
            name="explanation"
            rows={2}
            defaultValue={wordRow.explanation ?? ""}
            className={inputClass}
          />
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
