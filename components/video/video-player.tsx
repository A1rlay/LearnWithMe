"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/app/providers";
import type { QuizQuestion, SingleAnswerResult, VideoLesson } from "@/server/data/learning";

// ─── YouTube IFrame API types ─────────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  unloadModule(moduleName: string): void;
  destroy(): void;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
  );
  return match?.[1] ?? null;
}

// ─── State types ──────────────────────────────────────────────────────────────

type PlayerPhase = "idle" | "playing" | "paused" | "checkpoint" | "done";
type QuizPhase = "answering" | "submitting" | "result";

type SessionResult = {
  correct: boolean;
  correctOptionId: string | null;
  question: QuizQuestion;
  selectedOptionId: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoPlayer({ video, onComplete }: { video: VideoLesson; onComplete?: () => Promise<void> }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextCheckpointIdxRef = useRef(0);
  const activeCheckpointIdxRef = useRef<number | null>(null);
  const playerPhaseRef = useRef<PlayerPhase>("idle");

  const [playerPhase, setPlayerPhase] = useState<PlayerPhase>("idle");
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("answering");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<SingleAnswerResult | null>(null);
  const [sessionResults, setSessionResults] = useState<Map<string, SessionResult>>(new Map());

  // Volume / fullscreen state
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // coverActive: true = dark overlay visible (hides YouTube UI); false = transparent (video shows through)
  // Starts true so YouTube's initial load state is never visible.
  // Set immediately on click so there's no flash waiting for YouTube's async state event.
  const [coverActive, setCoverActive] = useState(true);

  const sortedQuestions = useMemo(
    () => [...video.questions].sort((a, b) => a.checkpointSeconds - b.checkpointSeconds),
    [video.questions],
  );

  const videoId = extractYouTubeId(video.videoUrl);

  const trpc = useTRPC();
  const submitMutation = useMutation({
    ...trpc.video.submitAnswer.mutationOptions(),
  });

  function setPhase(phase: PlayerPhase) {
    playerPhaseRef.current = phase;
    setPlayerPhase(phase);
  }

  function startPolling() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const time = player.getCurrentTime();
      const dur = player.getDuration();
      setCurrentTime(time);
      if (dur > 0) setDuration(dur);

      const idx = nextCheckpointIdxRef.current;
      if (idx < sortedQuestions.length) {
        const checkpoint = sortedQuestions[idx];
        if (time >= checkpoint.checkpointSeconds) {
          nextCheckpointIdxRef.current = idx + 1;
          activeCheckpointIdxRef.current = idx;
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          player.pauseVideo();
          setPhase("checkpoint");
          setActiveQuestion(checkpoint);
          setSelectedOptionId(null);
          setResult(null);
          setQuizPhase("answering");
        }
      }
    }, 200);
  }

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Track fullscreen changes
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    function createPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId!,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, cc_load_policy: 0 },
        events: {
          onReady: (e) => {
            setVolume(e.target.getVolume());
            setMuted(e.target.isMuted());
            e.target.unloadModule("captions");
          },
          onStateChange: (e) => {
            const YTState = window.YT.PlayerState;
            if (e.data === YTState.PLAYING) {
              playerRef.current?.unloadModule("captions");
              setCoverActive(false);
              setPhase("playing");
              startPolling();
            } else if (e.data === YTState.PAUSED) {
              setCoverActive(true);
              stopPolling();
              if (playerPhaseRef.current !== "checkpoint") setPhase("paused");
            } else if (e.data === YTState.ENDED) {
              setCoverActive(true);
              stopPolling();
              setPhase("done");
              onComplete?.();
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      stopPolling();
      playerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  function handleRelisten() {
    const idx = activeCheckpointIdxRef.current;
    const prevSeconds =
      idx !== null && idx > 0 ? sortedQuestions[idx - 1].checkpointSeconds : 0;
    nextCheckpointIdxRef.current = idx ?? 0;
    playerRef.current?.seekTo(prevSeconds, true);
    playerRef.current?.playVideo();
    setPhase("playing");
  }

  function handleSubmit() {
    if (!activeQuestion || !selectedOptionId) return;
    setQuizPhase("submitting");
    submitMutation.mutate(
      { optionId: selectedOptionId, questionId: activeQuestion.id },
      {
        onSuccess: (data) => {
          setResult(data);
          setQuizPhase("result");
          setSessionResults((prev) => {
            const next = new Map(prev);
            next.set(activeQuestion.id, {
              correct: data.correct,
              correctOptionId: data.correctOptionId,
              question: activeQuestion,
              selectedOptionId: selectedOptionId,
            });
            return next;
          });
        },
        onError: () => setQuizPhase("answering"),
      },
    );
  }

  function handleContinue() {
    if (nextCheckpointIdxRef.current >= sortedQuestions.length) {
      playerRef.current?.pauseVideo();
      setPhase("done");
    } else {
      playerRef.current?.playVideo();
      setPhase("playing");
    }
  }

  function handleVolumeChange(value: number) {
    setVolume(value);
    playerRef.current?.setVolume(value);
    if (value > 0 && muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
  }

  function handleToggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  const progressPct =
    duration && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : null;

  const completedCount = sessionResults.size;
  const totalQuestions = sortedQuestions.length;

  const summaryResults = useMemo(
    () =>
      [...sessionResults.values()].sort((a, b) => a.question.order - b.question.order),
    [sessionResults],
  );
  const correctCount = summaryResults.filter((r) => r.correct).length;
  const wrongCount = summaryResults.filter((r) => !r.correct).length;

  if (!videoId) {
    return (
      <div className="mt-8 rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.76)] p-6 text-sm text-[var(--muted)]">
        Invalid video URL — please update the URL in the admin panel.
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3">
      {/* YouTube iframe + overlay */}
      <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-black">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          {/* iframe */}
          <div ref={containerRef} className="absolute inset-0 h-full w-full" />

          {/* Overlay — dark when cover is active (hides all YouTube UI), transparent when playing */}
          <div
            className={`absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-colors duration-100 ${
              coverActive ? "bg-black/80" : "bg-transparent"
            }`}
            onClick={() => {
              if (playerPhase === "playing") {
                setCoverActive(true);   // instant cover before YouTube shows pause UI
                playerRef.current?.pauseVideo();
              } else if (playerPhase === "paused" || playerPhase === "idle") {
                playerRef.current?.playVideo();
                // coverActive set to false in onStateChange(PLAYING)
              }
            }}
          >
            {coverActive && playerPhase !== "checkpoint" && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-105">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.1)] px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          {/* Progress bar + question counter */}
          <div className="min-w-0 flex-1">
            {progressPct !== null && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.15)]">
                <div
                  className="h-full rounded-full bg-[#0F9C00] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
            {totalQuestions > 0 && (
              <p className="mt-1.5 text-xs text-[rgba(255,255,255,0.55)]">
                {completedCount} / {totalQuestions} questions answered
              </p>
            )}
          </div>

          {/* Volume + fullscreen */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Mute toggle */}
            <button
              onClick={handleToggleMute}
              className="text-[rgba(255,255,255,0.7)] transition-colors hover:text-white"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : volume < 50 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 accent-[#0F9C00]"
              aria-label="Volume"
            />

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-[rgba(255,255,255,0.7)] transition-colors hover:text-white"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Checkpoint modal */}
      {playerPhase === "checkpoint" && activeQuestion !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            {quizPhase === "answering" && (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0F9C00]">
                  Question {activeQuestion.order}
                </p>
                <h2 className="mt-3 text-xl font-extrabold text-[#000D71]">
                  {activeQuestion.prompt}
                </h2>

                <div className="mt-5 space-y-2">
                  {activeQuestion.options.map((option) => {
                    const selected = selectedOptionId === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                          selected
                            ? "border-[#000D71] bg-[#000D71] text-white"
                            : "border-gray-200 text-gray-700 hover:border-[#000D71]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option.id}
                          checked={selected}
                          onChange={() => setSelectedOptionId(option.id)}
                          className="sr-only"
                        />
                        {option.text}
                      </label>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={selectedOptionId === null}
                    className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Submit
                  </button>
                  <button
                    onClick={handleRelisten}
                    className="rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-500 transition-colors hover:border-gray-400"
                  >
                    Re-watch
                  </button>
                </div>
              </>
            )}

            {quizPhase === "submitting" && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0F9C00]" />
                <p className="text-sm text-gray-500">Checking…</p>
              </div>
            )}

            {quizPhase === "result" && result !== null && (
              <>
                <p className={`text-xs font-bold uppercase tracking-[0.28em] ${result.correct ? "text-[#0F9C00]" : "text-red-500"}`}>
                  {result.correct ? "Correct!" : "Wrong"}
                </p>
                <h2 className="mt-3 text-xl font-extrabold text-[#000D71]">
                  {activeQuestion.prompt}
                </h2>

                <div className="mt-5 space-y-2">
                  {activeQuestion.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrect = result.correctOptionId === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
                          isCorrect
                            ? "border-[#0F9C00] bg-green-50 text-[#0F9C00]"
                            : isSelected
                              ? "border-red-400 bg-red-50 text-red-600 line-through"
                              : "border-gray-100 text-gray-400"
                        }`}
                      >
                        {option.text}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleContinue}
                    className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Continue
                  </button>
                  <button
                    onClick={handleRelisten}
                    className="rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-500 transition-colors hover:border-gray-400"
                  >
                    Re-watch
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* End-of-video summary modal */}
      {playerPhase === "done" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0F9C00]">
              Lesson complete
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-[#000D71]">
              {video.title}
            </h2>

            {summaryResults.length > 0 ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-green-50 p-4 text-center">
                    <p className="text-4xl font-extrabold text-[#0F9C00]">{correctCount}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#0F9C00]">
                      Correct
                    </p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-4 text-center">
                    <p className="text-4xl font-extrabold text-red-500">{wrongCount}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-red-500">
                      Wrong
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {summaryResults.map(({ correct, correctOptionId, question, selectedOptionId: chosen }) => (
                    <div
                      key={question.id}
                      className={`rounded-2xl p-4 ${correct ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <p className={`text-xs font-bold uppercase tracking-widest ${correct ? "text-[#0F9C00]" : "text-red-500"}`}>
                        Q{question.order}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#000D71]">
                        {question.prompt}
                      </p>
                      <div className="mt-3 space-y-1.5">
                        {question.options.map((option) => {
                          const isSelected = chosen === option.id;
                          const isCorrect = correctOptionId === option.id;
                          return (
                            <div
                              key={option.id}
                              className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
                                isCorrect
                                  ? "border-[#0F9C00] bg-white text-[#0F9C00]"
                                  : isSelected
                                    ? "border-red-400 bg-white text-red-500 line-through"
                                    : "border-transparent text-gray-400"
                              }`}
                            >
                              {option.text}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-400">No questions answered.</p>
            )}

            <Link
              href="/topics"
              className="mt-6 flex items-center justify-center rounded-full bg-[#000D71] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              ← Back to Topics
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
