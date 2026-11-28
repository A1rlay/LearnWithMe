import Link from "next/link";
import { notFound } from "next/navigation";

import { updateQuestionAction } from "../../actions";
import { adminGetQuestion } from "@/server/data/admin";
import { requireEditorPage } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/submit-button";

type EditQuestionPageProps = {
  params: Promise<{ id: string; questionId: string; videoId: string }>;
};

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { id, questionId, videoId } = await params;
  await requireEditorPage({ kind: "question", id: questionId });
  const question = await adminGetQuestion(questionId);
  if (!question) notFound();

  const update = updateQuestionAction.bind(null, id, videoId, questionId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/topics/${id}/videos/${videoId}/questions`}
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div>
        <p className="eyebrow">
          Studio · {question.video.title}
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">
          Edit question {question.order}
        </h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 card p-8"
      >
        <QuestionFields
          defaults={{
            checkpointSeconds: question.checkpointSeconds,
            options: question.options,
            prompt: question.prompt,
            hint: question.hint,
          }}
        />
        <div className="flex gap-3 pt-2">
          <SubmitButton className="btn btn-primary">Save changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}

export function QuestionFields({
  defaultOrder,
  defaults,
}: {
  defaultOrder?: number;
  defaults?: {
    checkpointSeconds?: number;
    options?: { id: string; isCorrect: boolean; order: number; text: string }[];
    prompt?: string;
    hint?: string | null;
  };
}) {
  const correctIndex =
    defaults?.options?.find((o) => o.isCorrect)?.order ?? 1;

  const inputClass =
    "field";

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {defaultOrder !== undefined && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="order"
              className="text-sm font-medium text-fg"
            >
              Order <span className="text-accent-text">*</span>
            </label>
            <input
              id="order"
              name="order"
              defaultValue={defaultOrder}
              required
              className={inputClass}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkpointSeconds"
            className="text-sm font-medium text-fg"
          >
            Checkpoint (seconds) <span className="text-accent-text">*</span>
          </label>
          <input
            id="checkpointSeconds"
            name="checkpointSeconds"
            defaultValue={defaults?.checkpointSeconds?.toString() ?? "0"}
            required
            className={inputClass}
          />
          <p className="text-xs text-muted">When to pause video for this question</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="prompt"
          className="text-sm font-medium text-fg"
        >
          Prompt <span className="text-accent-text">*</span>
        </label>
        <input
          id="prompt"
          name="prompt"
          defaultValue={defaults?.prompt}
          required
          className={inputClass}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">Hint (optional)</span>
        <input name="hint" maxLength={200} defaultValue={defaults?.hint ?? ""} placeholder="A nudge, not the answer. e.g. Listen for the -ed ending." className="field" />
      </label>

      <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-5">
        <legend className="px-1 text-sm font-medium text-fg">
          Options: select the correct answer
        </legend>
        {[1, 2, 3, 4].map((n) => {
          const opt = defaults?.options?.find((o) => o.order === n);
          return (
            <div key={n} className="flex items-center gap-3">
              <input
                type="radio"
                id={`correct-${n}`}
                name="correct"
                value={n}
                defaultChecked={n === correctIndex}
                className="h-4 w-4 accent-fg"
              />
              {opt && (
                <input type="hidden" name={`option${n}Id`} value={opt.id} />
              )}
              <input
                id={`option${n}`}
                name={`option${n}`}
                defaultValue={opt?.text}
                placeholder={`Option ${n}`}
                required
                className="flex-1 rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text"
              />
            </div>
          );
        })}
        <p className="text-xs text-muted">
          Select the radio button next to the correct option.
        </p>
      </fieldset>
    </>
  );
}
