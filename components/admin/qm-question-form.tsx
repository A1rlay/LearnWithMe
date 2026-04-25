"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";

import type {
  ClassifierData,
  MatcherData,
  MultipleOptionData,
  QMQuestionData,
  QMQuestionType,
} from "@/server/data/question-maker";

const inputClass =
  "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

const labelClass = "text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]";

type Props = {
  action: (formData: FormData) => Promise<void>;
  defaults?: {
    type: QMQuestionType;
    prompt: string;
    data: QMQuestionData;
  };
  submitLabel: string;
};

export function QMQuestionForm({ action, defaults, submitLabel }: Props) {
  const [type, setType] = useState<QMQuestionType>(defaults?.type ?? "MULTIPLE_OPTION");

  const moData = defaults?.type === "MULTIPLE_OPTION" ? (defaults.data as MultipleOptionData) : null;
  const oaData = defaults?.type === "OPEN_ANSWER" ? (defaults.data as { referenceAnswer: string }) : null;
  const matcherData = defaults?.type === "MATCHER" ? (defaults.data as MatcherData) : null;
  const classifierData = defaults?.type === "CLASSIFIER" ? (defaults.data as ClassifierData) : null;

  return (
    <form action={action} className="flex flex-col gap-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8">
      <input type="hidden" name="type" value={type} />

      {/* Type selector */}
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Question type <span className="text-[var(--accent)]">*</span></span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["MULTIPLE_OPTION", "OPEN_ANSWER", "MATCHER", "CLASSIFIER"] as QMQuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                type === t
                  ? "border-[#0F9C00] bg-[#0F9C00] text-white"
                  : "border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white hover:text-white"
              }`}
            >
              {t === "MULTIPLE_OPTION" ? "Multiple option" : t === "OPEN_ANSWER" ? "Open answer" : t === "MATCHER" ? "Matcher" : "Classifier"}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="prompt" className={labelClass}>Prompt <span className="text-[var(--accent)]">*</span></label>
        <input id="prompt" name="prompt" defaultValue={defaults?.prompt} required className={inputClass} />
      </div>

      {/* Type-specific fields — each component manages its own state */}
      {type === "MULTIPLE_OPTION" && <MultipleOptionFields defaults={moData ?? undefined} />}
      {type === "OPEN_ANSWER" && <OpenAnswerFields defaults={oaData ?? undefined} />}
      {type === "MATCHER" && <MatcherFields defaults={matcherData ?? undefined} />}
      {type === "CLASSIFIER" && <ClassifierFields defaults={classifierData ?? undefined} />}

      <div className="pt-2">
        <button type="submit" className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Multiple Option ──────────────────────────────────────────────────────────

function MultipleOptionFields({ defaults }: { defaults?: MultipleOptionData }) {
  const [optionCount, setOptionCount] = useState(defaults?.options.length ?? 4);
  const [correctIndex, setCorrectIndex] = useState(defaults?.correctIndex ?? 0);

  return (
    <fieldset className="flex flex-col gap-4 rounded-[20px] border border-[var(--border)] p-5">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]">Options</legend>
      <input type="hidden" name="optionCount" value={optionCount} />
      <input type="hidden" name="correctIndex" value={correctIndex} />

      <div className="flex items-center gap-3">
        <span className="text-xs text-[rgba(255,255,255,0.55)]">Number of options:</span>
        {[2, 3, 4, 5, 6].map((n) => (
          <button key={n} type="button" onClick={() => setOptionCount(n)}
            className={`h-8 w-8 rounded-full text-xs font-bold transition-colors ${optionCount === n ? "bg-[#0F9C00] text-white" : "border border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white"}`}>
            {n}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: optionCount }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <button type="button" onClick={() => setCorrectIndex(i)}
              className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${correctIndex === i ? "border-[#0F9C00] bg-[#0F9C00]" : "border-[rgba(255,255,255,0.3)]"}`}
              title="Mark as correct" />
            <input name={`option_${i}`} defaultValue={defaults?.options[i] ?? ""} placeholder={`Option ${i + 1}`} required
              className="flex-1 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white" />
          </div>
        ))}
        <p className="text-xs text-[rgba(255,255,255,0.4)]">Click the circle to mark the correct answer.</p>
      </div>
    </fieldset>
  );
}

// ─── Open Answer ──────────────────────────────────────────────────────────────

function OpenAnswerFields({ defaults }: { defaults?: { referenceAnswer: string } }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="referenceAnswer" className={labelClass}>Reference answer</label>
      <textarea id="referenceAnswer" name="referenceAnswer" defaultValue={defaults?.referenceAnswer ?? ""} rows={3}
        className={inputClass} placeholder="The expected correct answer (used during review)" />
      <p className="text-xs text-[rgba(255,255,255,0.4)]">Students' open answers will be marked pending until you review them.</p>
    </div>
  );
}

// ─── Matcher (with line-drawing to connect pairs) ─────────────────────────────

