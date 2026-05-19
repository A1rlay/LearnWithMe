"use client";

import Link from "next/link";
import { useState } from "react";

import type { QMTopicDetail } from "@/server/data/question-maker";

type Team = { name: string; score: number };
type Phase = "setup" | "board" | "question";

const POINT_VALUES = [100, 200, 300, 400, 500];
const COLS = 5;
const ROWS = 5;
const TOTAL = COLS * ROWS;

function buildBoard(questionCount: number): number[] {
  // Each cell maps to a question index (wrap if fewer questions than cells)
  const order: number[] = [];
  for (let i = 0; i < TOTAL; i++) order.push(i % questionCount);
  // Shuffle
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function GameClient({ topic }: { topic: QMTopicDetail }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [teamNames, setTeamNames] = useState(["Team A", "Team B"]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);
  const [board] = useState(() => buildBoard(topic.questions.length));
  const [used, setUsed] = useState<boolean[]>(Array(TOTAL).fill(false));
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [awardingTeam, setAwardingTeam] = useState<number | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);

  function startGame() {
    const t = teamNames.slice(0, teamCount).map((name) => ({ name, score: 0 }));
    setTeams(t);
    setPhase("board");
  }

  function openCell(cellIdx: number) {
    if (used[cellIdx]) return;
    setActiveCell(cellIdx);
    setAwardingTeam(null);
    setPointsAwarded(null);
    setPhase("question");
  }

  function awardPoints(teamIdx: number, pts: number) {
    setTeams((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, score: t.score + pts } : t)),
    );
    setPointsAwarded(pts);
    setAwardingTeam(teamIdx);
  }

  function closeQuestion() {
    if (activeCell !== null) {
      setUsed((prev) => {
        const next = [...prev];
        next[activeCell] = true;
        return next;
      });
    }
    setActiveCell(null);
    setPhase("board");
  }

  const currentQuestion =
    activeCell !== null ? topic.questions[board[activeCell]] : null;
  const rowOfCell = activeCell !== null ? Math.floor(activeCell / COLS) : 0;
  const cellPoints = POINT_VALUES[rowOfCell] ?? 100;

  // Setup screen
  if (phase === "setup") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div>
            <Link
              href={`/question-maker/${topic.id}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-[rgba(255,255,255,0.55)] hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              Back
            </Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
              Game Mode
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-white">{topic.title}</h1>
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.5)]">
              {topic.questions.length} question{topic.questions.length !== 1 ? "s" : ""} · 5×5 board
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Number of teams</span>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTeamCount(n)}
                    className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${teamCount === n ? "bg-[#0F9C00] text-white" : "border border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.6)] hover:border-white"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {Array.from({ length: teamCount }, (_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Team {i + 1} name
                  </label>
                  <input
                    value={teamNames[i] ?? `Team ${String.fromCharCode(65 + i)}`}
                    onChange={(e) =>
                      setTeamNames((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-2.5 text-sm text-white outline-none focus:border-white"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={startGame}
              className="rounded-full bg-[#0F9C00] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Start game
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Board screen
  if (phase === "board") {
    const remaining = used.filter((u) => !u).length;
    return (
      <main className="flex min-h-screen flex-col gap-6 px-4 py-8">
        {/* Team scores */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {teams.map((t, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-8 py-4 text-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">{t.name}</p>
              <p className="font-serif text-4xl text-[var(--foreground)]">{t.score}</p>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-6 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Left</p>
            <p className="font-serif text-4xl text-[var(--foreground)]">{remaining}</p>
          </div>
        </div>

        {/* Point value legend */}
        <div className="flex justify-center gap-2 text-xs text-[rgba(255,255,255,0.4)]">
          {POINT_VALUES.map((v, i) => (
            <span key={i}>Row {i + 1} = {v} pts</span>
          ))}
        </div>

        {/* Board grid */}
        <div
          className="mx-auto w-full max-w-2xl grid gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: TOTAL }, (_, cellIdx) => {
            const row = Math.floor(cellIdx / COLS);
            const pts = POINT_VALUES[row];
            const isUsed = used[cellIdx];
            return (
              <button
                key={cellIdx}
                type="button"
                onClick={() => openCell(cellIdx)}
                disabled={isUsed}
                className={`aspect-square rounded-2xl text-lg font-extrabold transition-all ${
                  isUsed
                    ? "bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.15)] cursor-not-allowed"
                    : "bg-[rgba(0,13,113,0.6)] border border-[rgba(255,255,255,0.15)] text-[#0F9C00] hover:bg-[rgba(0,13,113,0.8)] hover:border-[#0F9C00] active:scale-95 cursor-pointer"
                }`}
              >
                {isUsed ? "✓" : pts}
              </button>
            );
          })}
        </div>

        {remaining === 0 && (
          <div className="text-center">
            <p className="text-2xl font-extrabold text-white mb-2">Game over!</p>
            <p className="text-[rgba(255,255,255,0.6)] text-sm mb-4">
              Winner: {[...teams].sort((a, b) => b.score - a.score)[0].name} with {Math.max(...teams.map((t) => t.score))} pts
            </p>
            <button onClick={() => { setUsed(Array(TOTAL).fill(false)); setTeams(teams.map((t) => ({ ...t, score: 0 }))); }}
              className="rounded-full border border-[rgba(255,255,255,0.25)] px-6 py-3 text-sm font-bold text-white hover:bg-[rgba(255,255,255,0.1)]">
              Play again
            </button>
          </div>
        )}
      </main>
    );
  }

  // Question screen
  if (phase === "question" && currentQuestion) {
    const data = currentQuestion.data as Record<string, unknown>;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
        {/* Points badge */}
        <div className="rounded-full border border-[#0F9C00] px-6 py-2 text-sm font-bold text-[#0F9C00]">
          {cellPoints} points
        </div>

        {/* Question */}
        <div className="w-full max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)] mb-3">
            {currentQuestion.type.replace(/_/g, " ")}
          </p>
          <h2 className="text-3xl font-extrabold text-white leading-snug">
            {currentQuestion.prompt}
          </h2>

          {/* Show answer hints for game mode */}
          {"options" in data && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(data.options as string[]).map((opt, i) => (
                <div key={i} className="rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-left text-sm text-white">
                  <span className="font-bold text-[rgba(255,255,255,0.4)] mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </div>
              ))}
            </div>
          )}
          {"sentence" in data && (
            <p className="mt-4 text-xl text-[rgba(255,255,255,0.7)]">{data.sentence as string}</p>
          )}
          {"statement" in data && (
            <p className="mt-4 text-xl text-[rgba(255,255,255,0.7)]">{data.statement as string}</p>
          )}
          {"word" in data && (
            <p className="mt-4 text-3xl font-extrabold tracking-[0.3em] text-[rgba(255,255,255,0.5)]">
              {(data.word as string).split("").sort(() => Math.random() - 0.5).join("")}
            </p>
          )}
          {"front" in data && (
            <p className="mt-4 text-2xl font-bold text-[rgba(255,255,255,0.7)]">{data.front as string}</p>
          )}
        </div>

        {/* Award points to team (shown if not yet awarded) */}
        {awardingTeam === null ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <p className="text-sm font-semibold text-[rgba(255,255,255,0.6)]">
              Award {cellPoints} points to:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {teams.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => awardPoints(i, cellPoints)}
                  className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t.name}
                </button>
              ))}
              <button
                type="button"
                onClick={closeQuestion}
                className="rounded-full border border-[rgba(255,255,255,0.2)] px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.6)] hover:border-white hover:text-white"
              >
                No one (skip)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-[#0F9C00]">
              +{pointsAwarded} pts → {teams[awardingTeam].name}
            </p>
            <button
              type="button"
              onClick={closeQuestion}
              className="rounded-full bg-[#0F9C00] px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Back to board
            </button>
          </div>
        )}
      </main>
    );
  }

  return null;
}
