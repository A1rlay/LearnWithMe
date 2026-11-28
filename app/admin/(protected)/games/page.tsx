import Link from "next/link";

import { requireRole } from "@/lib/auth";

type GameEntry = {
  href: string;
  title: string;
  description: string;
  tag: string;
};

const GAMES: GameEntry[] = [
  {
    href: "/admin/topics",
    title: "WordCatch",
    description: "Video lessons that pause at checkpoints to ask a question. You choose per video whether subtitles are shown.",
    tag: "Listening + Quiz",
  },
  {
    href: "/admin/question-maker",
    title: "QuestionMaker",
    description: "Build quiz sets with multiple choice, open answers, matching, and classification questions.",
    tag: "Quiz",
  },
  {
    href: "/admin/spell-right",
    title: "SpellRight",
    description: "Create word sets for termination practice (ed/t/d) and pronunciation exercises with microphone.",
    tag: "Spelling + Audio",
  },
];

export default async function GamesHubPage() {
  await requireRole("ADMIN", "TEACHER");
  const visible = GAMES;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow">Activities</p>
        <h1 className="mt-2 font-display text-4xl text-fg">Activity types</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every activity belongs to a subject and is tagged with the skills it trains.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group card card-interactive flex flex-col gap-3 p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-fg">{g.title}</h2>
              <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent-text">
                {g.tag}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{g.description}</p>
            <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-fg/40 transition-colors group-hover:text-fg">
              Manage
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
