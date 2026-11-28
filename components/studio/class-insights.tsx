import Link from "next/link";

import { GoalRing } from "@/components/progress/goal-ring";
import { activityLabel } from "@/server/data/activity";
import type { MissedQuestion, StudentInsight } from "@/server/data/class-insights";

export function ClassInsights({ students, missed }: { students: StudentInsight[]; missed: MissedQuestion[] }) {
  if (students.length === 0) return null;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const quiet = students.filter((s) => !s.week.lastActiveAt || s.week.lastActiveAt.getTime() < weekAgo);
  const onTrack = students.filter((s) => s.week.done >= s.week.goal).length;

  return (
    <section aria-labelledby="insights-h" className="flex flex-col gap-4">
      <h2 id="insights-h" className="text-sm font-semibold text-fg">How the class is doing</h2>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <dt className="text-xs text-muted">Met their weekly goal</dt>
          <dd className="mt-1 font-mono text-2xl text-fg">{onTrack}<span className="text-sm text-subtle"> / {students.length}</span></dd>
        </div>
        <div className={`card p-4 ${quiet.length ? "border-warning/30" : ""}`}>
          <dt className="text-xs text-muted">Quiet for 7+ days</dt>
          <dd className={`mt-1 font-mono text-2xl ${quiet.length ? "text-warning" : "text-fg"}`}>{quiet.length}</dd>
        </div>
        <div className="card col-span-2 p-4 sm:col-span-1">
          <dt className="text-xs text-muted">Answers in the last 30 days</dt>
          <dd className="mt-1 font-mono text-2xl text-fg">{students.reduce((n, s) => n + s.answers30d, 0)}</dd>
        </div>
      </dl>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">Students, quietest first</caption>
            <thead className="text-xs text-subtle">
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 font-medium">Student</th>
                <th scope="col" className="px-4 py-3 font-medium">Last active</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Correct (30d)</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">This week</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => {
                const isQuiet = !s.week.lastActiveAt || s.week.lastActiveAt.getTime() < weekAgo;
                return (
                  <tr key={s.id}>
                    <th scope="row" className="px-4 py-2.5 font-medium">
                      <Link href={`/u/${s.username}`} className="text-fg hover:text-accent-text">{s.name}</Link>
                      <span className="block text-xs font-normal text-subtle">@{s.username}</span>
                    </th>
                    <td className={`px-4 py-2.5 text-xs ${isQuiet ? "text-warning" : "text-muted"}`}>
                      {isQuiet && <span aria-hidden="true">● </span>}
                      {activityLabel(s.week.lastActiveAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-fg">
                      {s.pct30d === null ? "-" : `${s.pct30d}%`}
                      <span className="block text-subtle">{s.answers30d} answers</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex justify-end"><GoalRing done={s.week.done} goal={s.week.goal} size={36} /></span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card flex flex-col gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-fg">Most-missed questions</h3>
            <p className="mt-0.5 text-xs text-muted">Last 30 days, at least 2 attempts. Worth going over together.</p>
          </div>
          {missed.length === 0 ? (
            <p className="text-sm text-subtle">Nothing stands out yet.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {missed.map((q) => (
                <li key={`${q.kind}-${q.id}`} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm text-fg">{q.prompt}</span>
                    <span className="block text-xs text-subtle">{q.kind} · {q.activity}</span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-xs">
                    <span className="block text-danger">{q.wrongPct}% wrong</span>
                    <span className="block text-subtle">{q.attempts} tries</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
