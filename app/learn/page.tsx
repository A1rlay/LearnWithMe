import Link from "next/link";

import { ForwardLink, HomeLink } from "@/components/ui/nav-link";
import { getSession } from "@/lib/session";
import { getStudentAssignments } from "@/server/data/classes";
import { joinClassAction } from "./actions";

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
];

export default async function LearnPage() {
  const session = await getSession();
  const isStudent = session?.role === "STUDENT";

  const classData = isStudent ? await getStudentAssignments(session!.userId) : [];
  const hasClasses = classData.length > 0;
  const hasAssignments = classData.some((c) => c.assignments.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-12 sm:py-16">
      <div className="flex items-center justify-between">
        <HomeLink />
        {session && (
          <ForwardLink href={`/profile/${session.userId}`}>My Profile</ForwardLink>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
          Ingles Practico
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-white">
          {hasAssignments ? "Your assignments" : "Select a mode"}
        </h1>
      </div>

      {/* ── Assignments (students only) ── */}
      {hasAssignments && (
        <div className="flex flex-col gap-4">
          {classData.map((cls) =>
            cls.assignments.length === 0 ? null : (
              <div key={cls.classId} className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.45)]">
                  {cls.className} · {cls.teacherName}
                </p>
                <div className="flex flex-col gap-2">
                  {cls.assignments.map((a) => {
                    const done = !!a.completedAt;
                    const overdue = a.dueAt && !done && new Date(a.dueAt) < new Date();
                    return (
                      <Link
                        key={a.id}
                        href={`/question-maker/${a.topicId}`}
                        className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all ${
                          done
                            ? "border-[rgba(15,156,0,0.3)] bg-[rgba(15,156,0,0.06)]"
                            : overdue
                            ? "border-red-500/30 bg-[rgba(255,0,0,0.04)] hover:border-red-400/50"
                            : "border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.1)]"
                        }`}
                      >
                        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${done ? "text-[#0F9C00]" : "text-white"}`}>
                              {a.topicTitle}
                            </span>
                            {done && (
                              <span className="rounded-full bg-[rgba(15,156,0,0.2)] px-2 py-0.5 text-xs font-bold text-[#0F9C00]">
                                Done
                              </span>
                            )}
                            {overdue && (
                              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                                Overdue
                              </span>
                            )}
                          </div>
                          {a.note && (
                            <p className="text-xs text-[rgba(255,255,255,0.5)]">{a.note}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.35)]">
                            <span>{a.questionCount} questions</span>
                            {a.dueAt && !done && (
                              <>
                                <span>·</span>
                                <span>
                                  Due {new Date(a.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              </>
                            )}
                            {done && a.completedAt && (
                              <>
                                <span>·</span>
                                <span>
                                  Completed {new Date(a.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <svg
                          className="shrink-0 text-[rgba(255,255,255,0.25)] transition-colors group-hover:text-white"
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
            <span className="text-xs text-[rgba(255,255,255,0.35)]">or explore on your own</span>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
          </div>
        </div>
      )}

      {/* ── Mode cards ── */}
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

      {/* ── Join class ── */}
      {isStudent && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.35)]">
            {hasClasses ? `Your classes (${classData.length})` : "Join a class"}
          </p>

          {hasClasses && (
            <div className="flex flex-wrap gap-2">
              {classData.map((c) => (
                <span
                  key={c.classId}
                  className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs text-[rgba(255,255,255,0.55)]"
                >
                  {c.className} · {c.teacherName}
                </span>
              ))}
            </div>
          )}

          <form action={joinClassAction} className="flex gap-2">
            <input
              name="code"
              placeholder="Class code (e.g. A1B2C3)"
              maxLength={6}
              className="flex-1 rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-2.5 text-sm uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-[rgba(255,255,255,0.3)] outline-none focus:border-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-[rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.2)]"
            >
              Join
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
