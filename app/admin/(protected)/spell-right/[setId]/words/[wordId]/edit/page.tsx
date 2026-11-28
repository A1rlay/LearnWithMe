import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetSpellRightWord } from "@/server/data/spell-right";
import { updateSpellRightWordAction } from "../../../../actions";
import { requireEditorPage } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = { params: Promise<{ setId: string; wordId: string }> };

const inputClass =
  "field";

export default async function EditSpellRightWordPage({ params }: Props) {
  const { setId, wordId } = await params;
  await requireEditorPage({ kind: "spellWord", id: wordId });
  const wordRow = await adminGetSpellRightWord(wordId);
  if (!wordRow || wordRow.setId !== setId) notFound();

  const isTermination = wordRow.set.mode === "TERMINATION";
  const update = updateSpellRightWordAction.bind(null, setId, wordId);

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
        <p className="eyebrow">
          Studio · Sounds & spelling · {wordRow.set.title}
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">Edit word</h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 card p-8"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="word" className="text-sm font-medium text-fg">
            Word <span className="text-accent-text">*</span>
          </label>
          <input id="word" name="word" defaultValue={wordRow.word} required className={inputClass} />
        </div>

        {isTermination && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">
              Correct termination <span className="text-accent-text">*</span>
            </span>
            <div className="flex gap-4">
              {[
                { value: "ed", label: "/ɪd/ (ed)", hint: "wanted, landed" },
                { value: "t", label: "/t/", hint: "walked, jumped" },
                { value: "d", label: "/d/", hint: "played, moved" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={opt.value}
                    defaultChecked={wordRow.correctAnswer === opt.value}
                    className="mt-0.5 accent-accent-text"
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
          <label htmlFor="explanation" className="text-sm font-medium text-fg">
            Explanation
            <span className="ml-1 normal-case text-subtle">(shown after answer)</span>
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
          <SubmitButton className="btn btn-primary">Save changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}
