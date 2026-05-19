import Link from "next/link";
import { notFound } from "next/navigation";

import { getQMSession } from "@/server/data/question-maker";
import type { QMQuestionData } from "@/server/data/question-maker";
import { reviewQMAnswerAction } from "../../actions";

type Props = { params: Promise<{ sessionId: string }> };

export default async function QMSessionReviewPage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getQMSession(sessionId);
  if (!session) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/question-maker/sessions?topicId=${session.topicId}`}
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · QuestionMaker · {session.topic.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Session review</h1>
        {session.completedAt && (
          <p className="mt-1 text-sm text-[var(--muted)]">
            Completed {new Date(session.completedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {session.answers.map((answer, idx) => {
          const qData = answer.question.data as QMQuestionData;
          const studentAnswer = answer.answer as unknown;

          return (
            <div
              key={answer.id}
              className="flex flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    {idx + 1}. {answer.question.type.replace("_", " ")}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--foreground)]">
                    {answer.question.prompt}
                  </p>
                </div>
                {answer.isCorrect === true && (
                  <span className="shrink-0 rounded-full bg-[rgba(15,156,0,0.2)] px-3 py-1.5 text-xs font-bold text-[#0F9C00]">
                    Correct
                  </span>
                )}
                {answer.isCorrect === false && (
                  <span className="shrink-0 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400">
                    Incorrect
                  </span>
                )}
                {answer.isCorrect === null && (
                  <span className="shrink-0 rounded-full bg-yellow-500/20 px-3 py-1.5 text-xs font-bold text-yellow-300">
                    Pending review
                  </span>
                )}
              </div>

              <AnswerDisplay questionData={qData} studentAnswer={studentAnswer} />

              {/* Open answer review buttons */}
              {answer.question.type === "OPEN_ANSWER" && answer.isCorrect === null && (
                <div className="flex gap-2 border-t border-[var(--border)] pt-4">
                  <form action={reviewQMAnswerAction.bind(null, sessionId, answer.id, true)}>
                    <button
                      type="submit"
                      className="rounded-full bg-[rgba(15,156,0,0.2)] px-4 py-2 text-xs font-bold text-[#0F9C00] transition-colors hover:bg-[rgba(15,156,0,0.35)]"
                    >
                      Mark correct
                    </button>
                  </form>
                  <form action={reviewQMAnswerAction.bind(null, sessionId, answer.id, false)}>
                    <button
                      type="submit"
                      className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/25"
                    >
                      Mark incorrect
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnswerDisplay({
  questionData,
  studentAnswer,
}: {
  questionData: QMQuestionData;
  studentAnswer: unknown;
}) {
  if ("options" in questionData) {
    // Multiple option
    const chosen = typeof studentAnswer === "number" ? studentAnswer : -1;
    return (
      <div className="flex flex-col gap-1.5">
        {questionData.options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${
              i === questionData.correctIndex
                ? "bg-[rgba(15,156,0,0.15)] text-[#0F9C00]"
                : i === chosen && chosen !== questionData.correctIndex
                ? "bg-red-500/15 text-red-400"
                : "text-[var(--muted)]"
            }`}
          >
            {i === questionData.correctIndex && <span className="font-bold">✓</span>}
            {i === chosen && chosen !== questionData.correctIndex && (
              <span className="font-bold">✗</span>
            )}
            {i !== questionData.correctIndex && i !== chosen && (
              <span className="w-3" />
            )}
            {opt}
            {i === chosen && <span className="ml-auto text-xs opacity-70">(student)</span>}
          </div>
        ))}
      </div>
    );
  }

  if ("referenceAnswer" in questionData) {
    // Open answer
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-xl border border-[var(--border)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Student answer
          </p>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            {typeof studentAnswer === "string" ? studentAnswer : JSON.stringify(studentAnswer)}
          </p>
        </div>
        {questionData.referenceAnswer && (
          <div className="rounded-xl border border-[rgba(15,156,0,0.3)] bg-[rgba(15,156,0,0.08)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F9C00]">
              Reference answer
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{questionData.referenceAnswer}</p>
          </div>
        )}
      </div>
    );
  }

  if ("pairs" in questionData) {
    // Matcher
    const studentPairs = Array.isArray(studentAnswer) ? (studentAnswer as number[]) : [];
    return (
      <div className="grid grid-cols-2 gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Left</span>
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Right (correct → student)</span>
        {questionData.pairs.map((pair, i) => {
          const studentMatchIdx = studentPairs[i] ?? -1;
          const isCorrect = studentMatchIdx === i;
          return (
            <>
              <div key={`l${i}`} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]">
                {pair.left}
              </div>
              <div
                key={`r${i}`}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  isCorrect
                    ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.1)] text-[#0F9C00]"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {pair.right}
                {!isCorrect && studentMatchIdx >= 0 && studentMatchIdx < questionData.pairs.length && (
                  <span className="ml-2 opacity-60"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              {questionData.pairs[studentMatchIdx]?.right}</span>
                )}
              </div>
            </>
          );
        })}
      </div>
    );
  }

  if ("categories" in questionData) {
    // Classifier
    const studentCats = Array.isArray(studentAnswer) ? (studentAnswer as number[]) : [];
    return (
      <div className="flex flex-col gap-3">
        {questionData.categories.map((cat, ci) => (
          <div key={ci} className="rounded-[16px] border border-[var(--border)] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {cat}
            </p>
            <div className="flex flex-wrap gap-2">
              {questionData.items.map((item, ii) => {
                const correctCat = item.categoryIndex;
                const studentCat = studentCats[ii] ?? -1;
                const inThisCat = correctCat === ci;
                const studentInThisCat = studentCat === ci;
                if (!inThisCat && !studentInThisCat) return null;
                const isCorrect = studentCat === correctCat;
                return (
                  <span
                    key={ii}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      inThisCat && studentInThisCat
                        ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]"
                        : inThisCat && !studentInThisCat
                        ? "border border-[rgba(15,156,0,0.4)] text-[rgba(15,156,0,0.6)]"
                        : "bg-red-500/20 text-red-400"
                    }`}
                    title={!isCorrect ? `Student placed in: ${questionData.categories[studentCat] ?? "?"}` : undefined}
                  >
                    {item.text}
                    {!isCorrect && studentInThisCat && " ✗"}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if ("sentence" in questionData) {
    // Fill in blank
    const answer = typeof studentAnswer === "string" ? studentAnswer : "";
    const correct = answer.trim().toLowerCase() === questionData.answer.trim().toLowerCase();
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[rgba(255,255,255,0.6)]">{questionData.sentence}</p>
        <div className="flex gap-3">
          <div className={`flex-1 rounded-xl border px-4 py-3 text-sm ${correct ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] text-[#0F9C00]" : "border-red-500/30 bg-red-500/08 text-red-400"}`}>
            <span className="text-xs font-semibold uppercase tracking-widest opacity-60 block mb-1">Student</span>
            {answer || <span className="opacity-40">(empty)</span>}
          </div>
          {!correct && (
            <div className="flex-1 rounded-xl border border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] px-4 py-3 text-sm text-[#0F9C00]">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-60 block mb-1">Correct</span>
              {questionData.answer}
            </div>
          )}
        </div>
      </div>
    );
  }

  if ("statement" in questionData) {
    // True / False
    const studentBool = studentAnswer === true || studentAnswer === "true";
    const correct = studentBool === questionData.isTrue;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[rgba(255,255,255,0.6)]">{questionData.statement}</p>
        <div className="flex gap-3">
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${correct ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] text-[#0F9C00]" : "border-red-500/30 bg-red-500/08 text-red-400"}`}>
            Student: {studentBool ? "True" : "False"}
          </div>
          {!correct && (
            <div className="rounded-xl border border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] px-4 py-3 text-sm font-semibold text-[#0F9C00]">
              Correct: {questionData.isTrue ? "True" : "False"}
            </div>
          )}
        </div>
        {questionData.explanation && (
          <p className="text-xs text-[rgba(255,255,255,0.45)] mt-1">{questionData.explanation}</p>
        )}
      </div>
    );
  }

  if ("words" in questionData) {
    // Sentence order
    const studentOrder = Array.isArray(studentAnswer) ? (studentAnswer as number[]) : [];
    const correctOrder = questionData.words.map((_, i) => i);
    const isCorrect = JSON.stringify(studentOrder) === JSON.stringify(correctOrder);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {studentOrder.map((wi, pos) => {
            const expectedWord = questionData.words[correctOrder[pos]];
            const studentWord = questionData.words[wi];
            const wordCorrect = wi === correctOrder[pos];
            return (
              <span
                key={pos}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${wordCorrect ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]" : "bg-red-500/20 text-red-400"}`}
                title={wordCorrect ? undefined : `Expected: ${expectedWord}`}
              >
                {studentWord}
              </span>
            );
          })}
        </div>
        {!isCorrect && (
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs text-[rgba(255,255,255,0.4)] self-center">Correct:</span>
            {questionData.words.map((w, i) => (
              <span key={i} className="rounded-full bg-[rgba(15,156,0,0.12)] px-3 py-1 text-sm text-[#0F9C00]">{w}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if ("word" in questionData) {
    // Word scramble
    const answer = typeof studentAnswer === "string" ? studentAnswer : "";
    const correct = answer.trim().toLowerCase() === questionData.word.trim().toLowerCase();
    return (
      <div className="flex gap-3">
        <div className={`flex-1 rounded-xl border px-4 py-3 text-sm ${correct ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] text-[#0F9C00]" : "border-red-500/30 bg-red-500/08 text-red-400"}`}>
          <span className="text-xs font-semibold uppercase tracking-widest opacity-60 block mb-1">Student</span>
          {answer || <span className="opacity-40">(empty)</span>}
        </div>
        {!correct && (
          <div className="flex-1 rounded-xl border border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] px-4 py-3 text-sm text-[#0F9C00]">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-60 block mb-1">Correct</span>
            {questionData.word}
          </div>
        )}
      </div>
    );
  }

  if ("front" in questionData) {
    // Flashcard — self-assessed
    const knew = studentAnswer === true || studentAnswer === "true";
    return (
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)]">
          {questionData.front} → {questionData.back}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${knew ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]" : "bg-red-500/20 text-red-400"}`}>
          {knew ? "Knew it" : "Didn't know"}
        </span>
      </div>
    );
  }

  return (
    <pre className="text-xs text-[var(--muted)]">{JSON.stringify(studentAnswer, null, 2)}</pre>
  );
}
