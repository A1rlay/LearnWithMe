import type { QMQuestionData } from "@/server/data/question-maker";

export function AnswerDisplay({
  questionData,
  studentAnswer,
}: {
  questionData: QMQuestionData;
  studentAnswer: unknown;
}) {
  if ("options" in questionData) {
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
            {i === chosen && chosen !== questionData.correctIndex && <span className="font-bold">✗</span>}
            {i !== questionData.correctIndex && i !== chosen && <span className="w-3" />}
            {opt}
            {i === chosen && <span className="ml-auto text-xs opacity-70">(student)</span>}
          </div>
        ))}
      </div>
    );
  }

  if ("referenceAnswer" in questionData) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-xl border border-[var(--border)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Student answer</p>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            {typeof studentAnswer === "string" ? studentAnswer : JSON.stringify(studentAnswer)}
          </p>
        </div>
        {questionData.referenceAnswer && (
          <div className="rounded-xl border border-[rgba(15,156,0,0.3)] bg-[rgba(15,156,0,0.08)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F9C00]">Reference answer</p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{questionData.referenceAnswer}</p>
          </div>
        )}
      </div>
    );
  }

  if ("pairs" in questionData) {
    const studentPairs = Array.isArray(studentAnswer) ? (studentAnswer as number[]) : [];
    return (
      <div className="grid grid-cols-2 gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Left</span>
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Right (correct / student)</span>
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
                  <span className="ml-2 opacity-60">← {questionData.pairs[studentMatchIdx]?.right}</span>
                )}
              </div>
            </>
          );
        })}
      </div>
    );
  }

  if ("categories" in questionData) {
    const studentCats = Array.isArray(studentAnswer) ? (studentAnswer as number[]) : [];
    return (
      <div className="flex flex-col gap-3">
        {questionData.categories.map((cat, ci) => (
          <div key={ci} className="rounded-[16px] border border-[var(--border)] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{cat}</p>
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
                    title={!isCorrect ? `Student placed in: ${questionData.categories[studentCat] ?? "?"}` : undefined}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      inThisCat && studentInThisCat
                        ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]"
                        : inThisCat && !studentInThisCat
                        ? "border border-[rgba(15,156,0,0.4)] text-[rgba(15,156,0,0.6)]"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {item.text}{!isCorrect && studentInThisCat && " ✗"}
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
    const answer = typeof studentAnswer === "string" ? studentAnswer : "";
    const correct = answer.trim().toLowerCase() === questionData.answer.trim().toLowerCase();
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[rgba(255,255,255,0.6)]">{questionData.sentence}</p>
        <div className="flex gap-3">
          <div className={`flex-1 rounded-xl border px-4 py-3 text-sm ${correct ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] text-[#0F9C00]" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
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
    const studentBool = studentAnswer === true || studentAnswer === "true";
    const correct = studentBool === questionData.isTrue;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[rgba(255,255,255,0.6)]">{questionData.statement}</p>
        <div className="flex gap-3">
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${correct ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] text-[#0F9C00]" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            Student: {studentBool ? "True" : "False"}
          </div>
          {!correct && (
            <div className="rounded-xl border border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] px-4 py-3 text-sm font-semibold text-[#0F9C00]">
              Correct: {questionData.isTrue ? "True" : "False"}
            </div>
          )}
        </div>
        {questionData.explanation && (
          <p className="mt-1 text-xs text-[rgba(255,255,255,0.45)]">{questionData.explanation}</p>
        )}
      </div>
    );
  }

  if ("words" in questionData) {
    const studentOrder = Array.isArray(studentAnswer) ? (studentAnswer as number[]) : [];
    const correctOrder = questionData.words.map((_, i) => i);
    const isCorrect = JSON.stringify(studentOrder) === JSON.stringify(correctOrder);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {studentOrder.map((wi, pos) => {
            const wordCorrect = wi === correctOrder[pos];
            return (
              <span
                key={pos}
                title={wordCorrect ? undefined : `Expected: ${questionData.words[correctOrder[pos]]}`}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${wordCorrect ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]" : "bg-red-500/20 text-red-400"}`}
              >
                {questionData.words[wi]}
              </span>
            );
          })}
        </div>
        {!isCorrect && (
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="self-center text-xs text-[rgba(255,255,255,0.4)]">Correct:</span>
            {questionData.words.map((w, i) => (
              <span key={i} className="rounded-full bg-[rgba(15,156,0,0.12)] px-3 py-1 text-sm text-[#0F9C00]">{w}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if ("word" in questionData) {
    const answer = typeof studentAnswer === "string" ? studentAnswer : "";
    const correct = answer.trim().toLowerCase() === questionData.word.trim().toLowerCase();
    return (
      <div className="flex gap-3">
        <div className={`flex-1 rounded-xl border px-4 py-3 text-sm ${correct ? "border-[rgba(15,156,0,0.4)] bg-[rgba(15,156,0,0.08)] text-[#0F9C00]" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
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

  return <pre className="text-xs text-[var(--muted)]">{JSON.stringify(studentAnswer, null, 2)}</pre>;
}
