import Link from "next/link";

const modalities = [
  {
    href: "/topics",
    title: "WordCatch",
    description: "Watch real videos, answer checkpoint questions, and review your results.",
    badge: "Listening + Quiz",
    available: true,
  },
  {
    href: "/question-maker",
    title: "QuestionMaker",
    description: "Practice with teacher-made quizzes: multiple choice, open answers, matching, and sorting.",
    badge: "Quiz",
    available: true,
  },
];

export default function LearnPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-bold text-white transition-colors hover:text-[#0F9C00]"
      >
        ← Back
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
          Ingles Practico
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white">Select a mode</h1>
      </div>

      <div className="flex flex-col gap-4">
        {modalities.map((m) => (
          m.available ? (
            <Link
              key={m.title}
              href={m.href}
              className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.1)] px-6 py-5 backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.18)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-white">{m.title}</span>
                <span className="shrink-0 rounded-full bg-[#0F9C00] px-3 py-1 text-xs font-bold text-white">
                  {m.badge}
                </span>
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">{m.description}</p>
            </Link>
          ) : (
            <div
              key={m.title}
              className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-6 py-5 opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-white">{m.title}</span>
                <span className="shrink-0 rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1 text-xs font-semibold text-[rgba(255,255,255,0.5)]">
                  {m.badge}
                </span>
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.45)]">{m.description}</p>
            </div>
          )
        ))}
      </div>
    </main>
  );
}
