"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Word = {
  id: string;
  word: string;
  explanation: string | null;
};

type Answer = {
  word: Word;
  transcript: string | null;
  isCorrect: boolean;
  ipa: string | null;
};

type RecordPhase = "idle" | "recording" | "evaluated";
type GamePhase = "loading" | "playing" | "done";

type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

async function fetchIPA(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      phonetic?: string;
      phonetics?: Array<{ text?: string }>;
    }>;
    const phonetics = data[0]?.phonetics ?? [];
    return (
      phonetics.find((p) => p.text)?.text ??
      data[0]?.phonetic ??
      null
    );
  } catch {
    return null;
  }
}

export function PronunciationClient({
  setTitle,
  words,
}: {
  setId: string;
  setTitle: string;
  words: Word[];
}) {
  const [index, setIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("loading");
  const [recordPhase, setRecordPhase] = useState<RecordPhase>("idle");
  const [ipa, setIpa] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [scoredThisWord, setScoredThisWord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const recognitionRef = useRef<SR | null>(null);

  const current = words[index];

  useEffect(() => {
    if (!current) return;
    setGamePhase("loading");
    setRecordPhase("idle");
    setTranscript(null);
    setIsCorrect(null);
    setScoredThisWord(false);
    setError(null);
    fetchIPA(current.word).then((result) => {
      setIpa(result);
      setGamePhase("playing");
    });
  }, [index, current?.id]);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  function startRecording() {
    type SRCtor = new () => SR;
    const SRCtor: SRCtor | undefined =
      (window as unknown as { SpeechRecognition?: SRCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition;

    if (!SRCtor) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SRCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase().trim();
      setTranscript(text);
      const correct = text === current.word.toLowerCase().trim();
      setIsCorrect(correct);
      if (correct && !scoredThisWord) {
        setScore((s) => s + 1);
        setScoredThisWord(true);
      }
      setRecordPhase("evaluated");
    };

    recognition.onerror = () => {
      setError("Could not capture audio. Please try again.");
      setRecordPhase("idle");
    };

    recognition.onend = () => {
      setRecordPhase((prev) => (prev === "recording" ? "idle" : prev));
    };

    recognition.start();
    setRecordPhase("recording");
    setError(null);
    setTranscript(null);
    setIsCorrect(null);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
  }

  function handleNext() {
    // Capture the final attempt for this word before advancing
    setAnswers((prev) => [
      ...prev,
      {
        ipa,
        isCorrect: isCorrect ?? false,
        transcript,
        word: current,
      },
    ]);

    if (index + 1 >= words.length) {
      setGamePhase("done");
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleTryAgain() {
    setRecordPhase("idle");
    setTranscript(null);
    setIsCorrect(null);
    setError(null);
  }

  function handlePlayAgain() {
    setIndex(0);
    setScore(0);
    setAnswers([]);
    setGamePhase("loading");
  }

  // ── Review screen ────────────────────────────────────────────────────────────
  if (gamePhase === "done") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        {/* Score */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
            SpellRight · Pronunciation
          </p>
          <h1 className="font-serif text-4xl text-[var(--foreground)]">Results</h1>
          <p className="mt-1 text-lg text-[var(--muted)]">
            {score} / {words.length} correct
          </p>
        </div>

        {/* Word review */}
        <div className="flex flex-col gap-3">
          {answers.map((a, i) => (
            <div
              key={i}
              className={`flex flex-col gap-2 rounded-[20px] border px-5 py-4 ${
                a.isCorrect
                  ? "border-[rgba(15,156,0,0.35)] bg-[rgba(15,156,0,0.06)]"
                  : "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[var(--foreground)]">{a.word.word}</p>
                  {a.ipa && (
                    <p className="mt-0.5 text-sm text-[var(--muted)]">{a.ipa}</p>
                  )}
                </div>
                <span className={`shrink-0 text-xl ${a.isCorrect ? "text-[#0F9C00]" : "text-red-400"}`}>
                  {a.isCorrect ? "✓" : "✗"}
                </span>
              </div>

              {a.transcript && (
                <p className="text-xs text-[var(--muted)]">
                  You said:{" "}
                  <span className={`font-semibold ${a.isCorrect ? "text-[#0F9C00]" : "text-red-400"}`}>
                    "{a.transcript}"
                  </span>
                </p>
              )}

              {!a.isCorrect && a.word.explanation && (
                <p className="text-xs text-[var(--muted)] leading-relaxed border-t border-[rgba(255,255,255,0.08)] pt-2">
                  {a.word.explanation}
                </p>
              )}
            </div>
          ))}
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

      {/* Word card */}
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-10 flex flex-col items-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Pronounce this word
        </p>

        {gamePhase === "loading" ? (
          <div className="h-20 flex items-center text-sm text-[var(--muted)]">Loading…</div>
        ) : (
          <>
            <p className="text-5xl font-extrabold text-white">{current.word}</p>
            {ipa ? (
              <p className="text-lg text-[var(--muted)]">{ipa}</p>
            ) : null}
          </>
        )}
      </div>

      {/* Microphone controls */}
      {gamePhase === "playing" && recordPhase !== "evaluated" && (
        <div className="flex flex-col items-center gap-3">
          {recordPhase === "idle" ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F9C00] bg-[rgba(15,156,0,0.12)] text-[#0F9C00] hover:bg-[rgba(15,156,0,0.22)] transition-colors"
              aria-label="Start recording"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="12" rx="3" fill="currentColor" stroke="none" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500 bg-[rgba(239,68,68,0.15)] text-red-400 animate-pulse"
              aria-label="Stop recording"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
          )}
          <p className="text-xs text-[var(--muted)]">
            {recordPhase === "recording" ? "Recording… tap to stop" : "Tap the mic to start"}
          </p>
          {error && <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>}
        </div>
      )}

      {/* Result panel */}
      {recordPhase === "evaluated" && (
        <div className="w-full max-w-md rounded-[20px] border border-[var(--border)] bg-[var(--panel)] p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${isCorrect ? "text-[#0F9C00]" : "text-red-400"}`}>
              {isCorrect ? "✓" : "✗"}
            </span>
            <div>
              <p className={`font-bold text-lg ${isCorrect ? "text-[#0F9C00]" : "text-red-400"}`}>
                {isCorrect ? "Correct!" : "Not quite"}
              </p>
              {transcript && (
                <p className="text-xs text-[var(--muted)]">
                  You said:{" "}
                  <span className="text-[var(--foreground)]">"{transcript}"</span>
                </p>
              )}
            </div>
          </div>

          {current.explanation && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] mb-1">Tip</p>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{current.explanation}</p>
            </div>
          )}

          <div className="flex gap-3 mt-1">
            {!isCorrect && (
              <button
                type="button"
                onClick={handleTryAgain}
                className="flex-1 rounded-full border border-[rgba(255,255,255,0.25)] py-3 text-sm font-semibold text-[rgba(255,255,255,0.7)] hover:border-white hover:text-white transition-colors"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-full bg-[#0F9C00] py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              {index + 1 < words.length ? "Next word" : "See results"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
