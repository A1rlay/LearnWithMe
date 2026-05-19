"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import type {
  ClassifierData,
  FillBlankData,
  FlashcardData,
  MatcherData,
  MultipleOptionData,
  QMQuestionData,
  QMQuestionDetail,
  QMTopicDetail,
  SentenceOrderData,
  TrueFalseData,
  WordScrambleData,
} from "@/server/data/question-maker";
import { submitQuizAction } from "./actions";

type Props = { topic: QMTopicDetail; topicId: string };

type ScoredAnswer = {
  question: QMQuestionDetail;
  studentAnswer: unknown;
  isCorrect: boolean | null;
};

// ─── Main quiz shell ──────────────────────────────────────────────────────────

export function QuizClient({ topic, topicId }: Props) {
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
      topicId,
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
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.25)] px-5 py-3 text-sm font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Previous
          </button>
        ) : (
          <Link
            href="/question-maker"
            className="flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.45)] transition-colors hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Exit
          </Link>
        )}
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={!isAnswerReady(current, answers[step]) || submitting}
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!isAnswerReady(current, answers[step])}
            className="flex items-center gap-1.5 rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Next
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
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
  switch (question.type) {
    case "MULTIPLE_OPTION": return <MultipleOptionInput data={data as MultipleOptionData} value={value} onChange={onChange} />;
    case "OPEN_ANSWER": return <OpenAnswerInput value={value} onChange={onChange} />;
    case "MATCHER": return <MatcherInput data={data as MatcherData} value={value} onChange={onChange} />;
    case "CLASSIFIER": return <ClassifierInput data={data as ClassifierData} value={value} onChange={onChange} />;
    case "FILL_BLANK": return <FillBlankInput data={data as FillBlankData} value={value} onChange={onChange} />;
    case "TRUE_FALSE": return <TrueFalseInput data={data as TrueFalseData} value={value} onChange={onChange} />;
    case "SENTENCE_ORDER": return <SentenceOrderInput data={data as SentenceOrderData} value={value} onChange={onChange} />;
    case "WORD_SCRAMBLE": return <WordScrambleInput data={data as WordScrambleData} value={value} onChange={onChange} />;
    case "FLASHCARD": return <FlashcardInput data={data as FlashcardData} value={value} onChange={onChange} />;
    default: return null;
  }
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
          className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.25)] px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back to topics
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

      {question.type === "MULTIPLE_OPTION" && <ReviewMultipleOption data={data as MultipleOptionData} answer={studentAnswer} />}
      {question.type === "OPEN_ANSWER" && <ReviewOpenAnswer answer={studentAnswer} />}
      {question.type === "MATCHER" && <ReviewMatcher data={data as MatcherData} answer={studentAnswer} />}
      {question.type === "CLASSIFIER" && <ReviewClassifier data={data as ClassifierData} answer={studentAnswer} />}
      {question.type === "FILL_BLANK" && <ReviewFillBlank data={data as FillBlankData} answer={studentAnswer} />}
      {question.type === "TRUE_FALSE" && <ReviewTrueFalse data={data as TrueFalseData} answer={studentAnswer} />}
      {question.type === "SENTENCE_ORDER" && <ReviewSentenceOrder data={data as SentenceOrderData} answer={studentAnswer} />}
      {question.type === "WORD_SCRAMBLE" && <ReviewWordScramble data={data as WordScrambleData} answer={studentAnswer} />}
      {question.type === "FLASHCARD" && <ReviewFlashcard data={data as FlashcardData} answer={studentAnswer} />}
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

function isAnswerReady(question: QMQuestionDetail, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;
  const data = question.data as QMQuestionData;
  switch (question.type) {
    case "MATCHER": {
      const d = data as MatcherData;
      if (!Array.isArray(answer)) return false;
      const arr = answer as (number | null)[];
      return arr.length >= d.pairs.length && arr.every((v) => v !== null);
    }
    case "CLASSIFIER": {
      const d = data as ClassifierData;
      if (!Array.isArray(answer)) return false;
      const arr = answer as (number | null)[];
      return arr.length >= d.items.length && arr.every((v) => v !== null);
    }
    case "SENTENCE_ORDER": {
      const d = data as SentenceOrderData;
      if (!Array.isArray(answer)) return false;
      return (answer as unknown[]).length === d.words.length;
    }
    case "FILL_BLANK":
    case "WORD_SCRAMBLE":
      return typeof answer === "string" && answer.trim().length > 0;
    case "FLASHCARD":
      return answer === true || answer === false;
    default:
      return true;
  }
}

