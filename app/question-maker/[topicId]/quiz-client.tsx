"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import type {
  ClassifierData,
  MatcherData,
  MultipleOptionData,
  QMQuestionData,
  QMQuestionDetail,
  QMTopicDetail,
} from "@/server/data/question-maker";
import { submitQuizAction } from "./actions";

type Props = { topic: QMTopicDetail; sessionId: string };

type ScoredAnswer = {
  question: QMQuestionDetail;
  studentAnswer: unknown;
  isCorrect: boolean | null;
};

// ─── Main quiz shell ──────────────────────────────────────────────────────────

export function QuizClient({ topic, sessionId }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<unknown[]>(Array(topic.questions.length).fill(null));
  const [review, setReview] = useState<ScoredAnswer[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = topic.questions[step];
  const isLast = step === topic.questions.length - 1;

  function saveAnswer(v: unknown) {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = v;
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    const scored: ScoredAnswer[] = topic.questions.map((q, i) => ({
      question: q,
      studentAnswer: answers[i],
      isCorrect: scoreAnswer(q, answers[i]),
    }));
    await submitQuizAction(
      sessionId,
      scored.map((s) => ({
        questionId: s.question.id,
        answer: s.studentAnswer,
        isCorrect: s.isCorrect,
      })),
    );
    setReview(scored);
    setSubmitting(false);
  }

  if (review) return <ReviewScreen topic={topic} scored={review} />;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 sm:py-16">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]">
            {topic.title}
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.45)]">
            {step + 1} / {topic.questions.length}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.1)]">
          <div
            className="h-full rounded-full bg-[#0F9C00] transition-all duration-300"
            style={{ width: `${((step + 1) / topic.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Question {step + 1}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">{current.prompt}</h2>
      </div>

      {/* Answer input — keyed by question id so state resets between questions */}
      <QuestionInput
        key={current.id}
        question={current}
        value={answers[step]}
        onChange={saveAnswer}
      />

      {/* Nav */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/question-maker"
          className="text-sm text-[rgba(255,255,255,0.45)] transition-colors hover:text-white"
        >
          ← Exit
        </Link>
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={answers[step] === null || submitting}
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={answers[step] === null}
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Next →
          </button>
        )}
      </div>
    </main>
  );
}

// ─── Question dispatcher ──────────────────────────────────────────────────────

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QMQuestionDetail;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const data = question.data as QMQuestionData;
  if ("options" in data) return <MultipleOptionInput data={data} value={value} onChange={onChange} />;
  if ("referenceAnswer" in data) return <OpenAnswerInput value={value} onChange={onChange} />;
  if ("pairs" in data) return <MatcherInput data={data} value={value} onChange={onChange} />;
  if ("categories" in data) return <ClassifierInput data={data} value={value} onChange={onChange} />;
  return null;
}

// ─── Multiple Option ──────────────────────────────────────────────────────────

function MultipleOptionInput({
  data,
  value,
  onChange,
}: {
  data: MultipleOptionData;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const selected = typeof value === "number" ? value : -1;
  return (
    <div className="flex flex-col gap-2">
      {data.options.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-colors ${
            selected === i
              ? "border-[#0F9C00] bg-[rgba(15,156,0,0.15)] text-white"
              : "border-[rgba(255,255,255,0.18)] text-[rgba(255,255,255,0.8)] hover:border-[rgba(255,255,255,0.4)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Open Answer ──────────────────────────────────────────────────────────────

function OpenAnswerInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const text = typeof value === "string" ? value : "";
  return (
    <div className="flex flex-col gap-2">
      <textarea
        rows={4}
        value={text}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Type your answer here…"
        className="rounded-2xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.4)] px-5 py-4 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-[rgba(255,255,255,0.5)] resize-none"
      />
      <p className="text-xs text-[rgba(255,255,255,0.4)]">Your teacher will review this answer.</p>
    </div>
  );
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// Click a left item → it becomes active. Then click a right item → a line is drawn.
// Click a connected item (either side) → remove that connection.

type LineCoords = { x1: number; y1: number; x2: number; y2: number; leftIdx: number };

function MatcherInput({
  data,
  value,
  onChange,
}: {
  data: MatcherData;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<LineCoords[]>([]);

  // Stable shuffled order for right column
  const [shuffled] = useState<number[]>(() => {
    const idx = data.pairs.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });

  // selected[leftIdx] = rightActualIdx | null
  const selected: (number | null)[] = Array.isArray(value)
    ? (value as (number | null)[])
    : Array(data.pairs.length).fill(null);

  // Recalculate SVG line coordinates after DOM settles
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const newLines: LineCoords[] = [];
    for (let li = 0; li < data.pairs.length; li++) {
      const ri = selected[li];
      if (ri === null || ri === undefined) continue;
      const leftEl = leftRefs.current[li];
      const shuffledPos = shuffled.indexOf(ri);
      const rightEl = rightRefs.current[shuffledPos];
      if (!leftEl || !rightEl) continue;
      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();
      newLines.push({
        x1: lr.right - cr.left,
        y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left - cr.left,
        y2: rr.top + rr.height / 2 - cr.top,
        leftIdx: li,
      });
    }
    setLines(newLines);
  }, [value, shuffled, data.pairs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function connect(rightActualIdx: number) {
    if (activeLeft === null) return;
    const next = [...selected] as (number | null)[];
    // Free any left that was already using this right
    for (let i = 0; i < next.length; i++) {
      if (next[i] === rightActualIdx) next[i] = null;
    }
    // Toggle: click same right while active → deselect
    next[activeLeft] = next[activeLeft] === rightActualIdx ? null : rightActualIdx;
    onChange(next);
    setActiveLeft(null);
  }

  function removeLeft(li: number) {
    const next = [...selected] as (number | null)[];
    next[li] = null;
    onChange(next);
    setActiveLeft(null);
  }

  const allMatched = selected.every((s) => s !== null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[rgba(255,255,255,0.45)]">
        {allMatched
          ? "All pairs connected. Click any item to change a match."
          : activeLeft !== null
          ? "Now click the matching item on the right →"
          : "Click a left item to select it, then click the matching right item."}
      </p>

      <div ref={containerRef} className="relative select-none">
        <div className="grid grid-cols-2 gap-x-14 gap-y-2">
          {/* Left column */}
          <div className="flex flex-col gap-2">
            {data.pairs.map((pair, li) => {
              const isMatched = selected[li] !== null;
              const isActive = activeLeft === li;
              return (
                <button
                  key={li}
                  type="button"
                  ref={(el) => { leftRefs.current[li] = el; }}
                  onClick={() => {
                    if (isActive) {
                      setActiveLeft(null);
                    } else if (isMatched) {
                      removeLeft(li);
                      setActiveLeft(li);
                    } else {
                      setActiveLeft(li);
                    }
                  }}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    isActive
                      ? "border-white bg-white/10 text-white ring-1 ring-white/30"
                      : isMatched
                      ? "border-[rgba(15,156,0,0.55)] text-white"
                      : "border-[rgba(255,255,255,0.18)] text-[rgba(255,255,255,0.8)] hover:border-white"
                  }`}
                >
                  {pair.left}
                </button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-2">
            {shuffled.map((actualIdx, si) => {
              const isMatched = selected.includes(actualIdx);
              const clickable = activeLeft !== null && !isMatched;
              return (
                <button
                  key={actualIdx}
                  type="button"
                  ref={(el) => { rightRefs.current[si] = el; }}
                  onClick={() => {
                    if (activeLeft !== null) connect(actualIdx);
                  }}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    isMatched
                      ? "border-[rgba(15,156,0,0.55)] text-white"
                      : clickable
                      ? "border-[rgba(255,255,255,0.35)] text-white hover:border-[#0F9C00] hover:bg-[rgba(15,156,0,0.08)] cursor-pointer"
                      : "border-[rgba(255,255,255,0.18)] text-[rgba(255,255,255,0.6)]"
                  }`}
                >
                  {data.pairs[actualIdx].right}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ overflow: "visible" }}
        >
          {lines.map((line) => (
            <g key={line.leftIdx}>
              <line
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="rgba(15,156,0,0.7)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx={(line.x1 + line.x2) / 2} cy={(line.y1 + line.y2) / 2} r="3" fill="#0F9C00" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Classifier (drag-and-drop on desktop + tap-to-select on mobile) ──────────
// Browsers don't fire click after a drag, so both interaction models
// coexist safely in a single component.

function ClassifierInput({
  data,
  value,
  onChange,
}: {
  data: ClassifierData;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [dragItem, setDragItem] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | "bank" | null>(null);
  const [activeItem, setActiveItem] = useState<number | null>(null); // tap selection

  const [shuffled] = useState<number[]>(() => {
    const idx = data.items.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });

  const placements: (number | null)[] = Array.isArray(value)
    ? (value as (number | null)[])
    : Array(data.items.length).fill(null);

  function assign(ii: number, ci: number | null) {
    const next = [...placements];
    next[ii] = ci;
    onChange(next);
  }

  // ── Drag handlers (desktop) ───────────────────────────────────────────────
  function onDragStartItem(ii: number, e: React.DragEvent) {
    setDragItem(ii);
    setActiveItem(null);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragEndItem() {
    setDragItem(null);
    setDragOver(null);
  }

  // ── Tap/click handlers (mobile — click never fires after a real drag) ─────
  function tapBankItem(ii: number) {
    setActiveItem((prev) => (prev === ii ? null : ii));
  }
  function tapCategory(ci: number) {
    if (activeItem === null) return;
    assign(activeItem, ci);
    setActiveItem(null);
  }
  function tapPlacedItem(ii: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (activeItem === ii) {
      assign(ii, null); // second tap → return to bank
      setActiveItem(null);
    } else {
      setActiveItem(ii); // first tap → select to move
    }
  }

  const unplaced = shuffled.filter((ii) => placements[ii] === null);
  const catCols = Math.min(data.categories.length, 2);
  const hasTapSelection = activeItem !== null && dragItem === null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[rgba(255,255,255,0.45)]">
        {hasTapSelection
          ? `Tap a category to place "${data.items[activeItem!].text}" — or tap it again to cancel.`
          : "Drag items into a category, or tap to select and then tap a category."}
      </p>

      {/* Bank */}
      <div
        className={`min-h-12 rounded-2xl border-2 border-dashed p-4 transition-colors ${
          dragOver === "bank"
            ? "border-[rgba(255,255,255,0.45)] bg-[rgba(255,255,255,0.05)]"
            : hasTapSelection
            ? "border-[rgba(255,255,255,0.2)]"
            : "border-[rgba(255,255,255,0.15)]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver("bank"); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => {
          e.preventDefault();
          if (dragItem !== null) assign(dragItem, null);
          setDragOver(null);
          setDragItem(null);
        }}
      >
        <div className="flex flex-wrap gap-2 min-h-8">
          {unplaced.length === 0 ? (
            <span className="text-xs text-[rgba(255,255,255,0.3)]">All items placed</span>
          ) : (
            unplaced.map((ii) => (
              <div
                key={ii}
                draggable
                onDragStart={(e) => onDragStartItem(ii, e)}
                onDragEnd={onDragEndItem}
                onClick={() => tapBankItem(ii)}
                className={`cursor-grab rounded-full border px-3 py-1.5 text-sm font-semibold text-white select-none transition-all active:scale-95 ${
                  activeItem === ii
                    ? "border-[#0F9C00] bg-[rgba(15,156,0,0.25)] ring-2 ring-[#0F9C00] scale-105"
                    : dragItem === ii
                    ? "opacity-40 border-[rgba(255,255,255,0.3)]"
                    : "border-[rgba(255,255,255,0.3)] hover:border-white"
                }`}
              >
                {data.items[ii].text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category buckets */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${catCols}, minmax(0, 1fr))` }}
      >
        {data.categories.map((cat, ci) => {
          const placed = shuffled.filter((ii) => placements[ii] === ci);
          const highlight = dragOver === ci || hasTapSelection;
          return (
            <div
              key={ci}
              onDragOver={(e) => { e.preventDefault(); setDragOver(ci); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragItem !== null) assign(dragItem, ci);
                setDragOver(null);
                setDragItem(null);
              }}
              onClick={() => tapCategory(ci)}
              className={`min-h-24 rounded-2xl border-2 p-4 transition-colors ${
                highlight
                  ? "cursor-pointer border-[#0F9C00] bg-[rgba(15,156,0,0.06)]"
                  : "border-[rgba(255,255,255,0.18)]"
              }`}
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                {cat}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {placed.map((ii) => (
                  <div
                    key={ii}
                    draggable
                    onDragStart={(e) => onDragStartItem(ii, e)}
                    onDragEnd={onDragEndItem}
                    onClick={(e) => tapPlacedItem(ii, e)}
                    className={`cursor-grab rounded-full px-3 py-1 text-xs font-semibold select-none transition-all active:scale-95 ${
                      activeItem === ii
                        ? "bg-[rgba(15,156,0,0.4)] text-[#0F9C00] ring-2 ring-[#0F9C00] scale-105"
                        : dragItem === ii
                        ? "opacity-40 bg-[rgba(15,156,0,0.2)] text-[#0F9C00]"
                        : "bg-[rgba(15,156,0,0.2)] text-[#0F9C00] hover:bg-red-500/20 hover:text-red-400"
                    }`}
                    title="Drag or tap to move"
                  >
                    {data.items[ii].text}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[rgba(255,255,255,0.4)]">
        Mobile: tap an item to select it, tap a category to place it, tap a placed item twice to return it.
      </p>
    </div>
  );
}

// ─── Review screen (shown after submit) ──────────────────────────────────────

function ReviewScreen({
  topic,
  scored,
}: {
  topic: QMTopicDetail;
  scored: ScoredAnswer[];
}) {
  const correct = scored.filter((s) => s.isCorrect === true).length;
  const pending = scored.filter((s) => s.isCorrect === null).length;
  const total = scored.length;
  const autoGraded = total - pending;
  const pct = autoGraded > 0 ? Math.round((correct / autoGraded) * 100) : 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 sm:py-16">
      {/* Score card */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
          {topic.title}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white">Quiz complete!</h1>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] px-10 py-8 text-center">
        <p className="text-6xl font-extrabold text-[#0F9C00]">{pct}%</p>
        <p className="text-sm text-[rgba(255,255,255,0.6)]">
          {correct} correct out of {autoGraded} auto-graded
          {pending > 0 && (
            <span className="ml-1 text-yellow-300">
              · {pending} pending teacher review
            </span>
          )}
        </p>
      </div>

      {/* Per-question review */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">
          Review
        </h2>
        {scored.map((s, i) => (
          <QuestionReview key={s.question.id} index={i} scored={s} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/question-maker/${topic.id}`}
          className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </Link>
        <Link
          href="/question-maker"
          className="rounded-full border border-[rgba(255,255,255,0.25)] px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
        >
          ← Back to topics
        </Link>
      </div>
    </main>
  );
}

function QuestionReview({ index, scored }: { index: number; scored: ScoredAnswer }) {
  const { question, studentAnswer, isCorrect } = scored;
  const data = question.data as QMQuestionData;

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {index + 1}. {question.type.replace("_", " ")}
          </p>
          <p className="mt-1 font-semibold text-white">{question.prompt}</p>
        </div>
        {isCorrect === true && (
          <span className="shrink-0 rounded-full bg-[rgba(15,156,0,0.2)] px-3 py-1 text-xs font-bold text-[#0F9C00]">
            Correct ✓
          </span>
        )}
        {isCorrect === false && (
          <span className="shrink-0 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
            Wrong ✗
          </span>
        )}
        {isCorrect === null && (
          <span className="shrink-0 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-300">
            Pending
          </span>
        )}
      </div>

      {"options" in data && <ReviewMultipleOption data={data} answer={studentAnswer} />}
      {"referenceAnswer" in data && <ReviewOpenAnswer answer={studentAnswer} />}
      {"pairs" in data && <ReviewMatcher data={data} answer={studentAnswer} />}
      {"categories" in data && <ReviewClassifier data={data} answer={studentAnswer} />}
    </div>
  );
}

function ReviewMultipleOption({ data, answer }: { data: MultipleOptionData; answer: unknown }) {
  const chosen = typeof answer === "number" ? answer : -1;
  return (
    <div className="flex flex-col gap-1">
      {data.options.map((opt, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
            i === data.correctIndex
              ? "bg-[rgba(15,156,0,0.12)] text-[#0F9C00]"
              : i === chosen
              ? "bg-red-500/10 text-red-400"
              : "text-[rgba(255,255,255,0.45)]"
          }`}
        >
          <span className="w-4 shrink-0 text-center font-bold text-xs">
            {i === data.correctIndex ? "✓" : i === chosen ? "✗" : ""}
          </span>
          <span className="flex-1">{opt}</span>
          {i === chosen && i !== data.correctIndex && (
            <span className="text-xs opacity-60">your answer</span>
          )}
          {i === data.correctIndex && i === chosen && (
            <span className="text-xs opacity-60">your answer</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewOpenAnswer({ answer }: { answer: unknown }) {
  const text = typeof answer === "string" ? answer : "";
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-[var(--border)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.4)]">
          Your answer
        </p>
        <p className="mt-1 text-sm text-white">
          {text || <em className="opacity-40">No answer given</em>}
        </p>
      </div>
      <p className="text-xs text-yellow-300/70">
        Your teacher will review this and mark it as correct or incorrect.
      </p>
    </div>
  );
}

function ReviewMatcher({ data, answer }: { data: MatcherData; answer: unknown }) {
  const arr = Array.isArray(answer) ? (answer as (number | null)[]) : [];
  return (
    <div className="flex flex-col gap-1.5">
      {data.pairs.map((pair, i) => {
        const studentRight = arr[i] ?? null;
        const isCorrect = studentRight === i;
        const studentRightLabel =
          studentRight !== null && studentRight < data.pairs.length
            ? data.pairs[studentRight].right
            : null;
        return (
          <div
            key={i}
            className={`grid grid-cols-[1fr_16px_1fr] items-center gap-2 rounded-xl px-3 py-2 text-sm ${
              isCorrect ? "bg-[rgba(15,156,0,0.1)]" : "bg-red-500/8"
            }`}
          >
            <span className="text-white">{pair.left}</span>
            <span className={`text-center text-xs font-bold ${isCorrect ? "text-[#0F9C00]" : "text-red-400"}`}>
              {isCorrect ? "→" : "✗"}
            </span>
            <div className="flex flex-col gap-0.5">
              {!isCorrect && studentRightLabel && (
                <span className="text-xs text-red-400 line-through">{studentRightLabel}</span>
              )}
              <span className={isCorrect ? "text-[#0F9C00]" : "text-xs text-[rgba(15,156,0,0.7)]"}>
                {pair.right}
                {!isCorrect && " (correct)"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewClassifier({ data, answer }: { data: ClassifierData; answer: unknown }) {
  const arr = Array.isArray(answer) ? (answer as (number | null)[]) : [];
  const catCols = Math.min(data.categories.length, 2);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${catCols}, minmax(0, 1fr))` }}
    >
      {data.categories.map((cat, ci) => {
        // Items that belong here OR were placed here by student
        const relevantItems = data.items
          .map((item, ii) => ({ item, ii }))
          .filter(({ item, ii }) => item.categoryIndex === ci || arr[ii] === ci);

        return (
          <div key={ci} className="rounded-xl border border-[var(--border)] p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
              {cat}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {relevantItems.map(({ item, ii }) => {
                const studentCat = arr[ii];
                const correctCat = item.categoryIndex;
                const placedHere = studentCat === ci;
                const belongsHere = correctCat === ci;
                const isCorrect = placedHere && belongsHere;

                return (
                  <span
                    key={ii}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isCorrect
                        ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]"
                        : placedHere && !belongsHere
                        ? "bg-red-500/20 text-red-400"    // wrong placement
                        : "border border-dashed border-[rgba(15,156,0,0.35)] text-[rgba(15,156,0,0.55)]" // missed (belongs here but not placed)
                    }`}
                    title={
                      placedHere && !belongsHere
                        ? `Should be in "${data.categories[correctCat]}"`
                        : !placedHere && belongsHere
                        ? "You missed this one"
                        : undefined
                    }
                  >
                    {item.text}
                    {placedHere && !belongsHere && " ✗"}
                    {!placedHere && belongsHere && " (missed)"}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreAnswer(question: QMQuestionDetail, answer: unknown): boolean | null {
  const data = question.data as QMQuestionData;
  if ("options" in data) return answer === data.correctIndex;
  if ("referenceAnswer" in data) return null;
  if ("pairs" in data) {
    if (!Array.isArray(answer)) return false;
    const arr = answer as (number | null)[];
    return data.pairs.every((_, i) => arr[i] === i);
  }
  if ("categories" in data) {
    if (!Array.isArray(answer)) return false;
    const arr = answer as (number | null)[];
    return data.items.every((item, i) => arr[i] === item.categoryIndex);
  }
  return null;
}
