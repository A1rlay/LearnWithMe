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
              className="flex items-center gap-1.5 text-sm font-semibold text-subtle hover:text-fg"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              Back
            </Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.32em] text-accent-text">
              Game Mode
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-fg">{topic.title}</h1>
            <p className="mt-2 text-sm text-subtle">
              {topic.questions.length} question{topic.questions.length !== 1 ? "s" : ""} · 5×5 board
            </p>
          </div>

          <div className="flex flex-col gap-6 card p-8">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg">Number of teams</span>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTeamCount(n)}
                    className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${teamCount === n ? "bg-accent text-fg" : "border border-line-strong text-muted hover:border-fg"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {Array.from({ length: teamCount }, (_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
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
                    className="rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={startGame}
              className="btn btn-primary"
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
              className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface px-8 py-4 text-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{t.name}</p>
              <p key={t.score} className="animate-pop font-display text-4xl text-fg">{t.score}</p>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface px-6 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Left</p>
            <p key={remaining} className="animate-pop font-display text-4xl text-fg">{remaining}</p>
          </div>
        </div>

        {/* Point value legend */}
        <div className="flex justify-center gap-2 text-xs text-subtle">
          {POINT_VALUES.map((v, i) => (
            <span key={i}>Row {i + 1} = {v} pts</span>
          ))}
        </div>

        {/* Board grid */}
        <div
          className="stagger mx-auto w-full max-w-2xl grid gap-2"
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
                    ? "bg-surface-3 text-subtle/50 cursor-not-allowed"
                    : "bg-surface-2 border border-line-strong text-accent-text hover:bg-surface-3 hover:border-accent-text active:scale-95 cursor-pointer"
                }`}
              >
                {isUsed ? "✓" : pts}
              </button>
            );
          })}
        </div>

        {remaining === 0 && (
          <div className="animate-enter text-center">
            <p className="text-2xl font-extrabold text-fg mb-2">Game over!</p>
            <p className="text-muted text-sm mb-4">
              Winner: {[...teams].sort((a, b) => b.score - a.score)[0].name} with {Math.max(...teams.map((t) => t.score))} pts
            </p>
            <button onClick={() => { setUsed(Array(TOTAL).fill(false)); setTeams(teams.map((t) => ({ ...t, score: 0 }))); }}
              className="rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-fg hover:bg-surface-3">
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
        <div className="animate-pop rounded-full border border-accent-text px-6 py-2 text-sm font-bold text-accent-text">
          {cellPoints} points
        </div>

        {/* Question */}
        <div className="animate-enter w-full max-w-2xl text-center">
          <p className="eyebrow mb-3">
            {currentQuestion.type.replace(/_/g, " ")}
          </p>
          <h2 className="text-3xl font-extrabold text-fg leading-snug">
            {currentQuestion.prompt}
          </h2>

          {/* Show answer hints for game mode */}
          {"options" in data && (
            <div className="stagger mt-6 grid grid-cols-2 gap-3">
              {(data.options as string[]).map((opt, i) => (
                <div key={i} className="rounded-2xl border border-line-strong bg-surface-3 px-4 py-3 text-left text-sm text-fg">
                  <span className="font-bold text-subtle mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </div>
              ))}
            </div>
          )}
          {"sentence" in data && (
            <p className="mt-4 text-xl text-muted">{data.sentence as string}</p>
          )}
          {"statement" in data && (
            <p className="mt-4 text-xl text-muted">{data.statement as string}</p>
          )}
          {"word" in data && (
            <p className="mt-4 text-3xl font-extrabold tracking-[0.3em] text-subtle">
              {(data.word as string).split("").sort(() => Math.random() - 0.5).join("")}
            </p>
          )}
          {"front" in data && (
            <p className="mt-4 text-2xl font-bold text-muted">{data.front as string}</p>
          )}
        </div>

        {/* Award points to team (shown if not yet awarded) */}
        {awardingTeam === null ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <p className="text-sm font-semibold text-muted">
              Award {cellPoints} points to:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {teams.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => awardPoints(i, cellPoints)}
                  className="btn btn-primary"
                >
                  {t.name}
                </button>
              ))}
              <button
                type="button"
                onClick={closeQuestion}
                className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-muted hover:border-fg hover:text-fg"
              >
                No one (skip)
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-enter flex flex-col items-center gap-4">
            <p className="animate-pop text-lg font-bold text-accent-text">
              +{pointsAwarded} pts → {teams[awardingTeam].name}
            </p>
            <button
              type="button"
              onClick={closeQuestion}
              className="btn btn-primary"
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