type LineCoords = { x1: number; y1: number; x2: number; y2: number; leftIdx: number };

function MatcherFields({ defaults }: { defaults?: MatcherData }) {
  const initCount = defaults?.pairs.length ?? 4;

  const [lefts, setLefts] = useState<string[]>(() =>
    defaults?.pairs.map((p) => p.left) ?? Array(initCount).fill(""),
  );
  const [rights, setRights] = useState<string[]>(() =>
    defaults?.pairs.map((p) => p.right) ?? Array(initCount).fill(""),
  );
  // connections[leftIdx] = rightIdx  (which right item each left is paired with)
  const [connections, setConnections] = useState<(number | null)[]>(() =>
    Array.from({ length: initCount }, (_, i) => i),
  );
  const [activeLeft, setActiveLeft] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftDotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightDotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<LineCoords[]>([]);

  // Recalculate SVG lines whenever connections change
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const newLines: LineCoords[] = [];
    for (let li = 0; li < lefts.length; li++) {
      const ri = connections[li];
      if (ri === null || ri === undefined) continue;
      const leftEl = leftDotRefs.current[li];
      const rightEl = rightDotRefs.current[ri];
      if (!leftEl || !rightEl) continue;
      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();
      newLines.push({
        x1: lr.left + lr.width / 2 - cr.left,
        y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left + rr.width / 2 - cr.left,
        y2: rr.top + rr.height / 2 - cr.top,
        leftIdx: li,
      });
    }
    setLines(newLines);
  }, [connections, lefts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeCount(n: number) {
    const cur = lefts.length;
    if (n > cur) {
      const diff = n - cur;
      setLefts((p) => [...p, ...Array(diff).fill("")]);
      setRights((p) => [...p, ...Array(diff).fill("")]);
      setConnections((p) => [...p, ...Array(diff).fill(null)]);
    } else if (n < cur) {
      setLefts((p) => p.slice(0, n));
      setRights((p) => p.slice(0, n));
      setConnections((p) =>
        p.slice(0, n).map((c) => (c !== null && c < n ? c : null)),
      );
    }
    setActiveLeft(null);
  }

  function clickLeft(li: number) {
    if (activeLeft === li) {
      setActiveLeft(null);
    } else if (connections[li] !== null) {
      // Remove existing match and activate
      setConnections((p) => { const next = [...p]; next[li] = null; return next; });
      setActiveLeft(li);
    } else {
      setActiveLeft(li);
    }
  }

  function clickRight(ri: number) {
    if (activeLeft === null) return;
    setConnections((prev) => {
      const next = [...prev];
      // Free any left already using this right
      for (let i = 0; i < next.length; i++) {
        if (next[i] === ri) next[i] = null;
      }
      next[activeLeft] = next[activeLeft] === ri ? null : ri;
      return next;
    });
    setActiveLeft(null);
  }

  const allConnected = connections.every((c) => c !== null);
  const count = lefts.length;

  return (
    <fieldset className="flex flex-col gap-4 rounded-[20px] border border-[var(--border)] p-5">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]">Pairs</legend>

      {/* Serialized hidden inputs — left_i / right_i where left[i] matches right[connections[i]] */}
      <input type="hidden" name="pairCount" value={count} />
      {Array.from({ length: count }, (_, i) => (
        <Fragment key={i}>
          <input type="hidden" name={`left_${i}`} value={lefts[i]} />
          <input
            type="hidden"
            name={`right_${i}`}
            value={connections[i] !== null && connections[i]! < rights.length ? rights[connections[i]!] : ""}
          />
        </Fragment>
      ))}

      {/* Count selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[rgba(255,255,255,0.55)]">Number of pairs:</span>
        {[2, 3, 4, 5, 6, 8].map((n) => (
          <button key={n} type="button" onClick={() => changeCount(n)}
            className={`h-8 w-8 rounded-full text-xs font-bold transition-colors ${count === n ? "bg-[#0F9C00] text-white" : "border border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white"}`}>
            {n}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 22px 48px 22px 1fr", gap: "8px" }}>
        <span className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Left</span>
        <span />
        <span />
        <span />
        <span className="text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Right</span>
      </div>

      {/* Pair rows */}
      <div ref={containerRef} className="relative">
        <div
          className="grid items-center gap-y-2"
          style={{ gridTemplateColumns: "1fr 22px 48px 22px 1fr", gap: "8px" }}
        >
          {Array.from({ length: count }, (_, i) => {
            const isLeftActive = activeLeft === i;
            const isLeftConnected = connections[i] !== null;
            const isRightConnected = connections.includes(i);

            return (
              <Fragment key={i}>
                {/* Left text input */}
                <input
                  value={lefts[i]}
                  onChange={(e) => setLefts((p) => { const n = [...p]; n[i] = e.target.value; return n; })}
                  placeholder={`Left ${i + 1}`}
                  className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white"
                />

                {/* Left dot */}
                <button
                  type="button"
                  ref={(el) => { leftDotRefs.current[i] = el; }}
                  onClick={() => clickLeft(i)}
                  title={isLeftActive ? "Cancel" : isLeftConnected ? "Click to re-connect" : "Click to connect"}
                  className={`mx-auto h-5 w-5 rounded-full border-2 transition-all ${
                    isLeftActive
                      ? "scale-125 border-white bg-white"
                      : isLeftConnected
                      ? "border-[#0F9C00] bg-[#0F9C00]"
                      : "border-[rgba(255,255,255,0.35)] hover:border-white"
                  }`}
                />

                {/* Centre spacer — lines cross here */}
                <span />

                {/* Right dot */}
                <button
                  type="button"
                  ref={(el) => { rightDotRefs.current[i] = el; }}
                  onClick={() => clickRight(i)}
                  title={activeLeft !== null ? "Connect to selected left item" : ""}
                  className={`mx-auto h-5 w-5 rounded-full border-2 transition-all ${
                    isRightConnected
                      ? "border-[#0F9C00] bg-[#0F9C00]"
                      : activeLeft !== null
                      ? "border-[rgba(255,255,255,0.5)] hover:border-[#0F9C00] hover:scale-110"
                      : "border-[rgba(255,255,255,0.35)]"
                  }`}
                />

                {/* Right text input */}
                <input
                  value={rights[i]}
                  onChange={(e) => setRights((p) => { const n = [...p]; n[i] = e.target.value; return n; })}
                  placeholder={`Right ${i + 1}`}
                  className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white"
                />
              </Fragment>
            );
          })}
        </div>

        {/* SVG lines overlay */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ overflow: "visible" }}
        >
          {lines.map((line) => (
            <g key={line.leftIdx}>
              <line
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="#0F9C00"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx={(line.x1 + line.x2) / 2}
                cy={(line.y1 + line.y2) / 2}
                r="3"
                fill="#0F9C00"
              />
            </g>
          ))}
        </svg>
      </div>

      <p className="text-xs text-[rgba(255,255,255,0.4)]">
        {activeLeft !== null
          ? `→ Now click the right ● dot that matches "${lefts[activeLeft] || `Left ${activeLeft + 1}`}"`
          : allConnected
          ? "All pairs connected. Click any dot to re-connect."
          : "Click a left ● dot to select it, then click the matching right ● dot to connect the pair."}
      </p>
    </fieldset>
  );
}