function scoreAnswer(question: QMQuestionDetail, answer: unknown): boolean | null {
  const data = question.data as QMQuestionData;
  switch (question.type) {
    case "MULTIPLE_OPTION":
      return answer === (data as MultipleOptionData).correctIndex;
    case "OPEN_ANSWER":
      return null;
    case "MATCHER": {
      const d = data as MatcherData;
      if (!Array.isArray(answer)) return false;
      return d.pairs.every((_, i) => (answer as (number | null)[])[i] === i);
    }
    case "CLASSIFIER": {
      const d = data as ClassifierData;
      if (!Array.isArray(answer)) return false;
      return d.items.every((item, i) => (answer as (number | null)[])[i] === item.categoryIndex);
    }
    case "FILL_BLANK": {
      const d = data as FillBlankData;
      return typeof answer === "string" && answer.trim().toLowerCase() === d.answer.trim().toLowerCase();
    }
    case "TRUE_FALSE": {
      const d = data as TrueFalseData;
      return answer === d.isTrue;
    }
    case "SENTENCE_ORDER": {
      const d = data as SentenceOrderData;
      if (!Array.isArray(answer)) return false;
      return d.words.every((w, i) => (answer as string[])[i] === w);
    }
    case "WORD_SCRAMBLE": {
      const d = data as WordScrambleData;
      return typeof answer === "string" && answer.trim().toLowerCase() === d.word.trim().toLowerCase();
    }
    case "FLASHCARD":
      return answer === true ? true : false;
    default:
      return null;
  }
}

// ─── Fill in the blank ────────────────────────────────────────────────────────

function FillBlankInput({ data, value, onChange }: { data: FillBlankData; value: unknown; onChange: (v: unknown) => void }) {
  const text = typeof value === "string" ? value : "";
  const parts = data.sentence.split("___");
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)] px-5 py-4 text-base text-white leading-relaxed">
        {parts[0]}
        <input
          value={text}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="?"
          className="mx-2 inline-block w-28 rounded-lg border-b-2 border-[#0F9C00] bg-transparent px-2 py-0.5 text-center text-white outline-none placeholder:text-[rgba(255,255,255,0.3)]"
          autoFocus
        />
        {parts[1]}
      </div>
      {data.hint && <p className="text-xs text-[rgba(255,255,255,0.45)]">Hint: {data.hint}</p>}
    </div>
  );
}

function ReviewFillBlank({ data, answer }: { data: FillBlankData; answer: unknown }) {
  const student = typeof answer === "string" ? answer.trim() : "";
  const isCorrect = student.toLowerCase() === data.answer.trim().toLowerCase();
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${isCorrect ? "bg-[rgba(15,156,0,0.12)]" : "bg-red-500/10"}`}>
        <span className="font-bold">{isCorrect ? "✓" : "✗"}</span>
        <span className={isCorrect ? "text-[#0F9C00]" : "text-red-400"}>Your answer: {student || "—"}</span>
      </div>
      {!isCorrect && <div className="flex items-center gap-2 rounded-xl bg-[rgba(15,156,0,0.12)] px-4 py-2"><span className="font-bold text-[#0F9C00]">✓</span><span className="text-[#0F9C00]">Correct: {data.answer}</span></div>}
    </div>
  );
}

// ─── True / False ─────────────────────────────────────────────────────────────

function TrueFalseInput({ data, value, onChange }: { data: TrueFalseData; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)] px-5 py-4 text-base font-medium text-white">
        {data.statement}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            className={`rounded-2xl border py-5 text-lg font-extrabold transition-colors ${value === v ? (v ? "border-[#0F9C00] bg-[rgba(15,156,0,0.15)] text-[#0F9C00]" : "border-red-500 bg-red-500/15 text-red-400") : "border-[rgba(255,255,255,0.18)] text-white hover:border-[rgba(255,255,255,0.4)]"}`}>
            {v ? "True" : "False"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewTrueFalse({ data, answer }: { data: TrueFalseData; answer: unknown }) {
  const isCorrect = answer === data.isTrue;
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${isCorrect ? "bg-[rgba(15,156,0,0.12)]" : "bg-red-500/10"}`}>
        <span className="font-bold">{isCorrect ? "✓" : "✗"}</span>
        <span className={isCorrect ? "text-[#0F9C00]" : "text-red-400"}>You answered: {answer === true ? "True" : answer === false ? "False" : "—"}</span>
      </div>
      {!isCorrect && <div className="flex items-center gap-2 rounded-xl bg-[rgba(15,156,0,0.12)] px-4 py-2"><span className="font-bold text-[#0F9C00]">✓</span><span className="text-[#0F9C00]">Correct: {data.isTrue ? "True" : "False"}</span></div>}
      {data.explanation && <p className="text-xs text-[rgba(255,255,255,0.5)] px-1">Explanation: {data.explanation}</p>}
    </div>
  );
}

