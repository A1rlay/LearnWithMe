"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Word = {
  id: string;
  word: string;
  correctAnswer: string | null;
  explanation: string | null;
};

type Answer = {
  word: Word;
  selected: string;
  audioUrl: string | null;
};

type Phase = "loading" | "ready" | "answered" | "done";

const CHOICES = [
  { value: "ed", label: "/ɪd/", sublabel: "ed" },
  { value: "t", label: "/t/", sublabel: "t" },
  { value: "d", label: "/d/", sublabel: "d" },
];

async function fetchAudioUrl(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      phonetics?: Array<{ audio?: string }>;
    }>;
    const phonetics = data[0]?.phonetics ?? [];
    return phonetics.find((p) => p.audio)?.audio ?? null;
  } catch {
    return null;
  }
}

function playUrl(url: string) {
  const audio = new Audio(url);
  audio.volume = 0.4;
  audio.play();
}

export function TerminationClient({
  setTitle,
  words,
}: {
  setId: string;
  setTitle: string;
  words: Word[];
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = words[index];

  useEffect(() => {
    if (!current) return;
    setPhase("loading");
    setSelected(null);
    setAudioUrl(null);
    fetchAudioUrl(current.word).then((url) => {
      setAudioUrl(url);
      setPhase("ready");
    });
  }, [index, current?.id]);

  function playAudio() {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }

  function handleAnswer(choice: string) {
    if (phase !== "ready") return;
    setSelected(choice);
    if (choice === current.correctAnswer) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { word: current, selected: choice, audioUrl }]);
    setPhase("answered");
  }

  function handleNext() {
    if (index + 1 >= words.length) {
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handlePlayAgain() {
    setIndex(0);
    setScore(0);
    setAnswers([]);
    setPhase("loading");
  }

  // ── Review screen ────────────────────────────────────────────────────────────
  if (phase === "done" || (phase !== "loading" && index >= words.length)) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        {/* Score */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
            SpellRight · Termination
          </p>
          <h1 className="font-serif text-4xl text-[var(--foreground)]">Results</h1>
          <p className="mt-1 text-lg text-[var(--muted)]">
            {score} / {words.length} correct
          </p>
        </div>

        {/* Word review */}
        <div className="flex flex-col gap-3">
          {answers.map((a, i) => {
            const correct = a.selected === a.word.correctAnswer;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 rounded-[20px] border px-5 py-4 ${correct
                    ? "border-[rgba(15,156,0,0.35)] bg-[rgba(15,156,0,0.06)]"
                    : "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)]"
                  }`}
              >
                {/* Play button */}
                <div className="shrink-0">
                  {a.audioUrl ? (
                    <button
                      type="button"
                      onClick={() => playUrl(a.audioUrl!)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white hover:text-white transition-colors"
                      aria-label={`Play ${a.word.word}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </button>
                  ) : (
                    <div className="h-10 w-10" />
                  )}
                </div>

                {/* Word */}
                <p className="flex-1 font-bold text-[var(--foreground)]">{a.word.word}</p>

                {/* Correct answer */}
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="text-xs text-[var(--muted)]">correct</span>
                  <span className="text-sm font-bold text-[#0F9C00]">
                    /{a.word.correctAnswer}/
                  </span>
                </div>

                {/* Student answer */}
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="text-xs text-[var(--muted)]">your answer</span>
                  <span className={`text-sm font-bold ${correct ? "text-[#0F9C00]" : "text-red-400"}`}>
                    /{a.selected}/
                  </span>
                </div>

                {/* Result icon */}
                <span className={`shrink-0 text-xl ${correct ? "text-[#0F9C00]" : "text-red-400"}`}>
                  {correct ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            Play again
          </button>
          <Link
            href="/spell-right"
            className="rounded-full border border-[rgba(255,255,255,0.25)] px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.6)] hover:border-white hover:text-white transition-colors"
          >
            All sets
          </Link>
        </div>
      </main>
    );
  }

  // ── Game screen ──────────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between text-xs text-[var(--muted)]">
        <Link
          href="/spell-right"
          className="flex items-center gap-1.5 font-semibold hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {setTitle}
        </Link>
        <span className="tabular-nums">{index + 1} / {words.length}</span>
      </div>

      {/* Audio card */}
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-10 flex flex-col items-center gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Listen, then choose the ending sound
        </p>

        {phase === "loading" ? (
          <div className="h-20 flex items-center text-sm text-[var(--muted)]">Loading audio…</div>
        ) : audioUrl ? (
          <>
            <audio ref={audioRef} src={audioUrl} />
            <button
              type="button"
              onClick={playAudio}
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F9C00] bg-[rgba(15,156,0,0.12)] text-[#0F9C00] hover:bg-[rgba(15,156,0,0.22)] transition-colors"
              aria-label="Play audio"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </button>
            <p className="text-xs text-[var(--muted)]">Tap to hear the word</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs text-[var(--muted)]">No audio found — word shown instead</p>
            <p className="text-2xl font-bold text-[var(--foreground)]">{current.word}</p>
          </div>
        )}
      </div>

      {/* Choices */}
      {phase !== "loading" && (
        <div className="w-full max-w-md grid grid-cols-3 gap-3">
          {CHOICES.map((c) => {
            const isSelected = selected === c.value;
            const isCorrect = phase === "answered" && c.value === current.correctAnswer;
            const isWrong = phase === "answered" && isSelected && !isCorrect;

            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleAnswer(c.value)}
                disabled={phase === "answered"}
                className={[
                  "flex flex-col items-center gap-1 rounded-[20px] border px-4 py-5 text-center transition-all",
                  phase === "answered"
                    ? isCorrect
                      ? "border-[#0F9C00] bg-[rgba(15,156,0,0.12)] text-[#0F9C00]"
                      : isWrong
                        ? "border-red-500 bg-[rgba(239,68,68,0.1)] text-red-400"
                        : "border-[var(--border)] text-[var(--muted)] opacity-40"
                    : "cursor-pointer border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:border-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.05)]",
                ].join(" ")}
              >
                <span className="text-2xl font-extrabold">{c.label}</span>
                <span className="text-xs font-semibold opacity-60">-{c.sublabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Result panel */}
      {phase === "answered" && (
        <div className="w-full max-w-md rounded-[20px] border border-[var(--border)] bg-[var(--panel)] p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {selected === current.correctAnswer ? (
              <span className="text-2xl text-[#0F9C00]">✓</span>
            ) : (
              <span className="text-2xl text-red-400">✗</span>
            )}
            <div>
              <p className={`font-bold ${selected === current.correctAnswer ? "text-[#0F9C00]" : "text-red-400"}`}>
                {selected === current.correctAnswer ? "Correct!" : "Not quite"}
              </p>
              <p className="text-sm text-[var(--foreground)] font-semibold">{current.word}</p>
            </div>
          </div>

          {current.explanation && (
            <p className="text-sm text-[var(--muted)] leading-relaxed">{current.explanation}</p>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-[#0F9C00] py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            {index + 1 < words.length ? "Next word" : "See results"}
          </button>
        </div>
      )}
    </main>
  );
}