// ─── Classifier ───────────────────────────────────────────────────────────────

function ClassifierFields({ defaults }: { defaults?: ClassifierData }) {
  const [catCount, setCatCount] = useState(defaults?.categories.length ?? 2);
  const [itemCount, setItemCount] = useState(defaults?.items.length ?? 4);

  return (
    <div className="flex flex-col gap-5">
      <input type="hidden" name="categoryCount" value={catCount} />
      <input type="hidden" name="itemCount" value={itemCount} />

      {/* Categories */}
      <fieldset className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] p-5">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]">Categories</legend>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[rgba(255,255,255,0.55)]">Number:</span>
          {[2, 3, 4].map((n) => (
            <button key={n} type="button" onClick={() => setCatCount(n)}
              className={`h-8 w-8 rounded-full text-xs font-bold transition-colors ${catCount === n ? "bg-[#0F9C00] text-white" : "border border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white"}`}>
              {n}
            </button>
          ))}
        </div>
        {Array.from({ length: catCount }, (_, i) => (
          <input key={i} name={`category_${i}`} defaultValue={defaults?.categories[i] ?? ""} placeholder={`Category ${i + 1}`} required
            className={inputClass} />
        ))}
      </fieldset>

      {/* Items */}
      <fieldset className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] p-5">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]">Items</legend>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[rgba(255,255,255,0.55)]">Number of items (max 30):</span>
          <input
            type="number"
            min={2}
            max={30}
            value={itemCount}
            onChange={(e) => {
              const n = Math.min(30, Math.max(2, parseInt(e.target.value) || 2));
              setItemCount(n);
            }}
            className="w-20 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-3 py-2 text-center text-sm text-white outline-none focus:border-white"
          />
        </div>
        <div className="grid gap-2">
          {Array.from({ length: itemCount }, (_, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
              <input name={`item_${i}`} defaultValue={defaults?.items[i]?.text ?? ""} placeholder={`Item ${i + 1}`} required
                className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white" />
              <select name={`item_cat_${i}`} defaultValue={defaults?.items[i]?.categoryIndex ?? 0}
                className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.8)] px-3 py-2.5 text-sm text-white outline-none focus:border-white">
                {Array.from({ length: catCount }, (_, c) => (
                  <option key={c} value={c}>Category {c + 1}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="text-xs text-[rgba(255,255,255,0.4)]">Assign each item to its correct category.</p>
      </fieldset>
    </div>
  );
}
