import Link from "next/link";

import { HomeLink } from "@/components/ui/nav-link";

const modalities = [
  {
    href: "/topics",
    title: "WordCatch",
    description: "Watch real videos, answer checkpoint questions, and review your results.",
    badge: "Listening + Quiz",
  },
  {
    href: "/question-maker",
    title: "QuestionMaker",
    description: "Practice with teacher-made quizzes: multiple choice, open answers, matching, and sorting.",
    badge: "Quiz",
  },
  {
    href: "/spell-right",
    title: "SpellRight",
    description: "Listen to words and identify their ending sound, or practice your pronunciation with the mic.",
    badge: "Spelling + Audio",
  },
];

export default function LearnPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-12 sm:py-16">
      <HomeLink />

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
          Ingles Practico
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white">Select a mode</h1>
      </div>

      <div className="flex flex-col gap-3">
        {modalities.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className="group flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-6 py-5 backdrop-blur-sm transition-all hover:border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.14)]"
          >
            <div className="flex flex-1 min-w-0 flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">{m.title}</span>
                <span className="rounded-full bg-[rgba(15,156,0,0.25)] px-2.5 py-0.5 text-xs font-bold text-[#0F9C00]">
                  {m.badge}
                </span>
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.55)]">{m.description}</p>
            </div>
            <svg
              className="shrink-0 text-[rgba(255,255,255,0.3)] transition-transform group-hover:translate-x-0.5 group-hover:text-white"
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </main>
  );
}
