import Link from "next/link";
import { notFound } from "next/navigation";

import { updateQuestionAction } from "../../actions";
import { adminGetQuestion } from "@/server/data/admin";

type EditQuestionPageProps = {
  params: Promise<{ id: string; questionId: string; videoId: string }>;
};

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { id, questionId, videoId } = await params;
  const question = await adminGetQuestion(questionId);
  if (!question) notFound();

  const update = updateQuestionAction.bind(null, id, videoId, questionId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/topics/${id}/videos/${videoId}/questions`}
          className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · {question.video.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">
          Edit question {question.order}
        </h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <QuestionFields
          defaults={{
            checkpointSeconds: question.checkpointSeconds,
            options: question.options,
            prompt: question.prompt,
          }}
        />
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

export function QuestionFields({
  defaultOrder,
  defaults,
}: {
  defaultOrder?: number;
  defaults?: {
    checkpointSeconds?: number;
    options?: { id: string; isCorrect: boolean; order: number; text: string }[];
    prompt?: string;
  };
}) {
  const correctIndex =
    defaults?.options?.find((o) => o.isCorrect)?.order ?? 1;

  const inputClass =
    "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {defaultOrder !== undefined && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="order"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
            >
              Order <span className="text-[var(--accent)]">*</span>
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
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
          >
            Checkpoint (seconds) <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="checkpointSeconds"
            name="checkpointSeconds"
            defaultValue={defaults?.checkpointSeconds?.toString() ?? "0"}
            required
            className={inputClass}
          />
          <p className="text-xs text-[var(--muted)]">When to pause video for this question</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="prompt"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
        >
          Prompt <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          id="prompt"
          name="prompt"
          defaultValue={defaults?.prompt}
          required
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] p-5">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Options — select the correct answer
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
                className="h-4 w-4 accent-[var(--foreground)]"
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
                className="flex-1 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white"
              />
            </div>
          );
        })}
        <p className="text-xs text-[var(--muted)]">
          Select the radio button next to the correct option.
        </p>
      </fieldset>
    </>
  );
}
