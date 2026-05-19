import Link from "next/link";

import { requireRole } from "@/lib/auth";

type GameEntry = {
  href: string;
  title: string;
  description: string;
  tag: string;
  adminOnly?: boolean;
};

const GAMES: GameEntry[] = [
  {
    href: "/admin/topics",
    title: "WordCatch",
    description: "Manage topics, videos, and checkpoint quiz questions for the listening mode.",
    tag: "Listening + Quiz",
    adminOnly: true,
  },
  {
    href: "/admin/question-maker",
    title: "QuestionMaker",
    description: "Build quiz sets with multiple choice, open answers, matching, and classification questions.",
    tag: "Quiz",
  },
];

export default async function GamesHubPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const isAdmin = session.role === "ADMIN";

  const visible = GAMES.filter((g) => !g.adminOnly || isAdmin);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Games
        </p>
        <h1 className="mt-1 font-serif text-3xl text-[var(--foreground)]">Game modes</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Select a game to manage its content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-7 transition-all hover:border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">{g.title}</h2>
              <span className="shrink-0 rounded-full bg-[rgba(15,156,0,0.2)] px-2.5 py-0.5 text-xs font-bold text-[#0F9C00]">
                {g.tag}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">{g.description}</p>
            <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-[rgba(255,255,255,0.4)] transition-colors group-hover:text-white">
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