// ─── Sentence Order ───────────────────────────────────────────────────────────

function SentenceOrderInput({ data, value, onChange }: { data: SentenceOrderData; value: unknown; onChange: (v: unknown) => void }) {
  const chosen = Array.isArray(value) ? (value as string[]) : [];
  const [shuffled] = useState(() => {
    const arr = [...data.words];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const remaining = shuffled.filter((w) => !chosen.includes(w));

  function pick(w: string) { onChange([...chosen, w]); }
  function remove(i: number) { onChange(chosen.filter((_, idx) => idx !== i)); }

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-14 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.2)] p-4 flex flex-wrap gap-2 items-start">
        {chosen.length === 0 && <span className="text-sm text-[rgba(255,255,255,0.3)]">Tap words below to build the sentence…</span>}
        {chosen.map((w, i) => (
          <button key={i} type="button" onClick={() => remove(i)}
            className="rounded-full border border-[#0F9C00] bg-[rgba(15,156,0,0.15)] px-3 py-1.5 text-sm font-semibold text-[#0F9C00] transition-all hover:bg-red-500/20 hover:text-red-400 hover:border-red-400">
            {w}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map((w, i) => (
          <button key={i} type="button" onClick={() => pick(w)}
            className="rounded-full border border-[rgba(255,255,255,0.25)] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:border-[#0F9C00] hover:text-[#0F9C00]">
            {w}
          </button>
        ))}
      </div>
      <p className="text-xs text-[rgba(255,255,255,0.4)]">Tap words to add them to the sentence. Tap a placed word to remove it.</p>
    </div>
  );
}

function ReviewSentenceOrder({ data, answer }: { data: SentenceOrderData; answer: unknown }) {
  const chosen = Array.isArray(answer) ? (answer as string[]) : [];
  const isCorrect = data.words.every((w, i) => chosen[i] === w);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className={`rounded-xl px-4 py-3 ${isCorrect ? "bg-[rgba(15,156,0,0.12)]" : "bg-red-500/10"}`}>
        <p className="text-xs uppercase tracking-widest mb-1 text-[rgba(255,255,255,0.5)]">Your order</p>
        <p className={isCorrect ? "text-[#0F9C00]" : "text-red-400"}>{chosen.join(" ") || "—"}</p>
      </div>
      {!isCorrect && <div className="rounded-xl bg-[rgba(15,156,0,0.12)] px-4 py-3"><p className="text-xs uppercase tracking-widest mb-1 text-[rgba(255,255,255,0.5)]">Correct order</p><p className="text-[#0F9C00]">{data.words.join(" ")}</p></div>}
    </div>
  );
}

// ─── Word Scramble ────────────────────────────────────────────────────────────

function WordScrambleInput({ data, value, onChange }: { data: WordScrambleData; value: unknown; onChange: (v: unknown) => void }) {
  const text = typeof value === "string" ? value : "";
  const [scrambled] = useState(() => data.word.split("").sort(() => Math.random() - 0.5).join(""));
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)] px-8 py-6 text-3xl font-extrabold tracking-[0.3em] text-white text-center">
        {scrambled}
      </div>
      {data.hint && <p className="text-xs text-[rgba(255,255,255,0.45)]">Hint: {data.hint}</p>}
      <input value={text} onChange={(e) => onChange(e.target.value || null)} placeholder="Type the correct word…"
        className="w-full rounded-2xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.4)] px-5 py-4 text-center text-lg text-white placeholder:text-[rgba(255,255,255,0.3)] outline-none focus:border-[rgba(255,255,255,0.5)]"
        autoFocus />
    </div>
  );
}

function ReviewWordScramble({ data, answer }: { data: WordScrambleData; answer: unknown }) {
  const student = typeof answer === "string" ? answer.trim() : "";
  const isCorrect = student.toLowerCase() === data.word.trim().toLowerCase();
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${isCorrect ? "bg-[rgba(15,156,0,0.12)]" : "bg-red-500/10"}`}>
        <span className="font-bold">{isCorrect ? "✓" : "✗"}</span>
        <span className={isCorrect ? "text-[#0F9C00]" : "text-red-400"}>Your answer: {student || "—"}</span>
      </div>
      {!isCorrect && <div className="flex items-center gap-2 rounded-xl bg-[rgba(15,156,0,0.12)] px-4 py-2"><span className="font-bold text-[#0F9C00]">✓</span><span className="text-[#0F9C00]">Correct: {data.word}</span></div>}
    </div>
  );
}

// ─── Flashcard ────────────────────────────────────────────────────────────────

function FlashcardInput({ data, value, onChange }: { data: FlashcardData; value: unknown; onChange: (v: unknown) => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="flex flex-col gap-6 items-center">
      <button type="button" onClick={() => setFlipped((f) => !f)}
        className="w-full rounded-3xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)] px-6 py-12 text-center transition-all hover:bg-[rgba(255,255,255,0.08)] active:scale-98">
        {!flipped ? (
          <div>
            {data.frontLabel && <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.45)] mb-3">{data.frontLabel}</p>}
            <p className="text-3xl font-extrabold text-white">{data.front}</p>
            <p className="mt-4 text-xs text-[rgba(255,255,255,0.35)]">Tap to reveal answer</p>
          </div>
        ) : (
          <div>
            {data.backLabel && <p className="text-xs font-bold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.45)] mb-3">{data.backLabel}</p>}
            <p className="text-3xl font-extrabold text-[#0F9C00]">{data.back}</p>
            <p className="mt-4 text-xs text-[rgba(255,255,255,0.35)]">Tap to flip back</p>
          </div>
        )}
      </button>
      {flipped && value === null && (
        <div className="flex gap-4 w-full">
          <button type="button" onClick={() => onChange(false)} className="flex-1 rounded-2xl border border-red-500/40 bg-red-500/10 py-4 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20">
            ✗ Didn't know it
          </button>
          <button type="button" onClick={() => onChange(true)} className="flex-1 rounded-2xl border border-[#0F9C00]/40 bg-[rgba(15,156,0,0.1)] py-4 text-sm font-bold text-[#0F9C00] transition-colors hover:bg-[rgba(15,156,0,0.2)]">
            ✓ Got it!
          </button>
        </div>
      )}
      {value !== null && (
        <p className={`text-sm font-bold ${value === true ? "text-[#0F9C00]" : "text-red-400"}`}>
          {value === true ? "✓ Marked as known" : "✗ Marked for review"}
          <button type="button" onClick={() => onChange(null)} className="ml-3 text-xs text-[rgba(255,255,255,0.4)] hover:text-white">undo</button>
        </p>
      )}
    </div>
  );
}

function ReviewFlashcard({ data, answer }: { data: FlashcardData; answer: unknown }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
        <span className="text-[rgba(255,255,255,0.6)]">{data.front} → {data.back}</span>
        <span className={answer === true ? "font-bold text-[#0F9C00]" : "font-bold text-red-400"}>
          {answer === true ? "✓ Knew it" : "✗ Didn't know"}
        </span>
      </div>
    </div>
  );
}
